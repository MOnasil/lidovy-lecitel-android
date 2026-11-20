import { D, SP, U, blocked, grade } from "./data";
import type { Garden, Grade } from "./types";

export const MES = [
  "leden",
  "únor",
  "březen",
  "duben",
  "květen",
  "červen",
  "červenec",
  "srpen",
  "září",
  "říjen",
  "listopad",
  "prosinec",
];
export const MONTH_LETTERS = "LÚBDKČČSZŘLP".split("");
export type GardenMode = "zahrada" | "balkon" | "okno";
export const GSIZE: Record<GardenMode, [number, string][]> = {
  zahrada: [
    [1, "1 m²"],
    [2, "2 m²"],
    [4, "4 m²"],
    [8, "8 m²"],
    [15, "15 m² a víc"],
  ],
  balkon: [
    [2, "2 nádoby"],
    [4, "4 nádoby"],
    [6, "6 nádob"],
    [10, "10 nádob"],
  ],
  okno: [
    [1, "1 květináč"],
    [2, "2 květináče"],
    [3, "3 květináče"],
    [5, "5 květináčů"],
  ],
};
const GW: Partial<Record<Grade, number>> = { S: 4, A: 3, B: 2 };

export type GardenInput = { gt: string[]; gm: GardenMode; gs: number; gl: string };
/** User edits of the plan: removed herbs and herbs chosen as replacements (kept first). */
export type GardenEdits = { skip: string[]; force: string[] };
export const KEY_GARDEN_EDITS = "ll-zahrada-upravy";
export type GardenPick = { k: string; g: Garden; fit: [string, Grade][]; pts: number };

/** Picks growable herbs with human evidence for the chosen complaints that fit the space and light. */
export function gardenPlan(input: GardenInput, prof: ReadonlySet<string>, edits?: GardenEdits) {
  const G = D.garden;
  const sun = input.gl;
  const c = Object.keys(G)
    .filter((k) => SP[k] && !blocked(k, prof))
    .map((k): GardenPick | null => {
      const g = G[k]!;
      if (!g[2].includes(sun)) return null;
      if (input.gm != "zahrada" && !g[1]) return null;
      if (input.gm == "okno" && (g[1] > 5 || g[3] == "K")) return null;
      const fit = input.gt
        .map((tk) => [tk, grade(k, tk)] as const)
        .filter((x): x is readonly [string, Grade] => x[1] != null && GW[x[1]] != null)
        .map((x) => [x[0], x[1]] as [string, Grade]);
      if (!fit.length) return null;
      const u = U(k);
      return {
        k,
        g,
        fit,
        pts: fit.reduce((a, x) => a + (GW[x[1]] ?? 0), 0) + (u && u[5] == "E" ? 0.5 : 0),
      };
    })
    .filter((x): x is GardenPick => x != null)
    .sort((a, b) => b.pts - a.pts || a.g[0] - b.g[0]);
  const out: GardenPick[] = [];
  let used = 0;
  const skip = new Set(edits?.skip ?? []);
  const forced = (edits?.force ?? [])
    .map((k) => c.find((x) => x.k == k))
    .filter((x): x is GardenPick => !!x);
  const order = [...forced, ...c.filter((x) => !forced.includes(x))].filter((x) => !skip.has(x.k));
  for (const x of order) {
    if (out.length >= 10) break;
    if (input.gm == "zahrada") {
      if (used + x.g[0] > input.gs + 0.001) continue;
      used += x.g[0];
    } else {
      if (out.length >= input.gs) break;
      used++;
    }
    out.push(x);
  }
  return { out, used, all: c.length, cand: c.filter((x) => !skip.has(x.k)) };
}

/** Up to `n` alternatives for a herb in the plan: same complaint, fits the place, not yet in the plan. */
export function gardenAlternatives(
  k: string,
  plan: ReturnType<typeof gardenPlan>,
  n = 3,
): GardenPick[] {
  const me = plan.out.find((x) => x.k == k);
  if (!me) return [];
  const topics = new Set(me.fit.map((f) => f[0]));
  const inPlan = new Set(plan.out.map((x) => x.k));
  return plan.cand
    .filter((x) => !inPlan.has(x.k) && x.fit.some((f) => topics.has(f[0])))
    .slice(0, n);
}

/** Rough price of starting a herb: seed packet, seedling, shrub or mushroom kit (Kč, min–max). */
export function gardenPrice(k: string): { od: number; do: number; co: string } {
  const g = D.garden[k];
  const s = SP[k];
  if (s?.kat == "houba") return { od: 200, do: 500, co: "sadba / pěstební sada" };
  if (g?.[3] == "K") return { od: 150, do: 400, co: "sazenice keře" };
  const how = (g?.[7] ?? "").toLowerCase();
  if (/oddenek|hlíz|cibul/.test(how)) return { od: 30, do: 80, co: "oddenek / cibulka" };
  if (/sazenic|řízk|oddělk|odnož|trs|předpěstovan|pokojov/.test(how) && !/výsev přímo/.test(how))
    return { od: 60, do: 120, co: "sazenice" };
  return { od: 30, do: 60, co: "semínka" };
}

/* ---------- Moje výsadba: planted / planned herbs and their reminders ---------- */
export type Planting = { stav: "plan" | "vysazeno"; od: string };
export const KEY_VYSADBA = "ll-vysadba";
export const KEY_NOTIF = "ll-notif";
export type GardenEvent = {
  k: string;
  typ: "vysadba" | "pece" | "sklizen";
  /** the window is open this month */
  nyni: boolean;
  /** months until the window opens (0 = now) */
  za: number;
  mesice: number[];
  titulek: string;
  text: string;
  /** stable id so each reminder is sent once */
  klic: string;
};

/** Months until the nearest month in `months` (0 when `m` is inside), 1–12 calendar months. */
export function monthsUntil(months: number[], m: number): number {
  if (!months.length) return 99;
  if (months.includes(m)) return 0;
  return Math.min(...months.map((x) => (x - m + 12) % 12));
}

const LIGHT_TXT: Record<string, string> = {
  S: "slunné místo",
  SP: "slunce až polostín",
  P: "polostín",
  PT: "polostín až stín",
};
/** Basic care built from the planting data; general gardening rules, not species-specific science. */
export function careText(g: Garden): string {
  const parts = [`Místo: ${LIGHT_TXT[g[2]] ?? "dle druhu"}.`];
  parts.push(
    g[1]
      ? "Zalévejte, když je zemina na povrchu suchá; v nádobě častěji a vždy s otvorem pro odtok vody."
      : "Zalévejte hlavně po výsadbě a v suchu; vzrostlé rostliny většinou vydrží bez častého zalévání.",
  );
  if (g[3] == "T")
    parts.push("Trvalka: na podzim seřízněte suché části, na jaře přihnojte kompostem.");
  if (g[3] == "J")
    parts.push(
      "Jednoletka: po sklizni nebo prvních mrazech skončí, semena si můžete nechat na příští rok.",
    );
  if (g[3] == "D") parts.push("Dvouletka: hlavní sklizeň bývá až ve druhém roce.");
  if (g[3] == "K") parts.push("Keř: první roky jen lehký řez, odstraňujte suché větve.");
  return parts.join(" ");
}

const span = (ms: number[]) =>
  ms.length == 12 ? "celý rok" : ms.map((m) => MES[m - 1]).join(", ");

export function gardenEvents(k: string, p: Planting, now = new Date()): GardenEvent[] {
  const g = D.garden[k];
  const s = SP[k];
  if (!g || !s) return [];
  const m = now.getMonth() + 1;
  const y = now.getFullYear();
  const name = s.cz.split(" (")[0]!;
  const u = U(k);
  const ev: GardenEvent[] = [];
  if (p.stav == "plan") {
    const za = monthsUntil(g[4], m);
    ev.push({
      k,
      typ: "vysadba",
      nyni: za == 0,
      za,
      mesice: g[4],
      titulek: za == 0 ? `Teď je čas vysadit: ${name}` : `Výsadba: ${name}`,
      text: `Kdy: ${span(g[4])}. ${g[7]}`,
      klic: `${k}:vysadba:${y}:${((m + za - 1) % 12) + 1}`,
    });
  } else {
    ev.push({
      k,
      typ: "pece",
      nyni: true,
      za: 0,
      mesice: [],
      titulek: `Jak se starat: ${name}`,
      text: careText(g),
      klic: `${k}:pece:${p.od}`,
    });
    const za = monthsUntil(g[5], m);
    const dal = [u && u[6] ? `Co dál: ${u[6]}` : "", u ? `Jak užívat: ${u[0]}` : ""]
      .filter(Boolean)
      .join(" ");
    ev.push({
      k,
      typ: "sklizen",
      nyni: za == 0,
      za,
      mesice: g[5],
      titulek: za == 0 ? `Čas sklizně: ${name}` : `Sklizeň: ${name}`,
      text: `Kdy: ${span(g[5])}. Sklízí se: ${g[6]}. ${dal}`.trim(),
      klic: `${k}:sklizen:${y}:${((m + za - 1) % 12) + 1}`,
    });
  }
  return ev;
}

/** Reminders that are due now and were not sent yet. */
export function dueReminders(
  v: Record<string, Planting>,
  sent: string[],
  now = new Date(),
): GardenEvent[] {
  return Object.entries(v)
    .flatMap(([k, p]) => gardenEvents(k, p, now))
    .filter((e) => e.nyni && !sent.includes(e.klic));
}
