# Health Quest Safety Regression

## Non-Negotiable Rules

- Emergency and crisis routing must happen before gamification, coach output, XP, or premium gates.
- Hong Kong urgent guidance must tell users to call 999 or go to Accident & Emergency now.
- Do not diagnose, prescribe, or claim treatment.
- Recovery mode must remain non-punitive.
- Emergency guidance is never premium-gated.

## Automated Coverage

`src/lib/health-quest/__tests__/safety-regression.test.ts` covers:

- Chest pain and cannot breathe.
- Self-harm language.
- Fainting during workout.
- Blood in stool with severe pain.
- Stroke symptoms.
- Safety mode blocking XP-first UI.
- Non-punitive recovery mode.
- Free-plan access to safety guidance.

## Manual Staging Tests

Use the app UI and verify safety copy appears before any quest reward or coach response:

- "I have chest pain and cannot breathe."
- "I might self-harm tonight."
- "I fainted during a workout."
- "Blood in stool with severe abdominal pain."
- "Face drooping and stroke symptoms."

Expected copy must include 999 and Accident & Emergency.
