create table if not exists public.health_quest_analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  anonymous_id text,
  event_name text not null,
  event_version integer not null default 1,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint health_quest_analytics_events_name_check check (event_name in (
    'quest_viewed',
    'quest_completed',
    'quest_skipped',
    'quest_made_easier',
    'quest_why_this_opened',
    'recovery_mode_started',
    'safety_banner_shown',
    'weekly_review_opened',
    'weekly_review_completed',
    'lesson_started',
    'lesson_completed',
    'streak_protected',
    'streak_freeze_earned',
    'streak_freeze_consumed',
    'onboarding_started',
    'onboarding_completed',
    'family_challenge_started',
    'family_challenge_progressed',
    'subscription_gate_viewed',
    'doctor_prep_started',
    'insurance_lesson_completed'
  ))
);

alter table public.health_quest_analytics_events enable row level security;

grant insert on public.health_quest_analytics_events to authenticated;

drop policy if exists health_quest_analytics_insert_own on public.health_quest_analytics_events;
create policy health_quest_analytics_insert_own
on public.health_quest_analytics_events for insert
to authenticated
with check (user_id = (select auth.uid()) or user_id is null);

create index if not exists health_quest_analytics_events_name_created_idx
  on public.health_quest_analytics_events(event_name, created_at desc);
create index if not exists health_quest_analytics_events_user_created_idx
  on public.health_quest_analytics_events(user_id, created_at desc)
  where user_id is not null;

comment on table public.health_quest_analytics_events is 'Privacy-safe Health Quest event stream. Client users can insert only; no client read policy. Properties must not contain PHI, PII, raw health text, policy text, claim text, prompts, tokens, or secrets.';
