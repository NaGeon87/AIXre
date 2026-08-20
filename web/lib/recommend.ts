import { CATEGORIES, SPICY_LEVELS, type Category, type Food } from "./types";

export type SoupPreference = 0 | 1 | 2;
export type RawPreference = "O" | "X";
export type IngredientPreference = Category | "상관없음";

export interface Preference {
  spicy: number;
  soup: SoupPreference;
  raw: RawPreference;
  ingredient: IngredientPreference;
  month: number;
}

export const DEFAULT_PREFERENCE: Omit<Preference, "month"> = {
  spicy: 1,
  soup: 1,
  raw: "X",
  ingredient: "상관없음",
};

export const SOUP_OPTIONS: { value: SoupPreference; label: string }[] = [
  { value: 0, label: "국물 없이" },
  { value: 1, label: "상관없음" },
  { value: 2, label: "국물 있게" },
];

export const RAW_OPTIONS: { value: RawPreference; label: string }[] = [
  { value: "O", label: "날것도 좋아요" },
  { value: "X", label: "익힌 것으로" },
];

export const INGREDIENT_OPTIONS: IngredientPreference[] = [...CATEGORIES, "상관없음"];

/** 취향 점수 우선순위: 날것/익힘 > 주재료 > 국물 > 맵기. */
export const AXIS_WEIGHTS = {
  raw: 40,
  ingredient: 30,
  soup: 20,
  spicy: 10,
} as const;

export type AxisKey = keyof typeof AXIS_WEIGHTS;
const AXIS_LABELS: Record<AxisKey, string> = {
  raw: "날것/익힘",
  ingredient: "주재료",
  soup: "국물",
  spicy: "맵기",
};

const RAW_PARTIAL = 0.4;
const CREDIBILITY_FLOOR = 0.85;

export type AxisVerdict = "match" | "partial" | "miss" | "skipped";
export interface AxisScore {
  key: AxisKey;
  label: string;
  weight: number;
  earned: number;
  verdict: AxisVerdict;
  you: string;
  it: string;
  note: string;
}

export interface MatchExplanation {
  axes: AxisScore[];
  total: number;
  earned: number;
  percent: number;
  confidence: number;
  credibility: number;
  score: number;
}

export type TastePreference = Omit<Preference, "month">;
type ScorableFood = Pick<Food, "spicy" | "hasSoup" | "isRaw" | "mainIngredients" | "confidence">;

function spicyLabel(level: number): string {
  return SPICY_LEVELS.find((item) => item.value === level)?.label ?? `${level}`;
}

/** 취향 4축의 획득 점수와 근거 보정까지 한 번에 계산한다. */
export function explainMatch(pref: TastePreference, food: ScorableFood): MatchExplanation {
  const axes: AxisScore[] = [];

  const spicyGap = Math.abs(pref.spicy - food.spicy);
  const spicyRatio = Math.max(0, 1 - spicyGap / 3);
  axes.push({
    key: "spicy",
    label: AXIS_LABELS.spicy,
    weight: AXIS_WEIGHTS.spicy,
    earned: AXIS_WEIGHTS.spicy * spicyRatio,
    verdict: spicyGap === 0 ? "match" : spicyGap === 1 ? "partial" : "miss",
    you: spicyLabel(pref.spicy),
    it: spicyLabel(food.spicy),
    note:
      spicyGap === 0
        ? "고른 단계와 정확히 같습니다."
        : `${spicyGap}단계 차이라 배점의 ${Math.round(spicyRatio * 100)}%만 얻었습니다.`,
  });

  const soupLabel = food.hasSoup ? "국물 있음" : "국물 없음";
  if (pref.soup === 1) {
    axes.push({
      key: "soup",
      label: AXIS_LABELS.soup,
      weight: 0,
      earned: 0,
      verdict: "skipped",
      you: "상관없음",
      it: soupLabel,
      note: "상관없음으로 선택해 채점에서 제외했습니다.",
    });
  } else {
    const wantsSoup = pref.soup === 2;
    const matched = wantsSoup === food.hasSoup;
    axes.push({
      key: "soup",
      label: AXIS_LABELS.soup,
      weight: AXIS_WEIGHTS.soup,
      earned: matched ? AXIS_WEIGHTS.soup : 0,
      verdict: matched ? "match" : "miss",
      you: wantsSoup ? "국물 있게" : "국물 없이",
      it: soupLabel,
      note: matched ? "고른 것과 같습니다." : "고른 것과 반대라 점수를 얻지 못했습니다.",
    });
  }

  const wantsRaw = pref.raw === "O";
  const rawLabel = food.isRaw ? "날것" : "익힘";
  if (wantsRaw === food.isRaw) {
    axes.push({
      key: "raw",
      label: AXIS_LABELS.raw,
      weight: AXIS_WEIGHTS.raw,
      earned: AXIS_WEIGHTS.raw,
      verdict: "match",
      you: wantsRaw ? "날것도 좋아요" : "익힌 것으로",
      it: rawLabel,
      note: "고른 것과 같습니다.",
    });
  } else if (wantsRaw) {
    axes.push({
      key: "raw",
      label: AXIS_LABELS.raw,
      weight: AXIS_WEIGHTS.raw,
      earned: AXIS_WEIGHTS.raw * RAW_PARTIAL,
      verdict: "partial",
      you: "날것도 좋아요",
      it: rawLabel,
      note: `날것 후보가 적어 익힌 음식에도 배점의 ${Math.round(RAW_PARTIAL * 100)}%를 남깁니다.`,
    });
  } else {
    axes.push({
      key: "raw",
      label: AXIS_LABELS.raw,
      weight: AXIS_WEIGHTS.raw,
      earned: 0,
      verdict: "miss",
      you: "익힌 것으로",
      it: rawLabel,
      note: "익힌 것을 골랐지만 날것 음식이라 점수를 얻지 못했습니다.",
    });
  }

  const ingredientLabel = food.mainIngredients.join("·") || "분류 없음";
  if (pref.ingredient === "상관없음") {
    axes.push({
      key: "ingredient",
      label: AXIS_LABELS.ingredient,
      weight: 0,
      earned: 0,
      verdict: "skipped",
      you: "상관없음",
      it: ingredientLabel,
      note: "상관없음으로 선택해 채점에서 제외했습니다.",
    });
  } else {
    const matched = food.mainIngredients.includes(pref.ingredient);
    axes.push({
      key: "ingredient",
      label: AXIS_LABELS.ingredient,
      weight: AXIS_WEIGHTS.ingredient,
      earned: matched ? AXIS_WEIGHTS.ingredient : 0,
      verdict: matched ? "match" : "miss",
      you: pref.ingredient,
      it: ingredientLabel,
      note: matched ? "고른 주재료가 들어갑니다." : "고른 주재료가 대표 재료가 아닙니다.",
    });
  }

  const total = axes.reduce((sum, axis) => sum + axis.weight, 0);
  const earned = axes.reduce((sum, axis) => sum + axis.earned, 0);
  const percent = total > 0 ? (earned / total) * 100 : 0;
  const credibility = CREDIBILITY_FLOOR + (1 - CREDIBILITY_FLOOR) * food.confidence;

  return {
    axes,
    total,
    earned,
    percent,
    confidence: food.confidence,
    credibility,
    score: Math.round(percent * credibility),
  };
}

export interface ScoredFood {
  food: Food;
  match: number;
  inSeason: boolean;
  mismatches: string[];
  demoted: boolean;
  seasonBonus?: number;
  rankingScore?: number;
  substitute?: boolean;
  substitutionReasons?: string[];
  diversityPenalty?: number;
}

export function randomSeed(): string {
  return `${Date.now().toString(36)}.${Math.random().toString(36).slice(2)}`;
}

function tieHash(id: string, seed: string): number {
  let hash = 0x811c9dc5;
  for (const char of `${id}|${seed}`) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
}

function preferenceSeed(pref: Preference): string {
  return `${pref.month}|${pref.spicy}|${pref.soup}|${pref.raw}|${pref.ingredient}`;
}

function seasonalPool(foods: Food[], month: number): Food[] {
  const strict = foods.filter((food) => food.months.includes(month));
  if (strict.length >= 8) return strict;
  const neighbours = [((month + 10) % 12) + 1, month, (month % 12) + 1];
  return foods.filter((food) => food.months.some((candidate) => neighbours.includes(candidate)));
}

/** 자연어 추천 후보의 같은 식재료 반복을 강하게 억제한다. */
export const INGREDIENT_DUPLICATE_PENALTY = 100;

function looksSameDish(a: Food, b: Food): boolean {
  if (a.name.includes(b.name) || b.name.includes(a.name)) return true;
  if (a.ingredient && b.name.includes(a.ingredient)) return true;
  if (b.ingredient && a.name.includes(b.ingredient)) return true;
  return false;
}

function diversify(scored: ScoredFood[], limit: number): ScoredFood[] {
  const seenNames = new Set<string>();
  const pending = scored.filter((item) => {
    const name = item.food.displayName || item.food.name;
    if (seenNames.has(name)) return false;
    seenNames.add(name);
    return true;
  });

  const picked: ScoredFood[] = [];
  const ingredientCount = new Map<string, number>();

  while (picked.length < limit && pending.length > 0) {
    let bestIndex = 0;
    let bestAdjusted = -Infinity;

    pending.forEach((item, index) => {
      const ingredient = item.food.ingredient || item.food.name;
      const duplicateCount = ingredientCount.get(ingredient) ?? 0;
      const sameDishPenalty = picked.some((taken) => looksSameDish(taken.food, item.food)) ? 200 : 0;
      const adjusted = item.match - duplicateCount * INGREDIENT_DUPLICATE_PENALTY - sameDishPenalty;
      if (adjusted > bestAdjusted) {
        bestAdjusted = adjusted;
        bestIndex = index;
      }
    });

    const [item] = pending.splice(bestIndex, 1);
    const ingredient = item.food.ingredient || item.food.name;
    const duplicateCount = ingredientCount.get(ingredient) ?? 0;
    ingredientCount.set(ingredient, duplicateCount + 1);
    picked.push(duplicateCount > 0 ? { ...item, demoted: true } : item);
  }

  return picked;
}

/** 자연어 후보군을 현재 월 제철 범위와 취향 점수로 정렬한다. */
function rankCandidates(
  foods: Food[],
  pref: Preference,
  seed: string = preferenceSeed(pref),
): ScoredFood[] {
  const scored = seasonalPool(foods, pref.month).map<ScoredFood>((food) => ({
    food,
    match: explainMatch(pref, food).score,
    inSeason: food.months.includes(pref.month),
    mismatches: categoryMismatchReasons(pref, food),
    demoted: false,
  }));

  scored.sort((a, b) => {
    if (b.match !== a.match) return b.match - a.match;
    if (a.inSeason !== b.inSeason) return a.inSeason ? -1 : 1;
    return tieHash(a.food.id, seed) - tieHash(b.food.id, seed);
  });

  return diversify(scored, scored.length);
}

export function recommendFoods(foods: Food[], pref: Preference, limit = 4): ScoredFood[] {
  return rankCandidates(foods, pref).slice(0, limit);
}

export interface CategoryRecommendationResult {
  results: ScoredFood[];
}

/** 대체 추천 판정에는 날것/익힘·주재료·국물만 사용한다. 맵기와 월은 순위 요소다. */
export function categoryMismatchReasons(pref: Preference, food: Food): string[] {
  const reasons: string[] = [];
  if (food.isRaw !== (pref.raw === "O")) reasons.push("날것/익힘 조건 불일치");
  if (pref.ingredient !== "상관없음" && !food.mainIngredients.includes(pref.ingredient)) {
    reasons.push("주재료 조건 불일치");
  }
  if (pref.soup !== 1 && food.hasSoup !== (pref.soup === 2)) {
    reasons.push("국물 조건 불일치");
  }
  return reasons;
}

function monthGap(months: number[], target: number): number {
  if (months.length === 0) return 6;
  return Math.min(
    ...months.map((month) => {
      const direct = Math.abs(month - target);
      return Math.min(direct, 12 - direct);
    }),
  );
}

export const SEASON_EXACT_BONUS = 12;
export const SEASON_NEAR_BONUS = 3;

/** 해당 월 +12, 앞뒤 1개월 +3, 그 외 0. */
export function seasonPreferenceBonus(food: Pick<Food, "months">, month: number): number {
  const gap = monthGap(food.months, month);
  if (gap === 0) return SEASON_EXACT_BONUS;
  if (gap === 1) return SEASON_NEAR_BONUS;
  return 0;
}

/** ‘다른 추천 보기’에서 같은 식재료가 두 번째 등장할 때의 감점. */
export const CATEGORY_DUPLICATE_PENALTY = 15;

function rankedCategoryCandidates(foods: Food[], pref: Preference, seed: string): ScoredFood[] {
  const ranked = foods.map<ScoredFood>((food) => {
    const mismatches = categoryMismatchReasons(pref, food);
    const match = explainMatch(pref, food).score;
    const seasonBonus = seasonPreferenceBonus(food, pref.month);
    return {
      food,
      match,
      inSeason: food.months.includes(pref.month),
      mismatches,
      demoted: false,
      seasonBonus,
      rankingScore: match + seasonBonus,
      substitute: mismatches.length > 0,
      substitutionReasons: mismatches,
      diversityPenalty: 0,
    };
  });

  ranked.sort((a, b) => {
    const scoreDiff = (b.rankingScore ?? b.match) - (a.rankingScore ?? a.match);
    if (scoreDiff !== 0) return scoreDiff;
    if (b.match !== a.match) return b.match - a.match;
    if (a.inSeason !== b.inSeason) return a.inSeason ? -1 : 1;
    const gapDiff = monthGap(a.food.months, pref.month) - monthGap(b.food.months, pref.month);
    if (gapDiff !== 0) return gapDiff;
    return tieHash(a.food.id, seed) - tieHash(b.food.id, seed);
  });

  const seenNames = new Set<string>();
  return ranked.filter((item) => {
    const name = item.food.displayName || item.food.name;
    if (seenNames.has(name)) return false;
    seenNames.add(name);
    return true;
  });
}

function selectCategoryPage(
  ranked: ScoredFood[],
  limit: number,
  round: number,
  seenFoodIds: string[],
): ScoredFood[] {
  const seen = new Set(seenFoodIds);
  const unseen = ranked.filter((item) => !seen.has(item.food.id));
  const source = unseen.length >= limit
    ? unseen
    : [...unseen, ...ranked.filter((item) => seen.has(item.food.id))];

  const normal = source.filter((item) => !item.substitute);
  const alternatives = source.filter((item) => item.substitute);
  const picked: ScoredFood[] = [];
  const ingredientCounts = new Map<string, number>();
  const maxPerIngredient = round === 0 ? 1 : 2;

  const take = (pool: ScoredFood[], enforceCap: boolean) => {
    const pending = [...pool];
    while (picked.length < limit && pending.length > 0) {
      let bestIndex = -1;
      let bestAdjusted = -Infinity;
      let bestPenalty = 0;

      pending.forEach((item, index) => {
        if (picked.some((taken) => taken.food.id === item.food.id)) return;
        const ingredient = item.food.ingredient || item.food.name;
        const duplicateCount = ingredientCounts.get(ingredient) ?? 0;
        if (enforceCap && duplicateCount >= maxPerIngredient) return;
        const penalty = duplicateCount * CATEGORY_DUPLICATE_PENALTY;
        const adjusted = (item.rankingScore ?? item.match) - penalty;
        if (adjusted > bestAdjusted) {
          bestAdjusted = adjusted;
          bestIndex = index;
          bestPenalty = penalty;
        }
      });

      if (bestIndex < 0) break;
      const [chosen] = pending.splice(bestIndex, 1);
      const ingredient = chosen.food.ingredient || chosen.food.name;
      ingredientCounts.set(ingredient, (ingredientCounts.get(ingredient) ?? 0) + 1);
      picked.push({
        ...chosen,
        demoted: bestPenalty > 0,
        diversityPenalty: bestPenalty,
        rankingScore: (chosen.rankingScore ?? chosen.match) - bestPenalty,
      });
    }
  };

  take(normal, true);
  if (picked.length < limit) take(alternatives, true);
  if (picked.length < limit) take(normal, false);
  if (picked.length < limit) take(alternatives, false);

  return picked.slice(0, limit).sort((a, b) => {
    const scoreDiff = (b.rankingScore ?? b.match) - (a.rankingScore ?? a.match);
    return scoreDiff !== 0 ? scoreDiff : b.match - a.match;
  });
}

/** 카테고리 입력: 정상 추천 우선, 부족한 자리만 점수가 가장 가까운 대체 추천으로 5개를 채운다. */
export function recommendByExactCategory(
  foods: Food[],
  pref: Preference,
  limit = 5,
  seed: string = randomSeed(),
  round = 0,
  seenFoodIds: string[] = [],
): CategoryRecommendationResult {
  const ranked = rankedCategoryCandidates(foods, pref, seed);
  const results = selectCategoryPage(ranked, limit, round, seenFoodIds);
  return { results };
}
