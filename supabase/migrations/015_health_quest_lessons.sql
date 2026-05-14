create table if not exists public.lesson_tracks (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title jsonb not null,
  description jsonb not null,
  icon text,
  order_index integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.lesson_nodes (
  id uuid primary key default gen_random_uuid(),
  track_id uuid not null references public.lesson_tracks(id) on delete cascade,
  slug text not null,
  title jsonb not null,
  cards jsonb not null default '[]'::jsonb,
  quiz jsonb not null default '{}'::jsonb,
  xp integer not null default 5,
  unlocks_quest_type text,
  order_index integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(track_id, slug),
  constraint lesson_nodes_xp_check check (xp between 0 and 25),
  constraint lesson_nodes_unlocks_quest_type_check check (unlocks_quest_type is null or unlocks_quest_type in (
    'wake','water','meal','movement','mood','toilet_optional','sleep_prep','health_review','doctor_prep','recovery','learn'
  ))
);

create table if not exists public.user_lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lesson_nodes(id) on delete cascade,
  status text not null default 'not_started',
  score integer,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, lesson_id),
  constraint user_lesson_progress_status_check check (status in ('not_started','started','completed')),
  constraint user_lesson_progress_score_check check (score is null or score between 0 and 100)
);

alter table public.lesson_tracks enable row level security;
alter table public.lesson_nodes enable row level security;
alter table public.user_lesson_progress enable row level security;

grant select on public.lesson_tracks to anon, authenticated;
grant select on public.lesson_nodes to anon, authenticated;
grant select, insert, update, delete on public.user_lesson_progress to authenticated;

drop policy if exists lesson_tracks_public_read on public.lesson_tracks;
create policy lesson_tracks_public_read on public.lesson_tracks for select using (active = true);

drop policy if exists lesson_nodes_public_read on public.lesson_nodes;
create policy lesson_nodes_public_read on public.lesson_nodes for select using (active = true);

drop policy if exists user_lesson_progress_own_rows on public.user_lesson_progress;
create policy user_lesson_progress_own_rows
on public.user_lesson_progress for all
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create index if not exists lesson_nodes_track_order_idx on public.lesson_nodes(track_id, order_index) where active = true;
create index if not exists user_lesson_progress_user_status_idx on public.user_lesson_progress(user_id, status);

drop trigger if exists user_lesson_progress_set_updated_at on public.user_lesson_progress;
create trigger user_lesson_progress_set_updated_at before update on public.user_lesson_progress for each row execute function public.set_updated_at();

insert into public.lesson_tracks (slug, title, description, icon, order_index)
values
  ('hydration-basics','{"zh":"補水基礎","en":"Hydration Basics"}','{"zh":"由一杯水開始。","en":"Start with one glass."}','droplets',1),
  ('sleep-reset','{"zh":"睡眠重置","en":"Sleep Reset"}','{"zh":"一個睡前小步。","en":"One tiny wind-down step."}','bed',2),
  ('stress-reset','{"zh":"壓力重置","en":"Stress Reset"}','{"zh":"一般生活支援，不是診斷。","en":"General support, not diagnosis."}','brain',3),
  ('mood-awareness','{"zh":"心情覺察","en":"Mood Awareness"}','{"zh":"用表情符號開始。","en":"Start with one emoji."}','smile',4),
  ('food-awareness','{"zh":"飲食覺察","en":"Food Awareness"}','{"zh":"不羞辱、不計分。","en":"No shame, no moral scoring."}','apple',5),
  ('movement-starter','{"zh":"郁動入門","en":"Movement Starter"}','{"zh":"恢復都算數。","en":"Recovery counts too."}','dumbbell',6),
  ('gym-safety','{"zh":"健身安全","en":"Gym Safety"}','{"zh":"不聲稱運動一定安全。","en":"No claim that exercise is medically safe."}','shield',7),
  ('doctor-visit-prep','{"zh":"就診準備","en":"Doctor Visit Prep"}','{"zh":"準備問題，不作診斷。","en":"Prepare questions, not diagnosis."}','stethoscope',8),
  ('insurance-education','{"zh":"保險教育","en":"Insurance Education"}','{"zh":"整理問題，不作建議。","en":"Organize questions, not advice."}','shield-check',9),
  ('family-care-basics','{"zh":"家庭照顧基礎","en":"Family Care Basics"}','{"zh":"分享進度，不分享私隱。","en":"Share progress, not private details."}','users',10)
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  icon = excluded.icon,
  order_index = excluded.order_index,
  active = true;

insert into public.lesson_nodes (track_id, slug, title, cards, quiz, xp, unlocks_quest_type, order_index)
select id,
  'start-with-one-glass',
  '{"zh":"由一杯水開始","en":"Start with one glass"}',
  '[
    {"zh":"每個人需要嘅水分都唔同，但細小習慣更容易持續。","en":"Hydration needs vary, but tiny routines are easier to repeat."},
    {"zh":"簡單開始：起身後或食飯時飲一杯水。","en":"A simple start is one glass after waking or with meals."},
    {"zh":"如果有嚴重頭暈、神志不清、暈倒或嚴重脫水症狀，請尋求醫護協助。","en":"If you feel severe dizziness, confusion, fainting, or severe dehydration symptoms, seek medical help."}
  ]'::jsonb,
  '{"question":{"zh":"邊個係溫和嘅補水習慣？","en":"Which is a gentle hydration habit?"},"answers":[{"id":"a","text":{"zh":"強迫自己飲極大量水","en":"Force extreme water intake"}},{"id":"b","text":{"zh":"起身後飲一杯水","en":"Drink one glass after waking"}},{"id":"c","text":{"zh":"成日忽略口渴","en":"Ignore thirst all day"}}],"correctAnswerId":"b"}'::jsonb,
  5,
  'water',
  1
from public.lesson_tracks
where slug = 'hydration-basics'
on conflict (track_id, slug) do update set
  title = excluded.title,
  cards = excluded.cards,
  quiz = excluded.quiz,
  xp = excluded.xp,
  unlocks_quest_type = excluded.unlocks_quest_type,
  active = true;

insert into public.lesson_nodes (track_id, slug, title, cards, quiz, xp, unlocks_quest_type, order_index)
select id,
  'tiny-start',
  '{"zh":"最細開始","en":"Tiny start"}',
  jsonb_build_array(description, '{"zh":"今日只需要一個可以重複的小行動。","en":"Today only needs one repeatable tiny action."}'::jsonb, '{"zh":"如情況嚴重、持續或令你擔心，請尋求醫護協助；緊急情況請致電 999 或前往急症室。","en":"If anything is severe, persistent, or worrying, seek medical help; for emergencies call 999 or go to Accident & Emergency."}'::jsonb),
  '{"question":{"zh":"健康任務最重視咩？","en":"What does Health Quest reward most?"},"answers":[{"id":"a","text":{"zh":"完美健康","en":"Perfect health"}},{"id":"b","text":{"zh":"一致性和安全小步","en":"Consistency and safe tiny steps"}},{"id":"c","text":{"zh":"忽略休息日","en":"Ignoring recovery days"}}],"correctAnswerId":"b"}'::jsonb,
  5,
  case slug
    when 'sleep-reset' then 'sleep_prep'
    when 'stress-reset' then 'mood'
    when 'mood-awareness' then 'mood'
    when 'food-awareness' then 'meal'
    when 'movement-starter' then 'movement'
    when 'gym-safety' then 'recovery'
    when 'doctor-visit-prep' then 'doctor_prep'
    when 'insurance-education' then 'learn'
    else 'health_review'
  end,
  1
from public.lesson_tracks
where slug <> 'hydration-basics'
on conflict (track_id, slug) do update set
  title = excluded.title,
  cards = excluded.cards,
  quiz = excluded.quiz,
  xp = excluded.xp,
  unlocks_quest_type = excluded.unlocks_quest_type,
  active = true;
