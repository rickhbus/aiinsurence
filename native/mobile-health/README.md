# Mobile Health Native Bridge

This folder contains additive native bridge source for AI Health Guide / HealthOS mobile clients.

The bridge keeps the same product safety contract as `/api/mobile-health/sync`:

- Request platform permission on device before reading.
- Read bounded summaries only, not raw clinical records.
- Send summaries to the backend with a Supabase bearer token.
- Do not use mobile health data for diagnosis, insurance eligibility, pricing, coverage, claims, or care access.
- Keep server-only Supabase, Postgres, AI, Redis, and service-role keys out of native apps.

## Files

- `ios/HealthKitMobileHealthBridge.swift`: HealthKit permission, bounded reads, summary payload creation, and sync client.
- `android/HealthConnectMobileHealthBridge.kt`: Health Connect permission, bounded reads, summary payload creation, and sync client.

## Integration Checklist

1. Add the iOS file to the native app target and enable the HealthKit capability.
2. Add `NSHealthShareUsageDescription` and `NSHealthUpdateUsageDescription` to `Info.plist`.
3. Add the Android file to the native app module and declare Health Connect permissions.
4. Pass the current Supabase user access token into the bridge at sync time.
5. Keep the sync window small for first release, for example 7 or 30 days.
6. Show settings controls for connect, disconnect, deletion, export, and permission revocation.

