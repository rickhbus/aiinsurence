# Mobile Health Integration

AI Health Guide / 智健導航 uses a backend-first mobile health contract. The web app cannot directly read Apple Health or Android Health Connect from a browser.

## First Release Data Scope

Accepted summary types:

- Steps.
- Active energy / calories.
- Workouts and runs.
- Sleep sessions.
- Body weight.
- Heart-rate summary only, not raw continuous streams.
- Optional mindful minutes or mood only when copy clearly says non-clinical and the user explicitly grants permission.

Not ingested by default:

- Clinical records.
- Diagnoses.
- Medications.
- Reproductive or sexual health data.
- Glucose or highly sensitive biometrics.
- Raw high-frequency heart data.

Mobile health data must not be used for diagnosis, insurance eligibility, pricing, coverage, claims, or care-access decisions. It is also not sent to AI unless a future flow adds explicit user request and consent.

## Backend API

`POST /api/mobile-health/sync`

- Requires Supabase authentication.
- Requires explicit mobile health sync consent.
- Requires an `idempotencyKey`.
- Accepts up to 100 records per batch.
- Stores source platform as `apple_healthkit`, `android_health_connect`, `manual`, or `unknown`.
- Deduplicates by `user_id + source_platform + source_record_hash + start_time + data_type`.
- Returns `accepted_count`, `rejected_count`, `duplicate_count`, and `requestId`.
- Does not log raw payload values.

`GET /api/mobile-health/status`

- Requires Supabase authentication.
- Returns consent status, connected platforms, last successful sync, supported data types, and request id.
- Does not expose raw health samples.

## iOS HealthKit Bridge

- Enable the HealthKit capability in the native target.
- Add `NSHealthShareUsageDescription` and `NSHealthUpdateUsageDescription`.
- Request read permission only for selected types.
- Let users revoke permissions.
- Read a bounded first window, for example last 7 or 30 days, then incremental windows.
- Normalize samples on-device into the backend contract and send summaries only.

## Android Health Connect Bridge

- Check Health Connect availability before requesting permissions.
- Request only selected read permissions.
- Prefer incremental reads where available.
- Normalize records on device and send summaries to `/api/mobile-health/sync`.
- Do not make Google Fit the long-term primary integration because Google Fit APIs are deprecated and scheduled for end of service in late 2026.

## React Native / Expo Notes

- A pure web Expo app cannot access HealthKit or Health Connect directly.
- React Native requires native modules or Expo config plugins for HealthKit / Health Connect.
- Keep server-only Supabase and AI keys out of the native app. Mobile clients should use public Supabase config plus authenticated API routes.

## Consent UX

- Onboarding includes a mobile health sync preference.
- Settings shows sync status and explains platform limits.
- Sync is opt-in.
- Disconnect, deletion, and export need a future privacy workflow with identity confirmation and audit trail.
