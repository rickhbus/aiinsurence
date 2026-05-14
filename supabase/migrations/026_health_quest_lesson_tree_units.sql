insert into public.lesson_tracks (slug, title, description, icon, order_index)
values
  ('start-strong','{"zh":"Start Strong","en":"Start Strong"}','{"zh":"由一個 30 秒健康小步開始。","en":"Start with one 30-second health step."}','sparkles',1),
  ('water-energy','{"zh":"Water & Energy","en":"Water & Energy"}','{"zh":"用一杯水和能量提示建立節奏。","en":"Build rhythm with one glass and energy cues."}','droplets',2),
  ('mood-basics','{"zh":"Mood Basics","en":"Mood Basics"}','{"zh":"心情是提示，不是診斷。","en":"Mood is a signal, not a diagnosis."}','smile',3),
  ('sleep-reset','{"zh":"Sleep Reset","en":"Sleep Reset"}','{"zh":"用睡前小步幫自己降速。","en":"Use a tiny wind-down step."}','moon',4),
  ('food-awareness','{"zh":"Food Awareness","en":"Food Awareness"}','{"zh":"記錄食咗，不做飲食羞辱。","en":"Mark that you ate without food shame."}','apple',5),
  ('movement-starter','{"zh":"Movement Starter","en":"Movement Starter"}','{"zh":"30 秒郁動都可以係開始。","en":"Thirty seconds of movement can be a start."}','dumbbell',6),
  ('doctor-prep','{"zh":"Doctor Prep","en":"Doctor Prep"}','{"zh":"準備問題，不自行診斷。","en":"Prepare questions, not self-diagnosis."}','stethoscope',7),
  ('family-care','{"zh":"Family Care","en":"Family Care"}','{"zh":"家庭挑戰只分享安全進度。","en":"Family challenges share safe progress only."}','users',8),
  ('insurance-education','{"zh":"Insurance Education","en":"Insurance Education"}','{"zh":"學習保險問題界線，不作資格或索償保證。","en":"Learn insurance boundaries without eligibility or claim guarantees."}','shield-check',9)
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  icon = excluded.icon,
  order_index = excluded.order_index,
  active = true;

insert into public.lesson_nodes (track_id, slug, title, cards, quiz, xp, unlocks_quest_type, order_index)
select tracks.id,
  nodes.slug,
  nodes.title::jsonb,
  jsonb_build_array(tracks.description, '{"zh":"今日只需要一個可以重複的小行動。","en":"Today only needs one repeatable tiny action."}'::jsonb, '{"zh":"如情況嚴重、持續或令你擔心，請尋求醫護協助；緊急情況請立即致電 999 或前往急症室。","en":"If anything is severe, persistent, or worrying, seek medical help; for emergencies call 999 or go to Accident & Emergency now."}'::jsonb),
  '{"question":{"zh":"最安全嘅做法係？","en":"What is the safest approach?"},"answers":[{"id":"a","text":{"zh":"一次做晒追求完美","en":"Do everything perfectly at once"}},{"id":"b","text":{"zh":"揀一個溫和小步，唔舒服就停","en":"Pick one gentle step and pause if unwell"}},{"id":"c","text":{"zh":"等 AI 確認緊急情況先行動","en":"Wait for AI before acting in an emergency"}}],"correctAnswerId":"b"}'::jsonb,
  nodes.xp,
  nodes.quest_type,
  nodes.order_index
from public.lesson_tracks tracks
join (
  values
    ('first-tiny-step','{"zh":"第一個小步","en":"First tiny step"}','health_review',0,5),
    ('safety-first','{"zh":"安全先行","en":"Safety first"}','health_review',1,5),
    ('recovery-counts','{"zh":"恢復都算數","en":"Recovery counts"}','recovery',2,5),
    ('privacy-basics','{"zh":"私隱小提醒","en":"Privacy basics"}','health_review',3,5),
    ('daily-completion','{"zh":"每日完成感","en":"Daily completion"}','health_review',4,5),
    ('practice','{"zh":"練習","en":"Practice"}','health_review',5,5),
    ('review','{"zh":"複習","en":"Review"}','health_review',6,10),
    ('boss','{"zh":"Boss 回顧","en":"Boss review"}','health_review',7,15)
) as nodes(slug, title, quest_type, order_index, xp)
on tracks.slug = 'start-strong'
on conflict (track_id, slug) do update set
  title = excluded.title,
  cards = excluded.cards,
  quiz = excluded.quiz,
  xp = excluded.xp,
  unlocks_quest_type = excluded.unlocks_quest_type,
  order_index = excluded.order_index,
  active = true;

insert into public.lesson_nodes (track_id, slug, title, cards, quiz, xp, unlocks_quest_type, order_index)
select tracks.id,
  nodes.slug,
  nodes.title::jsonb,
  jsonb_build_array(tracks.description, '{"zh":"今日只需要一個可以重複的小行動。","en":"Today only needs one repeatable tiny action."}'::jsonb, case when tracks.slug = 'insurance-education' then '{"zh":"健康任務不會用健康、心情、飲食、症狀、家庭或就診準備資料作保險資格、定價、保障或索償結果。","en":"Health Quest never uses health, mood, food, symptom, family, or doctor-prep data for insurance eligibility, pricing, coverage, or claim outcomes."}'::jsonb else '{"zh":"如情況嚴重、持續或令你擔心，請尋求醫護協助；緊急情況請立即致電 999 或前往急症室。","en":"If anything is severe, persistent, or worrying, seek medical help; for emergencies call 999 or go to Accident & Emergency now."}'::jsonb end),
  '{"question":{"zh":"最安全嘅做法係？","en":"What is the safest approach?"},"answers":[{"id":"a","text":{"zh":"一次做晒追求完美","en":"Do everything perfectly at once"}},{"id":"b","text":{"zh":"揀一個溫和小步，唔舒服就停","en":"Pick one gentle step and pause if unwell"}},{"id":"c","text":{"zh":"用 XP 或寶石判斷醫療或保險結果","en":"Use XP or gems to judge medical or insurance outcomes"}}],"correctAnswerId":"b"}'::jsonb,
  nodes.xp,
  case tracks.slug
    when 'water-energy' then 'water'
    when 'mood-basics' then 'mood'
    when 'sleep-reset' then 'sleep_prep'
    when 'food-awareness' then 'meal'
    when 'movement-starter' then 'movement'
    when 'doctor-prep' then 'doctor_prep'
    when 'insurance-education' then 'learn'
    else 'health_review'
  end,
  nodes.order_index
from public.lesson_tracks tracks
join (
  values
    ('tiny-start','{"zh":"最細開始","en":"Tiny start"}',0,5),
    ('safe-choice','{"zh":"安全選擇","en":"Safe choice"}',1,5),
    ('privacy-boundary','{"zh":"私隱界線","en":"Privacy boundary"}',2,5),
    ('gentle-step','{"zh":"溫和小步","en":"Gentle step"}',3,5),
    ('daily-loop','{"zh":"每日循環","en":"Daily loop"}',4,5),
    ('practice','{"zh":"練習","en":"Practice"}',5,5),
    ('review','{"zh":"複習","en":"Review"}',6,10),
    ('boss','{"zh":"Boss 回顧","en":"Boss review"}',7,15)
) as nodes(slug, title, order_index, xp)
on tracks.slug in (
  'water-energy',
  'mood-basics',
  'sleep-reset',
  'food-awareness',
  'movement-starter',
  'doctor-prep',
  'family-care',
  'insurance-education'
)
on conflict (track_id, slug) do update set
  title = excluded.title,
  cards = excluded.cards,
  quiz = excluded.quiz,
  xp = excluded.xp,
  unlocks_quest_type = excluded.unlocks_quest_type,
  order_index = excluded.order_index,
  active = true;

comment on table public.lesson_nodes is
  'Health Quest lesson tree nodes. Lessons provide general wellness, doctor-prep, privacy, family, and insurance education only; no diagnosis, prescriptions, treatment guarantees, or insurance outcome guarantees.';
