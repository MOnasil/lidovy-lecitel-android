export type Species = {
  k: string;
  cz: string;
  lat: string;
  kat: string;
  cr: boolean;
  kde: string;
  kdy: string;
  pest: string;
  formy: string[];
  popis: string;
  ln?: string[];
};
export type Study = {
  i: string;
  y?: number;
  st: string;
  sp: string[];
  tp: string[];
  s: string;
  /** p = positive, n = negative, r = risk, m = mixed */
  d: string;
  ind: string;
  dose?: string;
  doi?: string;
};
export type Topic = { k: string; n: string; kw: string };
export type Nem = { k: string; n: string; tp: string; kw: string; rx: string; tip: string; doc: string };
export type Photo = { a: string; l: string; lu?: string; p: string; not?: boolean };
/** [how to take, when, how often, price key, where to buy, grow key, processing] */
export type Use = [string, string, string, string, string, string, string?];
/** [area m², container litres, light, life form, sow months, harvest months, what to harvest, how to plant] */
export type Garden = [number, number, string, string, number[], number[], string, string];
export type LiverTox = { cz?: string; lat?: string; sk: string; vy: string; u: string; s: string; d: string; url: string };
export type AbsItem = { s: string; st: string; d: string; y?: number; doi?: string };
/** Interaction finding: t = Z zesiluje, O oslabuje, V snižuje vstřebávání, L zlepšuje vstřebávání, R riziko, N bez interakce; p = partner (lék, jídlo, bylina). */
export type IxItem = { s: string; st: string; t: string; p: string; y?: number | null; doi?: string; sp?: string[] };
/** Registered medicinal product from the SÚKL open data (DLP). */
export type SuklProduct = {
  kod: string;
  n: string;
  dop: string;
  f: string;
  reg: string;
  v: string;
  combo: boolean;
  latky: string[];
};
export type LLData = {
  garden: Record<string, Garden>;
  species: Species[];
  forms: Record<string, [string, string, string, string]>;
  months: Record<string, number[]>;
  trad: [string, string, string, string][];
  related: Record<string, string[]>;
  order: string[];
  warn: Record<string, [string, string][]>;
  general: [string, string][];
  food: [string, string, string][];
  topics: Topic[];
  studies: Study[];
  lt: Record<string, LiverTox>;
  avoid: (LiverTox & { cz: string; lat: string })[];
  ph: Record<string, Photo[]>;
  /** GBIF occurrences: n records, c grid cells [lon, lat, count], m records per month, kr top regions, nk number of regions. */
  occ: Record<string, { n: number; c: [number, number, number][]; m?: number[]; kr?: string[]; nk?: number }>;
  /** Region borders (Natural Earth, projected like cz) and regional capitals [label, lat, lon]. */
  kraje?: { p: { n: string; d: string }[]; m: [string, number, number][] };
  pravo: Record<string, string>;
  cz: { d: string };
  use: Record<string, Use>;
  price: Record<string, string>;
  grow: Record<string, string>;
  nem: Nem[];
  mesta: [string, number, number, string][];
  abs: Record<string, AbsItem[]>;
  absg: [string, string][];
  detox: { g: string; it: AbsItem[] }[];
  detoxg: [string, string][];
  jed: { k: string; cz: string; lat: string; why: string }[];
  stats: { clanku: number; druhu: number };
  sukl?: { stav: string; sp: Record<string, SuklProduct[]> };
  ix?: Record<string, IxItem[]>;
  /** Habitat in Czechia: W = grows wild, G = only cultivated. */
  hab?: Record<string, "W" | "G">;
  /** [how to recognise, possible confusion] for wild-collected species. */
  poznat?: Record<string, [string, string]>;
  /** Registered medicines (SÚKL DLP): [product name, medicine group key from meds.ts]. */
  lk?: [string, string][];
  ixg?: { g: string; it: IxItem[] }[];
};
export type Grade = "S" | "A" | "B" | "C";
