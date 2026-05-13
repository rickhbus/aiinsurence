export const seniorMode = true;

export type SeniorModeSetting = {
  largerText: boolean;
  highContrast: boolean;
  biggerTapTargets: boolean;
  simpleLabels: boolean;
  reducedAnimation: boolean;
  hideTinyHelperText: boolean;
};

export const seniorModeSetting: SeniorModeSetting = {
  largerText: true,
  highContrast: true,
  biggerTapTargets: true,
  simpleLabels: true,
  reducedAnimation: true,
  hideTinyHelperText: true,
};

export const simpleMoodChoices = [
  { mood: "good", emoji: "😊", label: "好" },
  { mood: "okay", emoji: "😐", label: "一般" },
  { mood: "not-good", emoji: "😣", label: "唔舒服" },
] as const;

export const simpleActionChoices = [
  { action: "wake", emoji: "🌅", label: "起身" },
  { action: "food", emoji: "🍚", label: "食咗" },
  { action: "water", emoji: "💧", label: "飲咗水" },
  { action: "mood", emoji: "😊", label: "心情" },
  { action: "move", emoji: "🚶", label: "郁咗" },
  { action: "photo", emoji: "📷", label: "影相" },
  { action: "sick", emoji: "🤒", label: "唔舒服" },
  { action: "toilet", emoji: "🚽", label: "去廁所" },
] as const;

export const simpleModeBlockedTerms = [
  "AI.GBL",
  "Emotion Engine",
  "RPE",
  "macro",
  "entitlement",
  "analytics",
  "score",
  "provider",
  "webhook",
  "Supabase",
  "Stripe",
] as const;
