create extension if not exists pgcrypto;

create table if not exists public.gbl_cases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null check (char_length(title) <= 140),
  status text check (status in ('generated', 'fallback', 'safety_locked', 'archived')) not null default 'generated',
  case_type text check (case_type in ('healthcare_navigation', 'insurance_analysis', 'emotion_context', 'general_case')) not null,
  summary text,
  structured_context jsonb not null default '{}'::jsonb,
  safety_flags jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gbl_analysis_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  case_id uuid references public.gbl_cases(id) on delete cascade,
  request_id uuid not null,
  analysis_type text check (analysis_type in ('healthcare_navigation', 'insurance_analysis', 'emotion_context', 'general_case')) not null,
  status text check (status in ('generated', 'fallback', 'safety_locked')) not null,
  input_summary text,
  ai_ready_summary text,
  user_visible_summary text not null,
  recommendations jsonb not null default '[]'::jsonb,
  disclaimers jsonb not null default '[]'::jsonb,
  safety_flags jsonb not null default '{}'::jsonb,
  audit jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (request_id)
);

create table if not exists public.emotion_engine_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  case_id uuid references public.gbl_cases(id) on delete set null,
  request_id uuid not null,
  primary_emotion text check (primary_emotion in ('neutral', 'confused', 'anxious', 'frustrated', 'angry', 'overwhelmed', 'sad', 'hopeful', 'relieved', 'urgent', 'unknown')) not null,
  secondary_emotions jsonb not null default '[]'::jsonb,
  confidence numeric not null check (confidence >= 0 and confidence <= 1),
  urgency_level text check (urgency_level in ('low', 'medium', 'high', 'crisis')) not null,
  distress_indicators jsonb not null default '[]'::jsonb,
  recommended_tone text not null,
  suggested_next_step text not null,
  safety_flags jsonb not null default '{}'::jsonb,
  user_visible_summary text not null,
  internal_notes text,
  disclaimer text not null,
  created_at timestamptz not null default now(),
  unique (request_id)
);

create table if not exists public.insurance_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  case_id uuid references public.gbl_cases(id) on delete set null,
  analysis_type text not null,
  status text check (status in ('generated', 'fallback', 'safety_locked', 'archived')) not null default 'generated',
  input_summary text,
  result_summary text not null,
  recommendations jsonb not null default '[]'::jsonb,
  disclaimers jsonb not null default '[]'::jsonb,
  safety_flags jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.analysis_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  feature text not null,
  status text check (status in ('queued', 'processing', 'completed', 'failed', 'cancelled')) not null default 'queued',
  request_summary text,
  result_ref jsonb not null default '{}'::jsonb,
  error_code text,
  attempts integer not null default 0,
  run_after timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ai_usage_events
  add column if not exists feature text,
  add column if not exists provider text,
  add column if not exists model text;

update public.ai_usage_events
set feature = coalesce(feature, route)
where feature is null;

alter table public.ai_usage_events
  alter column feature set default 'unknown';

create index if not exists gbl_cases_user_created_idx on public.gbl_cases(user_id, created_at desc);
create index if not exists gbl_cases_user_status_idx on public.gbl_cases(user_id, status, created_at desc);
create index if not exists gbl_cases_user_type_idx on public.gbl_cases(user_id, case_type, created_at desc);
create index if not exists gbl_analysis_results_user_created_idx on public.gbl_analysis_results(user_id, created_at desc);
create index if not exists gbl_analysis_results_user_type_idx on public.gbl_analysis_results(user_id, analysis_type, created_at desc);
create index if not exists gbl_analysis_results_case_idx on public.gbl_analysis_results(case_id);
create index if not exists emotion_engine_results_user_created_idx on public.emotion_engine_results(user_id, created_at desc);
create index if not exists emotion_engine_results_user_urgency_idx on public.emotion_engine_results(user_id, urgency_level, created_at desc);
create index if not exists emotion_engine_results_case_idx on public.emotion_engine_results(case_id);
create index if not exists insurance_analyses_user_created_idx on public.insurance_analyses(user_id, created_at desc);
create index if not exists insurance_analyses_user_status_idx on public.insurance_analyses(user_id, status, created_at desc);
create index if not exists insurance_analyses_case_idx on public.insurance_analyses(case_id);
create index if not exists analysis_jobs_user_status_idx on public.analysis_jobs(user_id, status, run_after);
create index if not exists analysis_jobs_user_feature_idx on public.analysis_jobs(user_id, feature, created_at desc);
create index if not exists ai_usage_events_feature_created_idx on public.ai_usage_events(feature, created_at desc);

drop trigger if exists gbl_cases_set_updated_at on public.gbl_cases;
create trigger gbl_cases_set_updated_at
  before update on public.gbl_cases
  for each row execute function public.set_updated_at();

drop trigger if exists insurance_analyses_set_updated_at on public.insurance_analyses;
create trigger insurance_analyses_set_updated_at
  before update on public.insurance_analyses
  for each row execute function public.set_updated_at();

drop trigger if exists analysis_jobs_set_updated_at on public.analysis_jobs;
create trigger analysis_jobs_set_updated_at
  before update on public.analysis_jobs
  for each row execute function public.set_updated_at();

alter table public.gbl_cases enable row level security;
alter table public.gbl_analysis_results enable row level security;
alter table public.emotion_engine_results enable row level security;
alter table public.insurance_analyses enable row level security;
alter table public.analysis_jobs enable row level security;

revoke all on table public.gbl_cases from anon;
revoke all on table public.gbl_analysis_results from anon;
revoke all on table public.emotion_engine_results from anon;
revoke all on table public.insurance_analyses from anon;
revoke all on table public.analysis_jobs from anon;

grant select, insert, update, delete on public.gbl_cases to authenticated;
grant select, insert, delete on public.gbl_analysis_results to authenticated;
grant select, insert, delete on public.emotion_engine_results to authenticated;
grant select, insert, update, delete on public.insurance_analyses to authenticated;
grant select, insert, update, delete on public.analysis_jobs to authenticated;

drop policy if exists gbl_cases_select_own on public.gbl_cases;
create policy gbl_cases_select_own
on public.gbl_cases for select
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists gbl_cases_insert_own on public.gbl_cases;
create policy gbl_cases_insert_own
on public.gbl_cases for insert
to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists gbl_cases_update_own on public.gbl_cases;
create policy gbl_cases_update_own
on public.gbl_cases for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists gbl_cases_delete_own on public.gbl_cases;
create policy gbl_cases_delete_own
on public.gbl_cases for delete
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists gbl_analysis_results_select_own on public.gbl_analysis_results;
create policy gbl_analysis_results_select_own
on public.gbl_analysis_results for select
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists gbl_analysis_results_insert_own on public.gbl_analysis_results;
create policy gbl_analysis_results_insert_own
on public.gbl_analysis_results for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and (
    case_id is null
    or exists (
      select 1
      from public.gbl_cases c
      where c.id = case_id
        and c.user_id = (select auth.uid())
    )
  )
);

drop policy if exists gbl_analysis_results_delete_own on public.gbl_analysis_results;
create policy gbl_analysis_results_delete_own
on public.gbl_analysis_results for delete
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists emotion_engine_results_select_own on public.emotion_engine_results;
create policy emotion_engine_results_select_own
on public.emotion_engine_results for select
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists emotion_engine_results_insert_own on public.emotion_engine_results;
create policy emotion_engine_results_insert_own
on public.emotion_engine_results for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and (
    case_id is null
    or exists (
      select 1
      from public.gbl_cases c
      where c.id = case_id
        and c.user_id = (select auth.uid())
    )
  )
);

drop policy if exists emotion_engine_results_delete_own on public.emotion_engine_results;
create policy emotion_engine_results_delete_own
on public.emotion_engine_results for delete
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists insurance_analyses_select_own on public.insurance_analyses;
create policy insurance_analyses_select_own
on public.insurance_analyses for select
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists insurance_analyses_insert_own on public.insurance_analyses;
create policy insurance_analyses_insert_own
on public.insurance_analyses for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and (
    case_id is null
    or exists (
      select 1
      from public.gbl_cases c
      where c.id = case_id
        and c.user_id = (select auth.uid())
    )
  )
);

drop policy if exists insurance_analyses_update_own on public.insurance_analyses;
create policy insurance_analyses_update_own
on public.insurance_analyses for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists insurance_analyses_delete_own on public.insurance_analyses;
create policy insurance_analyses_delete_own
on public.insurance_analyses for delete
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists analysis_jobs_select_own on public.analysis_jobs;
create policy analysis_jobs_select_own
on public.analysis_jobs for select
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists analysis_jobs_insert_own on public.analysis_jobs;
create policy analysis_jobs_insert_own
on public.analysis_jobs for insert
to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists analysis_jobs_update_own on public.analysis_jobs;
create policy analysis_jobs_update_own
on public.analysis_jobs for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists analysis_jobs_delete_own on public.analysis_jobs;
create policy analysis_jobs_delete_own
on public.analysis_jobs for delete
to authenticated
using (user_id = (select auth.uid()));

comment on table public.gbl_cases is
  'User-owned AI.GBL case context. Store structured summaries and safety flags, not raw unrestricted PHI.';
comment on table public.gbl_analysis_results is
  'User-owned AI.GBL outputs with request IDs, safe summaries, recommendations, disclaimers, and audit metadata.';
comment on table public.emotion_engine_results is
  'Assistive emotion signals. Do not use for diagnosis or insurance eligibility, pricing, coverage, claims, or care-access decisions.';
comment on table public.insurance_analyses is
  'General insurance education analysis and document/question organization. No claim, eligibility, or coverage guarantees.';
comment on table public.analysis_jobs is
  'MVP queue table for future async AI/document analysis that might exceed serverless request limits.';
