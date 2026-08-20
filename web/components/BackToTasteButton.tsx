"use client";

import { useRouter } from "next/navigation";

/**
 * 근처 추천 화면은 음식 추천 지도에서 진입한다.
 * 새로 /taste로 이동하면 추천 상태가 초기화될 수 있으므로 먼저 브라우저
 * 히스토리로 돌아간다. 직접 진입한 경우에만 /taste를 대체 경로로 쓴다.
 */
export function BackToTasteButton() {
  const router = useRouter();

  const goBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/taste");
  };

  return (
    <button
      type="button"
      onClick={goBack}
      className="text-[12px] font-bold text-brand"
    >
      ← 음식 추천 지도로 돌아가기
    </button>
  );
}
