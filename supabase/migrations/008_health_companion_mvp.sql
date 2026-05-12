create extension if not exists pgcrypto;

create table if not exists public.daily_health_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  log_date date not null default current_date,
  wake_time timestamptz,
  sleep_minutes integer check (sleep_minutes between 0 and 1440),
  sleep_quality integer check (sleep_quality between 1 and 10),
  energy_score integer check (energy_score between 1 and 10),
  mood_score integer check (mood_score between 1 and 10),
  stress_score integer check (stress_score between 1 and 10),
  body_notes text,
  today_goal text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, log_date)
);

create table if not exists public.mood_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  logged_at timestamptz not null default now(),
  mood_score integer check (mood_score between 1 and 10),
  stress_score integer check (stress_score between 1 and 10),
  energy_score integer check (energy_score between 1 and 10),
  emotion_label text,
  trigger_category text,
  body_links text[] not null default '{}',
  user_text text,
  ai_reflection text,
  suggested_action text,
  safety_flag text,
  created_at timestamptz not null default now()
);

create table if not exists public.meal_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  meal_time timestamptz not null default now(),
  meal_type text check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack', 'drink')) not null,
  image_path text,
  description text,
  estimated_calories integer check (estimated_calories between 0 and 5000),
  protein_g numeric check (protein_g between 0 and 500),
  carbs_g numeric check (carbs_g between 0 and 800),
  fat_g numeric check (fat_g between 0 and 400),
  fiber_g numeric check (fiber_g between 0 and 200),
  water_ml integer check (water_ml between 0 and 5000),
  caffeine_mg integer check (caffeine_mg between 0 and 1200),
  alcohol_units numeric check (alcohol_units between 0 and 30),
  high_sugar_flag boolean not null default false,
  high_sodium_flag boolean not null default false,
  ai_summary text,
  created_at timestamptz not null default now()
);

create table if not exists public.hydration_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  logged_at timestamptz not null default now(),
  water_ml integer not null default 0 check (water_ml between 0 and 5000),
  caffeine_mg integer not null default 0 check (caffeine_mg between 0 and 1200),
  alcohol_units numeric not null default 0 check (alcohol_units between 0 and 30),
  drink_type text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.bowel_urine_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  logged_at timestamptz not null default now(),
  bowel_movement boolean,
  stool_type integer check (stool_type between 1 and 7),
  urine_color text check (urine_color in ('clear', 'pale_yellow', 'yellow', 'dark_yellow', 'brown_red_pink', 'unknown')),
  pain_flag boolean not null default false,
  blood_flag boolean not null default false,
  fever_flag boolean not null default false,
  dehydration_concern boolean not null default false,
  notes text,
  safety_flag text,
  created_at timestamptz not null default now()
);

create table if not exists public.gym_workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  workout_date date not null default current_date,
  started_at timestamptz,
  ended_at timestamptz,
  duration_minutes integer check (duration_minutes between 0 and 1440),
  workout_type text,
  target_muscle_groups text[] not null default '{}',
  intensity integer check (intensity between 1 and 10),
  soreness_before integer check (soreness_before between 1 and 10),
  soreness_after integer check (soreness_after between 1 and 10),
  energy_before integer check (energy_before between 1 and 10),
  mood_before integer check (mood_before between 1 and 10),
  mood_after integer check (mood_after between 1 and 10),
  pain_flag boolean not null default false,
  safety_flag text,
  ai_summary text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gym_exercise_sets (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid references public.gym_workouts(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  exercise_name text not null,
  muscle_group text,
  set_number integer not null check (set_number between 1 and 100),
  reps integer check (reps between 0 and 300),
  weight_kg numeric check (weight_kg between 0 and 1000),
  rpe integer check (rpe between 1 and 10),
  rest_seconds integer check (rest_seconds between 0 and 7200),
  pain_flag boolean not null default false,
  form_note text,
  unilateral boolean,
  completed boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.workout_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  goal text,
  level text,
  days_per_week integer check (days_per_week between 1 and 7),
  template_json jsonb not null default '{}'::jsonb,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((is_system = true and user_id is null) or (is_system = false))
);

create table if not exists public.subscription_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  plan text not null default 'free',
  status text not null default 'active',
  features jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.business_leads (
  id uuid primary key default gen_random_uuid(),
  lead_type text not null check (lead_type in ('gym', 'personal_trainer', 'employer', 'clinic', 'insurance_adviser', 'other')),
  company_name text not null check (char_length(company_name) between 1 and 160),
  contact_name text not null check (char_length(contact_name) between 1 and 120),
  email text not null check (char_length(email) <= 200 and email like '%@%'),
  phone text check (phone is null or char_length(phone) <= 40),
  message text check (message is null or char_length(message) <= 1500),
  consent_to_contact boolean not null default false,
  created_at timestamptz not null default now(),
  check (consent_to_contact = true)
);

alter table public.daily_health_summaries
  add column if not exists energy_score integer not null default 0,
  add column if not exists recovery_score integer not null default 0,
  add column if not exists stress_score integer not null default 0,
  add column if not exists movement_score integer not null default 0,
  add column if not exists digestive_score integer not null default 0,
  add column if not exists safety_status text not null default 'green',
  add column if not exists ai_summary text,
  add column if not exists next_actions text[] not null default '{}';

alter table public.daily_health_logs enable row level security;
alter table public.mood_logs enable row level security;
alter table public.meal_logs enable row level security;
alter table public.hydration_logs enable row level security;
alter table public.bowel_urine_logs enable row level security;
alter table public.gym_workouts enable row level security;
alter table public.gym_exercise_sets enable row level security;
alter table public.workout_templates enable row level security;
alter table public.subscription_entitlements enable row level security;
alter table public.business_leads enable row level security;

grant select, insert, update, delete on public.daily_health_logs to authenticated;
grant select, insert, update, delete on public.mood_logs to authenticated;
grant select, insert, update, delete on public.meal_logs to authenticated;
grant select, insert, update, delete on public.hydration_logs to authenticated;
grant select, insert, update, delete on public.bowel_urine_logs to authenticated;
grant select, insert, update, delete on public.gym_workouts to authenticated;
grant select, insert, update, delete on public.gym_exercise_sets to authenticated;
grant select, insert, update, delete on public.subscription_entitlements to authenticated;
grant select on public.workout_templates to anon, authenticated;
grant insert, update, delete on public.workout_templates to authenticated;
grant insert on public.business_leads to anon, authenticated;

drop policy if exists daily_health_logs_own_rows on public.daily_health_logs;
create policy daily_health_logs_own_rows
on public.daily_health_logs for all
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists mood_logs_own_rows on public.mood_logs;
create policy mood_logs_own_rows
on public.mood_logs for all
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists meal_logs_own_rows on public.meal_logs;
create policy meal_logs_own_rows
on public.meal_logs for all
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists hydration_logs_own_rows on public.hydration_logs;
create policy hydration_logs_own_rows
on public.hydration_logs for all
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists bowel_urine_logs_own_rows on public.bowel_urine_logs;
create policy bowel_urine_logs_own_rows
on public.bowel_urine_logs for all
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists gym_workouts_own_rows on public.gym_workouts;
create policy gym_workouts_own_rows
on public.gym_workouts for all
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists gym_exercise_sets_own_rows on public.gym_exercise_sets;
create policy gym_exercise_sets_own_rows
on public.gym_exercise_sets for all
to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.gym_workouts
    where gym_workouts.id = gym_exercise_sets.workout_id
      and gym_workouts.user_id = (select auth.uid())
  )
);

drop policy if exists workout_templates_select_accessible on public.workout_templates;
create policy workout_templates_select_accessible
on public.workout_templates for select
using (is_system = true or user_id = (select auth.uid()));

drop policy if exists workout_templates_insert_own on public.workout_templates;
create policy workout_templates_insert_own
on public.workout_templates for insert
to authenticated
with check (user_id = (select auth.uid()) and is_system = false);

drop policy if exists workout_templates_update_own on public.workout_templates;
create policy workout_templates_update_own
on public.workout_templates for update
to authenticated
using (user_id = (select auth.uid()) and is_system = false)
with check (user_id = (select auth.uid()) and is_system = false);

drop policy if exists workout_templates_delete_own on public.workout_templates;
create policy workout_templates_delete_own
on public.workout_templates for delete
to authenticated
using (user_id = (select auth.uid()) and is_system = false);

drop policy if exists subscription_entitlements_own_rows on public.subscription_entitlements;
create policy subscription_entitlements_own_rows
on public.subscription_entitlements for all
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists business_leads_insert_contact_consent on public.business_leads;
create policy business_leads_insert_contact_consent
on public.business_leads for insert
to anon, authenticated
with check (consent_to_contact = true);

create index if not exists daily_health_logs_user_date_idx on public.daily_health_logs(user_id, log_date desc);
create index if not exists mood_logs_user_logged_idx on public.mood_logs(user_id, logged_at desc);
create index if not exists meal_logs_user_meal_time_idx on public.meal_logs(user_id, meal_time desc);
create index if not exists hydration_logs_user_logged_idx on public.hydration_logs(user_id, logged_at desc);
create index if not exists bowel_urine_logs_user_logged_idx on public.bowel_urine_logs(user_id, logged_at desc);
create index if not exists gym_workouts_user_date_idx on public.gym_workouts(user_id, workout_date desc);
create index if not exists gym_workouts_user_started_idx on public.gym_workouts(user_id, started_at desc);
create index if not exists gym_exercise_sets_workout_idx on public.gym_exercise_sets(workout_id, set_number);
create index if not exists gym_exercise_sets_user_idx on public.gym_exercise_sets(user_id, created_at desc);
create index if not exists workout_templates_user_idx on public.workout_templates(user_id, created_at desc);
create index if not exists workout_templates_system_idx on public.workout_templates(is_system, name);
create index if not exists subscription_entitlements_user_idx on public.subscription_entitlements(user_id);
create index if not exists business_leads_created_idx on public.business_leads(created_at desc);
create index if not exists business_leads_type_idx on public.business_leads(lead_type, created_at desc);

drop trigger if exists daily_health_logs_set_updated_at on public.daily_health_logs;
create trigger daily_health_logs_set_updated_at before update on public.daily_health_logs for each row execute function public.set_updated_at();
drop trigger if exists gym_workouts_set_updated_at on public.gym_workouts;
create trigger gym_workouts_set_updated_at before update on public.gym_workouts for each row execute function public.set_updated_at();
drop trigger if exists workout_templates_set_updated_at on public.workout_templates;
create trigger workout_templates_set_updated_at before update on public.workout_templates for each row execute function public.set_updated_at();
drop trigger if exists subscription_entitlements_set_updated_at on public.subscription_entitlements;
create trigger subscription_entitlements_set_updated_at before update on public.subscription_entitlements for each row execute function public.set_updated_at();

create unique index if not exists workout_templates_system_name_unique
  on public.workout_templates(name)
  where is_system = true;

insert into public.workout_templates (name, goal, level, days_per_week, template_json, is_system)
values
  (
    'Beginner Full Body 3 days/week',
    'safe_beginner_plan',
    'beginner',
    3,
    '{"days":[{"name":"Day A","focus":"Full body strength","exercises":["Squat or leg press","Chest press","Seated row","Shoulder press","Plank"]},{"name":"Day B","focus":"Hinge and pull","exercises":["Romanian deadlift","Lat pulldown","Push-up","Lunges","Dead bug"]},{"name":"Day C","focus":"Balanced full body","exercises":["Leg press","Dumbbell bench press","Cable row","Lateral raise","Core"]}],"safetyNote":"Keep 1-3 reps in reserve and stop for chest pain, dizziness, severe breathlessness, or sharp pain."}'::jsonb,
    true
  ),
  (
    'Push / Pull / Legs',
    'strength_hypertrophy',
    'intermediate',
    3,
    '{"days":[{"name":"Push","focus":"Chest, shoulders, triceps","exercises":["Bench press","Shoulder press","Lateral raise","Triceps pushdown"]},{"name":"Pull","focus":"Back, biceps","exercises":["Pull-up or lat pulldown","Seated row","Face pull","Biceps curl"]},{"name":"Legs","focus":"Quads, hamstrings, glutes, calves","exercises":["Squat or leg press","Romanian deadlift","Leg curl","Calf raise"]}],"safetyNote":"Add optional cardio or mobility only when recovery is adequate."}'::jsonb,
    true
  ),
  (
    'Fat Loss',
    'fat_loss',
    'beginner_intermediate',
    5,
    '{"days":[{"name":"Strength days","focus":"3 strength days","exercises":["Full body strength","Protein awareness","No extreme dieting"]},{"name":"Cardio","focus":"2-3 cardio sessions","exercises":["Treadmill walk","Bike","Steps target"]}],"safetyNote":"Use protein awareness and steps; avoid unsafe restriction."}'::jsonb,
    true
  ),
  (
    'Muscle Gain',
    'muscle_gain',
    'intermediate',
    4,
    '{"days":[{"name":"Upper/Lower split","focus":"Progressive overload","exercises":["Bench press","Row","Squat","Romanian deadlift"]},{"name":"Recovery","focus":"Sleep and rest days","exercises":["Rest","Protein awareness","Mobility"]}],"safetyNote":"Progress gradually and avoid pushing through pain or poor recovery."}'::jsonb,
    true
  ),
  (
    'Recovery / Mobility',
    'recovery_mobility',
    'all_levels',
    2,
    '{"days":[{"name":"Light recovery","focus":"Circulation","exercises":["Light walking","Stretching","Mobility","Breathing"]},{"name":"Soft tissue optional","focus":"Relaxation","exercises":["Foam rolling if available","Massage gun if available"]}],"safetyNote":"This is not medical rehab. Persistent pain should be assessed by a qualified professional."}'::jsonb,
    true
  )
on conflict (name) where is_system = true do update
set goal = excluded.goal,
    level = excluded.level,
    days_per_week = excluded.days_per_week,
    template_json = excluded.template_json,
    updated_at = now();

comment on table public.daily_health_logs is
  'User-owned daily wake, sleep, energy, mood, stress, body note, and goal logs for lifestyle readiness. Not medical diagnosis.';
comment on table public.mood_logs is
  'User-owned mood and emotion coaching logs. Emotion is assistive tone support only, not a clinical assessment or insurance decision input.';
comment on table public.meal_logs is
  'User-owned meal and nutrition journal. Estimates are not medical nutrition diagnosis.';
comment on table public.hydration_logs is
  'User-owned water, caffeine, and alcohol tracker.';
comment on table public.bowel_urine_logs is
  'User-owned bowel and urine journal with red-flag safety fields.';
comment on table public.gym_workouts is
  'User-owned workout sessions. Exercise readiness signals are not safety-to-exercise guarantees.';
comment on table public.gym_exercise_sets is
  'User-owned exercise sets linked to gym_workouts.';
comment on table public.subscription_entitlements is
  'Mock MVP entitlement state until a real payment provider is integrated server-side.';
comment on table public.business_leads is
  'B2B lead capture only. Do not collect health, claim, policy, HKID, payment, or sensitive medical data here.';
