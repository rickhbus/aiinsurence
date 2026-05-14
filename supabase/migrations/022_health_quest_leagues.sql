create table if not exists public.health_quest_league_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text,
  league_name text not null,
  week_start date not null,
  xp integer not null default 0,
  rank integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, week_start),
  constraint health_quest_league_memberships_league_check check (league_name in (
    'Starter',
    'Bronze',
    'Silver',
    'Gold',
    'Jade',
    'Ruby',
    'Diamond'
  )),
  constraint health_quest_league_memberships_xp_check check (xp >= 0),
  constraint health_quest_league_memberships_display_name_check check (display_name is null or length(display_name) between 1 and 32)
);

alter table public.health_quest_league_memberships enable row level security;

revoke all on table public.health_quest_league_memberships from anon;
grant select, insert, update on public.health_quest_league_memberships to authenticated;

drop policy if exists health_quest_league_memberships_insert_own on public.health_quest_league_memberships;
create policy health_quest_league_memberships_insert_own
on public.health_quest_league_memberships for insert
to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists health_quest_league_memberships_update_own on public.health_quest_league_memberships;
create policy health_quest_league_memberships_update_own
on public.health_quest_league_memberships for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists health_quest_league_memberships_read_safe_week on public.health_quest_league_memberships;
create policy health_quest_league_memberships_read_safe_week
on public.health_quest_league_memberships for select
to authenticated
using (true);

create index if not exists health_quest_league_memberships_week_league_xp_idx
  on public.health_quest_league_memberships(week_start, league_name, xp desc);
create index if not exists health_quest_league_memberships_user_week_idx
  on public.health_quest_league_memberships(user_id, week_start);

drop trigger if exists health_quest_league_memberships_set_updated_at on public.health_quest_league_memberships;
create trigger health_quest_league_memberships_set_updated_at
before update on public.health_quest_league_memberships
for each row execute function public.set_updated_at();

comment on table public.health_quest_league_memberships is
  'Privacy-safe Health Quest weekly league rows. Store XP and optional display name only; never raw health, mood, food, doctor, family, symptom, or insurance data.';

