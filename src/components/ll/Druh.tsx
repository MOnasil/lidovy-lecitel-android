import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { D, HUM, SP, U, kat, rank, studies, warns, fmt } from "@/lib/ll/data";
import { habitat, interestingTrad, processSteps } from "@/lib/ll/display";
import { scrollToAnchor, takePendingAnchor } from "@/lib/ll/jump";
import { useApp } from "@/lib/ll/store";
import { riskOf } from "@/lib/ll/risks";
import {
  AbsList,
  GeneralAlerts,
  IxList,
  SpeciesLink,
  StudyItem,
  UseItem,
  WarnAlert,
} from "./common";
import { atlasList } from "./Atlas";
import {
  EvidenceCard,
  FactTiles,
  FormsAbsorb,
  HeadCard,
  MonthBar,
  MonthLegend,
  Sec,
} from "./DruhHead";
import { LIGHT_TXT, careText, gardenPrice } from "@/lib/ll/garden";
import { growInfo } from "@/lib/ll/display";

const ABS_LABELS: Record<string, string> = {
  clinical_trial: "Studie na lidech",
  meta_analysis: "Přehledová studie",
  systematic_review: "Přehledová studie",
  observational: "Pozorování lidí",
  review: "Přehled",
  human_other: "Studie na lidech",
};

const IX_NOTE =
  "Co studie naznačují o společném užívání. Výsledky z laboratoře a pokusů na zvířatech jsou jen orientační – před kombinací s léky se poraďte s lékárníkem.";

/* ---------- occurrence map of the Czech Republic ---------- */
const MON_FULL = [
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
/** Short text from GBIF data: where in Czechia it is recorded most and in which months. */
function occText(k: string): string | null {
  const o = D.occ[k];
  if (!o) return null;
  const parts: string[] = [];
  if (o.kr?.length)
    parts.push(
      `Nejvíc záznamů: ${o.kr.join(", ")}${o.nk ? ` (pozorována ve ${o.nk} ze 14 krajů)` : ""}.`,
    );
  if (o.m && o.m.some((x) => x > 0)) {
    const max = Math.max(...o.m);
    const top = o.m.map((x, i) => [x, i] as const).filter((x) => x[0] >= max * 0.5);
    const a = top[0]![1];
    const b = top[top.length - 1]![1];
    parts.push(
      `Nejčastěji pozorována: ${a == b ? MON_FULL[a] : `${MON_FULL[a]} až ${MON_FULL[b]}`}.`,
    );
  }
  return parts.join(" ") || null;
}
const K = Math.cos((49.8 * Math.PI) / 180);
const PX = (lo: number) => (lo - 12.0) * K * 68;
const PY = (la: number) => (51.1 - la) * 68;
function placeName(lat: number, lon: number) {
  let b = D.mesta[0]!;
  let bd = 1e9;
  for (const m of D.mesta) {
    const d = Math.hypot((m[2] - lon) * K, m[1] - lat);
    if (d < bd) {
      bd = d;
      b = m;
    }
  }
  const km = Math.round(bd * 111);
  return km < 6 ? `${b[0]} a okolí (${b[3]})` : `asi ${km} km od místa ${b[0]} (${b[3]})`;
}

function OccMap({ k }: { k: string }) {
  const [sel, setSel] = useState<number | null>(null);
  const o = D.occ[k];
  if (!o) return null;
  const ns = o.c.map((c) => c[2]).sort((a, b) => a - b);
  const q = (p: number) => ns[Math.min(ns.length - 1, Math.floor(p * ns.length))]!;
  const th = [q(0.5), q(0.8), q(0.95)] as const;
  const lvl = (n: number) =>
    n > th[2] && n > 3 ? 3 : n > th[1] && n > 2 ? 2 : n > th[0] && n > 1 ? 1 : 0;
  const c = sel != null ? o.c[sel] : undefined;
  return (
    <section className="box map">
      <h3>Kde byla v Česku pozorována</h3>
      <svg viewBox="-4 -4 310 186" role="img" aria-label="Mapa výskytu v České republice">
        <path className="cz-outline" d={D.cz.d} />
        {D.kraje?.p.map((r) => (
          <path key={r.n} className="kraj" d={r.d}>
            <title>{r.n}</title>
          </path>
        ))}
        {o.c.map((p, i) => (
          <circle
            key={i}
            cx={PX(p[0]).toFixed(1)}
            cy={PY(p[1]).toFixed(1)}
            r="2.6"
            className={`m${lvl(p[2])}${sel == i ? " sel" : ""}`}
            onClick={() => setSel(i)}
          >
            <title>{`${p[2]} záznamů`}</title>
          </circle>
        ))}
        {D.kraje?.m.map((m) => (
          <g key={m[0]} className="kmesto" aria-hidden="true">
            <circle cx={PX(m[2]).toFixed(1)} cy={PY(m[1]).toFixed(1)} r="1.6" />
            <text x={(PX(m[2]) + 2.6).toFixed(1)} y={(PY(m[1]) + 2.2).toFixed(1)}>
              {m[0]}
            </text>
          </g>
        ))}
      </svg>
      <div className="legendm">
        <span>
          <i className="m0" />
          ojediněle
        </span>
        <span>
          <i className="m1" />
          občas
        </span>
        <span>
          <i className="m2" />
          často
        </span>
        <span>
          <i className="m3" />
          hojně
        </span>
      </div>
      <p className="place" aria-live="polite">
        {c ? (
          <>
            <b>{placeName(c[1], c[0])}</b> – {c[2]}{" "}
            {c[2] == 1 ? "záznam" : c[2] < 5 ? "záznamy" : "záznamů"}
          </>
        ) : (
          <span className="note">Klepněte na bod a uvidíte, kde zhruba se nachází.</span>
        )}
      </p>
      <p className="note">
        {fmt(o.n)} záznamů. Data:{" "}
        <a href="https://www.gbif.org" target="_blank" rel="noopener">
          GBIF.org
        </a>{" "}
        (CC BY 4.0 a CC0).
      </p>
    </section>
  );
}

/** "‹ previous | next ›" between species, in the Atlas order (with its current filter and search). */
function PrevNext({ k }: { k: string }) {
  const { ui, doma } = useApp();
  let list = atlasList(ui.af, ui.as, doma);
  if (!list.some((s) => s.k == k)) list = atlasList("vse", "", doma);
  const i = list.findIndex((s) => s.k == k);
  if (i < 0 || list.length < 2) return null;
  const prev = list[(i - 1 + list.length) % list.length]!;
  const next = list[(i + 1) % list.length]!;
  const nm = (cz: string) => cz.split(" (")[0];
  return (
    <nav className="prevnext" aria-label="Další druhy">
      <SpeciesLink k={prev.k} className="pn-prev">
        ‹ {nm(prev.cz)}
      </SpeciesLink>
      <SpeciesLink k={next.k} className="pn-next">
        {nm(next.cz)} ›
      </SpeciesLink>
    </nav>
  );
}

/** "Babské léčitelství": compact, the first three uses with the rest on request. */
function TradBox({ tr }: { tr: Parameters<typeof UseItem>[0]["t"][] }) {
  const [all, setAll] = useState(false);
  const shown = all ? tr : tr.slice(0, 3);
  return (
    <section className="card-l trad-box">
      <h3 className="cl-h">👵 Babské léčitelství</h3>
      <div className="uses">
        {shown.map((t, i) => (
          <UseItem key={i} t={t} />
        ))}
      </div>
      {tr.length > shown.length ? (
        <button type="button" className="chip sm" onClick={() => setAll(true)}>
          Zobrazit další ({tr.length - shown.length})
        </button>
      ) : null}
    </section>
  );
}

export function Druh({ k }: { k: string }) {
  const { prof } = useApp();
  const s = SP[k]!;
  const w = warns(k, prof);
  const risk1 = riskOf(k, prof);
  const all = studies(k);
  const pos = all
    .filter((x) => x.d == "p")
    .sort((a, b) => rank(a) - rank(b) || (b.y || 0) - (a.y || 0));
  const hum = pos.filter((x) => HUM.includes(x.st));
  const oth = pos.filter((x) => !HUM.includes(x.st));
  const tr = D.trad.filter((t) => t[0] == k);
  const risk = all.filter((x) => x.d == "r").sort((a, b) => (b.y || 0) - (a.y || 0));
  const lt = D.lt[k];
  const kt = kat(s);
  const u = U(k);
  const absItems = D.abs[k];
  const ixItems = D.ix?.[k] ?? [];
  const occInfo = occText(k);
  const hab = habitat(k);
  const pz = D.poznat?.[k];
  const ixRisk = ixItems.filter((x) => x.t == "R" || x.t == "Z");
  const steps = processSteps(k);
  const g = D.garden[k];
  const gi = growInfo(k);
  const growable = !!g && !!gi && gi.lvl != "N";
  const noun = s.kat == "houba" ? "houbu" : "bylinu";
  const growTitle = `Pěstování ${s.kat == "houba" ? "houby" : "byliny"} v ČR`;
  const stepsTitle = growable
    ? "Jak úrodu zpracovat"
    : D.hab?.[k] == "W"
      ? `Jak zpracovat nasbíranou ${noun}`
      : `Jak ${noun} zpracovat`;
  const stepsList = (
    <ol className="steps">
      {steps.map((st) => (
        <li key={st.t}>
          <span className="step-ic" aria-hidden="true">
            {st.ic}
          </span>
          <div>
            <b>{st.t}</b>
            {st.d.split("\n").map((l, i) => (
              <p key={i}>{l}</p>
            ))}
          </div>
        </li>
      ))}
    </ol>
  );

  // Arriving from a list with a chosen form (e.g. tapping "Nálev"): scroll straight to it.
  useEffect(() => {
    const a = takePendingAnchor();
    if (a) window.setTimeout(() => scrollToAnchor(a), 80);
  }, [k]);
  const toPozor = (
    <button type="button" className="linkish" onClick={() => scrollToAnchor("pozor")}>
      viz Na co si dát pozor
    </button>
  );

  return (
    <>
      <p>
        <Link to="/atlas">← Atlas</Link>
      </p>
      <PrevNext k={k} />
      <HeadCard
        s={s}
        extra={
          <>
            {risk1 ? (
              <div className={`alert ${risk1.sev == "r" ? "crit" : "ix-warn"}`}>
                {risk1.sev == "r" ? "🔴" : "🟡"}{" "}
                <b>
                  {w.some((x) => x.meds?.length)
                    ? risk1.sev == "r"
                      ? "Nekombinujte s vašimi léky"
                      : "Možný střet s vašimi léky"
                    : risk1.sev == "r"
                      ? "Pro vás nevhodné"
                      : "Opatrně podle vašeho profilu"}
                </b>
                {risk1.why ? ` (${risk1.why})` : ""} – {toPozor}.
              </div>
            ) : null}
          </>
        }
      />
      {D.pravo[k] ? (
        <div className="alert warn">
          <b>Právní stav v ČR:</b> {D.pravo[k]}
        </div>
      ) : null}
      <GeneralAlerts />
      <EvidenceCard k={k} />
      {s.formy && s.formy.length ? <FormsAbsorb s={s} /> : null}
      <FactTiles k={k} w={w} risks={risk.length + (lt && lt.u != "bezpecne" ? 1 : 0)} />
      <hr className="sep" />
      {tr.length && interestingTrad(k, tr) ? <TradBox tr={tr} /> : null}
      <Sec icon="📍" title={pz ? "Kde roste a jak poznat" : "Kde roste"} id="kde">
        {hab ? (
          <p className={`hab-tag hab-${hab.ic == "🌳" ? "W" : (D.hab?.[k] ?? "x")}`}>
            <span aria-hidden="true">{hab.ic}</span> {hab.t}
          </p>
        ) : null}
        <div className="rows kde-rows">
          <div className="row stack">
            <b>Kde roste:</b> {s.kde}
          </div>
          {pz ? (
            <div className="row stack">
              <b>Jak poznat:</b> {pz[0]}
            </div>
          ) : null}
          {pz ? (
            <div className={`row stack${/^POZOR/.test(pz[1]) ? " zamena-warn" : ""}`}>
              <b>S čím se dá zaměnit:</b> {pz[1]}
            </div>
          ) : null}
          <div className="row stack">
            <b>Pěstování doma:</b> {s.pest}
          </div>
          {occInfo ? (
            <div className="row stack">
              <b>Pozorování v ČR:</b> {occInfo}
            </div>
          ) : null}
        </div>
        <OccMap k={k} />
      </Sec>
      {ixItems.length ? (
        <Sec
          icon="🔀"
          title="Kombinace s léky, jídlem a bylinami"
          n={ixItems.length}
          id="interakce"
        >
          <p className="note">{IX_NOTE}</p>
          <IxList items={ixItems} />
        </Sec>
      ) : null}
      {w.length || risk.length || lt || ixRisk.length ? (
        <Sec
          icon="⚠️"
          title="Na co si dát pozor"
          n={w.length + risk.length + ixRisk.length}
          id="pozor"
          warn
          open={w.some((x) => x.hit || x.meds?.length)}
        >
          {w.map((x, i) => (
            <WarnAlert key={i} w={x} plain />
          ))}
          {lt ? (
            <div className={`alert ${lt.u == "bezpecne" ? "ok" : "warn"}`}>
              <b>Játra:</b> {lt.s} {lt.d}{" "}
              <a href={lt.url} target="_blank" rel="noopener">
                LiverTox, NIH
              </a>
            </div>
          ) : null}
          {risk.length ? (
            <details open>
              <summary>Studie, které upozorňují na rizika ({risk.length})</summary>
              {risk.map((x) => (
                <StudyItem key={x.i} s={x} />
              ))}
            </details>
          ) : null}
          {ixRisk.length ? (
            <details open={!risk.length}>
              <summary>Rizikové kombinace s léky a jídlem ({ixRisk.length})</summary>
              <IxList items={ixRisk} />
            </details>
          ) : null}
        </Sec>
      ) : null}
      {growable && g && gi ? (
        <Sec icon="🌱" title={growTitle} id="pestovani">
          <div className="rows">
            <div className="row">
              <span>Náročnost</span>
              <span className={`gl-${gi.lvl}`}>
                <b>{gi.label}</b>
              </span>
            </div>
            <div className="row stack">{gi.text}</div>
            <div className="row">
              <span>Místo</span>
              <span>{LIGHT_TXT[g[2]] ?? "dle druhu"}</span>
            </div>
            {g[7] ? <div className="row stack">{g[7]}</div> : null}
            <div className="row stack">{careText(g)}</div>
            <div className="row">
              <span>Orientační cena</span>
              <span>
                {gardenPrice(k).od}–{gardenPrice(k).do} Kč ({gardenPrice(k).co})
              </span>
            </div>
          </div>
          <h4 className="fgrp">Kdy zasít a kdy sklízet</h4>
          <MonthBar sow={g[4]} harvest={g[5].length ? g[5] : D.months[k] || []} />
          <MonthLegend />
          {g[6] ? <p className="mleg">Sklízí se: {g[6]}</p> : null}
          {steps.length ? (
            <>
              <h4 className="fgrp">{stepsTitle}</h4>
              {stepsList}
              <p className="note">
                Obecný postup – dávky a časy přípravy si ověřte u lékárníka nebo bylinkáře.
              </p>
            </>
          ) : null}
        </Sec>
      ) : null}
      {u ? (
        !growable && steps.length ? (
          <Sec icon="🧺" title={stepsTitle}>
            {stepsList}
            <p className="note">
              Obecný postup – dávky a časy přípravy si ověřte u lékárníka nebo v příbalovém letáku.
            </p>
          </Sec>
        ) : null
      ) : null}
      {absItems && absItems.length ? (
        <Sec icon="🔬" title="Studie o vstřebatelnosti" n={absItems.length}>
          <AbsList items={absItems.slice(0, 8)} labels={ABS_LABELS} fallback="Studie" />
        </Sec>
      ) : null}
      <Sec icon="📚" title="Studie" n={pos.length}>
        {hum.length ? (
          <details open>
            <summary>Pozitivní účinky testované na lidech ({hum.length})</summary>
            {hum.slice(0, 40).map((x) => (
              <StudyItem key={x.i} s={x} />
            ))}
          </details>
        ) : null}
        {oth.length ? (
          <details open={!hum.length}>
            <summary>Méně jisté: zvířata, laboratoř a přehledy ({oth.length})</summary>
            {oth.slice(0, 30).map((x) => (
              <StudyItem key={x.i} s={x} />
            ))}
          </details>
        ) : null}
        {pos.length ? null : (
          <p className="note">K této {kt[1]} zatím nemáme studii s příznivým výsledkem.</p>
        )}
      </Sec>
      <PrevNext k={k} />
    </>
  );
}
