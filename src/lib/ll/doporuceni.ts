// "Doporučení pro vás" in the profile: for each saved complaint ("t:<topic>", "n:<condition>")
// the best-backed herbs, skipping ones unsuitable for the profile; herbs the user has at home win
// ties, and a herb that helps with several saved complaints is listed first.
import { D, NM, TP, blocked, grade, isHumanGrade, ngrade, nscore, score } from "./data";
import type { Grade } from "./types";

const GRANK: Record<Grade, number> = { S: 0, A: 1, B: 2, C: 3 };

export type Potiz = { id: string; n: string };
export function potizeOf(prof: ReadonlySet<string>): Potiz[] {
  return [...prof]
    .map((f) =>
      f.startsWith("t:") && TP[f.slice(2)]
        ? { id: f, n: TP[f.slice(2)]!.n }
        : f.startsWith("n:") && NM[f.slice(2)]
          ? { id: f, n: NM[f.slice(2)]!.n }
          : null,
    )
    .filter((x): x is Potiz => x != null);
}

const gradeFor = (k: string, id: string): Grade | null =>
  id.startsWith("n:")
    ? ngrade(k, id.slice(2)) || grade(k, NM[id.slice(2)]!.tp)
    : grade(k, id.slice(2));
const scoreFor = (k: string, id: string) =>
  id.startsWith("n:") ? nscore(k, id.slice(2)) : score(k, id.slice(2));

export type Rec = { k: string; g: Grade; for: string[]; home: boolean };

/** Up to `per` herbs per complaint; herbs covering several complaints come first. */
export function recommendFor(prof: ReadonlySet<string>, doma: readonly string[], per = 2): Rec[] {
  const pot = potizeOf(prof);
  const map = new Map<string, Rec>();
  for (const p of pot) {
    const rows = D.species
      .filter((s) => s.k != "houby" && !blocked(s.k, prof))
      .map((s) => ({ k: s.k, g: gradeFor(s.k, p.id) }))
      .filter((r): r is { k: string; g: Grade } => isHumanGrade(r.g))
      .sort(
        (a, b) =>
          GRANK[a.g] - GRANK[b.g] ||
          Number(doma.includes(b.k)) - Number(doma.includes(a.k)) ||
          scoreFor(b.k, p.id) - scoreFor(a.k, p.id),
      );
    for (const r of rows.slice(0, per)) {
      const cur = map.get(r.k);
      if (cur) {
        cur.for.push(p.n);
        if (GRANK[r.g] < GRANK[cur.g]) cur.g = r.g;
      } else map.set(r.k, { k: r.k, g: r.g, for: [p.n], home: doma.includes(r.k) });
    }
    // a herb at home that also helps (but is not in the top) is still worth showing
    const atHome = rows.find((r) => doma.includes(r.k));
    if (atHome && !map.has(atHome.k))
      map.set(atHome.k, { k: atHome.k, g: atHome.g, for: [p.n], home: true });
  }
  // a herb strong for one complaint may also help the others
  for (const r of map.values())
    for (const p of pot)
      if (!r.for.includes(p.n) && isHumanGrade(gradeFor(r.k, p.id))) r.for.push(p.n);
  return [...map.values()].sort(
    (a, b) =>
      b.for.length - a.for.length || GRANK[a.g] - GRANK[b.g] || Number(b.home) - Number(a.home),
  );
}
