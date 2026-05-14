create table if not exists public.health_quest_family_circles (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.health_quest_family_members (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.health_quest_family_circles(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  invited_email text,
  display_name text,
  role text not null default 'member',
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint health_quest_family_members_role_check check (role in ('owner','member','caregiver')),
  constraint health_quest_family_members_status_check check (status in ('pending','active','removed'))
);

create table if not exists public.health_quest_family_permissions (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.health_quest_family_circles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  sharing_level text not null default 'streak_only',
  allow_challenge_invites boolean not null default true,
  allow_doctor_summary_share boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(circle_id, user_id),
  constraint health_quest_family_permissions_level_check check (sharing_level in ('streak_only','quest_category_only','daily_wellbeing_status','shared_notes','doctor_prep_summary'))
);

create table if not exists public.health_quest_family_challenges (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.health_quest_family_circles(id) on delete cascade,
  challenge_type text not null,
  title jsonb not null,
  description jsonb not null,
  target_count integer not null default 7,
  start_date date not null,
  end_date date not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  constraint health_quest_family_challenges_type_check check (challenge_type in ('water_7_day','mood_checkin_week','family_walk_weekend','doctor_prep_checklist','three_lessons_together')),
  constraint health_quest_family_challenges_status_check check (status in ('active','completed','archived'))
);

create table if not exists public.health_quest_family_challenge_progress (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.health_quest_family_challenges(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  progress_count integer not null default 0,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(challenge_id, user_id)
);

alter table public.health_quest_family_circles enable row level security;
alter table public.health_quest_family_members enable row level security;
alter table public.health_quest_family_permissions enable row level security;
alter table public.health_quest_family_challenges enable row level security;
alter table public.health_quest_family_challenge_progress enable row level security;

grant select, insert, update, delete on public.health_quest_family_circles to authenticated;
grant select, insert, update, delete on public.health_quest_family_members to authenticated;
grant select, insert, update, delete on public.health_quest_family_permissions to authenticated;
grant select, insert, update, delete on public.health_quest_family_challenges to authenticated;
grant select, insert, update, delete on public.health_quest_family_challenge_progress to authenticated;

create or replace function public.is_health_quest_family_member(target_circle_id uuid)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.health_quest_family_members
    where circle_id = target_circle_id
      and user_id = (select auth.uid())
      and status = 'active'
  );
$$;

create or replace function public.is_health_quest_family_owner(target_circle_id uuid)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.health_quest_family_circles
    where id = target_circle_id
      and owner_user_id = (select auth.uid())
  );
$$;

drop policy if exists health_quest_family_circles_member_read on public.health_quest_family_circles;
create policy health_quest_family_circles_member_read
on public.health_quest_family_circles for select
to authenticated
using (owner_user_id = (select auth.uid()) or (select public.is_health_quest_family_member(id)));

drop policy if exists health_quest_family_circles_owner_write on public.health_quest_family_circles;
create policy health_quest_family_circles_owner_write
on public.health_quest_family_circles for all
to authenticated
using (owner_user_id = (select auth.uid()))
with check (owner_user_id = (select auth.uid()));

drop policy if exists health_quest_family_members_circle_read on public.health_quest_family_members;
create policy health_quest_family_members_circle_read
on public.health_quest_family_members for select
to authenticated
using (user_id = (select auth.uid()) or (select public.is_health_quest_family_owner(circle_id)) or (select public.is_health_quest_family_member(circle_id)));

drop policy if exists health_quest_family_members_owner_write on public.health_quest_family_members;
create policy health_quest_family_members_owner_write
on public.health_quest_family_members for insert
to authenticated
with check ((select public.is_health_quest_family_owner(circle_id)));

drop policy if exists health_quest_family_members_self_update on public.health_quest_family_members;
create policy health_quest_family_members_self_update
on public.health_quest_family_members for update
to authenticated
using (user_id = (select auth.uid()) or (select public.is_health_quest_family_owner(circle_id)))
with check (user_id = (select auth.uid()) or (select public.is_health_quest_family_owner(circle_id)));

drop policy if exists health_quest_family_permissions_own_rows on public.health_quest_family_permissions;
create policy health_quest_family_permissions_own_rows
on public.health_quest_family_permissions for all
to authenticated
using (user_id = (select auth.uid()) or (select public.is_health_quest_family_owner(circle_id)))
with check (user_id = (select auth.uid()));

drop policy if exists health_quest_family_challenges_member_read on public.health_quest_family_challenges;
create policy health_quest_family_challenges_member_read
on public.health_quest_family_challenges for select
to authenticated
using ((select public.is_health_quest_family_member(circle_id)) or (select public.is_health_quest_family_owner(circle_id)));

drop policy if exists health_quest_family_challenges_owner_insert on public.health_quest_family_challenges;
create policy health_quest_family_challenges_owner_insert
on public.health_quest_family_challenges for insert
to authenticated
with check ((select public.is_health_quest_family_owner(circle_id)));

drop policy if exists health_quest_family_challenge_progress_member_read on public.health_quest_family_challenge_progress;
create policy health_quest_family_challenge_progress_member_read
on public.health_quest_family_challenge_progress for select
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists health_quest_family_challenge_progress_own_write on public.health_quest_family_challenge_progress;
create policy health_quest_family_challenge_progress_own_write
on public.health_quest_family_challenge_progress for all
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create index if not exists health_quest_family_members_user_status_idx on public.health_quest_family_members(user_id, status);
create index if not exists health_quest_family_members_circle_status_idx on public.health_quest_family_members(circle_id, status);
create index if not exists health_quest_family_challenges_circle_status_idx on public.health_quest_family_challenges(circle_id, status);
create index if not exists health_quest_family_challenge_progress_user_idx on public.health_quest_family_challenge_progress(user_id);

drop trigger if exists health_quest_family_circles_set_updated_at on public.health_quest_family_circles;
create trigger health_quest_family_circles_set_updated_at before update on public.health_quest_family_circles for each row execute function public.set_updated_at();
drop trigger if exists health_quest_family_members_set_updated_at on public.health_quest_family_members;
create trigger health_quest_family_members_set_updated_at before update on public.health_quest_family_members for each row execute function public.set_updated_at();
drop trigger if exists health_quest_family_permissions_set_updated_at on public.health_quest_family_permissions;
create trigger health_quest_family_permissions_set_updated_at before update on public.health_quest_family_permissions for each row execute function public.set_updated_at();

comment on table public.health_quest_family_challenge_progress is 'Privacy-safe family challenge progress. Do not store raw symptoms, food text, mood text, policy text, or claim text.';
