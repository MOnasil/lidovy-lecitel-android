import { D } from "./data";
import { MED, MEDS, searchMeds, type Med } from "./meds";

const fold = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Medicine search over the catalogue and all registered medicines from SÚKL (by product name). */
export function searchMedsAll(q: string): { m: Med; via: string[] }[] {
  const n = fold(q.trim());
  if (!n) return MEDS.map((m) => ({ m, via: [] }));
  const out = new Map<string, { m: Med; via: string[] }>();
  for (const m of searchMeds(q)) out.set(m.k, { m, via: [] });
  if (n.length >= 3) {
    for (const [name, k] of D.lk ?? []) {
      if (!fold(name).includes(n)) continue;
      const m = MED[k];
      if (!m) continue;
      const e = out.get(k) ?? { m, via: [] };
      if (e.via.length < 4) e.via.push(name);
      out.set(k, e);
    }
  }
  return [...out.values()];
}

/** Marketed medicines without a known herb interaction group, matched by product name. */
export function searchSuklPlain(q: string, limit = 6): string[] {
  const n = fold(q.trim());
  if (n.length < 3) return [];
  const starts: string[] = [];
  const inside: string[] = [];
  for (const name of D.sl ?? []) {
    const f = fold(name);
    if (f.startsWith(n)) starts.push(name);
    else if (f.includes(" " + n)) inside.push(name);
    if (starts.length >= limit) break;
  }
  return [...starts, ...inside].slice(0, limit);
}

const SL = new Set((D.sl ?? []).map(fold));
/** Is this an own medicine that SÚKL knows (so "no known clash" rather than "unknown")? */
export const isKnownPlain = (name: string) => SL.has(fold(name.trim()));
