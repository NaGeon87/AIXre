# 전라맛도

광주·전남 음식 데이터를 기반으로 사용자의 취향에 맞는 음식과 실제 등록 식당을 추천하는 Next.js 서비스입니다.

## 현재 사용자 흐름

1. `/` — 지도 기반 랜딩
2. `/taste` — 자연어 LLM 입력 또는 카테고리 선택
3. 추천 5개 — 취향 점수 + 제철 보너스 + 식재료 다양성 보정
4. 지도 — 추천 음식을 취급하는 광주·전남 식당 표시
5. `/street/[id]` — 음식특화거리와 연결 식당
6. `/nearby` — 선택 식당 지역의 관광지·축제 추천
7. `/how` — 현재 추천 점수와 LLM 처리 방식 설명

## 웹 실행

```bash
cd web
npm ci
npm run dev
npm run build
```

외부 LLM을 사용하려면 Vercel 또는 로컬 환경변수에 아래 값을 설정합니다.

```text
SCHOOL_LLM_URL=...
SCHOOL_LLM_API_KEY=...
SCHOOL_LLM_MODEL=Qwen/Qwen3-8B
```

`SCHOOL_LLM_URL`에는 `/v1/chat/completions` 앞의 서버 기본 URL을 넣습니다. 외부 LLM 호출이 실패하면 로컬 추천 엔진으로 자동 전환됩니다.

## 핵심 코드

```text
web/
  app/
    api/chat-recommend/route.ts  자연어 후보 구성 + 외부 LLM 호출 + fallback
    taste/page.tsx               메인 탐색 화면
    street/[id]/page.tsx         음식거리 상세
    nearby/page.tsx              관광지·축제 추천
    how/page.tsx                 추천 방식 설명
  components/
    MapChatExplorer.tsx          지도/입력/추천 통합 UI
    RegionMap.tsx                Leaflet 지도
    CategoryTastePanel.tsx       카테고리 입력
  lib/
    recommend.ts                 점수·제철·대체·다양성 추천 로직
    parse-taste.ts               자연어 취향 규칙 파싱
    location.ts                  지역 포함/제외 공통 판정
    data.ts                      정적 JSON 로더
  public/data/                   실제 웹 런타임 데이터
```

## 추천 기준

- 날것/익힘 40점
- 주재료 30점
- 국물 20점
- 맵기 10점
- 해당 월 제철 +12점
- 앞뒤 1개월 +3점
- 그 외 +0점
- 첫 추천에서는 같은 핵심 식재료를 가능한 한 1개만 노출
- 다른 추천 보기에서는 같은 식재료 최대 2개, 두 번째부터 -15점
- 맵기는 대체 추천 판정이 아니라 감점에만 사용
- 정상 추천이 5개보다 적을 때만 부족한 자리를 대체 추천으로 채움

## 데이터

웹이 직접 읽는 데이터는 `web/public/data/`입니다. 수집·가공용 원본과 보관 데이터의 구분은 [`data/README.md`](data/README.md)를 참고하세요.

## 데이터 재생성 도구

Python 코드는 공공데이터 수집·정제·웹 JSON 생성용입니다. 필요한 패키지는 루트 `requirements.txt`에 있습니다.

```bash
pip install -r requirements.txt
python -m src.streets.build_streets
python -m src.tourism.build_tourism_data
python -m src.export.build_web_data
```

일부 수집기는 외부 API 키 또는 별도 중간 데이터가 필요합니다. 현재 배포에는 이미 생성된 `web/public/data/*.json`을 사용하므로 웹 실행에는 Python이 필요하지 않습니다.
