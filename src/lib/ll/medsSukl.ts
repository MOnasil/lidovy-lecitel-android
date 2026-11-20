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
