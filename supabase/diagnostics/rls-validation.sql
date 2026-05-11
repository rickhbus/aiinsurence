-- AI Health Guide / 智健導航 RLS validation.
-- Read-only. Run in Supabase SQL editor against staging after migrations.

set statement_timeout = '15s';

with expected_user_owned_tables(table_name) as (
  values
    ('profiles'),
    ('user_preferences'),
    ('household_members'),
    ('conversation_sessions'),
    ('conversation_messages'),
    ('saved_recommendations'),
    ('consent_events'),
    ('triage_assessments'),
    ('department_recommendations'),
    ('insurance_profiles'),
    ('insurance_recommendations'),
    ('escalation_cases'),
    ('audit_logs'),
    ('health_memory'),
    ('running_logs'),
    ('gym_logs'),
    ('meals'),
    ('water_logs'),
    ('sleep_logs'),
    ('body_metrics'),
    ('goals'),
    ('daily_health_summaries'),
    ('weekly_health_summaries'),
    ('user_streaks'),
    ('user_goal_progress'),
    ('ai_daily_recommendations'),
    ('ai_usage_events'),
    ('symptom_checks'),
    ('insurance_notes'),
    ('analytics_events'),
    ('gbl_cases'),
    ('gbl_analysis_results'),
    ('emotion_engine_results'),
    ('insurance_analyses'),
    ('analysis_jobs'),
    ('mobile_health_sync_batches'),
    ('mobile_health_records')
)
select
  e.table_name,
  case when c.relrowsecurity then 'enabled' else 'missing_rls' end as rls_status,
  count(p.policyname) filter (where p.cmd = 'SELECT') as select_policy_count,
  count(p.policyname) filter (where p.cmd = 'INSERT') as insert_policy_count,
  count(p.policyname) filter (where p.cmd = 'UPDATE') as update_policy_count,
  count(p.policyname) filter (where p.cmd = 'DELETE') as delete_policy_count
from expected_user_owned_tables e
join pg_class c on c.relname = e.table_name
join pg_namespace n on n.oid = c.relnamespace and n.nspname = 'public'
left join pg_policies p on p.schemaname = 'public' and p.tablename = e.table_name
group by e.table_name, c.relrowsecurity
order by e.table_name;

-- Public education content may be public read-only. Writes should not be
-- granted to anon/authenticated clients.
select
  table_schema,
  table_name,
  privilege_type,
  grantee
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'health_lessons'
order by grantee, privilege_type;

-- Adviser handoff must stay consent-gated.
select
  policyname,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'escalation_cases'
  and policyname ilike '%adviser%';
