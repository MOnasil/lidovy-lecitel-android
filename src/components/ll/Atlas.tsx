import { useState } from "react";
import { D, TOP, grade, norm, score } from "@/lib/ll/data";
import { TCM, growLabel } from "@/lib/ll/display";
import { photo } from "@/lib/ll/photos";
import { useApp } from "@/lib/ll/store";
import { riskOf } from "@/lib/ll/risks";
import { AtlasExtras } from "./Babske";
import { MineButtons, SpeciesLink } from "./common";

/** How many herbs/mushrooms the Atlas shows before "Rozbalit vše". */
export const ATLAS_FIRST = 8;
const GW: Record<string, number> = { S: 4, A: 3, B: 2 };
/** Evidence weight: how many uses are backed by human studies and how strongly. */
export const evidenceWeight = (k: string) =>
  TOP.reduce((a, t) => a + (GW[grade(k, t.k) ?? ""] ?? 0), 0);

const FILTERS: [string, string][] = [
  ["vse", "Vše"],
  ["bylina", "Byliny z ČR"],
  ["houba", "Houby"],
  ["exot", "Dovážené"],
  ["vcela", "Včelí produkty"],
  ["potr", "Potraviny"],
  ["tcm", "Čínská medicína"],
  ["cr", "Roste v ČR"],
  ["pest", "Lze pěstovat doma"],
];

/** The Atlas list for a filter and search, in the order the Atlas shows it. */
export function atlasList(f: string, search: string, doma: string[]) {
  const q = norm(search);
  const list = D.species.filter((s) => {
    if (s.k == "houby") return false;
    const gl = growLabel(s.k);
    const okF =
      f == "vse" ||
      s.kat == f ||
      (f == "tcm" && TCM.has(s.k)) ||
      (f == "doma" && doma.includes(s.k)) ||
      (f == "cr" && s.cr) ||
      (f == "pest" && (gl == D.grow["E"] || gl == D.grow["M"]));
    return okF && (!q || norm(s.cz + " " + s.lat + " " + (s.ln || []).join(" ")).includes(q));
  });
  // Without a search: the best-backed first.
  return q ? list : [...list].sort((a, b) => evidenceWeight(b.k) - evidenceWeight(a.k));
}

export function Atlas() {
  const { ui, setUI, doma, prof } = useApp();
  const [open, setOpen] = useState(false);
  const f = ui.af;
  const q = norm(ui.as);
  const sorted = atlasList(f, ui.as, doma);
  const shown = q || open ? sorted : sorted.slice(0, ATLAS_FIRST);
  return (
    <>
      <section className="box">
        <h2>Atlas bylin a hub</h2>
        <div className="ask">
          <input
            value={ui.as}
            onChange={(e) => setUI({ as: e.target.value })}
            placeholder="Hledat podle názvu"
            aria-label="Hledat v atlasu"
          />
        </div>
        <div className="chips">
          {[["doma", "✓ Mám doma"] as [string, string], ...FILTERS].map((x) => (
            <button
              key={x[0]}
              type="button"
              className="chip"
              aria-pressed={f == x[0]}
              onClick={() => setUI({ af: x[0] })}
            >
              {x[1]}
            </button>
          ))}
        </div>
        {f == "tcm" ? (
          <p className="note">
            Byliny a houby tradiční čínské medicíny. U každé ukazujeme, co z tradičního použití
            podporují studie.
          </p>
        ) : null}
        <p className="note">{sorted.length} druhů</p>
      </section>
      {sorted.length ? (
        <div className="tiles">
          {shown.map((s) => {
            const top = TOP.filter((t) => {
              const g = grade(s.k, t.k);
              return g && g != "C";
            })
              .sort((a, b) => score(s.k, b.k) - score(s.k, a.k))
              .slice(0, 2);
            const p = photo(s.k);
            const r = riskOf(s.k, prof);
            return (
              <div key={s.k} className="tile-w">
                <SpeciesLink k={s.k} className="tile">
                  {p ? <img src={p} alt="" loading="lazy" width={480} height={360} /> : null}
                  {r ? (
                    <span
                      className={`tile-risk sev-${r.sev}`}
                      title={r.why ? `Pozor: ${r.why}` : "Pozor podle vašeho profilu"}
                    >
                      ⚠️
                    </span>
                  ) : null}
                  <div className="tx">
                    <h3>{s.cz}</h3>
                    <div className="lat">{s.lat}</div>
                    <div className="tags">
                      {top.map((t) => (
                        <span key={t.k} className="tag">
                          {t.n.split(",")[0]!.split(" a ")[0]}
                        </span>
                      ))}
                    </div>
                  </div>
                </SpeciesLink>
                <MineButtons k={s.k} sm />
              </div>
            );
          })}
        </div>
      ) : (
        <p>Nic nenalezeno.</p>
      )}
      {shown.length < sorted.length ? (
        <div className="more-row">
          <button type="button" className="btn ghost" onClick={() => setOpen(true)}>
            Rozbalit vše ({sorted.length})
          </button>
        </div>
      ) : !q && open && sorted.length > ATLAS_FIRST ? (
        <div className="more-row">
          <button type="button" className="btn ghost" onClick={() => setOpen(false)}>
            Sbalit
          </button>
        </div>
      ) : null}
      {f == "vse" && !q ? <AtlasExtras /> : null}
    </>
  );
}
