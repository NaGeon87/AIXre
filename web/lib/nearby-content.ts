import festivalsJson from "@/public/data/festivals.json";
import tourismJson from "@/public/data/tourism.json";

export type Festival = {
  sigungu: string;
  name: string;
  period: string;
  place: string;
  source?: string;
};

export type DesignatedTourism = {
  sigungu: string;
  name: string;
  location: string;
  designatedDate?: string;
  note?: string;
};

export type PopularTourism = {
  id: string;
  name: string;
  type: string;
  ageGroup: string;
  share: number;
};

const GWANGJU_POPULAR_NAMES = new Set([
  "국립아시아문화전당",
  "김대중컨벤션센터",
  "광주기아챔피언스필드",
  "국립광주과학관",
  "광주패밀리랜드",
  "상무시민공원",
  "어등산CC",
  "광주월드컵경기장",
  "쌍암공원",
  "국립광주박물관",
  "광주호호수생태원",
  "증심사",
  "518기념문화센터",
  "운천저수지",
  "우치공원동물원",
  "퐁퐁플라워광주빛고을센터",
  "무각사",
  "빛고을CC",
  "전일빌딩245",
  "광주비엔날레전시관",
]);

export function normalizeNearbyArea(value: string) {
  return value.replace(/^광주\s+/, "").replace(/^전남\s+/, "").trim();
}

export function getNearbyContent(region: string, rawArea: string) {
  const area = normalizeNearbyArea(rawArea);
  const tourism = tourismJson as {
    designated: DesignatedTourism[];
    popular: PopularTourism[];
    sourceDate: string;
  };
  const festivals = festivalsJson as Festival[];

  const localTourism = tourism.designated
    .filter((item) => normalizeNearbyArea(item.sigungu) === area)
    .slice(0, 6);

  const gwangjuPopular = region === "광주"
    ? tourism.popular
        .filter((item) => GWANGJU_POPULAR_NAMES.has(item.name))
        .sort((a, b) => b.share - a.share)
        .slice(0, 6)
    : [];

  const localFestivals = festivals
    .filter((item) => {
      const festivalArea = normalizeNearbyArea(item.sigungu);
      if (region === "광주") {
        return item.sigungu.includes("광주") && (festivalArea === area || !area);
      }
      return festivalArea === area;
    })
    .slice(0, 6);

  return {
    area,
    tourismSourceDate: tourism.sourceDate,
    localTourism,
    gwangjuPopular,
    localFestivals,
    hasTourism: localTourism.length > 0 || gwangjuPopular.length > 0,
    hasAny: localTourism.length > 0 || gwangjuPopular.length > 0 || localFestivals.length > 0,
  };
}
