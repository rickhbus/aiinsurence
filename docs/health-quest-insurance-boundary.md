# Health Quest Insurance Boundary

## Product Boundary

Insurance Mission is education and preparation only. Health, gym, mood, food, symptom, family, doctor-prep, and mobile health data must never be used for:

- Insurance eligibility.
- Pricing or premium decisions.
- Coverage decisions.
- Claim outcomes.
- Care-access decisions.

## Forbidden Phrases

Automated tests reject these guarantees:

- you are covered
- you will be approved
- your claim will pass
- your health score improves your premium
- this app decides eligibility

## Analytics Boundary

Insurance analytics must not store policy text, claim text, HKID, phone, email, raw prompts, or health notes. Use category-level event names and privacy-safe properties only.

## UI Boundary

The insurance flow must show `InsuranceBoundaryBanner`. Copy should say the mission organizes questions and does not decide eligibility, pricing, coverage, claim outcomes, or care access.
