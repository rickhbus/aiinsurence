create table if not exists public.user_health_quest_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  primary_goal text not null default 'better_sleep',
  daily_time_budget text not null default 'two_minutes',
  hardest_barrier text,
  starting_path text not null default 'easy_start',
  preferred_locale text not null default 'zh-Hant',
  coach_style text not null default 'gentle',
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_health_quest_profiles_primary_goal_check check (primary_goal in (
    'better_sleep','more_energy','drink_more_water','eat_better','move_more','reduce_stress','mood_support','doctor_prep','family_care','insurance_education'
  )),
  constraint user_health_quest_profiles_daily_time_check check (daily_time_budget in ('thirty_seconds','two_minutes','five_minutes','ten_minutes')),
  constraint user_health_quest_profiles_barrier_check check (hardest_barrier is null or hardest_barrier in (
    'i_forget','too_tired','dont_know_what_to_do','lose_motivation','symptoms_worry_me','need_family_support','too_busy','privacy_concern'
  )),
  constraint user_health_quest_profiles_path_check check (starting_path in (
    'easy_start','energy_reset','sleep_better','stress_less','move_gently','food_awareness','doctor_prep','family_care'
  )),
  constraint user_health_quest_profiles_locale_check check (preferred_locale in ('zh-Hant','en','bilingual')),
  constraint user_health_quest_profiles_coach_style_check check (coach_style in ('gentle','direct','family_doctor','gym','calm','bilingual'))
);

create table if not exists public.user_quest_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  preferred_quest_time text not null default 'no_preference',
  reminder_enabled boolean not null default false,
  reminder_time time,
  recovery_mode_default boolean not null default false,
  minimum_required_quests integer not null default 3,
  max_daily_quests integer not null default 5,
  preferred_difficulty text not null default 'easy',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_quest_preferences_time_check check (preferred_quest_time in ('morning','midday','evening','no_preference')),
  constraint user_quest_preferences_min_check check (minimum_required_quests between 1 and 5),
  constraint user_quest_preferences_max_check check (max_daily_quests between 2 and 5 and max_daily_quests >= minimum_required_quests),
  constraint user_quest_preferences_difficulty_check check (preferred_difficulty in ('tiny','easy','normal','challenge'))
);

create table if not exists public.user_onboarding_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_key text not null,
  answer_value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.user_health_quest_profiles enable row level security;
alter table public.user_quest_preferences enable row level security;
alter table public.user_onboarding_answers enable row level security;

grant select, insert, update, delete on public.user_health_quest_profiles to authenticated;
grant select, insert, update, delete on public.user_quest_preferences to authenticated;
grant select, insert, update, delete on public.user_onboarding_answers to authenticated;

drop policy if exists user_health_quest_profiles_own_rows on public.user_health_quest_profiles;
create policy user_health_quest_profiles_own_rows
on public.user_health_quest_profiles for all
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists user_quest_preferences_own_rows on public.user_quest_preferences;
create policy user_quest_preferences_own_rows
on public.user_quest_preferences for all
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists user_onboarding_answers_own_rows on public.user_onboarding_answers;
create policy user_onboarding_answers_own_rows
on public.user_onboarding_answers for all
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create index if not exists user_health_quest_profiles_user_id_idx on public.user_health_quest_profiles(user_id);
create index if not exists user_quest_preferences_user_id_idx on public.user_quest_preferences(user_id);
create index if not exists user_onboarding_answers_user_question_idx on public.user_onboarding_answers(user_id, question_key);

drop trigger if exists user_health_quest_profiles_set_updated_at on public.user_health_quest_profiles;
create trigger user_health_quest_profiles_set_updated_at before update on public.user_health_quest_profiles for each row execute function public.set_updated_at();

drop trigger if exists user_quest_preferences_set_updated_at on public.user_quest_preferences;
create trigger user_quest_preferences_set_updated_at before update on public.user_quest_preferences for each row execute function public.set_updated_at();

comment on table public.user_health_quest_profiles is 'Health Quest onboarding profile preferences only. No diagnosis, HKID, policy text, claim text, or raw sensitive notes.';
comment on table public.user_quest_preferences is 'User-owned Health Quest preferences for reminders, recovery defaults, and adaptive quest difficulty.';
comment on table public.user_onboarding_answers is 'Preference-level onboarding answers. Do not store raw clinical intake or insurance decisioning data.';
