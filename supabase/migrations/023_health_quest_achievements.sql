create table if not exists public.health_quest_achievements (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title jsonb not null,
  description jsonb not null,
  icon text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.user_health_quest_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id uuid not null references public.health_quest_achievements(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  unique(user_id, achievement_id)
);

alter table public.health_quest_achievements enable row level security;
alter table public.user_health_quest_achievements enable row level security;

grant select on public.health_quest_achievements to anon, authenticated;
grant select, insert on public.user_health_quest_achievements to authenticated;

drop policy if exists health_quest_achievements_public_read on public.health_quest_achievements;
create policy health_quest_achievements_public_read
on public.health_quest_achievements for select
using (active = true);

drop policy if exists user_health_quest_achievements_own_rows on public.user_health_quest_achievements;
create policy user_health_quest_achievements_own_rows
on public.user_health_quest_achievements for all
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create index if not exists user_health_quest_achievements_user_idx
  on public.user_health_quest_achievements(user_id, unlocked_at desc);

insert into public.health_quest_achievements (slug, title, description, icon)
values
  ('first-step','{"zh":"第一步","en":"First Step"}','{"zh":"完成第一個小任務。","en":"Complete the first tiny quest."}','sparkles'),
  ('three-day-streak','{"zh":"3 日連續","en":"3-Day Streak"}','{"zh":"連續 3 日有小步。","en":"Keep a 3-day streak."}','flame'),
  ('seven-day-streak','{"zh":"7 日連續","en":"7-Day Streak"}','{"zh":"連續 7 日有小步。","en":"Keep a 7-day streak."}','flame'),
  ('hydration-starter','{"zh":"補水起步","en":"Hydration Starter"}','{"zh":"完成補水任務。","en":"Complete a hydration quest."}','droplets'),
  ('mood-checker','{"zh":"心情打卡","en":"Mood Checker"}','{"zh":"完成心情打卡。","en":"Complete a mood check-in."}','smile'),
  ('recovery-counts','{"zh":"恢復都算數","en":"Recovery Counts"}','{"zh":"選擇輕量恢復。","en":"Choose gentle recovery."}','heart'),
  ('lesson-learner','{"zh":"小課學習者","en":"Lesson Learner"}','{"zh":"完成一個健康小課。","en":"Complete one health lesson."}','book'),
  ('doctor-prep-ready','{"zh":"就診準備完成","en":"Doctor Prep Ready"}','{"zh":"準備一條問題。","en":"Prepare one question."}','stethoscope'),
  ('privacy-protector','{"zh":"私隱守護者","en":"Privacy Protector"}','{"zh":"檢查分享設定。","en":"Review sharing settings."}','shield'),
  ('family-supporter','{"zh":"家庭支援者","en":"Family Supporter"}','{"zh":"完成家庭安全進度。","en":"Complete safe family progress."}','users')
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  icon = excluded.icon,
  active = true;

comment on table public.health_quest_achievements is
  'Public Health Quest achievement definitions. No clinical achievement names or insurance approval claims.';
comment on table public.user_health_quest_achievements is
  'User-owned achievement unlocks. Unlocks are idempotent and habit/progress based only.';

