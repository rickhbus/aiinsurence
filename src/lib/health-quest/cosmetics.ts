import type { LocalizedText } from "./types";

export type HealthQuestCosmetic = {
  slug: string;
  cosmeticType: "theme" | "mascot_accessory" | "celebration_effect";
  title: LocalizedText;
  costGems: number;
};

export const healthQuestCosmetics: HealthQuestCosmetic[] = [
  { slug: "jade-trail", cosmeticType: "theme", title: { zh: "翡翠路線", en: "Jade Trail" }, costGems: 20 },
  { slug: "sky-trail", cosmeticType: "theme", title: { zh: "天空路線", en: "Sky Trail" }, costGems: 20 },
  { slug: "dragon-scarf", cosmeticType: "mascot_accessory", title: { zh: "小健龍頸巾", en: "Dragon Scarf" }, costGems: 35 },
  { slug: "amber-spark", cosmeticType: "celebration_effect", title: { zh: "暖光慶祝", en: "Amber Spark" }, costGems: 30 },
];

export function purchaseCosmetic(input: {
  walletGems: number;
  ownedSlugs: string[];
  cosmetic: HealthQuestCosmetic;
}) {
  if (input.ownedSlugs.includes(input.cosmetic.slug)) {
    return {
      purchased: false,
      reason: "already_owned" as const,
      walletGems: input.walletGems,
      ownedSlugs: input.ownedSlugs,
    };
  }

  if (input.walletGems < input.cosmetic.costGems) {
    return {
      purchased: false,
      reason: "not_enough_gems" as const,
      walletGems: input.walletGems,
      ownedSlugs: input.ownedSlugs,
    };
  }

  return {
    purchased: true,
    reason: "purchased" as const,
    walletGems: input.walletGems - input.cosmetic.costGems,
    ownedSlugs: [...input.ownedSlugs, input.cosmetic.slug],
  };
}

