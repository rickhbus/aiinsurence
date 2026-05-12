create table if not exists public.daily_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  checkin_type text check (checkin_type in ('wake_up', 'meal', 'water', 'exercise', 'health_review')) not null,
  label text,
  amount numeric,
  unit text,
  note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.daily_checkins enable row level security;

grant select, insert, update, delete on public.daily_checkins to authenticated;

drop policy if exists daily_checkins_own_rows on public.daily_checkins;
create policy daily_checkins_own_rows
on public.daily_checkins for all
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create index if not exists daily_checkins_user_created_idx
  on public.daily_checkins(user_id, created_at desc);
create index if not exists daily_checkins_user_type_created_idx
  on public.daily_checkins(user_id, checkin_type, created_at desc);

comment on table public.daily_checkins is
  'User-owned everyday habit check-ins such as wake, meal, water, exercise, and mobile health review. Not clinical data and not used for insurance eligibility, pricing, coverage, claims, or care access.';
