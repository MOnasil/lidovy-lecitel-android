import { Fragment, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { CONDS, D, FLAGS, SP, norm } from "@/lib/ll/data";
import { MED } from "@/lib/ll/meds";
import { ABSORB, ABSV_CLS } from "@/lib/ll/absorb";
import {
  GUIDE,
  GUIDE_REST,
  RULE_T,
  groupSev,
  guideStudies,
  orderedGuide,
  relevant,
} from "@/lib/ll/ixguide";
import { photoUrl } from "@/lib/ll/photos";
import { useApp } from "@/lib/ll/store";
import { myRisks, risksByItem, type Risk } from "@/lib/ll/risks";
import { isKnownPlain } from "@/lib/ll/medsSukl";
import { ZdraviLeky, ownMeds } from "./Profil";
import { Sec } from "./DruhHead";
import { AbsList, IxBadge, IxList, IX_T, SpeciesLink, cap1 } from "./common";

const DETOX_LABELS: Record<string, string> = {
  clinical_trial: "studie na lidech",
  meta_analysis: "přehledová studie",
  systematic_review: "přehledová studie",
  observational: "pozorování lidí",
  case_report: "popsaný případ",
  human_other: "studie na lidech",
};

const IX_NOTE =
  "Studie naznačují tyto možné interakce. Laboratorní a zvířecí výsledky jsou jen orientační; při užívání léků se poraďte s lékárníkem.";

/** Extra absorption rules; `rel` moves a rule up (with a badge) for users it concerns. */
const ABS_RULES: { t: string; d: string; rel?: string[] }[] = [
  {
    t: "Železo s vitaminem C, bez čaje a mléka",
    d: "Vitamin C (i z ovoce a zeleniny) vstřebání železa zlepšuje, čaj, káva a mléko ho snižují. Železo berte nalačno nebo s ovocem a čaj pijte aspoň hodinu od něj.",
  },
  {
    t: "Vitaminy D, E, K a A s jídlem",
    d: "Rozpouštějí se v tucích, proto se lépe vstřebají s jídlem, které obsahuje tuk (například k obědu).",
  },
  {
    t: "Hořčík: záleží na formě",
    d: "Studie naznačují, že citrát a další organické formy hořčíku se vstřebávají lépe než oxid hořečnatý.",
  },
  {
    t: "Léky na štítnou žlázu nalačno",
    d: "Levothyroxin berte ráno nalačno, 30–60 minut před snídaní a kávou. Vápník, železo a hořčík až s odstupem aspoň 4 hodin.",
    rel: ["stitna", "c:stitna"],
  },
  {
    t: "Vláknina a léky s odstupem",
    d: "Psyllium, lněné semínko a jiná vláknina mohou zpomalit vstřebání léků. Užívejte je aspoň 2 hodiny od léků.",
    rel: ["leky"],
  },
];

function AbsGeneral() {
  const { prof, doma } = useApp();
  const mine = doma.filter((k) => SP[k] && ABSORB[k]);
  const rules = [
    ...ABS_RULES.slice(0, 1).map((r) => ({ ...r, mine: false })),
    ...D.absg.map((g) => ({ t: g[0], d: g[1], mine: false })),
    ...ABS_RULES.slice(1).map((r) => ({ t: r.t, d: r.d, mine: !!r.rel && relevant(r.rel, prof) })),
  ];
  const sorted = [...rules.filter((r) => r.mine), ...rules.filter((r) => !r.mine)];
  return (
    <section className="box">
      <h2>Jak zlepšit vstřebávání</h2>
      <p className="note">Obecná pravidla podle studií vstřebatelnosti.</p>
      <ProfHint />
      {mine.length ? (
        <div className="use mine">
          <b>Vaše byliny</b> <MineBadge />
          <ul className="ix-list">
            {mine.map((k) => {
              const a = ABSORB[k]!;
              return (
                <li key={k}>
                  <SpeciesLink k={k}>{SP[k]!.cz.split(" (")[0]}</SpeciesLink>{" "}
                  <span className={`absv absv-${ABSV_CLS[a.v]}`}>vstřebávání {a.v}</span>
                  <div>{a.k ?? a.s}</div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
      {sorted.map((g) => (
        <div key={g.t} className={`use${g.mine ? " mine" : ""}`}>
          <b>{g.t}</b> {g.mine ? <MineBadge /> : null}
          <p className="mt-1">{g.d}</p>
        </div>
      ))}
    </section>
  );
}

/** Has the user filled in anything that changes the advice (not just saved herbs)? */
function profFilled(prof: ReadonlySet<string>) {
  return [...prof].some((x) => !x.startsWith("fav:") && x != "dite");
}

function MineBadge() {
  return <span className="mine-badge">týká se vás</span>;
}

function ProfHint() {
  const { prof } = useApp();
  if (profFilled(prof)) return null;
  return (
    <p className="note">
      Nahoře jsou nejčastější případy. <Link to="/profil">Vyplňte v profilu</Link> své léky a nemoci
      a to, co se vás týká, se seřadí nahoru.
    </p>
  );
}

/** How many "Co nekombinovat" groups are shown before "Zobrazit další". */
const IX_FIRST = 8;

function Interakce() {
  const { prof } = useApp();
  const [more, setMore] = useState(false);
  const studies = useMemo(() => guideStudies(), []);
  const ordered = orderedGuide(prof);
  const groups = more ? ordered : ordered.slice(0, IX_FIRST);
  const rest = GUIDE_REST.map((r) => ({
    ...r,
    it: studies["rest:" + r.g] ?? [],
    mine: relevant(r.rel, prof),
  }))
    .filter((r) => r.it.length)
    .sort((a, b) => Number(b.mine) - Number(a.mine));
  return (
    <section className="box" id="interakce">
      <h2>Co nekombinovat – léky, doplňky, byliny a jídlo</h2>
      <p className="note">{IX_NOTE}</p>
      <ProfHint />
      {groups.map(({ g, mine }) => {
        const st = studies[g.k] ?? [];
        const food = g.k == "jidlo" ? D.food : [];
        const sev = mine ? groupSev(g) : null;
        return (
          <details
            key={g.k}
            className={`dtx ixg${mine ? " mine" : ""}${sev ? " sev-" + sev : ""}`}
            open={mine || undefined}
          >
            <summary>
              <span aria-hidden="true">{g.icon}</span> <b>{g.title}</b>{" "}
              {mine ? (
                <span className={`mine-badge sev-${sev ?? "y"}`}>
                  {sev == "r" ? "🔴 týká se vás – závažné" : "🟡 týká se vás"}
                </span>
              ) : null}
              {g.ex ? <span className="note ixg-ex">např. {g.ex}</span> : null}
            </summary>
            {g.note ? <p className="note">{g.note}</p> : null}
            <ul className="ix-list">
              {g.rules.map((r) => {
                const t = RULE_T[r.t];
                const sp = (r.sp ?? []).filter((k) => SP[k]);
                return (
                  <li key={r.co}>
                    <IxBadge label={t[0]} cls={t[1]} />
                    <b className="ix-p">{r.co}</b>
                    <div>{r.proc}</div>
                    {sp.length ? (
                      <span className="note">
                        {sp.map((k, i) => (
                          <span key={k}>
                            {i ? ", " : ""}
                            <SpeciesLink k={k}>{SP[k]!.cz.split(" (")[0]}</SpeciesLink>
                          </span>
                        ))}
                      </span>
                    ) : null}
                  </li>
                );
              })}
              {food.map((f) => (
                <li key={f[0]}>
                  <b className="ix-p">
                    {f[0]} × {f[1]}
                  </b>
                  <div>{f[2]}</div>
                </li>
              ))}
            </ul>
            {st.length ? (
              <details className="ixg-st">
                <summary>Co ukázaly studie ({st.length})</summary>
                <IxList items={st} showSp />
              </details>
            ) : null}
          </details>
        );
      })}
      {!more ? (
        <div className="more-row">
          <button type="button" className="btn ghost" onClick={() => setMore(true)}>
            Zobrazit další ({ordered.length - IX_FIRST + rest.length})
          </button>
        </div>
      ) : null}
      {more && rest.length ? <h3 className="mt-4">Další studie podle témat</h3> : null}
      {(more ? rest : []).map((r) => (
        <details key={r.g} className={`dtx${r.mine ? " mine" : ""}`}>
          <summary>
            {r.g} <span className="note">({r.it.length})</span> {r.mine ? <MineBadge /> : null}
          </summary>
          <IxList items={r.it} showSp />
        </details>
      ))}
      <p className="ix-legend">
        {Object.values(IX_T).map((t) => (
          <span key={t[1]} className={`ix-badge ${t[1]}`}>
            {t[0]}
          </span>
        ))}
      </p>
    </section>
  );
}

/** Most asked-about detox topics first; `rel` lifts a topic for users it concerns. */
const DETOX_ORDER = [
  "alkohol a kocovina",
  "diety a půsty",
  "ledviny a pitný režim",
  "vitaminy a minerály",
  "jaterní enzymy",
  "glutathion a NAC",
  "pocení a sauna",
  "jíly, zeolit, aktivní uhlí",
  "čaje a koření",
  "těžké kovy",
];
const DETOX_REL: Record<string, string[]> = {
  "ledviny a pitný režim": ["ledviny"],
  "jaterní enzymy": ["jatra"],
  "glutathion a NAC": ["jatra"],
  "těžké kovy": ["tehot"],
  "Ledviny a střevo": ["ledviny"],
  Olovo: ["tehot"],
};
const DETOXG_ORDER = [
  "Tělo se čistí samo",
  "Pozor na „detoxikační“ přípravky",
  "Kocovina",
  "Nejvíc pomůže nepřijímat",
];

function Detox() {
  const { prof } = useApp();
  if (!D.detox.length && !D.detoxg.length) return null;
  const rank = (list: string[], x: string) => {
    const i = list.indexOf(x);
    return i < 0 ? 99 : i;
  };
  const mineOf = (x: string) => !!DETOX_REL[x] && relevant(DETOX_REL[x]!, prof);
  const byMine = <T,>(a: T[], key: (t: T) => string, order: string[]) =>
    [...a].sort(
      (x, y) =>
        Number(mineOf(key(y))) - Number(mineOf(key(x))) ||
        rank(order, key(x)) - rank(order, key(y)),
    );
  const general = byMine(D.detoxg, (g) => g[0], DETOXG_ORDER);
  const G = byMine(D.detox, (g) => g.g, DETOX_ORDER);
  return (
    <section className="box" id="detox">
      <h2>Detoxikace organismu podle studií</h2>
      <p className="note">
        Co naznačují studie o vylučování škodlivin z těla – a co naopak nefunguje nebo škodí.
      </p>
      <ProfHint />
      {general.map((g) => (
        <div key={g[0]} className={`use${mineOf(g[0]) ? " mine" : ""}`}>
          <b>{g[0]}</b> {mineOf(g[0]) ? <MineBadge /> : null}
          <p className="mt-1">{g[1]}</p>
        </div>
      ))}
      <h3 className="mt-4">Jednotlivé studie</h3>
      <p className="note">✓ příznivý výsledek · ≈ smíšený · ✗ bez účinku · ! riziko</p>
      {G.map((g) => (
        <details key={g.g} className={`dtx${mineOf(g.g) ? " mine" : ""}`}>
          <summary>
            {cap1(g.g)} <span className="note">({g.it.length})</span>{" "}
            {mineOf(g.g) ? <MineBadge /> : null}
          </summary>
          <AbsList items={g.it} labels={DETOX_LABELS} fallback="studie" />
        </details>
      ))}
    </section>
  );
}

function Avoid({ q, bare }: { q: string; bare?: boolean }) {
  const av = D.avoid.filter((a) => !q || norm(a.cz + " " + a.lat).includes(q));
  if (!av.length) return null;
  return (
    <section className={bare ? undefined : "box"}>
      {bare ? null : <h2>Byliny, kterým se raději vyhněte</h2>}
      <p className="note">
        Tradičně se používaly, ale podle databáze LiverTox (NIH) mohou poškodit játra.
      </p>
      {av.map((a) => (
        <div key={a.lat} className={`alert ${a.u == "nebezpecne" ? "crit" : "warn"}`}>
          <b>{cap1(a.cz)}</b> <i>({a.lat})</i>: {a.s} {a.d}{" "}
          <a href={a.url} target="_blank" rel="noopener">
            zdroj
          </a>
        </div>
      ))}
    </section>
  );
}

function Jedovate({ q, bare }: { q: string; bare?: boolean }) {
  const jl = D.jed.filter((j) => !q || norm(j.cz + " " + j.lat + " " + j.why).includes(q));
  if (!jl.length) return null;
  return (
    <section className={bare ? undefined : "box"}>
      {bare ? null : <h2>Jedovaté rostliny – poznejte je</h2>}
      <p className="note">
        Tyto rostliny rostou i u nás a snadno se zamění s léčivkami. Nesbírejte nic, co bezpečně
        nepoznáte.
      </p>
      <div className="tiles">
        {jl.map((j) => {
          const p = D.ph[j.k];
          const t = photoUrl(j.k, "t");
          return (
            <div key={j.k} className="tile">
              {p && t ? (
                <img
                  data-zoom={photoUrl(j.k, "1") ?? t}
                  src={t}
                  alt={j.cz}
                  loading="lazy"
                  width={480}
                  height={360}
                />
              ) : null}
              <div className="tx">
                <h3>☠ {j.cz}</h3>
                <div className="lat">{j.lat}</div>
                <p className="why">{j.why}</p>
                {p && p[0] ? (
                  <div className="note credit">
                    Foto: {p[0].a},{" "}
                    <a href={p[0].p} target="_blank" rel="noopener">
                      {p[0].l || "licence"}
                    </a>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** Safety and general sections shown in the Atlas (the Babské rady tab was removed). */
export function AtlasExtras() {
  return (
    <>
      <Sec icon="⚠️" title="Byliny, kterým se raději vyhněte">
        <Avoid q="" bare />
      </Sec>
      <Sec icon="☠️" title="Jedovaté rostliny – poznejte je">
        <Jedovate q="" bare />
      </Sec>
    </>
  );
}

/** Top of "Interakce": the user's medicines and conditions, each with what not to combine. */
/** Herb/mushroom tiles, four in a row: photo, name, severity and why. */
export function RiskTiles({ list, first = 8 }: { list: Risk[]; first?: number }) {
  const [all, setAll] = useState(false);
  const [why, setWhy] = useState<string | null>(null);
  const shown = all ? list : list.slice(0, first);
  const open = why ? list.find((r) => r.k == why) : null;
  return (
    <>
      <div className="rtiles">
        {shown.map((r) => (
          <div key={r.k} className={`rtile sev-${r.sev}`}>
            <SpeciesLink k={r.k} className="rtile-l">
              {photoUrl(r.k, "t") ? (
                <img src={photoUrl(r.k, "t")!} alt="" loading="lazy" />
              ) : (
                <span className="rtile-ph" aria-hidden="true">
                  🌿
                </span>
              )}
              <b>{SP[r.k]!.cz.split(" (")[0]}</b>
            </SpeciesLink>
            <button
              type="button"
              className={`rtile-b sev-${r.sev}`}
              aria-expanded={why == r.k}
              onClick={() => setWhy(why == r.k ? null : r.k)}
            >
              {r.sev == "r" ? "nekombinovat" : "opatrně"} ⓘ
            </button>
          </div>
        ))}
      </div>
      {open ? (
        <p className={`ix-explain rt-why sev-${open.sev}`}>
          <b>{SP[open.k]!.cz.split(" (")[0]}</b>
          {open.why ? ` (${open.why})` : ""}: {open.t}
        </p>
      ) : null}
      {list.length > shown.length ? (
        <div className="more-row">
          <button type="button" className="chip sm" onClick={() => setAll(true)}>
            Zobrazit další ({list.length - shown.length})
          </button>
        </div>
      ) : null}
    </>
  );
}

/** Table of the user's medicines and illnesses; each row opens the herbs it clashes with. */
function MojeTabulka() {
  const { prof, toggleProf, meds, setMeds, medsOther, saveMedsOther } = useApp();
  const [open, setOpen] = useState<string | null>(null);
  const by = useMemo(() => risksByItem(prof), [prof]);
  const own = ownMeds(medsOther);
  type Row = {
    id: string;
    ic: string;
    typ: string;
    n: string;
    list: Risk[] | null;
    drop: () => void;
  };
  const rows: Row[] = [
    ...meds
      .filter((k) => MED[k])
      .map((k) => ({
        id: "m:" + k,
        ic: "💊",
        typ: "Lék",
        n: MED[k]!.n,
        list: by.get("med:" + MED[k]!.n) ?? [],
        drop: () => setMeds(meds.filter((m) => m != k)),
      })),
    ...own.map((t) => ({
      id: "o:" + t,
      ic: "💊",
      typ: "Lék",
      n: t,
      list: isKnownPlain(t) ? [] : null,
      drop: () => saveMedsOther(own.filter((x) => x != t).join("\n")),
    })),
    ...[...FLAGS.map(([k, n]) => ({ k, n })), ...CONDS.map((c) => ({ k: c.k, n: c.n }))]
      .filter((c) => c.k != "leky" && prof.has(c.k))
      .map((c) => ({
        id: "c:" + c.k,
        ic: "🩺",
        typ: "Nemoc",
        n: c.n.split(" (")[0]!,
        list: by.get(c.k) ?? [],
        drop: () => toggleProf(c.k, false),
      })),
  ];
  const label = (l: Risk[] | null) => {
    if (l == null) return <span className="note">neznámý lék – zeptejte se lékárníka</span>;
    if (!l.length) return <span className="note">známé střety nemáme</span>;
    const red = l.some((r) => r.sev == "r");
    const n = l.length;
    return (
      <span className={`mt-cnt sev-${red ? "r" : "y"}`}>
        {red ? "🔴" : "🟡"} {n} {n == 1 ? "bylina" : n < 5 ? "byliny" : "bylin"} ▾
      </span>
    );
  };
  return (
    <div className="mtab" role="table" aria-label="Moje léky a nemoci">
      <div className="mt-row mt-head" role="row">
        <span role="columnheader">Lék / nemoc</span>
        <span role="columnheader">Střety s bylinami</span>
        <span />
      </div>
      {rows.map((r) => (
        <Fragment key={r.id}>
          <div className={`mt-row${open == r.id ? " on" : ""}`} role="row">
            <button
              type="button"
              className="mt-main"
              aria-expanded={open == r.id}
              disabled={!r.list?.length}
              onClick={() => setOpen(open == r.id ? null : r.id)}
            >
              <span className="mt-n">
                <span aria-hidden="true">{r.ic}</span> {r.n}
                <small>{r.typ}</small>
              </span>
              {label(r.list)}
            </button>
            <button
              type="button"
              className="x-btn"
              aria-label={`Odebrat ${r.n}`}
              onClick={() => (r.drop(), open == r.id && setOpen(null))}
            >
              ✕
            </button>
          </div>
          {open == r.id && r.list?.length ? (
            <div className="mt-tiles">
              <RiskTiles list={r.list} />
            </div>
          ) : null}
        </Fragment>
      ))}
    </div>
  );
}

function MojeInterakce() {
  const { prof, meds, medsOther } = useApp();
  const [add, setAdd] = useState(false);
  const own = ownMeds(medsOther);
  const hasCond = [...FLAGS.map(([k]) => k), ...CONDS.map((c) => c.k)].some(
    (k) => k != "leky" && prof.has(k),
  );
  const risks = useMemo(() => myRisks(prof), [prof]);
  const empty = !meds.length && !hasCond && !own.length;
  if (empty) return <ZdraviLeky title="Jaké léky užíváte nebo co vás trápí?" compact />;
  return (
    <>
      <section className="box">
        <h2>Moje léky a zdraví</h2>
        <MojeTabulka />
        <div className="row-btns mt-add">
          <button type="button" className="btn" onClick={() => setAdd((v) => !v)}>
            {add ? "Hotovo" : "➕ Přidat do Mých léků"}
          </button>
        </div>
        {add ? <ZdraviLeky title="" compact /> : null}
      </section>
      <section className="box ix-box">
        <h2>⚠️ Pozor pro vás</h2>
        {risks.length ? (
          <>
            <p className="note">
              Byliny a houby, které se podle studií a příbalových informací nesnesou s vašimi léky
              nebo nemocemi. Klepněte na štítek pro vysvětlení.
            </p>
            <RiskTiles list={risks} />
          </>
        ) : (
          <p className="note">Podle vašeho profilu jsme nenašli žádný střet s bylinami.</p>
        )}
      </section>
      {meds.map((mk) => {
        const med = MED[mk];
        if (!med) return null;
        const rules = GUIDE.filter(
          (g) => g.rel.includes(med.k) || g.rel.some((r) => MED[r]?.k == med.k),
        )
          .flatMap((g) => g.rules)
          .filter((r) => !r.sp?.length);
        if (!rules.length) return null;
        return (
          <section key={med.k} className="box">
            <h3>💊 {med.n}: jídlo, pití a doplňky</h3>
            <ul className="ix-list">
              {rules.map((r) => (
                <li key={r.co}>
                  <IxBadge label={RULE_T[r.t][0]} cls={RULE_T[r.t][1]} />
                  <b className="ix-p">{r.co}</b>
                  <div>{r.proc}</div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      {own.filter((t) => !isKnownPlain(t)).length ? (
        <p className="note box-note">
          💊 {own.filter((t) => !isKnownPlain(t)).join(", ")}: tyto léky aplikace nezná, střety s
          bylinami u nich nehlídáme. Zeptejte se lékárníka.
        </p>
      ) : null}
    </>
  );
}

/** "Interakce" tab: the user's own overview, then what not to combine, absorption, detox. */
export function InterakcePage() {
  return (
    <>
      <MojeInterakce />
      <Interakce />
      <Detox />
      <AbsGeneral />
    </>
  );
}
