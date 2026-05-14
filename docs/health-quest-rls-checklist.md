# Health Quest RLS Checklist

## Required Checks

- User A cannot read User B `daily_quests`.
- User A cannot read User B `user_xp_events`.
- User A cannot read User B `user_health_quest_profiles`.
- User A cannot read User B `user_lesson_progress`.
- User A cannot read User B `doctor_prep_missions` or `doctor_prep_answers`.
- Family permissions are visible only to the owner/member scope allowed by family-circle policies.
- `health_quest_analytics_events` is client insert-only and not client-readable.
- `lesson_tracks` and `lesson_nodes` are public read-only.
- `quest_templates` is public read-only when active.

## SQL Asset

Use:

```bash
psql "$POSTGRES_URL_NON_POOLING" -f supabase/diagnostics/health-quest-rls-verification.sql
```

Run only in local/staging with disposable users. The script checks counts and policy behavior without printing private health content.

## Policy Surfaces

- `daily_quests_*_own`
- `user_xp_events_*_own`
- `user_health_quest_profiles_own_rows`
- `user_quest_preferences_own_rows`
- `user_onboarding_answers_own_rows`
- `user_lesson_progress_own_rows`
- `doctor_prep_missions_own_rows`
- `doctor_prep_answers_own_rows`
- `health_quest_family_*`
- `health_quest_analytics_insert_own`

## Manual Verification

1. Create two disposable Supabase Auth users.
2. Insert one Health Quest row per table for each user.
3. Query as User A and confirm User B rows return zero rows.
4. Confirm lesson and quest-template reads work without exposing user data.
5. Confirm analytics insert succeeds for authenticated users and select returns no rows.
