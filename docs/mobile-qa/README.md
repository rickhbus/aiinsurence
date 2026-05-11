# Mobile QA Checklist

Existing captured artifacts live in `docs/screenshots/`:

- `mobile-dashboard.png`
- `mobile-quick-add.png`
- `ai-coach.png`
- `memory-consent.png`
- `mobile-running.png`
- `mobile-nutrition.png`

Additional manual QA required before production promotion:

- Viewport `375x812`: `/`, `/onboarding`, `/dashboard`, `/coach`, `/profile/memory`, `/track/running`, `/nutrition/food-log`, `/settings`.
- Confirm no horizontal scroll.
- Confirm bottom nav and Quick Add are reachable.
- Confirm onboarding can choose Apple Health, Android Health Connect, or not now.
- Confirm settings explains that HealthKit / Health Connect require native app permission and does not claim browser-only access.
- Confirm forms and charts do not overflow.
- Confirm tap targets are comfortable.

Screenshots for mobile health sync settings still need to be captured from preview or a local browser session before production promotion.
