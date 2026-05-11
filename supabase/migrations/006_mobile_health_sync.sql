create extension if not exists pgcrypto;

-- Backend-first mobile health sync contract for Apple HealthKit and Android
-- Health Connect summaries. This stores bounded, normalized summaries only; it
-- does not ingest clinical records, diagnoses, medications, reproductive or
-- sexual health, glucose, raw continuous heart streams, or other sensitive
-- clinical datasets.

alter table public.consent_events
  drop constraint if exists consent_events_consent_type_check;

alter table public.consent_events
  add constraint consent_events_consent_type_check
  check (
    consent_type in (
      'save_memory',
      'health_data',
      'health_logs',
      'ai_history',
      'mobile_health_sync',
      'analytics',
      'marketing',
      'adviser_handoff'
    )
  );

create table if not exists public.mobile_health_sync_batches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  source_platform text check (source_platform in ('apple_healthkit', 'android_health_connect', 'manual', 'unknown')) not null,
  idempotency_key text not null,
  request_id text,
  status text check (status in ('processing', 'completed', 'failed')) not null default 'processing',
  accepted_count integer not null default 0 check (accepted_count >= 0),
  rejected_count integer not null default 0 check (rejected_count >= 0),
  duplicate_count integer not null default 0 check (duplicate_count >= 0),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (user_id, idempotency_key)
);

create table if not exists public.mobile_health_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  sync_batch_id uuid references public.mobile_health_sync_batches(id) on delete set null,
  source_platform text check (source_platform in ('apple_healthkit', 'android_health_connect', 'manual', 'unknown')) not null,
  source_record_hash text not null,
  data_type text check (
    data_type in (
      'steps',
      'active_energy',
      'workout',
      'sleep_session',
      'body_weight',
      'heart_rate_summary',
      'mindful_minutes',
      'mood'
    )
  ) not null,
  start_time timestamptz not null,
  end_time timestamptz,
  source_device text,
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, source_platform, source_record_hash, start_time, data_type)
);

alter table public.mobile_health_sync_batches enable row level security;
alter table public.mobile_health_records enable row level security;

revoke all on table public.mobile_health_sync_batches from anon;
revoke all on table public.mobile_health_records from anon;
grant select, insert, update, delete on public.mobile_health_sync_batches to authenticated;
grant select, insert, update, delete on public.mobile_health_records to authenticated;

drop policy if exists mobile_health_sync_batches_select_own on public.mobile_health_sync_batches;
create policy mobile_health_sync_batches_select_own
on public.mobile_health_sync_batches for select
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists mobile_health_sync_batches_insert_own on public.mobile_health_sync_batches;
create policy mobile_health_sync_batches_insert_own
on public.mobile_health_sync_batches for insert
to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists mobile_health_sync_batches_update_own on public.mobile_health_sync_batches;
create policy mobile_health_sync_batches_update_own
on public.mobile_health_sync_batches for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists mobile_health_sync_batches_delete_own on public.mobile_health_sync_batches;
create policy mobile_health_sync_batches_delete_own
on public.mobile_health_sync_batches for delete
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists mobile_health_records_select_own on public.mobile_health_records;
create policy mobile_health_records_select_own
on public.mobile_health_records for select
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists mobile_health_records_insert_own on public.mobile_health_records;
create policy mobile_health_records_insert_own
on public.mobile_health_records for insert
to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists mobile_health_records_update_own on public.mobile_health_records;
create policy mobile_health_records_update_own
on public.mobile_health_records for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists mobile_health_records_delete_own on public.mobile_health_records;
create policy mobile_health_records_delete_own
on public.mobile_health_records for delete
to authenticated
using (user_id = (select auth.uid()));

create index if not exists mobile_health_sync_batches_user_id_lookup_idx
  on public.mobile_health_sync_batches(user_id);
create index if not exists mobile_health_sync_batches_user_created_idx
  on public.mobile_health_sync_batches(user_id, created_at desc);
create index if not exists mobile_health_sync_batches_user_status_idx
  on public.mobile_health_sync_batches(user_id, status, created_at desc);
create index if not exists mobile_health_sync_batches_user_platform_idx
  on public.mobile_health_sync_batches(user_id, source_platform, completed_at desc);

create index if not exists mobile_health_records_user_id_lookup_idx
  on public.mobile_health_records(user_id);
create index if not exists mobile_health_records_user_created_idx
  on public.mobile_health_records(user_id, created_at desc);
create index if not exists mobile_health_records_user_type_start_idx
  on public.mobile_health_records(user_id, data_type, start_time desc);
create index if not exists mobile_health_records_user_platform_start_idx
  on public.mobile_health_records(user_id, source_platform, start_time desc);

comment on table public.mobile_health_sync_batches is
  'Per-user mobile health sync batch idempotency and status metadata. Do not store raw health samples or device identifiers here.';
comment on table public.mobile_health_records is
  'Per-user normalized mobile health summaries from native HealthKit/Health Connect adapters. No clinical records, diagnoses, medications, glucose, or raw continuous heart streams.';
comment on column public.mobile_health_records.source_record_hash is
  'Hash of the native source record identity for dedupe; do not store raw native sample identifiers.';
