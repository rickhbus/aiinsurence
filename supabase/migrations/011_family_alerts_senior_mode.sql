create extension if not exists pgcrypto;

create table if not exists public.family_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  group_id uuid references public.family_groups(id) on delete set null,
  alert_type text not null check (alert_type in ('check_in_help','not_feeling_well','family_message','emergency_prompt')),
  message_zh text,
  status text not null default 'created',
  created_at timestamptz not null default now()
);

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  reminder_type text not null,
  title_zh text not null,
  time_of_day text not null,
  enabled boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.doctor_appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  appointment_date timestamptz not null,
  clinic_name text,
  doctor_name text,
  reason text,
  questions text[] not null default '{}',
  documents_to_bring text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.photo_journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  category text not null check (category in (
    'food',
    'drink',
    'exercise',
    'walk',
    'gym',
    'sleep_rest',
    'mood_life',
    'medicine_supplement',
    'toilet_note',
    'doctor_document',
    'insurance_document',
    'unknown'
  )),
  observation_zh text not null,
  user_note_zh text,
  confirmed_by_user boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.family_alerts enable row level security;
alter table public.reminders enable row level security;
alter table public.doctor_appointments enable row level security;
alter table public.photo_journal_entries enable row level security;

grant select, insert, update on public.family_alerts to authenticated;
grant select, insert, update, delete on public.reminders to authenticated;
grant select, insert, update, delete on public.doctor_appointments to authenticated;
grant select, insert, update, delete on public.photo_journal_entries to authenticated;

drop policy if exists family_alerts_insert_owner on public.family_alerts;
create policy family_alerts_insert_owner
on public.family_alerts for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and (
    group_id is null
    or public.is_family_group_member(group_id)
  )
);

drop policy if exists family_alerts_select_owner_or_consented_caregiver on public.family_alerts;
create policy family_alerts_select_owner_or_consented_caregiver
on public.family_alerts for select
to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1
    from public.family_share_consents consent
    join public.family_memberships membership
      on membership.group_id = consent.group_id
    where consent.subject_user_id = family_alerts.user_id
      and consent.group_id = family_alerts.group_id
      and consent.revoked_at is null
      and consent.scopes && array['safety_status','emergency_contact']::text[]
      and membership.user_id = (select auth.uid())
      and membership.role = 'caregiver'
      and membership.status = 'active'
  )
);

drop policy if exists family_alerts_update_owner on public.family_alerts;
create policy family_alerts_update_owner
on public.family_alerts for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists reminders_own_rows on public.reminders;
create policy reminders_own_rows
on public.reminders for all
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists doctor_appointments_own_rows on public.doctor_appointments;
create policy doctor_appointments_own_rows
on public.doctor_appointments for all
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists photo_journal_entries_own_rows on public.photo_journal_entries;
create policy photo_journal_entries_own_rows
on public.photo_journal_entries for all
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()) and confirmed_by_user = true);

create index if not exists family_alerts_user_created_idx
  on public.family_alerts(user_id, created_at desc);
create index if not exists family_alerts_group_created_idx
  on public.family_alerts(group_id, created_at desc)
  where group_id is not null;
create index if not exists reminders_user_time_idx
  on public.reminders(user_id, enabled, time_of_day);
create index if not exists doctor_appointments_user_date_idx
  on public.doctor_appointments(user_id, appointment_date asc);
create index if not exists photo_journal_entries_user_created_idx
  on public.photo_journal_entries(user_id, created_at desc);

drop trigger if exists reminders_set_updated_at on public.reminders;
create trigger reminders_set_updated_at before update on public.reminders for each row execute function public.set_updated_at();

drop trigger if exists doctor_appointments_set_updated_at on public.doctor_appointments;
create trigger doctor_appointments_set_updated_at before update on public.doctor_appointments for each row execute function public.set_updated_at();

comment on table public.family_alerts is
  'In-app family alerts for consent-based caregiver awareness. Emergency prompts must still show 999 first.';
comment on table public.reminders is
  'User-owned in-app reminders. Medication reminders only record user-provided text and the instruction to follow doctor or pharmacist directions.';
comment on table public.doctor_appointments is
  'User-owned appointment planning and visit preparation, not diagnosis.';
comment on table public.photo_journal_entries is
  'User-confirmed photo journal observations. The app never auto-saves analysis and must not store sensitive identifiers.';
