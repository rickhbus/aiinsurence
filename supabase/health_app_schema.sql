-- Supabase-ready data model for AI Health Guide / 智健導航.
-- Run in Supabase SQL editor after reviewing against existing project tables.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text,
  language text default 'zh-Hant',
  region text default 'Hong Kong',
  care_preference text check (care_preference in ('public', 'private', 'either', 'not_sure')),
  primary_goal text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.health_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  memory_type text not null check (memory_type in ('profile', 'fitness', 'nutrition', 'healthcare', 'behavior')),
  content text not null,
  source text not null default 'user_confirmed',
  consent_status text not null default 'saved' check (consent_status in ('saved', 'declined', 'edited', 'deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_type text not null,
  title text,
  duration_minutes integer check (duration_minutes >= 0),
  calories integer check (calories >= 0),
  rpe integer check (rpe between 1 and 10),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.running_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  distance_km numeric check (distance_km >= 0),
  duration_seconds integer check (duration_seconds >= 0),
  pace text,
  heart_rate_avg integer check (heart_rate_avg >= 0),
  calories integer check (calories >= 0),
  rpe integer check (rpe between 1 and 10),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.gym_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_id uuid references public.workouts(id) on delete set null,
  exercise_name text not null,
  muscle_group text,
  sets integer check (sets >= 0),
  reps integer check (reps >= 0),
  weight numeric check (weight >= 0),
  rest_seconds integer check (rest_seconds >= 0),
  rpe integer check (rpe between 1 and 10),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  meal_type text not null,
  food_name text not null,
  calories integer check (calories >= 0),
  protein_g numeric check (protein_g >= 0),
  carbs_g numeric check (carbs_g >= 0),
  fat_g numeric check (fat_g >= 0),
  fiber_g numeric check (fiber_g >= 0),
  sugar_g numeric check (sugar_g >= 0),
  sodium_mg numeric check (sodium_mg >= 0),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.water_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount_ml integer not null check (amount_ml >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.body_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  weight_kg numeric check (weight_kg >= 0),
  body_fat_percentage numeric check (body_fat_percentage >= 0 and body_fat_percentage <= 100),
  waist_cm numeric check (waist_cm >= 0),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.sleep_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sleep_hours numeric check (sleep_hours >= 0 and sleep_hours <= 24),
  sleep_quality integer check (sleep_quality between 1 and 10),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_type text not null,
  target_value numeric,
  current_value numeric default 0,
  unit text,
  deadline date,
  status text not null default 'active' check (status in ('active', 'paused', 'completed', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.health_lessons (
  id uuid primary key default gen_random_uuid(),
  title_en text not null,
  title_zh text not null,
  category text not null,
  difficulty text,
  content_en text not null,
  content_zh text not null,
  action_step_en text,
  action_step_zh text,
  quiz_question_en text,
  quiz_question_zh text,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recommendation_type text not null,
  title text not null,
  content text not null,
  reasoning text,
  safety_level text not null default 'normal' check (safety_level in ('normal', 'caution', 'emergency')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.health_memory enable row level security;
alter table public.workouts enable row level security;
alter table public.running_logs enable row level security;
alter table public.gym_logs enable row level security;
alter table public.meals enable row level security;
alter table public.water_logs enable row level security;
alter table public.body_metrics enable row level security;
alter table public.sleep_logs enable row level security;
alter table public.goals enable row level security;
alter table public.ai_recommendations enable row level security;

create policy "profiles are private" on public.profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "health memory is private" on public.health_memory
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "workouts are private" on public.workouts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "running logs are private" on public.running_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "gym logs are private" on public.gym_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "meals are private" on public.meals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "water logs are private" on public.water_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "body metrics are private" on public.body_metrics
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "sleep logs are private" on public.sleep_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "goals are private" on public.goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "recommendations are private" on public.ai_recommendations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "lessons are readable by everyone" on public.health_lessons
  for select using (true);
