create table if not exists public.health_quest_review_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_type text not null,
  source_id text,
  due_at timestamptz not null,
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint health_quest_review_items_type_check check (item_type in (
    'hydration_review',
    'mood_review',
    'sleep_review',
    'movement_review',
    'doctor_prep_review',
    'insurance_boundary_review'
  ))
);

alter table public.health_quest_review_items enable row level security;

revoke all on table public.health_quest_review_items from anon;
grant select, insert, update, delete on public.health_quest_review_items to authenticated;

drop policy if exists health_quest_review_items_own_rows on public.health_quest_review_items;
create policy health_quest_review_items_own_rows
on public.health_quest_review_items for all
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create index if not exists health_quest_review_items_user_due_idx
  on public.health_quest_review_items(user_id, due_at)
  where completed_at is null;
create index if not exists health_quest_review_items_user_type_idx
  on public.health_quest_review_items(user_id, item_type, due_at);

comment on table public.health_quest_review_items is
  'User-owned Health Quest review schedule. Metadata must stay privacy-safe and must not store raw symptoms, notes, food text, policy text, claim text, prompts, HKID, phone, auth tokens, or payment data.';

