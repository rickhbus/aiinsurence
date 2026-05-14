-- Health Quest RLS verification helper.
-- Run only against staging/local with disposable users. Replace the UUIDs with
-- real auth.users ids before running. This script checks policy shape without
-- selecting or printing private health content.

begin;

-- Replace these placeholders in a disposable staging database.
\set user_a '00000000-0000-0000-0000-000000000001'
\set user_b '00000000-0000-0000-0000-000000000002'

set local role authenticated;
set local request.jwt.claim.sub = :'user_a';

-- User-owned tables should return zero rows for another user's records.
select count(*) = 0 as user_a_cannot_read_user_b_daily_quests
from public.daily_quests
where user_id = :'user_b';

select count(*) = 0 as user_a_cannot_read_user_b_xp_events
from public.user_xp_events
where user_id = :'user_b';

select count(*) = 0 as user_a_cannot_read_user_b_onboarding_profile
from public.user_health_quest_profiles
where user_id = :'user_b';

select count(*) = 0 as user_a_cannot_read_user_b_lesson_progress
from public.user_lesson_progress
where user_id = :'user_b';

select count(*) = 0 as user_a_cannot_read_user_b_doctor_missions
from public.doctor_prep_missions
where user_id = :'user_b';

select count(*) = 0 as analytics_events_are_not_client_readable
from public.health_quest_analytics_events;

-- Public read-only content should be selectable but not writable by clients.
select count(*) >= 1 as lesson_tracks_public_readable
from public.lesson_tracks
where active = true;

select count(*) >= 1 as lesson_nodes_public_readable
from public.lesson_nodes
where active = true;

select count(*) >= 1 as quest_templates_public_readable
from public.quest_templates
where active = true;

rollback;
