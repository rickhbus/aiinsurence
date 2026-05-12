create extension if not exists pgcrypto;

alter table public.subscription_entitlements
  add column if not exists payment_provider text not null default 'mock',
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists current_period_end timestamptz;

comment on table public.subscription_entitlements is
  'Server-owned entitlement state. Stripe webhook updates this table when payment env vars are configured; clients may only read their own row.';

revoke insert, update, delete on public.subscription_entitlements from authenticated;

drop policy if exists subscription_entitlements_own_rows on public.subscription_entitlements;
drop policy if exists subscription_entitlements_select_own on public.subscription_entitlements;
create policy subscription_entitlements_select_own
on public.subscription_entitlements for select
to authenticated
using (user_id = (select auth.uid()));

create index if not exists subscription_entitlements_stripe_customer_idx
  on public.subscription_entitlements(stripe_customer_id)
  where stripe_customer_id is not null;

create index if not exists subscription_entitlements_stripe_subscription_idx
  on public.subscription_entitlements(stripe_subscription_id)
  where stripe_subscription_id is not null;

create table if not exists public.family_groups (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users(id) on delete cascade not null,
  name text not null check (char_length(name) between 1 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.family_memberships (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.family_groups(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null default 'member' check (role in ('owner', 'caregiver', 'member')),
  status text not null default 'active' check (status in ('active', 'pending', 'revoked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (group_id, user_id)
);

create table if not exists public.family_invites (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.family_groups(id) on delete cascade not null,
  invited_email text not null check (char_length(invited_email) <= 200 and invited_email like '%@%'),
  invited_by_user_id uuid references auth.users(id) on delete cascade not null,
  invitee_user_id uuid references auth.users(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked', 'expired')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '14 days')
);

create table if not exists public.family_share_consents (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.family_groups(id) on delete cascade not null,
  subject_user_id uuid references auth.users(id) on delete cascade not null,
  grantee_user_id uuid references auth.users(id) on delete set null,
  grantee_email text check (grantee_email is null or (char_length(grantee_email) <= 200 and grantee_email like '%@%')),
  scopes text[] not null default array['safety_status','daily_checkin_completion']::text[],
  emergency_contact_info text check (emergency_contact_info is null or char_length(emergency_contact_info) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revoked_at timestamptz,
  check (
    scopes <@ array[
      'safety_status',
      'daily_checkin_completion',
      'emergency_contact',
      'hydration_summary',
      'meal_summary',
      'workout_summary',
      'mood_summary'
    ]::text[]
  )
);

alter table public.family_groups enable row level security;
alter table public.family_memberships enable row level security;
alter table public.family_invites enable row level security;
alter table public.family_share_consents enable row level security;

grant select, insert, update, delete on public.family_groups to authenticated;
grant select, insert, update, delete on public.family_memberships to authenticated;
grant select, insert, update, delete on public.family_invites to authenticated;
grant select, insert, update, delete on public.family_share_consents to authenticated;

create or replace function public.is_family_group_member(target_group_id uuid, allowed_roles text[] default null)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.family_memberships
    where group_id = target_group_id
      and user_id = auth.uid()
      and status = 'active'
      and (allowed_roles is null or role = any(allowed_roles))
  );
$$;

drop policy if exists family_groups_select_member on public.family_groups;
create policy family_groups_select_member
on public.family_groups for select
to authenticated
using (owner_user_id = (select auth.uid()) or public.is_family_group_member(id));

drop policy if exists family_groups_insert_owner on public.family_groups;
create policy family_groups_insert_owner
on public.family_groups for insert
to authenticated
with check (owner_user_id = (select auth.uid()));

drop policy if exists family_groups_update_owner on public.family_groups;
create policy family_groups_update_owner
on public.family_groups for update
to authenticated
using (owner_user_id = (select auth.uid()))
with check (owner_user_id = (select auth.uid()));

drop policy if exists family_memberships_select_group_member on public.family_memberships;
create policy family_memberships_select_group_member
on public.family_memberships for select
to authenticated
using (user_id = (select auth.uid()) or public.is_family_group_member(group_id, array['owner','caregiver']::text[]));

drop policy if exists family_memberships_insert_owner_or_manager on public.family_memberships;
create policy family_memberships_insert_owner_or_manager
on public.family_memberships for insert
to authenticated
with check (
  (
    user_id = (select auth.uid())
    and role = 'owner'
    and exists (
      select 1 from public.family_groups
      where family_groups.id = group_id
        and family_groups.owner_user_id = (select auth.uid())
    )
  )
  or public.is_family_group_member(group_id, array['owner']::text[])
);

drop policy if exists family_memberships_update_manager on public.family_memberships;
create policy family_memberships_update_manager
on public.family_memberships for update
to authenticated
using (public.is_family_group_member(group_id, array['owner']::text[]))
with check (public.is_family_group_member(group_id, array['owner']::text[]));

drop policy if exists family_invites_select_manager on public.family_invites;
create policy family_invites_select_manager
on public.family_invites for select
to authenticated
using (invited_by_user_id = (select auth.uid()) or public.is_family_group_member(group_id, array['owner','caregiver']::text[]));

drop policy if exists family_invites_insert_manager on public.family_invites;
create policy family_invites_insert_manager
on public.family_invites for insert
to authenticated
with check (
  invited_by_user_id = (select auth.uid())
  and public.is_family_group_member(group_id, array['owner','caregiver']::text[])
);

drop policy if exists family_invites_update_manager on public.family_invites;
create policy family_invites_update_manager
on public.family_invites for update
to authenticated
using (invited_by_user_id = (select auth.uid()) or public.is_family_group_member(group_id, array['owner']::text[]))
with check (invited_by_user_id = (select auth.uid()) or public.is_family_group_member(group_id, array['owner']::text[]));

drop policy if exists family_share_consents_select_allowed on public.family_share_consents;
create policy family_share_consents_select_allowed
on public.family_share_consents for select
to authenticated
using (
  subject_user_id = (select auth.uid())
  or grantee_user_id = (select auth.uid())
  or public.is_family_group_member(group_id, array['owner','caregiver']::text[])
);

drop policy if exists family_share_consents_insert_subject on public.family_share_consents;
create policy family_share_consents_insert_subject
on public.family_share_consents for insert
to authenticated
with check (
  subject_user_id = (select auth.uid())
  and public.is_family_group_member(group_id)
);

drop policy if exists family_share_consents_update_subject on public.family_share_consents;
create policy family_share_consents_update_subject
on public.family_share_consents for update
to authenticated
using (subject_user_id = (select auth.uid()))
with check (subject_user_id = (select auth.uid()));

create index if not exists family_groups_owner_idx on public.family_groups(owner_user_id, created_at desc);
create index if not exists family_memberships_group_idx on public.family_memberships(group_id, status);
create index if not exists family_memberships_user_idx on public.family_memberships(user_id, status);
create index if not exists family_invites_group_idx on public.family_invites(group_id, status);
create index if not exists family_invites_invited_by_idx on public.family_invites(invited_by_user_id, created_at desc);
create index if not exists family_share_consents_subject_idx on public.family_share_consents(subject_user_id, revoked_at);
create index if not exists family_share_consents_group_idx on public.family_share_consents(group_id, revoked_at);

drop trigger if exists family_groups_set_updated_at on public.family_groups;
create trigger family_groups_set_updated_at before update on public.family_groups for each row execute function public.set_updated_at();
drop trigger if exists family_memberships_set_updated_at on public.family_memberships;
create trigger family_memberships_set_updated_at before update on public.family_memberships for each row execute function public.set_updated_at();
drop trigger if exists family_share_consents_set_updated_at on public.family_share_consents;
create trigger family_share_consents_set_updated_at before update on public.family_share_consents for each row execute function public.set_updated_at();

comment on table public.family_groups is
  'Consent-first family groups. No health sharing happens merely because a group exists.';
comment on table public.family_memberships is
  'Family group membership and role state.';
comment on table public.family_invites is
  'Caregiver/family invitations by email. Invite alone does not grant access to health records.';
comment on table public.family_share_consents is
  'Explicit sharing scopes granted by a subject user. Mood/mental-health detail is not shared by default.';
