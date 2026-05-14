alter table public.user_xp_events
  add column if not exists event_key text;

alter table public.user_xp_events
  drop constraint if exists user_xp_events_event_key_shape_check;

alter table public.user_xp_events
  add constraint user_xp_events_event_key_shape_check
  check (
    event_key is null
    or (
      length(event_key) between 1 and 160
      and event_key ~ '^[a-z0-9:_-]+$'
    )
  );

create unique index if not exists user_xp_events_user_event_key_unique_idx
  on public.user_xp_events(user_id, event_key)
  where event_key is not null;

create index if not exists user_xp_events_event_key_idx
  on public.user_xp_events(event_key)
  where event_key is not null;

comment on column public.user_xp_events.event_key is
  'Optional idempotency key for retry-safe XP awards, e.g. weekly_review:2026-W20 or lesson:<lesson_id>. Never store raw health text.';

alter table public.streak_freezes
  add column if not exists event_key text;

alter table public.streak_freezes
  drop constraint if exists streak_freezes_event_key_shape_check;

alter table public.streak_freezes
  add constraint streak_freezes_event_key_shape_check
  check (
    event_key is null
    or (
      length(event_key) between 1 and 160
      and event_key ~ '^[a-z0-9:_-]+$'
    )
  );

create unique index if not exists streak_freezes_user_event_key_unique_idx
  on public.streak_freezes(user_id, event_key)
  where event_key is not null;

comment on column public.streak_freezes.event_key is
  'Optional idempotency key for retry-safe streak-freeze awards. Does not contain health details.';

alter table public.health_quest_family_members
  add column if not exists invite_token_hash text,
  add column if not exists expires_at timestamptz,
  add column if not exists accepted_at timestamptz,
  add column if not exists revoked_at timestamptz,
  add column if not exists accepted_by_user_id uuid references auth.users(id) on delete set null;

alter table public.health_quest_family_members
  drop constraint if exists health_quest_family_members_invite_token_hash_shape_check;

alter table public.health_quest_family_members
  add constraint health_quest_family_members_invite_token_hash_shape_check
  check (
    invite_token_hash is null
    or (
      length(invite_token_hash) = 64
      and invite_token_hash ~ '^[a-f0-9]+$'
    )
  );

create unique index if not exists health_quest_family_members_invite_hash_unique_idx
  on public.health_quest_family_members(invite_token_hash)
  where invite_token_hash is not null and revoked_at is null;

create index if not exists health_quest_family_members_pending_invite_idx
  on public.health_quest_family_members(circle_id, status, expires_at)
  where status = 'pending';

comment on column public.health_quest_family_members.invite_token_hash is
  'SHA-256 hash of the one-time family invite token. Raw tokens must never be stored.';
comment on column public.health_quest_family_members.expires_at is
  'Pending invite expiry. Email delivery is separate from this preference/storage layer.';
comment on column public.health_quest_family_members.accepted_by_user_id is
  'User who accepted this invite, if any. Invite payload must not include health details.';

create or replace function public.accept_health_quest_family_invite(invite_hash text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_member public.health_quest_family_members%rowtype;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication is required';
  end if;

  select *
  into target_member
  from public.health_quest_family_members
  where invite_token_hash = invite_hash
    and status = 'pending'
    and accepted_at is null
    and revoked_at is null
    and expires_at > now()
  limit 1;

  if target_member.id is null then
    raise exception 'Invite is expired, revoked, or invalid';
  end if;

  update public.health_quest_family_members
  set
    user_id = (select auth.uid()),
    accepted_by_user_id = (select auth.uid()),
    accepted_at = now(),
    status = 'active',
    updated_at = now()
  where id = target_member.id;

  return jsonb_build_object(
    'membershipId', target_member.id,
    'circleId', target_member.circle_id,
    'status', 'active'
  );
end;
$$;

revoke all on function public.accept_health_quest_family_invite(text) from public;
grant execute on function public.accept_health_quest_family_invite(text) to authenticated;

comment on function public.accept_health_quest_family_invite(text) is
  'Accepts a pending family invite by token hash without exposing invite email or health details.';
