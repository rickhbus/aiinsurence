create table if not exists public.health_quest_wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  gems integer not null default 0,
  lifetime_gems integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint health_quest_wallets_gems_check check (gems >= 0 and lifetime_gems >= 0)
);

create table if not exists public.health_quest_reward_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  amount integer not null default 0,
  source text not null,
  event_key text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(user_id, event_key),
  constraint health_quest_reward_events_amount_check check (amount between 0 and 100),
  constraint health_quest_reward_events_source_check check (source in (
    'first_quest_of_day',
    'streak_protected',
    'weekly_review',
    'lesson_completed',
    'chest_opened',
    'challenge_completed',
    'practice_completed'
  )),
  constraint health_quest_reward_events_event_key_shape_check check (
    event_key is null
    or (
      length(event_key) between 1 and 160
      and event_key ~ '^[a-z0-9:_-]+$'
    )
  )
);

alter table public.health_quest_wallets enable row level security;
alter table public.health_quest_reward_events enable row level security;

revoke all on table public.health_quest_wallets from anon;
revoke all on table public.health_quest_reward_events from anon;

grant select, insert, update on public.health_quest_wallets to authenticated;
grant select, insert on public.health_quest_reward_events to authenticated;

drop policy if exists health_quest_wallets_own_rows on public.health_quest_wallets;
create policy health_quest_wallets_own_rows
on public.health_quest_wallets for all
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists health_quest_reward_events_own_rows on public.health_quest_reward_events;
create policy health_quest_reward_events_own_rows
on public.health_quest_reward_events for all
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create index if not exists health_quest_reward_events_user_created_idx
  on public.health_quest_reward_events(user_id, created_at desc);
create index if not exists health_quest_reward_events_user_source_idx
  on public.health_quest_reward_events(user_id, source, created_at desc);

drop trigger if exists health_quest_wallets_set_updated_at on public.health_quest_wallets;
create trigger health_quest_wallets_set_updated_at
before update on public.health_quest_wallets
for each row execute function public.set_updated_at();

comment on table public.health_quest_wallets is
  'Health Quest cosmetic reward wallet. Gems must never buy medical advice, safety guidance, insurance decisions, claim outcomes, or care access.';
comment on table public.health_quest_reward_events is
  'Idempotent privacy-safe reward ledger. Metadata must not store PHI/PII, raw symptoms, raw notes, policy text, claim text, prompts, HKID, phone, tokens, or payment data.';

