import foodsJson from "@/public/data/foods.json";
import streetsJson from "@/public/data/streets.json";
import metaJson from "@/public/data/meta.json";

import type { Food, Meta, Street } from "./types";

// 웹 런타임은 이 정적 JSON만 읽는다. 원천/가공 데이터는 루트 data/에 분리한다.
export const foods = foodsJson as unknown as Food[];
export const streets = streetsJson as unknown as Street[];
export const meta = metaJson as unknown as Meta;

export function findStreet(id: string): Street | undefined {
  return streets.find((s) => s.id === id);
}
