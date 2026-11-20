// Static encyclopedia dataset (species, studies, conditions…). Imported as raw text and parsed
// once: TypeScript would otherwise infer a type for the whole 2 MB JSON file.
import raw from "@/data/ll-data.json?raw";
import type { Grade, LLData, Nem, Species, Study, Topic } from "./types";
import { MED, MED_PREFIX, medsHitting, medsIn, type Med } from "./meds";

export const D = JSON.parse(raw) as LLData;

export const norm = (s: string) =>
  String(s)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

/** Czech number formatting with a non-breaking space as thousands separator (SSR-safe). */
export const fmt = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");

export const SP: Record<string, Species> = Object.fromEntries(D.species.map((s) => [s.k, s]));
export const TP: Record<string, Topic> = Object.fromEntries(D.topics.map((t) => [t.k, t]));
export const NM: Record<string, Nem> = Object.fromEntries(D.nem.map((n) => [n.k, n]));
export const TOP: Topic[] = D.order.map((k) => TP[k]!).filter(Boolean);

export const HUM = [
  "meta_analysis",
  "clinical_trial",
  "systematic_review",
  "observational",
  "human_other",
];
export const STL: Record<string, string> = {
  meta_analysis: "přehledová studie",
  clinical_trial: "studie s lidmi",
  systematic_review: "přehledová studie",
  observational: "sledování lidí",
  human_other: "studie s lidmi",
  case_report: "popsaný případ",
  review: "přehled výzkumu",
  animal: "pokus na zvířatech",
  in_vitro: "laboratorní pokus",
  ex_vivo: "laboratorní pokus",
};
export const GL: Record<Grade, string> = {
  S: "Doloženo mnoha studiemi",
  A: "Pozitivní účinky testovány na lidech",
  B: "První pozitivní testy na lidech",
  C: "Méně jisté",
};
export const KAT: Record<string, [string, string, string]> = {
  bylina: ["bylinu", "bylině", "Byliny z ČR"],
  houba: ["houbu", "houbě", "Houby"],
  exot: ["rostlinu", "rostlině", "Dovážené rostliny"],
  vcela: ["včelí produkt", "včelím produktu", "Včelí produkty"],
  potr: ["potravinu", "potravině", "Zelenina, semena a potraviny"],
};
export const kat = (s: Species) => KAT[s.kat] ?? KAT["exot"]!;

export const FLAGS: [string, string][] = [
  ["leky", "Pravidelně užívám léky (např. antikoncepci, antidepresiva, léky na srdce)"],
  ["krev", "Užívám léky na ředění krve nebo mám poruchu srážlivosti"],
  ["tlak", "Mám vysoký krevní tlak nebo nemocné srdce"],
  ["cukr", "Užívám léky na cukrovku"],
  ["operace", "Čeká mě operace"],
  ["ledviny", "Mám nemocné ledviny nebo ledvinové kameny"],
  ["jatra", "Mám nemocná játra"],
  ["imuno", "Mám autoimunitní nemoc, jsem po transplantaci nebo užívám léky tlumící imunitu"],
  ["onko", "Léčím se s rakovinou"],
  ["tehot", "Jsem těhotná nebo kojím"],
];

/** More conditions and allergies; a herb warning whose text matches `rx` is marked as unsuitable. */
export const CONDS: { k: string; n: string; kw: string; rx: RegExp }[] = [
  {
    k: "c:hvezd",
    n: "Alergie na hvězdnicovité (ambrozie, pelyněk, heřmánek, třapatka)",
    kw: "alergie pyl senna ambrozie pelynek hermanek",
    rx: /hvězdnic|ambroz|pelyň|kopretin/,
  },
  {
    k: "c:vcela",
    n: "Alergie na včelí produkty (med, pyl, propolis, mateří kašička)",
    kw: "alergie med pyl propolis vcel",
    rx: /včel|propolis|mateří kašič|pylov/,
  },
  { k: "c:astma", n: "Astma", kw: "astma dusnost pruduskya", rx: /astma/ },
  {
    k: "c:stitna",
    n: "Nemoc štítné žlázy",
    kw: "stitna zlaza hashimoto hypotyreoza hypertyreoza",
    rx: /štítn|jód/,
  },
  { k: "c:epil", n: "Epilepsie", kw: "epilepsie zachvaty krece", rx: /epilep/ },
  {
    k: "c:vred",
    n: "Žaludeční vředy, pálení žáhy nebo reflux",
    kw: "vred zaludek palení zahy reflux gastritida",
    rx: /vřed|žáh|reflux/,
  },
  {
    k: "c:zluc",
    n: "Žlučové kameny nebo nemoc žlučníku",
    kw: "zlucnik zlucove kameny",
    rx: /žluč/,
  },
  {
    k: "c:hormon",
    n: "Nádor citlivý na hormony (prs, děloha, prostata) nebo endometrióza",
    kw: "rakovina prsu dělohy prostaty endometrioza hormony",
    rx: /na hormonech|na hormony|estrogen|rakovin[a-z]* prs|endometri|prostat/,
  },
  {
    k: "c:nizkytlak",
    n: "Nízký krevní tlak",
    kw: "nizky tlak hypotenze zavrate",
    rx: /snížit tlak|sníží tlak|snižuje tlak|snižovat tlak|nízk[a-z]* tlak/,
  },
  {
    k: "c:srdce",
    n: "Poruchy srdečního rytmu",
    kw: "arytmie busení srdce fibrilace",
    rx: /arytm|bušení|rytm/,
  },
];
export const COND: Record<string, (typeof CONDS)[number]> = Object.fromEntries(
  CONDS.map((c) => [c.k, c]),
);

/** Flags that were removed from the profile; old saved values are ignored. */
const RETIRED = new Set(["dite"]);

export const RED: [RegExp, string][] = [
  [
    /sebevra|zabit se|nechci zit|ublizit si|vzit si zivot/,
    "Pokud myslíte na to, že si ublížíte, zavolejte prosím hned na Linku první psychické pomoci 116 123 (nonstop, zdarma) nebo na 155. Nejste na to sami.",
  ],
  [
    /bolest na hrud|boli.* na hrud|tlak na hrud|nemuzu dychat|nemohu dychat|dusim se|dusnost|ochrnu|nemuzu mluvit|bezvedom|zachvat krec|otok jazyk|otok krk|otekly jazyk|anafyla/,
    "Tohle může být stav ohrožující život. Volejte hned 155.",
  ],
  [
    /krev ve stolic|krev v moc|zvracim krev|vykasl.* krev|cerna stolic|silna bolest bricha|otrav|snedl.*jedovat|muchomurk/,
    "S tímhle bylinky ani houby nepomohou. Jděte co nejdřív k lékaři nebo na pohotovost; při otravě volejte Toxikologické informační středisko 224 919 293 nebo 155.",
  ],
  [
    /horeck.*(dite|ditet|miminko|kojen)|(dite|miminko|kojen).*horeck/,
    "Horečka u malého dítěte patří k dětskému lékaři. U kojence do 3 měsíců volejte lékaře hned.",
  ],
];

/* ---------- study index and evidence grading ---------- */
type Bucket = Record<string, Study[]>;
const BY: Record<string, Bucket> = {};
for (const s of D.studies)
  for (const sp of s.sp) {
    const o = BY[sp] ?? (BY[sp] = { _: [] });
    o["_"]!.push(s);
    for (const t of s.tp) (o[t] ?? (o[t] = [])).push(s);
  }
export const studies = (sp: string, tp?: string): Study[] => BY[sp]?.[tp || "_"] ?? [];
const NRX: Record<string, RegExp> = {};
for (const n of D.nem) NRX[n.k] = new RegExp(n.rx);
export const nstudies = (sp: string, nk: string) => studies(sp).filter((s) => NRX[nk]!.test(s.ind));

export function gradeOf(st: Study[]): Grade | null {
  const hp = st.filter((s) => HUM.includes(s.st) && s.d == "p");
  const hn = st.filter((s) => HUM.includes(s.st) && s.d == "n").length;
  if (hp.length) {
    const meta = hp.filter((s) => s.st == "meta_analysis").length;
    if (hn * 4 <= hp.length && (meta >= 2 || (meta >= 1 && hp.length >= 6) || hp.length >= 10))
      return "S";
    const strong =
      hp.some((s) => s.st == "meta_analysis") ||
      hp.filter((s) => s.st == "clinical_trial" || s.st == "systematic_review").length >= 2;
    return strong && hn < hp.length ? "A" : "B";
  }
  return st.some((s) => s.d == "p") ? "C" : null;
}
const GC = new Map<string, Grade | null>();
export function grade(sp: string, tp: string): Grade | null {
  const key = sp + "|" + tp;
  if (!GC.has(key)) GC.set(key, gradeOf(studies(sp, tp)));
  return GC.get(key) ?? null;
}
export function ngrade(sp: string, nk: string): Grade | null {
  const key = sp + "#" + nk;
  if (!GC.has(key)) GC.set(key, gradeOf(nstudies(sp, nk)));
  return GC.get(key) ?? null;
}
export function rank(s: Study) {
  const i = HUM.indexOf(s.st);
  return (i < 0 ? 9 : i) * 2 + (s.d == "p" ? 0 : 1);
}
export const bestOf = (st: Study[]) =>
  st.filter((s) => s.d == "p").sort((a, b) => rank(a) - rank(b) || (b.y || 0) - (a.y || 0))[0];
export const best = (sp: string, tp: string) => bestOf(studies(sp, tp));
function scoreOf(st: Study[], g: Grade | null) {
  const hp = st.filter((s) => HUM.includes(s.st) && s.d == "p");
  return (
    (g == "S" ? 3000 : g == "A" ? 1000 : g == "B" ? 100 : 0) +
    hp.filter((s) => s.st == "meta_analysis").length * 10 +
    hp.length
  );
}
export const score = (sp: string, tp: string) => scoreOf(studies(sp, tp), grade(sp, tp));
export const nscore = (sp: string, nk: string) => scoreOf(nstudies(sp, nk), ngrade(sp, nk));
export const isHumanGrade = (g: Grade | null) => g == "S" || g == "A" || g == "B";

/* ---------- profile-based warnings ---------- */
/**
 * `hit`: unsuitable for this profile (own checkbox, or a possible interaction with a medicine
 * listed in `meds`). `soft`: a generic "affects some medicines" warning for someone who takes
 * medicines we cannot match more precisely.
 */
export type Warn = { f: string; t: string; hit: boolean; meds?: string[]; soft?: boolean };
export function warns(sp: string, prof: ReadonlySet<string>): Warn[] {
  const ms = medsIn(prof);
  const all: Warn[] = (D.warn[sp] ?? []).map(([f, t]) => {
    const by = medsHitting(ms, f, t);
    const own = f != "*" && !RETIRED.has(f) && prof.has(f);
    const low = t.toLowerCase();
    const cond = CONDS.some((c) => prof.has(c.k) && c.rx.test(low));
    const w: Warn = { f, t, hit: own || cond || by.length > 0 };
    if (by.length) w.meds = by.map((m) => m.n);
    if (!w.hit && f == "leky" && ms.length) w.soft = true;
    return w;
  });
  const lt = D.lt[sp];
  if (lt && lt.u != "bezpecne" && prof.has("jatra") && !all.some((w) => w.f == "jatra"))
    all.push({ f: "jatra", t: "Játra: " + lt.s, hit: true });
  return all;
}
/** Profile-wide general advice; anyone with a listed medicine also gets the "leky" advice. */
export const hasFlag = (prof: ReadonlySet<string>, f: string) =>
  prof.has(f) ||
  (medsIn(prof).length > 0 && (f == "leky" || medsIn(prof).some((m) => m.flags.includes(f))));
export const blocked = (k: string, prof: ReadonlySet<string>) => warns(k, prof).some((w) => w.hit);

export const U = (k: string) => D.use[k] ?? null;

/** URL slug for a species detail page, e.g. matricaria_chamomilla → matricaria-chamomilla. */
export const slug = (k: string) => k.replace(/_/g, "-");
export const unslug = (s: string) => s.replace(/-/g, "_");

/** For each chosen medicine, the herbs/mushrooms whose warnings name a possible interaction. */
export function interactions(
  meds: readonly string[],
): { med: Med; items: { k: string; t: string }[] }[] {
  return meds
    .map((mk) => MED[mk])
    .filter((m): m is Med => m != null)
    .map((med) => {
      const only = new Set([MED_PREFIX + med.k]);
      const items: { k: string; t: string }[] = [];
      for (const k of Object.keys(D.warn)) {
        if (!SP[k]) continue;
        const w = warns(k, only).find((x) => x.meds?.length);
        if (w) items.push({ k, t: w.t });
      }
      items.sort((a, b) => SP[a.k]!.cz.localeCompare(SP[b.k]!.cz, "cs"));
      return { med, items };
    });
}
