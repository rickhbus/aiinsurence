alter table public.user_streaks
  add column if not exists total_freezes_earned integer not null default 0,
  add column if not exists total_freezes_consumed integer not null default 0,
  add column if not exists last_freeze_earned_at timestamptz,
  add column if not exists last_freeze_consumed_at timestamptz;

create index if not exists user_streaks_user_type_idx on public.user_streaks(user_id, streak_type);

comment on column public.user_streaks.total_freezes_earned is 'Total shame-free Health Quest streak freezes earned.';
comment on column public.user_streaks.total_freezes_consumed is 'Total Health Quest streak freezes consumed after missed days.';
