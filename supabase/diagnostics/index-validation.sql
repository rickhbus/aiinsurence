-- AI Health Guide / 智健導航 index validation.
-- Read-only. Run after migrations and before production traffic.

set statement_timeout = '15s';

with expected_indexes(indexname) as (
  values
    ('profiles_id_lookup_idx'),
    ('user_preferences_user_id_lookup_idx'),
    ('user_preferences_user_created_idx'),
    ('consent_events_user_id_lookup_idx'),
    ('consent_events_user_created_idx'),
    ('consent_events_user_category_idx'),
    ('health_memory_user_id_lookup_idx'),
    ('health_memory_user_created_idx'),
    ('health_memory_user_category_idx'),
    ('health_memory_user_status_idx'),
    ('running_logs_user_created_idx'),
    ('gym_logs_user_created_idx'),
    ('meals_user_created_idx'),
    ('water_logs_user_created_idx'),
    ('sleep_logs_user_created_idx'),
    ('body_metrics_user_created_idx'),
    ('daily_health_summaries_user_summary_date_idx'),
    ('weekly_health_summaries_user_week_start_date_idx'),
    ('user_goal_progress_user_progress_date_idx'),
    ('goals_user_category_idx'),
    ('goals_user_status_created_idx'),
    ('ai_usage_events_user_created_idx'),
    ('ai_usage_events_user_status_idx'),
    ('analytics_events_user_category_idx'),
    ('gbl_cases_user_status_idx'),
    ('gbl_analysis_results_user_type_idx'),
    ('emotion_engine_results_user_urgency_idx'),
    ('insurance_analyses_user_status_idx'),
    ('analysis_jobs_user_status_idx'),
    ('analysis_jobs_user_feature_idx'),
    ('mobile_health_sync_batches_user_id_lookup_idx'),
    ('mobile_health_sync_batches_user_created_idx'),
    ('mobile_health_sync_batches_user_status_idx'),
    ('mobile_health_sync_batches_user_platform_idx'),
    ('mobile_health_records_user_id_lookup_idx'),
    ('mobile_health_records_user_created_idx'),
    ('mobile_health_records_user_type_start_idx'),
    ('mobile_health_records_user_platform_start_idx')
)
select
  e.indexname,
  case when i.indexname is null then 'missing' else 'present' end as status,
  i.tablename,
  i.indexdef
from expected_indexes e
left join pg_indexes i
  on i.schemaname = 'public'
 and i.indexname = e.indexname
order by e.indexname;

-- Check for large user-owned tables without a direct user_id index.
select
  c.relname as table_name,
  case when exists (
    select 1
    from pg_index idx
    join pg_attribute a
      on a.attrelid = idx.indrelid
     and a.attnum = any(idx.indkey)
    where idx.indrelid = c.oid
      and a.attname = 'user_id'
  ) then 'has_user_id_index' else 'missing_user_id_index' end as user_id_index_status
from pg_class c
join pg_namespace n on n.oid = c.relnamespace and n.nspname = 'public'
where c.relkind = 'r'
  and c.relname in (
    'conversation_messages',
    'saved_recommendations',
    'health_memory',
    'running_logs',
    'gym_logs',
    'meals',
    'water_logs',
    'sleep_logs',
    'body_metrics',
    'daily_health_summaries',
    'weekly_health_summaries',
    'ai_usage_events',
    'gbl_analysis_results',
    'emotion_engine_results',
    'insurance_analyses',
    'analysis_jobs',
    'mobile_health_records'
  )
order by c.relname;
