# 데이터 구분

데이터를 삭제하지 않고 용도별로 구분했습니다.

## 1. 웹 런타임 데이터

실제 서비스가 직접 읽는 데이터입니다.

```text
../web/public/data/
  foods.json
  streets.json
  meta.json
  tourism.json
  festivals.json
```

이 파일들은 배포에 필요하므로 유지합니다.

## 2. 재생성에 사용하는 데이터

현재 Python 정제 코드가 직접 참조하는 파일입니다.

```text
raw/
  광주전남_음식특화거리_위치검증_최종.csv
  전남광주통합특별시_지정관광지_20260618.csv
  전남인기관광명소.csv
processed/
  menu_taste_profile.csv
  streets.csv
```

## 3. 보관 데이터 (`archive/`)

현재 웹 런타임이나 기본 재생성 단계에서는 읽지 않지만 검수·원본 보존 가치가 있어 삭제하지 않은 파일입니다.

```text
archive/raw/        원본 사본·현재 미사용 원천 데이터
archive/processed/  CSV와 중복되는 XLSX, 제외 목록 등
archive/review/     과거 검수 산출물
```

`archive/` 파일은 서비스 빌드에 필요하지 않습니다. 향후 데이터 검수나 재가공 시 참고용으로만 사용합니다.
