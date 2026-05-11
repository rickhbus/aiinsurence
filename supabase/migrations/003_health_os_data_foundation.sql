create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.health_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  memory_type text check (memory_type in ('profile', 'fitness', 'nutrition', 'healthcare', 'insurance', 'behavior')) not null,
  content text not null check (char_length(content) <= 600),
  source text not null default 'user_confirmed',
  consent_status text check (consent_status in ('saved', 'declined', 'edited', 'deleted')) not null default 'saved',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.running_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  distance_km numeric not null check (distance_km > 0 and distance_km <= 100),
  duration_seconds integer not null check (duration_seconds > 0 and duration_seconds <= 86400),
  pace text,
  heart_rate_avg integer check (heart_rate_avg between 30 and 240),
  calories integer check (calories between 0 and 5000),
  rpe integer check (rpe between 1 and 10),
  route_notes text,
  weather text,
  shoe text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gym_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  workout_title text,
  exercise_name text not null,
  muscle_group text,
  sets integer not null check (sets between 1 and 60),
  reps integer not null check (reps between 1 and 300),
  weight_kg numeric check (weight_kg between 0 and 1000),
  rest_seconds integer check (rest_seconds between 0 and 7200),
  rpe integer check (rpe between 1 and 10),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  meal_type text check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack', 'other')) not null,
  food_name text not null,
  calories integer check (calories between 0 and 5000),
  protein_g numeric check (protein_g between 0 and 500),
  carbs_g numeric check (carbs_g between 0 and 800),
  fat_g numeric check (fat_g between 0 and 400),
  fiber_g numeric check (fiber_g between 0 and 200),
  sugar_g numeric check (sugar_g between 0 and 400),
  sodium_mg numeric check (sodium_mg between 0 and 20000),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.water_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  amount_ml integer not null check (amount_ml between 1 and 5000),
  created_at timestamptz not null default now()
);

create table if not exists public.sleep_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  sleep_hours numeric not null check (sleep_hours >= 0 and sleep_hours <= 24),
  bedtime text,
  wake_time text,
  sleep_quality integer check (sleep_quality between 1 and 10),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.body_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  weight_kg numeric check (weight_kg > 0 and weight_kg <= 500),
  waist_cm numeric check (waist_cm > 0 and waist_cm <= 300),
  body_fat_percentage numeric check (body_fat_percentage > 0 and body_fat_percentage <= 80),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (weight_kg is not null or waist_cm is not null or body_fat_percentage is not null)
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  goal_type text not null,
  target_value numeric,
  current_value numeric not null default 0,
  unit text,
  deadline date,
  weekly_action text,
  status text check (status in ('active', 'paused', 'completed', 'archived')) not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.health_lessons (
  id uuid primary key default gen_random_uuid(),
  title_en text not null,
  title_zh text not null,
  category text not null,
  difficulty text,
  reading_time integer not null default 3,
  content_en text not null,
  content_zh text not null,
  example_en text,
  example_zh text,
  action_step_en text,
  action_step_zh text,
  quiz_question_en text,
  quiz_question_zh text,
  quiz_answer text,
  related_tracker text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.daily_health_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  summary_date date not null,
  calories_total integer not null default 0,
  protein_total numeric not null default 0,
  carbs_total numeric not null default 0,
  fat_total numeric not null default 0,
  water_total_ml integer not null default 0,
  sleep_hours numeric not null default 0,
  sleep_quality numeric not null default 0,
  running_distance_km numeric not null default 0,
  active_minutes integer not null default 0,
  gym_sessions integer not null default 0,
  health_score integer not null default 0,
  activity_score integer not null default 0,
  nutrition_score integer not null default 0,
  sleep_score integer not null default 0,
  hydration_score integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, summary_date)
);

create table if not exists public.weekly_health_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  week_start_date date not null,
  running_distance_km numeric not null default 0,
  gym_sessions integer not null default 0,
  avg_sleep_hours numeric not null default 0,
  protein_consistency_days integer not null default 0,
  water_goal_days integer not null default 0,
  workout_days integer not null default 0,
  health_score_avg integer not null default 0,
  ai_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_start_date)
);

create table if not exists public.user_streaks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  streak_type text not null,
  current_count integer not null default 0,
  best_count integer not null default 0,
  last_logged_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, streak_type)
);

create table if not exists public.user_goal_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  goal_id uuid references public.goals(id) on delete cascade not null,
  progress_date date not null default current_date,
  current_value numeric not null default 0,
  progress_percent integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, goal_id, progress_date)
);

create table if not exists public.ai_daily_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  recommendation_date date not null,
  recommendation jsonb not null,
  input_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, recommendation_date)
);

create table if not exists public.ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  route text not null,
  input_tokens_estimate integer,
  output_tokens_estimate integer,
  cost_estimate numeric,
  status text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.symptom_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  symptom_text text not null,
  duration text,
  severity text check (severity in ('mild', 'moderate', 'severe')),
  red_flags text[] not null default '{}',
  public_private_preference text check (public_private_preference in ('public', 'private', 'either', 'not_sure')),
  suggested_next_step text check (suggested_next_step in ('self_care_education', 'gp_family_doctor', 'specialist', 'ae_emergency')),
  safety_locked boolean not null default false,
  disclaimer text not null default '這不是診斷。',
  created_at timestamptz not null default now()
);

create table if not exists public.insurance_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  insurance_type text check (insurance_type in ('hospital', 'outpatient', 'critical_illness', 'accident', 'dental', 'travel', 'other')) not null default 'other',
  topic text not null,
  notes text,
  claim_documents text[] not null default '{}',
  questions_to_ask text[] not null default '{}',
  disclaimer text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  event_name text not null,
  event_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists health_memory_user_type_idx on public.health_memory(user_id, memory_type);
create index if not exists health_memory_user_created_idx on public.health_memory(user_id, created_at desc);
create index if not exists running_logs_user_created_idx on public.running_logs(user_id, created_at desc);
create index if not exists gym_logs_user_created_idx on public.gym_logs(user_id, created_at desc);
create index if not exists gym_logs_user_muscle_idx on public.gym_logs(user_id, muscle_group);
create index if not exists meals_user_created_idx on public.meals(user_id, created_at desc);
create index if not exists water_logs_user_created_idx on public.water_logs(user_id, created_at desc);
create index if not exists sleep_logs_user_created_idx on public.sleep_logs(user_id, created_at desc);
create index if not exists body_metrics_user_created_idx on public.body_metrics(user_id, created_at desc);
create index if not exists goals_user_status_idx on public.goals(user_id, status);
create index if not exists daily_health_summaries_user_date_idx on public.daily_health_summaries(user_id, summary_date desc);
create index if not exists weekly_health_summaries_user_week_idx on public.weekly_health_summaries(user_id, week_start_date desc);
create index if not exists user_streaks_user_type_idx on public.user_streaks(user_id, streak_type);
create index if not exists user_goal_progress_user_goal_date_idx on public.user_goal_progress(user_id, goal_id, progress_date desc);
create index if not exists ai_daily_recommendations_user_date_idx on public.ai_daily_recommendations(user_id, recommendation_date desc);
create index if not exists ai_usage_events_user_route_created_idx on public.ai_usage_events(user_id, route, created_at desc);
create index if not exists symptom_checks_user_created_idx on public.symptom_checks(user_id, created_at desc);
create index if not exists insurance_notes_user_created_idx on public.insurance_notes(user_id, created_at desc);
create index if not exists analytics_events_user_name_created_idx on public.analytics_events(user_id, event_name, created_at desc);

drop trigger if exists health_memory_set_updated_at on public.health_memory;
create trigger health_memory_set_updated_at before update on public.health_memory for each row execute function public.set_updated_at();
drop trigger if exists running_logs_set_updated_at on public.running_logs;
create trigger running_logs_set_updated_at before update on public.running_logs for each row execute function public.set_updated_at();
drop trigger if exists gym_logs_set_updated_at on public.gym_logs;
create trigger gym_logs_set_updated_at before update on public.gym_logs for each row execute function public.set_updated_at();
drop trigger if exists meals_set_updated_at on public.meals;
create trigger meals_set_updated_at before update on public.meals for each row execute function public.set_updated_at();
drop trigger if exists sleep_logs_set_updated_at on public.sleep_logs;
create trigger sleep_logs_set_updated_at before update on public.sleep_logs for each row execute function public.set_updated_at();
drop trigger if exists body_metrics_set_updated_at on public.body_metrics;
create trigger body_metrics_set_updated_at before update on public.body_metrics for each row execute function public.set_updated_at();
drop trigger if exists goals_set_updated_at on public.goals;
create trigger goals_set_updated_at before update on public.goals for each row execute function public.set_updated_at();
drop trigger if exists health_lessons_set_updated_at on public.health_lessons;
create trigger health_lessons_set_updated_at before update on public.health_lessons for each row execute function public.set_updated_at();
drop trigger if exists daily_health_summaries_set_updated_at on public.daily_health_summaries;
create trigger daily_health_summaries_set_updated_at before update on public.daily_health_summaries for each row execute function public.set_updated_at();
drop trigger if exists weekly_health_summaries_set_updated_at on public.weekly_health_summaries;
create trigger weekly_health_summaries_set_updated_at before update on public.weekly_health_summaries for each row execute function public.set_updated_at();
drop trigger if exists user_streaks_set_updated_at on public.user_streaks;
create trigger user_streaks_set_updated_at before update on public.user_streaks for each row execute function public.set_updated_at();
drop trigger if exists user_goal_progress_set_updated_at on public.user_goal_progress;
create trigger user_goal_progress_set_updated_at before update on public.user_goal_progress for each row execute function public.set_updated_at();
drop trigger if exists ai_daily_recommendations_set_updated_at on public.ai_daily_recommendations;
create trigger ai_daily_recommendations_set_updated_at before update on public.ai_daily_recommendations for each row execute function public.set_updated_at();
drop trigger if exists insurance_notes_set_updated_at on public.insurance_notes;
create trigger insurance_notes_set_updated_at before update on public.insurance_notes for each row execute function public.set_updated_at();

alter table public.health_memory enable row level security;
alter table public.running_logs enable row level security;
alter table public.gym_logs enable row level security;
alter table public.meals enable row level security;
alter table public.water_logs enable row level security;
alter table public.sleep_logs enable row level security;
alter table public.body_metrics enable row level security;
alter table public.goals enable row level security;
alter table public.health_lessons enable row level security;
alter table public.daily_health_summaries enable row level security;
alter table public.weekly_health_summaries enable row level security;
alter table public.user_streaks enable row level security;
alter table public.user_goal_progress enable row level security;
alter table public.ai_daily_recommendations enable row level security;
alter table public.ai_usage_events enable row level security;
alter table public.symptom_checks enable row level security;
alter table public.insurance_notes enable row level security;
alter table public.analytics_events enable row level security;

grant select, insert, update, delete on public.health_memory to authenticated;
grant select, insert, update, delete on public.running_logs to authenticated;
grant select, insert, update, delete on public.gym_logs to authenticated;
grant select, insert, update, delete on public.meals to authenticated;
grant select, insert, update, delete on public.water_logs to authenticated;
grant select, insert, update, delete on public.sleep_logs to authenticated;
grant select, insert, update, delete on public.body_metrics to authenticated;
grant select, insert, update, delete on public.goals to authenticated;
grant select on public.health_lessons to anon, authenticated;
grant select, insert, update, delete on public.daily_health_summaries to authenticated;
grant select, insert, update, delete on public.weekly_health_summaries to authenticated;
grant select, insert, update, delete on public.user_streaks to authenticated;
grant select, insert, update, delete on public.user_goal_progress to authenticated;
grant select, insert, update, delete on public.ai_daily_recommendations to authenticated;
grant select, insert on public.ai_usage_events to authenticated;
grant select, insert on public.symptom_checks to authenticated;
grant select, insert, update, delete on public.insurance_notes to authenticated;
grant insert, select on public.analytics_events to authenticated;

drop policy if exists health_lessons_select_all on public.health_lessons;
create policy health_lessons_select_all on public.health_lessons for select using (true);

drop policy if exists health_memory_own_rows on public.health_memory;
create policy health_memory_own_rows on public.health_memory for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists running_logs_own_rows on public.running_logs;
create policy running_logs_own_rows on public.running_logs for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists gym_logs_own_rows on public.gym_logs;
create policy gym_logs_own_rows on public.gym_logs for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists meals_own_rows on public.meals;
create policy meals_own_rows on public.meals for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists water_logs_own_rows on public.water_logs;
create policy water_logs_own_rows on public.water_logs for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists sleep_logs_own_rows on public.sleep_logs;
create policy sleep_logs_own_rows on public.sleep_logs for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists body_metrics_own_rows on public.body_metrics;
create policy body_metrics_own_rows on public.body_metrics for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists goals_own_rows on public.goals;
create policy goals_own_rows on public.goals for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists daily_health_summaries_own_rows on public.daily_health_summaries;
create policy daily_health_summaries_own_rows on public.daily_health_summaries for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists weekly_health_summaries_own_rows on public.weekly_health_summaries;
create policy weekly_health_summaries_own_rows on public.weekly_health_summaries for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists user_streaks_own_rows on public.user_streaks;
create policy user_streaks_own_rows on public.user_streaks for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists user_goal_progress_own_rows on public.user_goal_progress;
create policy user_goal_progress_own_rows on public.user_goal_progress for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists ai_daily_recommendations_own_rows on public.ai_daily_recommendations;
create policy ai_daily_recommendations_own_rows on public.ai_daily_recommendations for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists ai_usage_events_own_rows on public.ai_usage_events;
create policy ai_usage_events_own_rows on public.ai_usage_events for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists symptom_checks_own_rows on public.symptom_checks;
create policy symptom_checks_own_rows on public.symptom_checks for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists insurance_notes_own_rows on public.insurance_notes;
create policy insurance_notes_own_rows on public.insurance_notes for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists analytics_events_own_rows on public.analytics_events;
create policy analytics_events_own_rows on public.analytics_events for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
