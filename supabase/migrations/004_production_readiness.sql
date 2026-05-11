create extension if not exists pgcrypto;

-- Production readiness migration for Health OS.
-- Keeps all user-owned data RLS-protected with explicit per-action own-row
-- policies, adds dashboard-scale indexes, and stores onboarding state in the
-- profile row without introducing a second auth model.

alter table public.profiles
  add column if not exists onboarding_completed_at timestamptz,
  add column if not exists onboarding_answers jsonb not null default '{}'::jsonb,
  add column if not exists memory_consent_granted boolean not null default false,
  add column if not exists first_action text;

comment on column public.profiles.onboarding_completed_at is
  'Set after the user completes or explicitly skips non-required onboarding steps.';
comment on column public.profiles.onboarding_answers is
  'Non-sensitive onboarding preferences used for empty states and first-value guidance.';
comment on column public.profiles.memory_consent_granted is
  'True only when the user explicitly grants health-memory consent.';

create or replace function public.ensure_user_owned_table_ready(
  table_name text,
  owner_column text default 'user_id'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  execute format('alter table public.%I enable row level security', table_name);
  execute format('revoke all on table public.%I from anon', table_name);
  execute format(
    'grant select, insert, update, delete on table public.%I to authenticated',
    table_name
  );

  execute format('drop policy if exists %I on public.%I', table_name || '_own_rows', table_name);
  execute format('drop policy if exists %I on public.%I', table_name || '_select_own', table_name);
  execute format('drop policy if exists %I on public.%I', table_name || '_insert_own', table_name);
  execute format('drop policy if exists %I on public.%I', table_name || '_update_own', table_name);
  execute format('drop policy if exists %I on public.%I', table_name || '_delete_own', table_name);

  execute format(
    'create policy %I on public.%I for select to authenticated using (%I = (select auth.uid()))',
    table_name || '_select_own',
    table_name,
    owner_column
  );

  execute format(
    'create policy %I on public.%I for insert to authenticated with check (%I = (select auth.uid()))',
    table_name || '_insert_own',
    table_name,
    owner_column
  );

  execute format(
    'create policy %I on public.%I for update to authenticated using (%I = (select auth.uid())) with check (%I = (select auth.uid()))',
    table_name || '_update_own',
    table_name,
    owner_column,
    owner_column
  );

  execute format(
    'create policy %I on public.%I for delete to authenticated using (%I = (select auth.uid()))',
    table_name || '_delete_own',
    table_name,
    owner_column
  );
end;
$$;

select public.ensure_user_owned_table_ready('profiles', 'id');
select public.ensure_user_owned_table_ready('user_preferences');
select public.ensure_user_owned_table_ready('household_members');
select public.ensure_user_owned_table_ready('conversation_sessions');
select public.ensure_user_owned_table_ready('conversation_messages');
select public.ensure_user_owned_table_ready('saved_recommendations');
select public.ensure_user_owned_table_ready('consent_events');
select public.ensure_user_owned_table_ready('triage_assessments');
select public.ensure_user_owned_table_ready('department_recommendations');
select public.ensure_user_owned_table_ready('insurance_profiles');
select public.ensure_user_owned_table_ready('insurance_recommendations');
select public.ensure_user_owned_table_ready('escalation_cases');
select public.ensure_user_owned_table_ready('audit_logs');
select public.ensure_user_owned_table_ready('health_memory');
select public.ensure_user_owned_table_ready('running_logs');
select public.ensure_user_owned_table_ready('gym_logs');
select public.ensure_user_owned_table_ready('meals');
select public.ensure_user_owned_table_ready('water_logs');
select public.ensure_user_owned_table_ready('sleep_logs');
select public.ensure_user_owned_table_ready('body_metrics');
select public.ensure_user_owned_table_ready('goals');
select public.ensure_user_owned_table_ready('daily_health_summaries');
select public.ensure_user_owned_table_ready('weekly_health_summaries');
select public.ensure_user_owned_table_ready('user_streaks');
select public.ensure_user_owned_table_ready('user_goal_progress');
select public.ensure_user_owned_table_ready('ai_daily_recommendations');
select public.ensure_user_owned_table_ready('ai_usage_events');
select public.ensure_user_owned_table_ready('symptom_checks');
select public.ensure_user_owned_table_ready('insurance_notes');
select public.ensure_user_owned_table_ready('analytics_events');

drop function public.ensure_user_owned_table_ready(text, text);

-- Preserve cross-table ownership checks that are stricter than a plain user_id
-- match. These prevent a user from attaching their own row to another user's
-- conversation/session or opening adviser handoff cases without consent.
drop policy if exists conversation_messages_insert_own on public.conversation_messages;
create policy conversation_messages_insert_own
on public.conversation_messages for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.conversation_sessions s
    where s.id = session_id
      and s.user_id = (select auth.uid())
  )
);

drop policy if exists saved_recommendations_insert_own on public.saved_recommendations;
create policy saved_recommendations_insert_own
on public.saved_recommendations for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and (
    session_id is null
    or exists (
      select 1
      from public.conversation_sessions s
      where s.id = session_id
        and s.user_id = (select auth.uid())
    )
  )
);

drop policy if exists escalation_cases_insert_own on public.escalation_cases;
create policy escalation_cases_insert_own
on public.escalation_cases for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.consent_events c
    where c.user_id = (select auth.uid())
      and c.consent_type = 'adviser_handoff'
      and c.granted = true
  )
);

-- Public health education content is intentionally readable, while writes stay
-- unavailable to anon/authenticated clients from the app.
alter table public.health_lessons enable row level security;
grant select on public.health_lessons to anon, authenticated;
drop policy if exists health_lessons_select_all on public.health_lessons;
create policy health_lessons_select_all
on public.health_lessons for select
using (true);

-- Preserve the adviser consent exception while keeping the user's own-row
-- policies above as the default behavior.
drop policy if exists escalation_cases_select_adviser_with_consent on public.escalation_cases;
create policy escalation_cases_select_adviser_with_consent
on public.escalation_cases for select
to authenticated
using (
  adviser_user_id = (select auth.uid())
  and visible_to_adviser = true
  and exists (
    select 1
    from public.consent_events c
    where c.user_id = escalation_cases.user_id
      and c.consent_type = 'adviser_handoff'
      and c.granted = true
  )
);

-- Simple user_id indexes. Composite indexes below cover most queries, but
-- explicit user_id indexes make ownership filters predictable for large tables.
create index if not exists profiles_id_lookup_idx on public.profiles(id);
create index if not exists user_preferences_user_id_lookup_idx on public.user_preferences(user_id);
create index if not exists household_members_user_id_lookup_idx on public.household_members(user_id);
create index if not exists conversation_sessions_user_id_lookup_idx on public.conversation_sessions(user_id);
create index if not exists conversation_messages_user_id_lookup_idx on public.conversation_messages(user_id);
create index if not exists saved_recommendations_user_id_lookup_idx on public.saved_recommendations(user_id);
create index if not exists consent_events_user_id_lookup_idx on public.consent_events(user_id);
create index if not exists triage_assessments_user_id_lookup_idx on public.triage_assessments(user_id);
create index if not exists department_recommendations_user_id_lookup_idx on public.department_recommendations(user_id);
create index if not exists insurance_profiles_user_id_lookup_idx on public.insurance_profiles(user_id);
create index if not exists insurance_recommendations_user_id_lookup_idx on public.insurance_recommendations(user_id);
create index if not exists escalation_cases_user_id_lookup_idx on public.escalation_cases(user_id);
create index if not exists audit_logs_user_id_lookup_idx on public.audit_logs(user_id);
create index if not exists health_memory_user_id_lookup_idx on public.health_memory(user_id);
create index if not exists running_logs_user_id_lookup_idx on public.running_logs(user_id);
create index if not exists gym_logs_user_id_lookup_idx on public.gym_logs(user_id);
create index if not exists meals_user_id_lookup_idx on public.meals(user_id);
create index if not exists water_logs_user_id_lookup_idx on public.water_logs(user_id);
create index if not exists sleep_logs_user_id_lookup_idx on public.sleep_logs(user_id);
create index if not exists body_metrics_user_id_lookup_idx on public.body_metrics(user_id);
create index if not exists goals_user_id_lookup_idx on public.goals(user_id);
create index if not exists daily_health_summaries_user_id_lookup_idx on public.daily_health_summaries(user_id);
create index if not exists weekly_health_summaries_user_id_lookup_idx on public.weekly_health_summaries(user_id);
create index if not exists user_streaks_user_id_lookup_idx on public.user_streaks(user_id);
create index if not exists user_goal_progress_user_id_lookup_idx on public.user_goal_progress(user_id);
create index if not exists ai_daily_recommendations_user_id_lookup_idx on public.ai_daily_recommendations(user_id);
create index if not exists ai_usage_events_user_id_lookup_idx on public.ai_usage_events(user_id);
create index if not exists symptom_checks_user_id_lookup_idx on public.symptom_checks(user_id);
create index if not exists insurance_notes_user_id_lookup_idx on public.insurance_notes(user_id);
create index if not exists analytics_events_user_id_lookup_idx on public.analytics_events(user_id);

-- user_id + created_at indexes for bounded dashboard and audit queries.
create index if not exists user_preferences_user_created_idx on public.user_preferences(user_id, created_at desc);
create index if not exists household_members_user_created_idx on public.household_members(user_id, created_at desc);
create index if not exists conversation_sessions_user_created_idx on public.conversation_sessions(user_id, created_at desc);
create index if not exists conversation_messages_user_created_idx on public.conversation_messages(user_id, created_at desc);
create index if not exists saved_recommendations_user_created_idx on public.saved_recommendations(user_id, created_at desc);
create index if not exists consent_events_user_created_idx on public.consent_events(user_id, created_at desc);
create index if not exists triage_assessments_user_created_idx on public.triage_assessments(user_id, created_at desc);
create index if not exists department_recommendations_user_created_idx on public.department_recommendations(user_id, created_at desc);
create index if not exists insurance_profiles_user_created_idx on public.insurance_profiles(user_id, created_at desc);
create index if not exists insurance_recommendations_user_created_idx on public.insurance_recommendations(user_id, created_at desc);
create index if not exists escalation_cases_user_created_idx on public.escalation_cases(user_id, created_at desc);
create index if not exists audit_logs_user_created_idx on public.audit_logs(user_id, created_at desc);
create index if not exists ai_usage_events_user_created_idx on public.ai_usage_events(user_id, created_at desc);
create index if not exists analytics_events_user_created_idx on public.analytics_events(user_id, created_at desc);

-- user_id + date indexes for precomputed summaries and goal progress.
create index if not exists daily_health_summaries_user_summary_date_idx
  on public.daily_health_summaries(user_id, summary_date);
create index if not exists weekly_health_summaries_user_week_start_date_idx
  on public.weekly_health_summaries(user_id, week_start_date);
create index if not exists user_goal_progress_user_progress_date_idx
  on public.user_goal_progress(user_id, progress_date desc);
create index if not exists goals_user_deadline_idx
  on public.goals(user_id, deadline)
  where deadline is not null;

-- user_id + category/status indexes for filtering and operational screens.
create index if not exists health_memory_user_category_idx on public.health_memory(user_id, memory_type);
create index if not exists health_memory_user_status_idx on public.health_memory(user_id, consent_status);
create index if not exists meals_user_category_idx on public.meals(user_id, meal_type);
create index if not exists goals_user_category_idx on public.goals(user_id, goal_type);
create index if not exists goals_user_status_created_idx on public.goals(user_id, status, created_at desc);
create index if not exists escalation_cases_user_status_idx on public.escalation_cases(user_id, status, created_at desc);
create index if not exists escalation_cases_user_category_idx on public.escalation_cases(user_id, case_type, created_at desc);
create index if not exists ai_usage_events_user_status_idx on public.ai_usage_events(user_id, status, created_at desc);
create index if not exists analytics_events_user_category_idx on public.analytics_events(user_id, event_name, created_at desc);
create index if not exists saved_recommendations_user_category_idx on public.saved_recommendations(user_id, recommendation_type, created_at desc);
create index if not exists consent_events_user_category_idx on public.consent_events(user_id, consent_type, created_at desc);
create index if not exists audit_logs_user_category_idx on public.audit_logs(user_id, event_type, created_at desc);

comment on table public.daily_health_summaries is
  'Per-user daily rollup used by dashboard and AI context to avoid full raw-log scans.';
comment on table public.weekly_health_summaries is
  'Per-user weekly rollup used by progress and weekly report features.';
comment on table public.ai_daily_recommendations is
  'Per-user daily cached recommendation; regeneration is rate limited in server routes.';
comment on table public.ai_usage_events is
  'Privacy-safe AI usage accounting. Do not store raw prompts or health text here.';
comment on table public.analytics_events is
  'Privacy-safe product event metadata. Do not store symptoms, policy text, or free-text notes.';
