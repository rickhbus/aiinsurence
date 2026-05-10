create table if not exists public.triage_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  session_id uuid references public.conversation_sessions(id) on delete set null,
  request_type text not null,
  urgency_level integer check (urgency_level between 1 and 4) not null,
  urgency_label text not null,
  classification text not null,
  input_preview text,
  matched_signals text[] not null default '{}',
  safety_locked boolean not null default false,
  disclaimer text not null,
  escalation text not null,
  audit text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.department_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  session_id uuid references public.conversation_sessions(id) on delete set null,
  care_route text not null,
  possible_departments text[] not null default '{}',
  next_action text not null,
  urgency_level integer check (urgency_level between 1 and 4) not null,
  requires_human_review boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.insurance_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  session_id uuid references public.conversation_sessions(id) on delete set null,
  profile_summary jsonb not null default '{}'::jsonb,
  coverage_needs text[] not null default '{}',
  public_private_preference text check (public_private_preference in ('public', 'private', 'either')),
  budget_range text,
  created_at timestamptz not null default now()
);

create table if not exists public.insurance_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  session_id uuid references public.conversation_sessions(id) on delete set null,
  priority_coverage text[] not null default '{}',
  useful_addons text[] not null default '{}',
  situational_coverage text[] not null default '{}',
  questions_before_buying text[] not null default '{}',
  requires_licensed_adviser boolean not null default true,
  disclaimer text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.escalation_cases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  session_id uuid references public.conversation_sessions(id) on delete set null,
  adviser_user_id uuid references auth.users(id) on delete set null,
  case_type text check (case_type in ('medical_emergency', 'clinical_review', 'licensed_adviser', 'claims_review')) not null,
  reason text not null,
  urgency text,
  status text check (status in ('open', 'in_review', 'closed')) not null default 'open',
  visible_to_adviser boolean not null default false,
  consented_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  event_type text not null,
  event_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists triage_assessments_user_id_idx on public.triage_assessments(user_id);
create index if not exists triage_assessments_session_id_idx on public.triage_assessments(session_id);
create index if not exists department_recommendations_user_id_idx on public.department_recommendations(user_id);
create index if not exists department_recommendations_session_id_idx on public.department_recommendations(session_id);
create index if not exists insurance_profiles_user_id_idx on public.insurance_profiles(user_id);
create index if not exists insurance_profiles_session_id_idx on public.insurance_profiles(session_id);
create index if not exists insurance_recommendations_user_id_idx on public.insurance_recommendations(user_id);
create index if not exists insurance_recommendations_session_id_idx on public.insurance_recommendations(session_id);
create index if not exists escalation_cases_user_id_idx on public.escalation_cases(user_id);
create index if not exists escalation_cases_adviser_user_id_idx on public.escalation_cases(adviser_user_id);
create index if not exists audit_logs_user_id_idx on public.audit_logs(user_id);

drop trigger if exists escalation_cases_set_updated_at on public.escalation_cases;
create trigger escalation_cases_set_updated_at
  before update on public.escalation_cases
  for each row execute function public.set_updated_at();

alter table public.triage_assessments enable row level security;
alter table public.department_recommendations enable row level security;
alter table public.insurance_profiles enable row level security;
alter table public.insurance_recommendations enable row level security;
alter table public.escalation_cases enable row level security;
alter table public.audit_logs enable row level security;

grant select, insert on public.triage_assessments to authenticated;
grant select, insert on public.department_recommendations to authenticated;
grant select, insert on public.insurance_profiles to authenticated;
grant select, insert on public.insurance_recommendations to authenticated;
grant select, insert, update on public.escalation_cases to authenticated;
grant select, insert on public.audit_logs to authenticated;

create policy triage_assessments_select_own
on public.triage_assessments for select
to authenticated
using (user_id = (select auth.uid()));

create policy triage_assessments_insert_own
on public.triage_assessments for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy department_recommendations_select_own
on public.department_recommendations for select
to authenticated
using (user_id = (select auth.uid()));

create policy department_recommendations_insert_own
on public.department_recommendations for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy insurance_profiles_select_own
on public.insurance_profiles for select
to authenticated
using (user_id = (select auth.uid()));

create policy insurance_profiles_insert_own
on public.insurance_profiles for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy insurance_recommendations_select_own
on public.insurance_recommendations for select
to authenticated
using (user_id = (select auth.uid()));

create policy insurance_recommendations_insert_own
on public.insurance_recommendations for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy escalation_cases_select_own
on public.escalation_cases for select
to authenticated
using (user_id = (select auth.uid()));

create policy escalation_cases_select_adviser_with_consent
on public.escalation_cases for select
to authenticated
using (
  adviser_user_id = (select auth.uid())
  and visible_to_adviser = true
  and exists (
    select 1
    from public.consent_events c
    where c.user_id = escalation_cases.user_id
      and c.consent_type = 'adviser_handoff'
      and c.granted = true
  )
);

create policy escalation_cases_insert_own
on public.escalation_cases for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.consent_events c
    where c.user_id = (select auth.uid())
      and c.consent_type = 'adviser_handoff'
      and c.granted = true
  )
);

create policy escalation_cases_update_own
on public.escalation_cases for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy audit_logs_select_own
on public.audit_logs for select
to authenticated
using (user_id = (select auth.uid()));

create policy audit_logs_insert_own
on public.audit_logs for insert
to authenticated
with check (user_id = (select auth.uid()));
