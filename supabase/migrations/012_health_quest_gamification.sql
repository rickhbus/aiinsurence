create extension if not exists pgcrypto;

create table if not exists public.daily_quests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  local_date date not null,
  quest_type text not null,
  title jsonb not null default '{}'::jsonb,
  description jsonb not null default '{}'::jsonb,
  action_label jsonb not null default '{}'::jsonb,
  completed_label jsonb not null default '{}'::jsonb,
  xp integer not null default 0,
  required boolean not null default true,
  status text not null default 'locked',
  order_index integer not null default 0,
  unlocks_after text[] not null default '{}'::text[],
  safety_level text not null default 'normal',
  source text not null default 'generated',
  metadata jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  skipped_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint daily_quests_quest_type_check check (quest_type in (
    'wake',
    'water',
    'meal',
    'movement',
    'mood',
    'toilet_optional',
    'sleep_prep',
    'health_review',
    'doctor_prep',
    'recovery',
    'learn'
  )),
  constraint daily_quests_status_check check (status in (
    'locked',
    'active',
    'done',
    'skipped',
    'recovery',
    'blocked_by_safety'
  )),
  constraint daily_quests_safety_level_check check (safety_level in ('normal','caution','urgent')),
  constraint daily_quests_source_check check (source in ('generated','template','manual','recovery')),
  constraint daily_quests_xp_check check (xp between 0 and 100),
  unique(user_id, local_date, quest_type, order_index)
);

create table if not exists public.user_xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quest_id uuid references public.daily_quests(id) on delete set null,
  amount integer not null,
  reason text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint user_xp_events_amount_check check (amount between 0 and 100)
);

create table if not exists public.user_streaks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  streak_type text not null default 'daily_health_quest',
  current_count integer not null default 0,
  best_count integer not null default 0,
  last_logged_date date,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_completed_date date,
  streak_freeze_count integer not null default 0,
  protected_today boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, streak_type)
);

alter table public.user_streaks
  add column if not exists current_streak integer not null default 0,
  add column if not exists longest_streak integer not null default 0,
  add column if not exists last_completed_date date,
  add column if not exists streak_freeze_count integer not null default 0,
  add column if not exists protected_today boolean not null default false;

create table if not exists public.streak_freezes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  local_date date not null,
  reason text,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(user_id, local_date)
);

create table if not exists public.quest_templates (
  id uuid primary key default gen_random_uuid(),
  quest_type text not null,
  locale text not null default 'zh-Hant',
  title jsonb not null,
  description jsonb not null,
  action_label jsonb not null,
  completed_label jsonb not null,
  xp integer not null default 5,
  required boolean not null default true,
  order_index integer not null default 0,
  safety_level text not null default 'normal',
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint quest_templates_quest_type_check check (quest_type in (
    'wake',
    'water',
    'meal',
    'movement',
    'mood',
    'toilet_optional',
    'sleep_prep',
    'health_review',
    'doctor_prep',
    'recovery',
    'learn'
  )),
  constraint quest_templates_safety_level_check check (safety_level in ('normal','caution','urgent')),
  constraint quest_templates_xp_check check (xp between 0 and 100),
  unique(quest_type, locale, order_index)
);

alter table public.daily_quests enable row level security;
alter table public.user_xp_events enable row level security;
alter table public.user_streaks enable row level security;
alter table public.streak_freezes enable row level security;
alter table public.quest_templates enable row level security;

revoke all on table public.daily_quests from anon;
revoke all on table public.user_xp_events from anon;
revoke all on table public.user_streaks from anon;
revoke all on table public.streak_freezes from anon;
revoke all on table public.quest_templates from anon, authenticated;

grant select, insert, update, delete on public.daily_quests to authenticated;
grant select, insert on public.user_xp_events to authenticated;
grant select, insert, update on public.user_streaks to authenticated;
grant select, insert, update, delete on public.streak_freezes to authenticated;
grant select on public.quest_templates to anon, authenticated;

drop policy if exists daily_quests_select_own on public.daily_quests;
create policy daily_quests_select_own
on public.daily_quests for select
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists daily_quests_insert_own on public.daily_quests;
create policy daily_quests_insert_own
on public.daily_quests for insert
to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists daily_quests_update_own on public.daily_quests;
create policy daily_quests_update_own
on public.daily_quests for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists daily_quests_delete_own on public.daily_quests;
create policy daily_quests_delete_own
on public.daily_quests for delete
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists user_xp_events_select_own on public.user_xp_events;
create policy user_xp_events_select_own
on public.user_xp_events for select
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists user_xp_events_insert_own on public.user_xp_events;
create policy user_xp_events_insert_own
on public.user_xp_events for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and amount between 0 and 100
);

drop policy if exists user_streaks_own_rows on public.user_streaks;
create policy user_streaks_own_rows
on public.user_streaks for all
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists streak_freezes_own_rows on public.streak_freezes;
create policy streak_freezes_own_rows
on public.streak_freezes for all
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists quest_templates_public_read on public.quest_templates;
create policy quest_templates_public_read
on public.quest_templates for select
using (active = true);

create index if not exists daily_quests_user_date_idx
  on public.daily_quests(user_id, local_date);
create index if not exists daily_quests_user_status_idx
  on public.daily_quests(user_id, status);
create index if not exists user_xp_events_user_created_idx
  on public.user_xp_events(user_id, created_at desc);
create index if not exists streak_freezes_user_local_date_idx
  on public.streak_freezes(user_id, local_date);
create index if not exists quest_templates_type_locale_idx
  on public.quest_templates(quest_type, locale)
  where active = true;

drop trigger if exists daily_quests_set_updated_at on public.daily_quests;
create trigger daily_quests_set_updated_at before update on public.daily_quests for each row execute function public.set_updated_at();

comment on table public.daily_quests is
  'Daily Health Quest path. Rewards completion and consistency only; not diagnosis, treatment, or insurance decisioning.';
comment on table public.user_xp_events is
  'Privacy-safe XP ledger. Metadata must not encode raw symptoms, notes, policy text, or private health details.';
comment on table public.user_streaks is
  'User-owned streak state. Health Quest uses streak_type=daily_health_quest on the existing streak table.';
comment on table public.streak_freezes is
  'User-owned shame-free streak freeze records.';
comment on table public.quest_templates is
  'Public read-only non-sensitive quest templates.';

insert into public.quest_templates (
  quest_type,
  locale,
  title,
  description,
  action_label,
  completed_label,
  xp,
  required,
  order_index,
  safety_level,
  metadata
)
values
  ('wake', 'zh-Hant', '{"zh":"起身打卡","en":"Wake check-in"}', '{"zh":"用一撳開始今日任務。","en":"Tell Health Quest you started the day."}', '{"zh":"我起身啦","en":"I am up"}', '{"zh":"早晨已記低","en":"Morning saved"}', 5, true, 0, 'normal', '{"template":"normal"}'),
  ('water', 'zh-Hant', '{"zh":"飲一杯水","en":"Drink water"}', '{"zh":"一杯水已經可以向前行。","en":"One glass is enough to move forward."}', '{"zh":"記低飲水","en":"Log water"}', '{"zh":"飲水已記低","en":"Water logged"}', 5, true, 1, 'normal', '{"template":"normal"}'),
  ('meal', 'zh-Hant', '{"zh":"記低一餐","en":"Log a meal"}', '{"zh":"唔需要卡路里壓力，只要記低食咗。","en":"No calorie pressure. Just mark that you ate."}', '{"zh":"我食咗","en":"I ate"}', '{"zh":"餐點已記低","en":"Meal logged"}', 10, true, 2, 'normal', '{"template":"normal"}'),
  ('movement', 'zh-Hant', '{"zh":"郁動一下","en":"Move a little"}', '{"zh":"短步行、伸展或輕量郁動都算數。","en":"A short walk, stretch, or gentle movement counts."}', '{"zh":"我郁咗","en":"I moved"}', '{"zh":"郁動已計算","en":"Movement counted"}', 15, false, 3, 'normal', '{"template":"normal"}'),
  ('mood', 'zh-Hant', '{"zh":"心情打卡","en":"Mood check"}', '{"zh":"揀一個簡單狀態，並非診斷。","en":"Pick a simple signal. This is not a diagnosis."}', '{"zh":"記低心情","en":"Check mood"}', '{"zh":"心情已記低","en":"Mood saved"}', 10, true, 4, 'normal', '{"template":"normal"}'),
  ('health_review', 'zh-Hant', '{"zh":"晚間回顧","en":"Evening review"}', '{"zh":"用一個短回顧完成今日循環。","en":"Close the loop with one short health review."}', '{"zh":"回顧今日","en":"Review day"}', '{"zh":"回顧已保存","en":"Review saved"}', 10, false, 5, 'normal', '{"template":"normal"}')
on conflict do nothing;
