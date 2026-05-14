create table if not exists public.doctor_prep_missions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  status text not null default 'draft',
  concern_summary text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint doctor_prep_missions_status_check check (status in ('draft','completed','archived'))
);

create table if not exists public.doctor_prep_answers (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.doctor_prep_missions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  step_key text not null,
  answer_text text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint doctor_prep_answers_step_key_check check (step_key in ('what_changed','when_started','better_or_worse','tried','top_questions','export_summary'))
);

alter table public.doctor_prep_missions enable row level security;
alter table public.doctor_prep_answers enable row level security;

grant select, insert, update, delete on public.doctor_prep_missions to authenticated;
grant select, insert, update, delete on public.doctor_prep_answers to authenticated;

drop policy if exists doctor_prep_missions_own_rows on public.doctor_prep_missions;
create policy doctor_prep_missions_own_rows
on public.doctor_prep_missions for all
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists doctor_prep_answers_own_rows on public.doctor_prep_answers;
create policy doctor_prep_answers_own_rows
on public.doctor_prep_answers for all
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create index if not exists doctor_prep_missions_user_status_idx on public.doctor_prep_missions(user_id, status);
create index if not exists doctor_prep_answers_mission_user_idx on public.doctor_prep_answers(mission_id, user_id);

drop trigger if exists doctor_prep_missions_set_updated_at on public.doctor_prep_missions;
create trigger doctor_prep_missions_set_updated_at before update on public.doctor_prep_missions for each row execute function public.set_updated_at();
drop trigger if exists doctor_prep_answers_set_updated_at on public.doctor_prep_answers;
create trigger doctor_prep_answers_set_updated_at before update on public.doctor_prep_answers for each row execute function public.set_updated_at();

comment on table public.doctor_prep_missions is 'User-owned doctor visit preparation. This is not diagnosis, treatment advice, medication advice, or emergency triage.';
comment on table public.doctor_prep_answers is 'User-entered visit prep answers. Do not expose to family sharing unless explicit doctor_prep_summary permission is set.';
