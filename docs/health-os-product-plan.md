# Health OS Product Plan

Product name: Super Family Doctor / AI Health Companion. Traditional Chinese: 智健家庭醫生 / 智健導航.

The daily question is: “How is my body and mind today, what did I eat, how did I move, how did I feel, and what should I do next safely?”

## Pillars

- Daily Health Journal.
- Mood & Emotion Coach.
- Food Photo / Nutrition Log.
- Hydration, caffeine, alcohol log.
- Bowel and urine log.
- Gym Workout Coach.
- Sleep, steps, runs, workouts, body weight, and heart-rate summary sync readiness.
- AI Daily Summary and Weekly Report.
- Safe Medical Navigation.
- Insurance and doctor-visit preparation.
- Family / caregiver expansion.
- Monetization through subscriptions, family plan, gym/PT partners, employer wellness, report exports, and insurance-preparation tools.

## Routes

The MVP surface is `/`, `/today`, `/check-in`, `/mood`, `/food`, `/hydration`, `/toilet`, `/gym`, `/gym/templates`, `/reports`, `/family`, `/doctor`, `/insurance`, `/pricing`, and `/business`.

Existing `/gbl`, `/emotion`, and `/history` remain part of the intelligence and audit surface.

## Data

Migration `008_health_companion_mvp.sql` adds additive RLS-protected tables for daily logs, mood, meals, hydration, bowel/urine, gym workouts, exercise sets, templates, entitlements, and business leads.

Scores are “生活狀態參考”, not diagnosis scores.
