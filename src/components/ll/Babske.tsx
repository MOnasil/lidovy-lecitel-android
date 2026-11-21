import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { CONDS, D, FLAGS, SP, interactions, norm, warns } from "@/lib/ll/data";
import { MED } from "@/lib/ll/meds";
import { ABSORB, ABSV_CLS } from "@/lib/ll/absorb";
import { GUIDE, GUIDE_REST, RULE_T, guideStudies, orderedGuide, relevant } from "@/lib/ll/ixguide";
import { photoUrl } from "@/lib/ll/photos";
import { useApp } from "@/lib/ll/store";
import { ZdraviLeky, ownMeds } from "./Profil";
import { Sec } from "./DruhHead";
import { AbsList, IxBadge, IxList, IX_T, SpeciesLink, UseItem, Who, cap1, verdict } from "./common";

const ORDER: Record<string, number> = { gS: -1, gA: 0, gB: 1, gM: 2, gN: 3 };
const BV: Record<string, string[] | null> = {
  vse: null,
  silne: ["gS"],
  ano: ["gS", "gA", "gB"],
  lab: ["gM"],
  ne: ["gN"],
};
const CATS: [string, string][] = [
  ["vse", "Vše"],
  ["bylina", "Byliny z ČR"],
  ["houba", "Houby"],
  ["exot", "Dovážené"],
  ["vcela", "Včelí produkty"],
  ["potr", "Potraviny"],
];
const VERD: [string, string][] = [
  ["vse", "Vše"],
  ["silne", "✓✓ Doloženo mnoha studiemi"],
  ["ano", "✓ Potvrzeno studiemi na lidech"],
  ["lab", "Jen laboratoř a zvířata"],
  ["ne", "✗ Nepotvrzeno"],
];
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
        return (
          <details key={g.k} className={`dtx ixg${mine ? " mine" : ""}`} open={mine || undefined}>
            <summary>
              <span aria-hidden="true">{g.icon}</span> <b>{g.title}</b>{" "}
              {mine ? <MineBadge /> : null}
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

/** Herbs and mushrooms whose warnings concern the user's conditions, allergies or medicines. */
function AvoidMine() {
  const { prof } = useApp();
  const [all, setAll] = useState(false);
  const list = useMemo(
    () =>
      profFilled(prof)
        ? D.species
            .filter((s) => s.k != "houby")
            .map((s) => ({ s, w: warns(s.k, prof).filter((x) => x.hit) }))
            .filter((x) => x.w.length)
            .sort((a, b) => a.s.cz.localeCompare(b.s.cz, "cs"))
        : [],
    [prof],
  );
  if (!profFilled(prof))
    return (
      <div className="use">
        <b>Pro vás podle profilu</b>
        <p className="mt-1">
          <Link to="/profil">Vyplňte v profilu</Link> nemoci, alergie a léky a ukážeme byliny a
          houby, kterým se máte vyhnout.
        </p>
      </div>
    );
  const shown = all ? list : list.slice(0, 12);
  return (
    <div className="use mine">
      <b>Pro vás podle profilu</b> <MineBadge />
      {!list.length ? (
        <p className="mt-1">
          Podle vašeho profilu jsme nenašli žádnou bylinu, které se máte vyhnout.
        </p>
      ) : (
        <>
          <ul className="ix-list">
            {shown.map(({ s, w }) => (
              <li key={s.k}>
                <SpeciesLink k={s.k}>
                  <b>{s.cz.split(" (")[0]}</b>
                </SpeciesLink>
                <div>
                  {w[0]!.meds?.length ? `Užíváte ${w[0]!.meds.join(", ")}: ` : ""}
                  {w[0]!.t}
                </div>
              </li>
            ))}
          </ul>
          {list.length > shown.length ? (
            <button type="button" className="chip sm" onClick={() => setAll(true)}>
              Zobrazit všech {list.length}
            </button>
          ) : null}
        </>
      )}
    </div>
  );
}

function Avoid({ q, bare }: { q: string; bare?: boolean }) {
  const av = D.avoid.filter((a) => !q || norm(a.cz + " " + a.lat).includes(q));
  if (!av.length) return null;
  return (
    <section className={bare ? undefined : "box"}>
      {bare ? null : <h2>Byliny, kterým se raději vyhněte</h2>}
      {bare ? <AvoidMine /> : null}
      {bare ? <h3 className="mt-4">Pro všechny</h3> : null}
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

/** Herb names as links, comma separated. */
function HerbLinks({ ks }: { ks: string[] }) {
  return (
    <>
      {ks.map((k, i) => (
        <span key={k}>
          {i ? ", " : ""}
          <SpeciesLink k={k}>{SP[k]!.cz.split(" (")[0]}</SpeciesLink>
        </span>
      ))}
    </>
  );
}

/** Top of "Interakce": the user's medicines and conditions, each with what not to combine. */
function MojeInterakce() {
  const { prof, meds, medsOther } = useApp();
  const own = ownMeds(medsOther);
  const conds = [
    ...FLAGS.map(([k, n]) => ({ k, n })),
    ...CONDS.map((c) => ({ k: c.k, n: c.n })),
  ].filter((c) => prof.has(c.k) && c.k != "leky");
  const medHits = useMemo(() => interactions(meds), [meds]);
  const empty = !meds.length && !conds.length && !own.length;
  return (
    <>
      <ZdraviLeky
        title={empty ? "Jaké léky užíváte nebo co vás trápí?" : "Vaše léky a zdraví"}
        compact
      />
      {medHits.map(({ med, items }) => {
        const rules = GUIDE.filter(
          (g) => g.rel.includes(med.k) || g.rel.some((r) => MED[r]?.k == med.k),
        );
        return (
          <section key={med.k} className="box ix-box">
            <h3>💊 {med.n}</h3>
            {items.length ? (
              <>
                <h4 className="fgrp">Byliny a houby – nekombinovat nebo opatrně</h4>
                <ul className="ix-list">
                  {items.slice(0, 12).map((x) => (
                    <li key={x.k}>
                      <SpeciesLink k={x.k}>
                        <b>{SP[x.k]!.cz.split(" (")[0]}</b>
                      </SpeciesLink>
                      <div>{x.t}</div>
                    </li>
                  ))}
                </ul>
                {items.length > 12 ? <p className="note">a dalších {items.length - 12}</p> : null}
              </>
            ) : (
              <p className="note">K tomuto léku jsme nenašli střet s bylinami v aplikaci.</p>
            )}
            {rules
              .flatMap((g) => g.rules)
              .filter((r) => !r.sp?.length || !r.sp.every((k) => items.some((i) => i.k == k)))
              .length ? (
              <>
                <h4 className="fgrp">Jídlo, pití a doplňky</h4>
                <ul className="ix-list">
                  {rules
                    .flatMap((g) => g.rules)
                    .filter((r) => !r.sp?.length || !r.sp.every((k) => items.some((i) => i.k == k)))
                    .map((r) => (
                      <li key={r.co}>
                        <IxBadge label={RULE_T[r.t][0]} cls={RULE_T[r.t][1]} />
                        <b className="ix-p">{r.co}</b>
                        <div>{r.proc}</div>
                      </li>
                    ))}
                </ul>
              </>
            ) : null}
          </section>
        );
      })}
      {own.map((t) => (
        <section key={t} className="box">
          <h3>💊 {t}</h3>
          <p className="note">
            Tento lék aplikace nezná, střety s bylinami proto nehlídáme. Zeptejte se lékárníka.
          </p>
        </section>
      ))}
      {conds.map((c) => {
        const only = new Set([c.k]);
        const ks = D.species
          .filter((x) => x.k != "houby" && warns(x.k, only).some((w) => w.hit))
          .map((x) => x.k)
          .sort((a, b) => SP[a]!.cz.localeCompare(SP[b]!.cz, "cs"));
        return (
          <section key={c.k} className="box ix-box">
            <h3>🩺 {c.n.length > 70 ? c.n.slice(0, 68) + "…" : c.n}</h3>
            {ks.length ? (
              <>
                <h4 className="fgrp">Byliny a houby, kterým se raději vyhněte</h4>
                <p>
                  <HerbLinks ks={ks.slice(0, 20)} />
                  {ks.length > 20 ? ` a dalších ${ks.length - 20}` : ""}
                </p>
              </>
            ) : (
              <p className="note">K tomu jsme nenašli byliny, kterým se vyhnout.</p>
            )}
          </section>
        );
      })}
    </>
  );
}

/** "Interakce" tab: the user's own overview, then what not to combine, absorption, detox. */
export function InterakcePage() {
  return (
    <>
      <MojeInterakce />
      <Interakce />
      <AbsGeneral />
      <Detox />
    </>
  );
}

export function Babske() {
  const { ui, setUI } = useApp();
  const f = ui.bf;
  const q = norm(ui.bs);
  const bv = BV[ui.bv] ?? null;
  const groups: Record<string, [string, string, string, string][]> = {};
  for (const t of D.trad) {
    const s = SP[t[0]];
    if (!s || (f != "vse" && s.kat != f)) continue;
    if (bv && !bv.includes(verdict(t[0], t[2])[0])) continue;
    if (
      q &&
      !norm(s.cz + " " + s.lat + " " + (s.ln || []).join(" ") + " " + t[1] + " " + t[3]).includes(q)
    )
      continue;
    (groups[t[0]] ?? (groups[t[0]] = [])).push(t);
  }
  const minOrder = (k: string) =>
    Math.min(...groups[k]!.map((t) => ORDER[verdict(t[0], t[2])[0]]!));
  const keys = Object.keys(groups).sort(
    (a, b) => minOrder(a) - minOrder(b) || SP[a]!.cz.localeCompare(SP[b]!.cz, "cs"),
  );

  return (
    <>
      <section className="box">
        <h2>Babské léčitelství</h2>
        <p>Co používaly naše babičky a lidoví léčitelé – a co na to říká dnešní věda.</p>
        <div className="ask">
          <input
            value={ui.bs}
            onChange={(e) => setUI({ bs: e.target.value })}
            placeholder="Hledat rostlinu nebo potíž, např. heřmánek, kašel"
            aria-label="Hledat v babských radách"
          />
        </div>
        <div className="chips">
          {CATS.map((x) => (
            <button
              key={x[0]}
              type="button"
              className="chip"
              aria-pressed={f == x[0]}
              onClick={() => setUI({ bf: x[0] })}
            >
              {x[1]}
            </button>
          ))}
        </div>
        <div className="seg">
          <span className="note">Co na to věda:</span>
          {VERD.map((x) => (
            <button
              key={x[0]}
              type="button"
              className="chip sm"
              aria-pressed={ui.bv == x[0]}
              onClick={() => setUI({ bv: x[0] })}
            >
              {x[1]}
            </button>
          ))}
        </div>
        <p className="note">{keys.length} rostlin</p>
      </section>
      {!q && f == "vse" && ui.bv == "vse" ? (
        <>
          <AbsGeneral />
          <Interakce />
          <Detox />
        </>
      ) : null}
      {keys.map((k) => {
        const s = SP[k]!;
        const ts = [...groups[k]!].sort(
          (a, b) => ORDER[verdict(a[0], a[2])[0]]! - ORDER[verdict(b[0], b[2])[0]]!,
        );
        return (
          <article key={k} className="box">
            <Who s={s} />
            <div className="uses">
              {ts.map((t, i) => (
                <UseItem key={i} t={t} />
              ))}
            </div>
          </article>
        );
      })}
      {!keys.length ? (
        <div className="box">
          <p>Nic nenalezeno.</p>
        </div>
      ) : null}
      {f == "vse" || f == "bylina" ? (
        <>
          <Avoid q={q} />
          <Jedovate q={q} />
        </>
      ) : null}
    </>
  );
}
