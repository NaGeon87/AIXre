import Link from "next/link";

import { meta } from "@/lib/data";
import {
  AXIS_WEIGHTS,
  CATEGORY_DUPLICATE_PENALTY,
  INGREDIENT_DUPLICATE_PENALTY,
  SEASON_EXACT_BONUS,
  SEASON_NEAR_BONUS,
} from "@/lib/recommend";

export const metadata = {
  title: "추천 방식 · 전라맛도",
  description: "전라맛도의 취향 점수, 제철 보너스, 다양성 규칙과 LLM 사용 방식.",
};

export default function HowPage() {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-[760px] bg-canvas px-5 pb-16 pt-8 sm:px-8">
      <Link href="/" className="text-[13px] font-bold text-brand">
        ← 전라맛도
      </Link>

      <h1 className="font-display mt-5 text-[32px] text-fg">추천은 이렇게 만들어집니다</h1>
      <p className="mt-3 text-[14px] leading-relaxed text-fg-muted">
        자연어 입력은 외부 LLM이 문맥을 해석하고, 카테고리 입력은 동일한 음식 데이터와
        점수 엔진을 직접 사용합니다. 최종 결과는 등록된 음식 {meta.foodCount}건 안에서만 고릅니다.
      </p>

      <section className="mt-8 rounded-2xl border border-line bg-surface p-5">
        <h2 className="font-display text-[20px] text-fg">1. 취향 점수 · 최대 100점</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Score label="날것/익힘" value={AXIS_WEIGHTS.raw} />
          <Score label="주재료" value={AXIS_WEIGHTS.ingredient} />
          <Score label="국물" value={AXIS_WEIGHTS.soup} />
          <Score label="맵기" value={AXIS_WEIGHTS.spicy} />
        </div>
        <p className="mt-4 text-[12px] leading-relaxed text-fg-muted">
          맵기는 후보를 탈락시키지 않고 차이만큼 감점합니다. 국물·주재료의 ‘상관없음’은 해당 항목을 채점에서 제외합니다.
        </p>
      </section>

      <section className="mt-4 rounded-2xl border border-line bg-surface p-5">
        <h2 className="font-display text-[20px] text-fg">2. 제철 보너스</h2>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <Score label="해당 월" value={SEASON_EXACT_BONUS} prefix="+" />
          <Score label="앞뒤 1개월" value={SEASON_NEAR_BONUS} prefix="+" />
          <Score label="그 외" value={0} prefix="+" />
        </div>
        <p className="mt-4 text-[12px] leading-relaxed text-fg-muted">
          제철은 취향 조건보다 낮은 보너스입니다. 제철이 아니라는 이유만으로 대체 추천이 되지는 않습니다.
        </p>
      </section>

      <section className="mt-4 rounded-2xl border border-line bg-surface p-5">
        <h2 className="font-display text-[20px] text-fg">3. 다양성·대체 추천</h2>
        <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-fg-muted">
          <li>· 첫 추천은 같은 핵심 식재료를 가능한 한 1개만 노출합니다.</li>
          <li>· 자연어 추천에서 같은 식재료 반복은 {INGREDIENT_DUPLICATE_PENALTY}점 상당의 강한 패널티로 억제합니다.</li>
          <li>· ‘다른 추천 보기’에서는 같은 식재료를 최대 2개까지 허용하고 두 번째부터 -{CATEGORY_DUPLICATE_PENALTY}점을 적용합니다.</li>
          <li>· 날것/익힘·주재료·국물 조건을 만족하는 정상 추천이 5개보다 적을 때만 부족한 자리를 대체 추천으로 채웁니다.</li>
          <li>· 대체 추천은 조건에서 벗어난 후보 중 최종 점수가 가장 높은 순으로 선택합니다.</li>
        </ul>
      </section>

      <section className="mt-4 rounded-2xl border border-line bg-surface p-5">
        <h2 className="font-display text-[20px] text-fg">4. 자연어 LLM 처리</h2>
        <p className="mt-3 text-[13px] leading-relaxed text-fg-muted">
          “광주 말고”, “해산물 빼고”, “엄청 매운 음식” 같은 표현을 먼저 구조화하고,
          조건에 맞는 내부 음식 후보만 외부 LLM에 전달합니다. LLM은 새 음식이나 식당을 만들어내지 않고
          전달된 후보 ID 안에서 최대 5개를 고릅니다. 외부 LLM 호출이 실패하면 같은 데이터의 로컬 점수 엔진으로 자동 전환합니다.
        </p>
      </section>
    </main>
  );
}

function Score({ label, value, prefix = "" }: { label: string; value: number; prefix?: string }) {
  return (
    <div className="rounded-xl bg-surface-alt px-3 py-4 text-center">
      <p className="text-[11px] text-fg-muted">{label}</p>
      <p className="mt-1 text-[22px] font-bold text-brand">{prefix}{value}</p>
    </div>
  );
}
