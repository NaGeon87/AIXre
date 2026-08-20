import { BackToTasteButton } from "@/components/BackToTasteButton";
import { getNearbyContent } from "@/lib/nearby-content";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function NearbyPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const restaurant = one(params.restaurant);
  const food = one(params.food);
  const region = one(params.region);
  const nearby = getNearbyContent(region, one(params.area));
  const { area, localTourism, gwangjuPopular, localFestivals, hasTourism, tourismSourceDate } = nearby;

  return (
    <main className="min-h-dvh bg-canvas px-5 py-8 text-fg">
      <div className="mx-auto w-full max-w-[820px]">
        <BackToTasteButton />

        <section className="mt-4 rounded-3xl border border-line bg-surface p-6 shadow-sm">
          <p className="text-[11px] font-bold text-brand">{region} {area}</p>
          <h1 className="mt-1 font-display text-[30px] leading-tight text-fg">
            {restaurant || "선택한 음식점"} 근처 추천
          </h1>
          {food && <p className="mt-2 text-[13px] text-fg-muted">먹을 메뉴 · {food}</p>}
          <p className="mt-4 rounded-2xl bg-canvas px-4 py-3 text-[12px] leading-relaxed text-fg-muted">
            같은 <strong className="font-bold text-fg">시·군·구 권역</strong>의 관광지와 축제를 추천합니다.
          </p>
        </section>

        {hasTourism && (
          <section className="mt-6">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold text-brand">TOUR</p>
                <h2 className="font-display text-[24px] text-fg">근처 관광지</h2>
              </div>
              <span className="text-[11px] text-fg-muted">관광 데이터 기준 {tourismSourceDate}</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {localTourism.map((item) => (
                <article key={`${item.sigungu}-${item.name}`} className="rounded-2xl border border-line bg-surface p-4">
                  <p className="text-[10px] font-bold text-brand">{item.note || "관광지"}</p>
                  <h3 className="mt-1 font-display text-[19px] text-fg">{item.name}</h3>
                  <p className="mt-2 text-[12px] text-fg-muted">{item.sigungu} · {item.location}</p>
                </article>
              ))}
              {gwangjuPopular.map((item) => (
                <article key={item.id} className="rounded-2xl border border-line bg-surface p-4">
                  <p className="text-[10px] font-bold text-brand">광주권 인기 관광 · {item.type}</p>
                  <h3 className="mt-1 font-display text-[19px] text-fg">{item.name}</h3>
                  <p className="mt-2 text-[12px] text-fg-muted">방문 비중 {item.share.toFixed(1)}%</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {localFestivals.length > 0 && (
          <section className="mt-8">
            <div className="mb-3">
              <p className="text-[11px] font-bold text-brand">FESTIVAL</p>
              <h2 className="font-display text-[24px] text-fg">근처 축제</h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {localFestivals.map((festival) => (
                <article key={`${festival.sigungu}-${festival.name}`} className="rounded-2xl border border-line bg-surface p-4">
                  <p className="text-[10px] font-bold text-brand">{festival.sigungu}</p>
                  <h3 className="mt-1 font-display text-[19px] text-fg">{festival.name}</h3>
                  <p className="mt-2 text-[12px] font-medium text-fg">{festival.period}</p>
                  <p className="mt-1 text-[12px] text-fg-muted">{festival.place}</p>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
