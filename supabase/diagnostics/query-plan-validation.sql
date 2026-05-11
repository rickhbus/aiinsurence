-- AI Health Guide / 智健導航 staging query-plan validation.
-- Read-only. Run against staging with production-shaped synthetic data.
-- Replace the UUID in the params CTE with a staging test user's auth.uid().

set statement_timeout = '15s';

with expected_indexes(indexname) as (
  values
    ('health_memory_user_created_idx'),
    ('health_memory_user_category_idx'),
    ('health_memory_user_status_idx'),
    ('daily_health_summaries_user_summary_date_idx'),
    ('weekly_health_summaries_user_week_start_date_idx'),
    ('goals_user_status_created_idx'),
    ('ai_usage_events_user_status_idx'),
    ('ai_usage_events_feature_created_idx'),
    ('gbl_cases_user_created_idx'),
    ('gbl_cases_user_status_idx'),
    ('gbl_analysis_results_user_created_idx'),
    ('gbl_analysis_results_user_type_idx'),
    ('emotion_engine_results_user_created_idx'),
    ('emotion_engine_results_user_urgency_idx'),
    ('insurance_analyses_user_created_idx'),
    ('insurance_analyses_user_status_idx')
)
select
  e.indexname,
  case when i.indexname is null then 'missing' else 'present' end as status
from expected_indexes e
left join pg_indexes i
  on i.schemaname = 'public'
 and i.indexname = e.indexname
order by e.indexname;

-- Dashboard data path: summaries, recent logs, goals, and memory counts.
explain analyze
with params as (
  select
    '00000000-0000-0000-0000-000000000000'::uuid as user_id,
    current_date as day,
    date_trunc('week', current_date)::date as week_start
)
select *
from public.daily_health_summaries d, params p
where d.user_id = p.user_id
  and d.summary_date = p.day
limit 1;

explain analyze
with params as (
  select
    '00000000-0000-0000-0000-000000000000'::uuid as user_id,
    date_trunc('week', current_date)::date as week_start
)
select *
from public.weekly_health_summaries w, params p
where w.user_id = p.user_id
  and w.week_start_date = p.week_start
limit 1;

explain analyze
with params as (
  select '00000000-0000-0000-0000-000000000000'::uuid as user_id
)
select id, goal_type, status, target_value, deadline, created_at
from public.goals g, params p
where g.user_id = p.user_id
  and g.status in ('active', 'paused')
order by g.created_at desc
limit 20;

-- History query path: bounded, per-user analysis history.
explain analyze
with params as (
  select '00000000-0000-0000-0000-000000000000'::uuid as user_id
)
select id, case_id, analysis_type, status, user_visible_summary, created_at
from public.gbl_analysis_results r, params p
where r.user_id = p.user_id
order by r.created_at desc
limit 20;

explain analyze
with params as (
  select '00000000-0000-0000-0000-000000000000'::uuid as user_id
)
select id, case_id, primary_emotion, urgency_level, user_visible_summary, created_at
from public.emotion_engine_results r, params p
where r.user_id = p.user_id
order by r.created_at desc
limit 20;

-- AI usage daily-limit path: per-user, per-route, date-bounded status filter.
explain analyze
with params as (
  select
    '00000000-0000-0000-0000-000000000000'::uuid as user_id,
    '/api/gbl/analyze'::text as route,
    date_trunc('day', now()) as day_start
)
select count(*)
from public.ai_usage_events e, params p
where e.user_id = p.user_id
  and e.route = p.route
  and e.created_at >= p.day_start
  and e.status <> 'rate_limited';

-- Memory listing path: per-user, optional category filter.
explain analyze
with params as (
  select
    '00000000-0000-0000-0000-000000000000'::uuid as user_id,
    'nutrition'::text as memory_type
)
select id, memory_type, content, consent_status, created_at
from public.health_memory m, params p
where m.user_id = p.user_id
  and m.memory_type = p.memory_type
order by m.created_at desc
limit 50;

-- Daily and weekly dashboard summary lookup paths.
explain analyze
with params as (
  select
    '00000000-0000-0000-0000-000000000000'::uuid as user_id,
    current_date - interval '30 days' as from_day,
    current_date as to_day
)
select summary_date, health_score, active_minutes, protein_total, water_total_ml, sleep_hours
from public.daily_health_summaries d, params p
where d.user_id = p.user_id
  and d.summary_date >= p.from_day
  and d.summary_date <= p.to_day
order by d.summary_date asc;

explain analyze
with params as (
  select
    '00000000-0000-0000-0000-000000000000'::uuid as user_id,
    date_trunc('week', current_date)::date - interval '12 weeks' as from_week
)
select week_start_date, running_distance_km, gym_sessions, avg_sleep_hours, health_score_avg
from public.weekly_health_summaries w, params p
where w.user_id = p.user_id
  and w.week_start_date >= p.from_week
order by w.week_start_date desc
limit 12;
