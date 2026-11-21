import { CONDS, D, FLAGS, SP, warns, type Warn } from "./data";

/** How serious a warning is: "r" = do not combine / avoid, "y" = be careful. */
export type Sev = "r" | "y";

const RED =
  /nekombin|neužív|nepoužív|nebezpe|serotonin|vyhn|nesmí|zakáz|toxick|jedovat|nedoporuč|transplant|krvácen/i;

export const sevOf = (t: string): Sev => (RED.test(t) ? "r" : "y");

export const SEV_LABEL: Record<Sev, string> = { r: "🔴 nekombinovat", y: "🟡 opatrně" };

/** Short "why" for a hit warning: the medicines or the profile condition it concerns. */
export function reasonOf(w: Warn, prof: ReadonlySet<string>): string {
  if (w.meds?.length) return w.meds.join(", ");
  const fl = FLAGS.find(([k]) => k == w.f && prof.has(k));
  if (fl) return shortName(fl[1]);
  const low = w.t.toLowerCase();
  const c = CONDS.find((x) => prof.has(x.k) && (x.k == w.f || x.rx.test(low)));
  return c ? shortName(c.n) : "";
}

const shortName = (n: string) => {
  const s = n.split(" (")[0]!;
  return s.length > 40 ? s.slice(0, 38) + "…" : s;
};

export type Risk = { k: string; sev: Sev; t: string; why: string };

/** The one place that decides which herbs and mushrooms clash with the user's profile. */
export function riskOf(k: string, prof: ReadonlySet<string>): Risk | null {
  const hit = warns(k, prof).filter((w) => w.hit);
  if (!hit.length) return null;
  const w = hit.find((x) => sevOf(x.t) == "r") ?? hit[0]!;
  return { k, sev: sevOf(w.t), t: w.t, why: reasonOf(w, prof) };
}

/** All clashes for the profile, the serious ones first. */
export function myRisks(prof: ReadonlySet<string>): Risk[] {
  const out: Risk[] = [];
  for (const s of D.species) {
    if (s.k == "houby") continue;
    const r = riskOf(s.k, prof);
    if (r) out.push(r);
  }
  return out.sort(
    (a, b) =>
      Number(b.sev == "r") - Number(a.sev == "r") || SP[a.k]!.cz.localeCompare(SP[b.k]!.cz, "cs"),
  );
}

/**
 * Clashes grouped by what causes them: a medicine name (as in `MED[k].n`) or a profile flag /
 * condition key. Each list holds the herbs concerned, serious first.
 */
export function risksByItem(prof: ReadonlySet<string>): Map<string, Risk[]> {
  const out = new Map<string, Risk[]>();
  const add = (key: string, r: Risk) => {
    const l = out.get(key) ?? [];
    const prev = l.find((x) => x.k == r.k);
    if (!prev) l.push(r);
    else if (r.sev == "r" && prev.sev != "r") Object.assign(prev, r);
    out.set(key, l);
  };
  for (const s of D.species) {
    if (s.k == "houby") continue;
    for (const w of warns(s.k, prof)) {
      if (!w.hit) continue;
      const base = { k: s.k, sev: sevOf(w.t), t: w.t };
      for (const m of w.meds ?? []) add("med:" + m, { ...base, why: m });
      if (w.f != "*" && prof.has(w.f)) add(w.f, { ...base, why: "" });
      const low = w.t.toLowerCase();
      for (const c of CONDS) if (prof.has(c.k) && c.rx.test(low)) add(c.k, { ...base, why: "" });
    }
  }
  for (const l of out.values())
    l.sort(
      (a, b) =>
        Number(b.sev == "r") - Number(a.sev == "r") || SP[a.k]!.cz.localeCompare(SP[b.k]!.cz, "cs"),
    );
  return out;
}
