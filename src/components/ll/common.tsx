import { Fragment, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { D, GL, SP, STL, U, best, grade, hasFlag, slug, type Warn } from "@/lib/ll/data";
import { drugLabel, pharmacyText, whenHowOften } from "@/lib/ll/display";
import { scrollToAnchor } from "@/lib/ll/jump";
import { photo, photoUrl } from "@/lib/ll/photos";
import { useApp } from "@/lib/ll/store";
import type { AbsItem, Grade, IxItem, Species, Study, Use } from "@/lib/ll/types";

export const cap1 = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

export function Pill({ g }: { g: Grade }) {
  return <span className={`pill g${g}`}>{GL[g]}</span>;
}

export function Thumb({ s, nozoom }: { s: Species; nozoom?: boolean }) {
  const p = photo(s.k);
  return p ? (
    <img
      className="thumb"
      data-zoom={nozoom ? undefined : (photoUrl(s.k, "1") ?? p)}
      src={p}
      alt=""
      loading="lazy"
      width={56}
      height={56}
    />
  ) : null;
}

export function SpeciesLink({
  k,
  children,
  className,
  "aria-label": ariaLabel,
}: {
  k: string;
  children: React.ReactNode;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <Link to="/atlas/$druh" params={{ druh: slug(k) }} className={className} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}

/** Species avatar + Czech and Latin name, linked to the detail page. */
export function Who({
  s,
  sub,
  picLink,
  extra,
  after,
}: {
  s: Species;
  sub?: React.ReactNode;
  picLink?: boolean;
  extra?: React.ReactNode;
  after?: React.ReactNode;
}) {
  return (
    <div className="who">
      {picLink ? (
        <SpeciesLink k={s.k} className="who-pic" aria-label={`${s.cz} – přehled v atlasu`}>
          <Thumb s={s} nozoom />
        </SpeciesLink>
      ) : (
        <Thumb s={s} />
      )}
      <div>
        <h3>
          <SpeciesLink k={s.k}>{s.cz}</SpeciesLink>
          {after ? <> {after}</> : null}
        </h3>
        <div className="lat">{sub ?? s.lat}</div>
        {extra}
      </div>
    </div>
  );
}

export function GeneralAlerts() {
  const { prof } = useApp();
  return (
    <>
      {D.general
        .filter((g) => hasFlag(prof, g[0]))
        .map((g) => (
          <div key={g[0]} className="alert warn">
            <b>Z vašeho profilu:</b> {g[1]}
          </div>
        ))}
    </>
  );
}

export function DoiLink({ doi, label = "zdroj" }: { doi?: string | undefined; label?: string }) {
  if (!doi) return null;
  return (
    <a href={`https://doi.org/${doi}`} target="_blank" rel="noopener">
      {label}
    </a>
  );
}

export function StudyItem({ s }: { s: Study }) {
  return (
    <div className="study">
      <div>{s.s}</div>
      <div className="meta">
        {STL[s.st] || "výzkum"}
        {s.y ? " · " + s.y : ""}
        {s.doi ? (
          <>
            {" · "}
            <DoiLink doi={s.doi} />
          </>
        ) : null}
      </div>
    </div>
  );
}

export function HowShort({ k }: { k: string }) {
  const u = U(k);
  if (!u) return null;
  return (
    <div className="howto">
      <div>
        <span>Nejlépe</span>
        {u[0]}
      </div>
      <div>
        <span>Kdy a jak často</span>
        {whenHowOften(u)}
      </div>
    </div>
  );
}

export const FBUY = ["kapsle", "extrakt", "tinktura", "sirup", "prasek", "olej"];
export const FICON: Record<string, string> = {
  caj: "🍵",
  odvar: "🫖",
  odvarb: "🫖",
  tinkb: "💧",
  tinktura: "💧",
  zevne: "🩹",
  sirup: "🥄",
  koreni: "🧂",
  kapsle: "💊",
  extrakt: "💊",
  olej: "🫒",
  prasek: "🥄",
  jidlo: "🥗",
};

export function gotoForm(id: string) {
  scrollToAnchor(id);
}

export function FormChips({ s }: { s: Species }) {
  if (!s.formy || !s.formy.length) return null;
  return (
    <div className="fchips">
      {s.formy.map((f) => (
        <button key={f} type="button" className="fchip" onClick={() => gotoForm("f-" + f)}>
          {FICON[f] || "•"} {D.forms[f]?.[0]}
        </button>
      ))}
    </div>
  );
}

export function FormRow({ f, anchor }: { f: string; anchor?: boolean }) {
  const F = D.forms[f];
  if (!F) return null;
  return (
    <div className={anchor ? "row frow" : "row stack"} id={anchor ? `f-${f}` : undefined}>
      <b>
        {anchor && FICON[f] ? FICON[f] + " " : ""}
        {F[0]}.
      </b>{" "}
      {F[1]}
      <div className="note mt-1">
        <b>Vstřebání:</b> {F[2]} <b>Kdy:</b> {F[3]}
      </div>
    </div>
  );
}

/** Preparation forms split into "buy ready-made" and "prepare at home", with scroll anchors. */
export function FormsSplit({ s }: { s: Species }) {
  const fb = s.formy.filter((f) => FBUY.includes(f));
  const fh = s.formy.filter((f) => !FBUY.includes(f));
  return (
    <>
      {fb.length ? (
        <>
          <h4 className="fgrp">Koupit hotové</h4>
          <div className="rows">
            {fb.map((f) => (
              <FormRow key={f} f={f} anchor />
            ))}
          </div>
        </>
      ) : null}
      {fh.length ? (
        <>
          <h4 className="fgrp">Připravit doma</h4>
          <div className="rows">
            {fh.map((f) => (
              <FormRow key={f} f={f} anchor />
            ))}
          </div>
        </>
      ) : null}
    </>
  );
}

export function FormsList({ s }: { s: Species }) {
  return (
    <div className="rows">
      {s.formy.map((f) => (
        <FormRow key={f} f={f} />
      ))}
    </div>
  );
}

/* ---------- traditional (folk) uses with the science verdict ---------- */
export function verdict(sp: string, tp: string): [string, string] {
  const g = grade(sp, tp);
  return g == "S"
    ? ["gS", "Doloženo mnoha studiemi na lidech"]
    : g == "A"
      ? ["gA", "Studie to podporují"]
      : g == "B"
        ? ["gB", "První studie to naznačují"]
        : g == "C"
          ? ["gM", "Zatím jen pokusy v laboratoři"]
          : ["gN", "Studie to zatím nepotvrdily"];
}

export function UseItem({ t }: { t: [string, string, string, string] }) {
  const v = verdict(t[0], t[2]);
  const g = grade(t[0], t[2]);
  const b = g && g != "C" ? best(t[0], t[2]) : undefined;
  return (
    <div className={`use ${v[0]}`}>
      <div className="uh">
        <b>{cap1(t[3])}</b>
        <span className={`pill ${v[0]}`}>{v[1]}</span>
      </div>
      <p>
        <b>Tradičně:</b> {t[1]}
      </p>
      {b ? (
        <p className="note">
          <b>Co naznačují studie:</b> {b.s}
        </p>
      ) : (
        <p className="note">
          <b>Co na to studie:</b>{" "}
          {v[0] == "gM"
            ? "Příznivý účinek se ukázal jen v laboratoři nebo u zvířat, u lidí ho zatím nikdo neověřil."
            : "V naší databázi k tomu zatím není studie s lidmi s příznivým výsledkem. Neznamená to, že rada nefunguje – jen ji věda zatím nepotvrdila."}
        </p>
      )}
    </div>
  );
}

const ABS_ICON: Record<string, string> = { p: "✓", n: "✗", m: "≈", r: "!" };

export function AbsList({
  items,
  labels,
  fallback,
}: {
  items: AbsItem[];
  labels: Record<string, string>;
  fallback: string;
}) {
  return (
    <ul className="abs">
      {items.map((x, i) => (
        <li key={i}>
          <b>{ABS_ICON[x.d] || "•"}</b> {x.s}{" "}
          <span className="note">
            ({labels[x.st] || fallback}
            {x.y ? ", " + x.y : ""}
            {x.doi ? (
              <>
                , <DoiLink doi={x.doi} />
              </>
            ) : null}
            )
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Interaction badges: what a combination does according to studies. */
export const IX_T: Record<string, [string, string]> = {
  Z: ["zesiluje účinek", "ix-z"],
  O: ["oslabuje účinek", "ix-o"],
  V: ["snižuje vstřebávání", "ix-v"],
  L: ["zlepšuje vstřebávání", "ix-l"],
  R: ["riziko", "ix-r"],
  N: ["bez významné interakce", "ix-n"],
};
/** Short explanation shown after tapping an interaction label. */
const IX_EXPLAIN: Record<string, string> = {
  "zesiluje účinek":
    "Bylina působí podobně jako lék, nebo zpomalí jeho odbourávání. Účinek léku je pak silnější, než má být – třeba větší sklon ke krvácení nebo příliš nízký tlak či cukr.",
  "oslabuje účinek":
    "Bylina urychlí odbourávání léku v játrech nebo působí proti němu. Lék pak nemusí fungovat – třeba antikoncepce nebo léky na ředění krve.",
  riziko:
    "Kombinace může přímo uškodit, třeba prudce zvýšit tlak nebo vyvolat serotoninový syndrom. Nekombinujte.",
  "snižuje vstřebávání":
    "Látky se ve střevě navážou na sebe a do krve se dostane méně. Většinou pomůže odstup 2–4 hodiny.",
  "zlepšuje vstřebávání": "Kombinace pomáhá, aby se do těla dostalo víc účinné látky.",
  "bez významné interakce": "Studie nenašly, že by se bylina a lék výrazně ovlivňovaly.",
  doporučení: "Praktická rada, jak bylinu nebo lék užívat.",
};

/** Interaction label that explains itself when tapped. */
export function IxBadge({ label, cls }: { label: string; cls: string }) {
  const [open, setOpen] = useState(false);
  const ex = IX_EXPLAIN[label];
  return (
    <>
      <button
        type="button"
        className={`ix-badge ${cls}${ex ? " ix-tap" : ""}`}
        aria-expanded={ex ? open : undefined}
        onClick={(e) => {
          e.stopPropagation();
          if (ex) setOpen((v) => !v);
        }}
      >
        {label}
        {ex ? " ⓘ" : ""}
      </button>
      {open && ex ? (
        <span className="ix-explain">
          {ex} Než začnete bylinu užívat s léky, poraďte se s lékárníkem nebo lékařem.
        </span>
      ) : null}
    </>
  );
}

const IX_ST: Record<string, string> = {
  clinical_trial: "studie na lidech",
  meta_analysis: "přehledová studie",
  systematic_review: "přehledová studie",
  observational: "pozorování lidí",
  case_report: "popsaný případ",
  review: "přehled",
  animal: "pokus na zvířatech",
  in_vitro: "laboratoř",
};

/** List of interaction findings; showSp adds the herb names (general overview). */
export function IxList({ items, showSp }: { items: IxItem[]; showSp?: boolean }) {
  return (
    <ul className="ix-list">
      {items.map((x, i) => {
        const t = IX_T[x.t];
        const names = showSp ? (x.sp || []).map((k) => SP[k]?.cz).filter(Boolean) : [];
        return (
          <li key={i}>
            {t ? <IxBadge label={t[0]} cls={t[1]} /> : null}
            {x.p ? <b className="ix-p">{cap1(drugLabel(x.p))}</b> : null}
            {names.length ? <span className="note"> · {names.join(", ")}</span> : null}
            <div>{x.s}</div>
            <span className="note">
              ({IX_ST[x.st] || "studie"}
              {x.y ? ", " + x.y : ""}
              {x.doi ? (
                <>
                  , <DoiLink doi={x.doi} />
                </>
              ) : null}
              )
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** One herb warning; medicine clashes name the medicine, profile hits say "Pro vás nevhodné". */
export function WarnAlert({ w, plain }: { w: Warn; plain?: boolean }) {
  if (w.hit)
    return (
      <div className={`alert ${w.meds?.length ? "ix-warn" : "crit"}`}>
        {w.meds?.length ? "⚠️ " : null}
        <b>
          {w.meds?.length
            ? `Možný střet s lékem ${w.meds.join(", ")}:`
            : plain
              ? "Týká se vás:"
              : "Pro vás nevhodné:"}
        </b>{" "}
        {w.t}
        {w.meds?.length ? " Poraďte se s lékárníkem nebo lékařem." : ""}
      </div>
    );
  return (
    <div className="alert warn">
      {w.soft ? <b>Užíváte léky: </b> : plain ? null : <b>Pozor: </b>}
      {w.t}
    </div>
  );
}

/** "Jak používat" panel: forms as icons plus how, when and how often – visually set apart in the advisor. */
export function HowToUse({ s, u, noForms }: { s: Species; u: Use; noForms?: boolean }) {
  const n = D.sukl?.sp[s.k]?.length ?? 0;
  return (
    <div className="howuse">
      <div className="howuse-top">
        <div className="howuse-h">Doporučené podání:</div>
        {!noForms && s.formy && s.formy.length ? (
          <div className="howuse-forms" aria-label="Možné formy">
            {s.formy.slice(0, 5).map((f) => (
              <span key={f} className="hu-form">
                <span aria-hidden="true">{FICON[f] || "•"}</span> {D.forms[f]?.[0]}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <dl className="howuse-dl">
        <dt>Forma užití</dt>
        <dd>{u[0]}</dd>
        {u[1] || u[2] ? (
          <>
            <dt>Kdy a jak často</dt>
            <dd>{whenHowOften(u)}</dd>
          </>
        ) : null}
      </dl>
      {noForms ? null : <PharmacyBadge k={s.k} />}
    </div>
  );
}

const VYDEJ: Record<string, string> = {
  F: "bez receptu",
  V: "bez receptu s omezením",
  R: "na recept",
};

/** "Můj seznam" toggle: signed in → star button; signed out → invitation to sign in; loading → nothing. */
/** Round tick toggle used by "Mám doma" and "Chci pěstovat" (empty circle → green circle with a tick). */
function TickToggle({
  on,
  label,
  title,
  sm,
  onToggle,
}: {
  on: boolean;
  label: string;
  title: string;
  sm?: boolean | undefined;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className={`tick-btn${on ? " on" : ""}${sm ? " sm" : ""}`}
      aria-pressed={on}
      title={title}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
    >
      <span className="tick" aria-hidden="true">
        {on ? "✓" : ""}
      </span>
      {label}
    </button>
  );
}

/** "Mám doma" toggle (browser list, works signed out); the list is shown in Zahrádka and the profile. */
export function DomaButton({ k, sm }: { k: string; sm?: boolean | undefined }) {
  const { doma, toggleDoma } = useApp();
  const on = doma.includes(k);
  return (
    <TickToggle
      on={on}
      sm={sm}
      label="Mám doma"
      title={on ? "Odebrat ze seznamu Mám doma" : "Přidat do seznamu Mám doma"}
      onToggle={() => toggleDoma(k)}
    />
  );
}

/** "Chci pěstovat" toggle – adds the herb to Zahrádka as "Budu pěstovat"; only for herbs grown here. */
export function GrowButton({ k, sm }: { k: string; sm?: boolean | undefined }) {
  const { vys, setVys } = useApp();
  if (!D.garden[k]) return null;
  const on = !!vys[k];
  return (
    <TickToggle
      on={on}
      sm={sm}
      label="Chci pěstovat"
      title={on ? "Odebrat ze Zahrádky" : "Přidat do Zahrádky jako Budu pěstovat"}
      onToggle={() =>
        setVys((p) => {
          const n = { ...p };
          if (n[k]) delete n[k];
          else n[k] = { stav: "plan", od: new Date().toISOString().slice(0, 10) };
          return n;
        })
      }
    />
  );
}

/** Both toggles side by side. */
export function MineButtons({ k, sm }: { k: string; sm?: boolean }) {
  return (
    <span className="mine-btns">
      <DomaButton k={k} sm={sm} />
      <GrowButton k={k} sm={sm} />
    </span>
  );
}

/** Pharmacy badge: in which forms registered medicines (SÚKL) with the plant are sold. */
export function PharmacyBadge({ k }: { k: string }) {
  const t = pharmacyText(k);
  if (!t) return null;
  return (
    <SpeciesLink k={k} className="pharm-badge">
      💊 {t}
    </SpeciesLink>
  );
}

/** Registered medicines containing this plant (SÚKL open data), neutral list without ranking. */
export function SuklProducts({ k, bare }: { k: string; bare?: boolean }) {
  const list = D.sukl?.sp[k];
  if (!list || !list.length) return null;
  const single = list.filter((p) => !p.combo);
  const combo = list.filter((p) => p.combo);
  const row = (p: (typeof list)[number]) => (
    <div key={p.kod} className="row stack">
      <b>{p.n}</b> <span className="note">{p.dop}</span>
      <div className="note">
        {VYDEJ[p.v] ?? p.v}
        {p.combo ? ` · složení: ${p.latky.map((l) => l.toLowerCase()).join(", ")}` : ""}
      </div>
    </div>
  );
  return (
    <section className={bare ? undefined : "box"}>
      {bare ? null : <h3>Registrovaná léčiva v ČR</h3>}
      <p className="note">
        Přípravky s touto rostlinou, které schválil Státní ústav pro kontrolu léčiv. Seřazeno
        abecedně, nejde o doporučení konkrétní značky. Před užitím si přečtěte příbalový leták nebo
        se poraďte s lékárníkem.
      </p>
      {single.length ? (
        <>
          <h4 className="fgrp">Jen tato rostlina ({single.length})</h4>
          <div className="rows">{single.map(row)}</div>
        </>
      ) : null}
      {combo.length ? (
        <details>
          <summary>Směsi s dalšími rostlinami ({combo.length})</summary>
          <div className="rows">{combo.map(row)}</div>
        </details>
      ) : null}
      <p className="note">
        Zdroj: SÚKL, databáze léčivých přípravků (otevřená data), stav k{" "}
        {D.sukl!.stav.split("-").reverse().join(". ").replace(/^0/, "")}.
      </p>
    </section>
  );
}

/**
 * A wrapped row of chips in priority order, but with a later chip pulled up when it fits the space
 * left on a row; the chips then stretch so no row ends with an empty gap on the right.
 */
export function PackedChips({
  items,
  tail,
  className = "chips",
}: {
  items: { k: string; el: React.ReactNode }[];
  tail?: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const sig = items.map((i) => i.k).join("|");
  const [packed, setPacked] = useState<{ sig: string; order: string[] } | null>(null);
  const order = packed?.sig == sig ? packed.order : null;
  useEffect(() => {
    if (order) return;
    const el = ref.current;
    if (!el) return;
    const W = el.clientWidth;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 8;
    const w = [...el.children].slice(0, items.length).map((c) => (c as HTMLElement).offsetWidth);
    const used = new Set<number>();
    const out: number[] = [];
    for (let i = 0; i < items.length; i++) {
      if (used.has(i)) continue;
      used.add(i);
      out.push(i);
      let rem = W - w[i]!;
      for (let j = i + 1; j < items.length && j < i + 8; j++)
        if (!used.has(j) && w[j]! + gap <= rem) {
          used.add(j);
          out.push(j);
          rem -= w[j]! + gap;
        }
    }
    setPacked({ sig, order: out.map((i) => items[i]!.k) });
  }, [order, sig, items]);
  const byK = new Map(items.map((i) => [i.k, i.el]));
  const ks = order ?? items.map((i) => i.k);
  return (
    <div ref={ref} className={`${className}${order ? " fill" : ""}`}>
      {ks.map((k) => (
        <Fragment key={k}>{byK.get(k)}</Fragment>
      ))}
      {tail}
    </div>
  );
}
