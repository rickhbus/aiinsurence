alter table public.user_quest_preferences
  add column if not exists morning_reminder_enabled boolean not null default false,
  add column if not exists morning_reminder_time time,
  add column if not exists water_reminder_enabled boolean not null default false,
  add column if not exists evening_review_enabled boolean not null default false,
  add column if not exists weekly_review_enabled boolean not null default true,
  add column if not exists notification_quiet_hours_start time,
  add column if not exists notification_quiet_hours_end time;

create index if not exists daily_quests_user_date_status_idx on public.daily_quests(user_id, local_date, status);
create index if not exists user_xp_events_user_created_desc_idx on public.user_xp_events(user_id, created_at desc);

comment on column public.user_quest_preferences.morning_reminder_enabled is 'Preference only. Actual push infrastructure is intentionally separate.';
comment on column public.user_quest_preferences.weekly_review_enabled is 'Preference for safe weekly review reminders without private health details.';
