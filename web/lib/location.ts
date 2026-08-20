import type { Restaurant } from "./types";

export interface LocationIntent {
  region?: string;
  area?: string;
  label?: string;
  excludeRegions?: string[];
  excludeAreas?: string[];
}

function compact(value: string): string {
  return value.replace(/\s+/g, "");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** "광주 말고", "전복 빼고"처럼 명시적인 제외 표현인지 판정한다. */
export function isExplicitlyExcluded(normalized: string, names: string[]): boolean {
  return names.some((name) => {
    if (!name) return false;
    const escaped = escapeRegExp(name);
    return new RegExp(
      `${escaped}(?:은|는|이|가)?(?:말고|빼고|빼|제외하고|제외|아닌|싫어|싫고)`,
    ).test(normalized);
  });
}

/** 사용자 지역 의도와 식당 주소가 맞는지 한 곳에서 판정한다. */
export function restaurantMatchesLocation(
  restaurant: Restaurant,
  intent: LocationIntent | null,
): boolean {
  if (!intent) return true;
  if (intent.excludeRegions?.includes(restaurant.region)) return false;

  if (intent.excludeAreas?.length) {
    const area = compact(restaurant.area);
    if (
      intent.excludeAreas.some((excluded) => {
        const wanted = compact(excluded);
        return area.includes(wanted) || wanted.includes(area);
      })
    ) {
      return false;
    }
  }

  if (intent.region && restaurant.region !== intent.region) return false;
  if (intent.area) {
    const area = compact(restaurant.area);
    const wanted = compact(intent.area);
    if (!(area.includes(wanted) || wanted.includes(area))) return false;
  }

  return true;
}

/** 광주·전남 시군구 이름과 "말고/빼고" 같은 부정 표현을 지역 조건으로 변환한다. */
export function detectLocationIntent(
  message: string,
  restaurants: Restaurant[],
): LocationIntent | null {
  const normalized = compact(message);
  if (!normalized) return null;

  const allAreas = Array.from(new Set(restaurants.map((restaurant) => restaurant.area).filter(Boolean)))
    .sort((a, b) => b.length - a.length);
  const excludeAreas: string[] = [];
  const excludeRegions: string[] = [];
  let positiveArea: { region?: string; area: string; label: string } | null = null;

  for (const area of allAreas) {
    const compactArea = compact(area);
    const short = compactArea.replace(/(특별자치도|광역시|특별시|시|군|구)$/u, "");
    const names = [compactArea, short].filter((name) => name.length >= 2);
    if (!names.some((name) => normalized.includes(name))) continue;

    const sample = restaurants.find((restaurant) => restaurant.area === area);
    if (isExplicitlyExcluded(normalized, names)) {
      excludeAreas.push(area);
    } else if (!positiveArea) {
      positiveArea = {
        region: sample?.region,
        area,
        label: `${sample?.region ?? ""} ${area}`.trim(),
      };
    }
  }

  const gwangjuExcluded = isExplicitlyExcluded(normalized, ["광주", "광주광역시"]);
  const jeonnamExcluded = isExplicitlyExcluded(normalized, ["전남", "전라남도"]);
  if (gwangjuExcluded) excludeRegions.push("광주");
  if (jeonnamExcluded) excludeRegions.push("전남");

  let region = positiveArea?.region;
  let label = positiveArea?.label;
  if (!positiveArea && !gwangjuExcluded && normalized.includes("광주")) {
    region = "광주";
    label = "광주";
  } else if (
    !positiveArea &&
    !jeonnamExcluded &&
    (normalized.includes("전남") || normalized.includes("전라남도"))
  ) {
    region = "전남";
    label = "전남";
  }

  if (!region && !positiveArea && excludeRegions.length === 0 && excludeAreas.length === 0) {
    return null;
  }

  const excludedLabels = [...excludeRegions, ...excludeAreas];
  if (!label) label = `${excludedLabels.join("·")} 제외`;
  else if (excludedLabels.length) label = `${label} · ${excludedLabels.join("·")} 제외`;

  return {
    region,
    area: positiveArea?.area,
    label,
    excludeRegions: Array.from(new Set(excludeRegions)),
    excludeAreas: Array.from(new Set(excludeAreas)),
  };
}
