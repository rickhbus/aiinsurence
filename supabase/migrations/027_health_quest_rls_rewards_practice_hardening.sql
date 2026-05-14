create unique index if not exists health_quest_review_items_user_type_source_uidx
  on public.health_quest_review_items(user_id, item_type, source_id);

create or replace function public.can_read_health_quest_league_member(
  p_week_start date,
  p_league_name text
) returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.health_quest_league_memberships memberships
    where memberships.user_id = auth.uid()
      and memberships.week_start = p_week_start
      and memberships.league_name = p_league_name
  );
$$;

revoke all on function public.can_read_health_quest_league_member(date, text) from public;
revoke all on function public.can_read_health_quest_league_member(date, text) from anon;
grant execute on function public.can_read_health_quest_league_member(date, text) to authenticated;

drop policy if exists health_quest_league_memberships_read_safe_week on public.health_quest_league_memberships;
drop policy if exists health_quest_league_memberships_read_same_week_league on public.health_quest_league_memberships;
create policy health_quest_league_memberships_read_same_week_league
on public.health_quest_league_memberships for select
to authenticated
using (
  user_id = (select auth.uid())
  or public.can_read_health_quest_league_member(week_start, league_name)
);

create or replace function public.claim_health_quest_reward(
  p_event_type text,
  p_amount integer,
  p_source text,
  p_event_key text,
  p_metadata jsonb default '{}'::jsonb
) returns table (
  wallet_gems integer,
  wallet_lifetime_gems integer,
  reward_id uuid,
  reward_event_type text,
  reward_amount integer,
  reward_source text,
  reward_event_key text,
  reward_created_at timestamptz,
  duplicate boolean
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_reward public.health_quest_reward_events%rowtype;
  v_metadata jsonb := '{}'::jsonb;
  v_inserted boolean := false;
  v_wallet_gems integer := 0;
  v_wallet_lifetime_gems integer := 0;
begin
  if v_user_id is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  if p_amount is null or p_amount <= 0 or p_amount > 100 then
    raise exception 'invalid_reward_amount' using errcode = '22023';
  end if;

  if p_event_key is null or length(p_event_key) < 1 or length(p_event_key) > 160 or p_event_key !~ '^[a-z0-9:_-]+$' then
    raise exception 'invalid_reward_event_key' using errcode = '22023';
  end if;

  if p_metadata is not null and jsonb_typeof(p_metadata) <> 'object' then
    raise exception 'invalid_reward_metadata' using errcode = '22023';
  end if;

  select coalesce(jsonb_object_agg(key, value), '{}'::jsonb)
    into v_metadata
  from jsonb_each(coalesce(p_metadata, '{}'::jsonb))
  where key in ('rewardKind', 'theme', 'cosmeticSlug', 'challengeType', 'leagueName')
    and jsonb_typeof(value) in ('string', 'number', 'boolean');

  insert into public.health_quest_wallets(user_id)
  values (v_user_id)
  on conflict (user_id) do nothing;

  insert into public.health_quest_reward_events(
    user_id,
    event_type,
    amount,
    source,
    event_key,
    metadata
  )
  values (
    v_user_id,
    p_event_type,
    p_amount,
    p_source,
    p_event_key,
    v_metadata
  )
  on conflict (user_id, event_key) do nothing
  returning * into v_reward;

  if v_reward.id is not null then
    v_inserted := true;

    update public.health_quest_wallets
    set gems = gems + p_amount,
        lifetime_gems = lifetime_gems + p_amount,
        updated_at = now()
    where user_id = v_user_id
    returning gems, lifetime_gems into v_wallet_gems, v_wallet_lifetime_gems;
  else
    select *
      into v_reward
    from public.health_quest_reward_events
    where user_id = v_user_id
      and event_key = p_event_key;

    select gems, lifetime_gems
      into v_wallet_gems, v_wallet_lifetime_gems
    from public.health_quest_wallets
    where user_id = v_user_id;
  end if;

  return query
  select
    v_wallet_gems,
    v_wallet_lifetime_gems,
    v_reward.id,
    v_reward.event_type,
    v_reward.amount,
    v_reward.source,
    v_reward.event_key,
    v_reward.created_at,
    not v_inserted;
end;
$$;

revoke all on function public.claim_health_quest_reward(text, integer, text, text, jsonb) from public;
revoke all on function public.claim_health_quest_reward(text, integer, text, text, jsonb) from anon;
grant execute on function public.claim_health_quest_reward(text, integer, text, text, jsonb) to authenticated;

comment on function public.claim_health_quest_reward(text, integer, text, text, jsonb) is
  'Atomically records an idempotent Health Quest reward event and credits cosmetic gems exactly once for the authenticated user.';
