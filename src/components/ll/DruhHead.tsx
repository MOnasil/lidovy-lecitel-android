import { useState } from "react";
import { D, GL, HUM, SP, TOP, grade, score, studies, type Warn } from "@/lib/ll/data";
import { ABSORB } from "@/lib/ll/absorb";
import {
  PRICE_KC,
  growInfo,
  pharmacyItems,
  pharmacyText,
  whenHowOften,
  type PharmItem,
} from "@/lib/ll/display";
import { hasPhoto, photoUrl } from "@/lib/ll/photos";
import type { Grade, Species } from "@/lib/ll/types";
import { FBUY, FICON, MineButtons, StudyItem, gotoForm } from "./common";
import { scrollToAnchor } from "@/lib/ll/jump";

/** Background tint of each form icon (light, matches the Poradce chips). */
const FCOLOR: Record<string, string> = {
  caj: "#FAEEDA",
  odvar: "#FAEEDA",
  odvarb: "#FAEEDA",
  tinkb: "#E6F1FB",
  tinktura: "#E6F1FB",
  zevne: "#E1F5EE",
  sirup: "#FBEAF0",
  koreni: "#FAECE7",
  kapsle: "#EEEDFE",
  extrakt: "#EEEDFE",
  olej: "#EAF3DE",
  prasek: "#FAECE7",
  jidlo: "#EAF3DE",
};

/** Short label of a form for the round icons. */
export const FSHORT: Record<string, string> = {
  caj: "Nálev",
  odvar: "Odvar",
  odvarb: "Odvar",
  tinkb: "Tinktura",
  tinktura: "Tinktura",
  zevne: "Zevně",
  sirup: "Sirup",
  koreni: "Koření",
  kapsle: "Kapsle",
  extrakt: "Extrakt",
  olej: "Silice",
  prasek: "Prášek",
  jidlo: "Jídlo",
};

/** How well a form gets into the body: 3 = good, 2 = medium, 1 = mostly local effect. */
const FABS: Record<string, [number, string]> = {
  kapsle: [3, "Vstřebání dobré"],
  extrakt: [3, "Vstřebání dobré"],
  tinkb: [3, "Vstřebání dobré"],
  tinktura: [3, "Vstřebání dobré"],
  caj: [2, "Vstřebání střední"],
  odvar: [2, "Vstřebání střední"],
  odvarb: [2, "Vstřebání střední"],
  sirup: [2, "Vstřebání střední"],
  koreni: [2, "Vstřebá se s jídlem"],
  jidlo: [2, "Vstřebá se s jídlem"],
  prasek: [2, "Vstřebání střední"],
  olej: [1, "Působí hlavně v místě použití"],
  zevne: [1, "Působí hlavně v místě použití"],
};

export const TICON: Record<string, string> = {
  unava: "⚡",
  stres: "😌",
  spanek: "🌙",
  alergie: "🤧",
  imunita: "🛡️",
  plice: "🫁",
  traveni: "🍽️",
  hlava: "🤕",
  klouby: "🦴",
  kuze: "🩹",
  srdce: "❤️",
  cukr: "🩸",
  pamet: "🧠",
  zeny: "♀️",
  muzi: "♂️",
  ledviny: "💧",
  jatra: "🫀",
  zuby: "🦷",
  onko: "🎗️",
};

const GCLS: Record<Grade, string> = { S: "ev-s", A: "ev-a", B: "ev-b", C: "ev-c" };
const GDOTS: Record<Grade, number> = { S: 3, A: 2, B: 1, C: 0 };
const GWORD: Record<Grade, string> = {
  S: "silně doloženo",
  A: "doloženo",
  B: "první důkazy",
  C: "jen laboratoř",
};
/** Topic tiles shown before "Další účinky". */
const TOP_N = 5;
const MONTHS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

function plural(n: number, one: string, few: string, many: string) {
  return n == 1 ? one : n < 5 ? few : many;
}

/** Photo with up to three thumbnails; tapping the big photo zooms it. */
function HeadPic({ k }: { k: string }) {
  const [img, setImg] = useState(0);
  const s = SP[k]!;
  // only photos that really exist (have a URL) are offered
  const files = (D.ph[k] ?? []).map((_, j) => String(j + 1)).filter((f) => photoUrl(k, f));
  if (!files.length || !hasPhoto(k)) return null;
  const i = Math.min(img, files.length - 1);
  const big = photoUrl(k, files[i]!)!;
  return (
    <div
      className="hd-picw"
      data-gallery={JSON.stringify(
        files.map((f, j) => {
          const c = D.ph[k]?.[j];
          // the credit (author, licence) is shown in the enlarged view only
          return { s: photoUrl(k, f), a: c?.a ?? "", l: c?.l ?? "", p: c?.p ?? "" };
        }),
      )}
    >
      <a href={big} data-zoom={big} className="hd-pic">
        <img src={big} alt={s.cz} width={300} height={300} />
        <span className="hd-info" aria-hidden="true">
          ⓘ
        </span>
        {files.length > 1 ? (
          <span className="hd-cnt">
            {i + 1}/{files.length}
          </span>
        ) : null}
      </a>
      {files.length > 1 ? (
        <div className="hd-gal">
          {files.slice(0, 3).map((f, j) => (
            <button
              key={f}
              type="button"
              aria-pressed={j == i}
              aria-label={`Fotka ${j + 1}`}
              onClick={() => setImg(j)}
            >
              <img src={photoUrl(k, f)!} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** Longer description: first sentence visible, the rest behind "více ▾". */
function MoreText({ t }: { t: string }) {
  return <p className="hd-more">{t}</p>;
}

/** Photo credit line (required by the photo licences). */
export function PhotoCredit({ k }: { k: string }) {
  const p = D.ph[k]?.[0];
  if (!p || !hasPhoto(k)) return null;
  return (
    <p className="hd-credit">
      ©{" "}
      <a href={p.p} target="_blank" rel="noopener" title="Fotka na Wikimedia Commons">
        {p.a}
      </a>
      ,{" "}
      {p.lu ? (
        <a href={p.lu} target="_blank" rel="noopener">
          {p.l}
        </a>
      ) : (
        p.l
      )}
    </p>
  );
}

/** Price and growing-in-Czechia mini tiles under the photo. */
function HeadFacts({ k }: { k: string }) {
  const u = D.use[k];
  const gi = growInfo(k);
  if (!u) return null;
  return (
    <div className="hd-facts">
      <div className="hd-fact">
        <span className="tile-h">👛 Cena za měsíc</span>
        <b>{PRICE_KC[u[3]] ?? D.price[u[3]]}</b>
        <small>{pharmacyText(k) ?? u[4]}</small>
      </div>
      {gi ? (
        gi.lvl != "N" && D.garden[k] ? (
          <button
            type="button"
            className="hd-fact hd-fact-btn"
            onClick={() => scrollToAnchor("pestovani")}
          >
            <span className="tile-h">🌱 Pěstování v ČR ›</span>
            <b className={`gl-${gi.lvl}`}>{gi.label}</b>
            <small>{gi.text}</small>
          </button>
        ) : (
          <div className="hd-fact">
            <span className="tile-h">🌱 Pěstování v ČR</span>
            <b className={`gl-${gi.lvl}`}>{gi.label}</b>
            <small>{gi.text}</small>
          </div>
        )
      ) : null}
    </div>
  );
}

/** Coloured form icons (tea, capsules…): one column up to 3 forms, two columns from 4. */
export function FormIcons({
  s,
  jump,
  onPick,
}: {
  s: Species;
  jump?: boolean;
  /** Clicking a form opens something else (e.g. the detail page at that form). */
  onPick?: (f: string) => void;
}) {
  if (!s.formy || !s.formy.length) return null;
  const fs = [...s.formy].sort((a, b) => (FABS[b]?.[0] ?? 2) - (FABS[a]?.[0] ?? 2)).slice(0, 6);
  return (
    <div className="hd-forms">
      <div className="hd-forms-h">Podání</div>
      <div className={`hd-fgrid ${fs.length > 3 ? "c2" : "c1"}`}>
        {fs.map((f) => {
          const inner = (
            <>
              <span
                className="hd-fo"
                style={{ background: FCOLOR[f] || "#F1EFE8" }}
                aria-hidden="true"
              >
                {FICON[f] || "•"}
              </span>
              {FSHORT[f] || D.forms[f]?.[0]}
            </>
          );
          return jump || onPick ? (
            <button
              key={f}
              type="button"
              className="hd-f"
              onClick={(e) => {
                e.stopPropagation();
                if (onPick) onPick(f);
                else gotoForm("f-" + f);
              }}
            >
              {inner}
            </button>
          ) : (
            <span key={f} className="hd-f">
              {inner}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/** Header card: photo, name, Latin name, short description, coloured form icons, when and how often. */
export function HeadCard({ s, extra }: { s: Species; extra?: React.ReactNode }) {
  const u = D.use[s.k];
  return (
    <section className="hd card-l">
      <h2 className="hd-name">{s.cz}</h2>
      <div className="hd-sub">
        <span className="hd-lat">{s.lat}</span>
        <MineButtons k={s.k} />
      </div>
      <div className="hd-row">
        {hasPhoto(s.k) ? (
          <div className="hd-picc">
            <HeadPic k={s.k} />
          </div>
        ) : null}
        <div className="hd-txt">
          <p className="hd-desc">{s.popis}</p>
          {s.ln && s.ln.length ? <p className="hd-ln">Lidově: {s.ln.join(", ")}</p> : null}
        </div>
        <FormIcons s={s} jump />
      </div>
      {D.zaj?.[s.k] ? <MoreText t={D.zaj[s.k]!} /> : null}
      <HeadFacts k={s.k} />
      {u && (u[1] || u[2]) ? (
        <div className="hd-when">
          <span aria-hidden="true">🕒</span> {whenHowOften(u)}
        </div>
      ) : null}
      {extra}
    </section>
  );
}

/** "What it helps with and how well it is backed by studies" – one tile per topic. */
export function EvidenceCard({ k }: { k: string }) {
  const gs = TOP.map((t) => [t, grade(k, t.k)] as const)
    .filter((x): x is readonly [(typeof TOP)[number], Grade] => x[1] != null)
    .sort((a, b) => score(k, b[0].k) - score(k, a[0].k));
  if (!gs.length) return null;
  const sure = gs.filter((x) => x[1] != "C");
  const less = gs.filter((x) => x[1] == "C");
  const tile = (t: (typeof TOP)[number], g: Grade) => {
    const st = studies(k, t.k).filter((x) => x.d == "p");
    const hum = st.filter((x) => HUM.includes(x.st));
    const meta = hum.filter((x) => x.st == "meta_analysis" || x.st == "systematic_review").length;
    const ppl = hum.length - meta;
    const dose = hum.find((x) => x.dose)?.dose;
    const detail =
      g == "C"
        ? `Zatím jen laboratoř a zvířata · ${st.length} ${plural(st.length, "studie", "studie", "studií")}`
        : `${GL[g]} · ${ppl} ${plural(ppl, "studie", "studie", "studií")} na lidech${
            meta
              ? `, ${meta} ${plural(meta, "přehledová studie", "přehledové studie", "přehledových studií")}`
              : ""
          }`;
    const all = studies(k, t.k)
      .filter((x) => x.d == "p" || x.d == "m")
      .sort(
        (a, b) =>
          Number(HUM.includes(b.st)) - Number(HUM.includes(a.st)) || (b.y ?? 0) - (a.y ?? 0),
      );
    return (
      <details key={t.k} className="ev-d">
        <summary className={`ev ${GCLS[g]}`}>
          <span className="ev-ic" aria-hidden="true">
            {TICON[t.k] || "🌿"}
          </span>
          <div className="ev-t">
            <b>{t.n}</b>
            <small>{detail}</small>
            {dose ? <small className="ev-dose">Ve studiích: {dose}</small> : null}
          </div>
          <span className="ev-strength">
            <span className="ev-dots" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <i key={i} className={i < GDOTS[g] ? "on" : ""} />
              ))}
            </span>
            <span className="ev-word">{GWORD[g]}</span>
          </span>
        </summary>
        <div className="ev-src">
          {all.length ? (
            all.slice(0, 25).map((x) => <StudyItem key={x.i} s={x} />)
          ) : (
            <p className="note">Zdroje k tomuto účinku zatím nemáme.</p>
          )}
          {all.length > 25 ? (
            <p className="note">a dalších {all.length - 25} ve Studiích níže</p>
          ) : null}
        </div>
      </details>
    );
  };
  return (
    <section className="card-l">
      <h3 className="cl-h">Na co pomáhá a jak je to doloženo</h3>
      {sure.length ? (
        sure.slice(0, TOP_N).map((x) => tile(x[0], x[1]))
      ) : (
        <p className="note">Zatím bez použití testovaného na lidech.</p>
      )}
      {sure.length > TOP_N || (sure.length && less.length) ? (
        <details>
          <summary>
            Další účinky ({sure.length - Math.min(sure.length, TOP_N) + less.length})
          </summary>
          {sure.slice(TOP_N).map((x) => tile(x[0], x[1]))}
          {less.map((x) => tile(x[0], x[1]))}
        </details>
      ) : null}
      {!sure.length ? less.slice(0, 4).map((x) => tile(x[0], x[1])) : null}
    </section>
  );
}

/** One 12-month bar: sowing and harvest in two colours, a diagonal split when both fall in one month. */
export function MonthBar({ sow, harvest }: { sow: number[]; harvest: number[] }) {
  return (
    <div className="mbar" role="img" aria-label="Kalendář setí a sklizně">
      {MONTHS.map((n, i) => {
        const v = sow.includes(i + 1);
        const h = harvest.includes(i + 1);
        return (
          <span key={n} className={v && h ? "b" : v ? "v" : h ? "s" : ""} title={MON_NAMES[i]}>
            {n}
          </span>
        );
      })}
    </div>
  );
}
const MON_NAMES = [
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

export function MonthLegend() {
  return (
    <p className="mleg">
      <i className="v" /> zasít &nbsp; <i className="s" /> sklízet &nbsp; <i className="b" /> obojí
    </p>
  );
}

/** When to sow and harvest in one row – shown only for herbs that can be grown in Czechia. */
export function MonthCard({ k }: { k: string; fungus?: boolean }) {
  const g = D.garden[k];
  const gi = growInfo(k);
  if (!g || !gi || gi.lvl == "N") return null;
  const sow = g[4];
  const harvest = g[5].length ? g[5] : D.months[k] || [];
  if (!sow.length && !harvest.length) return null;
  return (
    <section className="card-l">
      <h3 className="cl-h">Kdy zasít a kdy sklízet</h3>
      <MonthBar sow={sow} harvest={harvest} />
      <MonthLegend />
      {g[6] ? <p className="mleg">Sklízí se: {g[6]}</p> : null}
    </section>
  );
}

/** Growing + price tiles, absorption meter and the warning tile. */
export function FactTiles({ k, w, risks }: { k: string; w: Warn[]; risks: number }) {
  const ab = ABSORB[k];
  const lvl = ab ? (ab.v == "dobrá" ? 3 : ab.v == "střední" ? 2 : 1) : 0;
  const nWarn = w.length + (risks ? 1 : 0);
  return (
    <>
      {ab ? (
        <section className="card-l">
          <h3 className="cl-h">Vstřebatelnost</h3>
          <div className={`ameter a${lvl}`} aria-label={ab.v}>
            <i />
            <i />
            <i />
          </div>
          <p className="ab-t">
            <b>{ab.v.charAt(0).toUpperCase() + ab.v.slice(1)}</b> · {ab.s}
          </p>
          {ab.k ? (
            <p className="ab-t">
              <b>S čím kombinovat:</b> {ab.k}
            </p>
          ) : null}
        </section>
      ) : null}
      {nWarn ? (
        <button type="button" className="card-l warn-tile" onClick={() => scrollToAnchor("pozor")}>
          <span aria-hidden="true">⚠️</span>
          <span>
            <b>Pozor ({nWarn})</b>
            <small>
              {w
                .slice(0, 2)
                .map((x) => x.t.split(/[.–]/)[0]!.trim())
                .join(" · ") || "Rizika popsaná ve studiích"}
            </small>
          </span>
        </button>
      ) : null}
    </>
  );
}

/** "Možnosti použití a jak se vstřebají": forms split into buy / make at home, each with an absorption meter. */
export function FormsAbsorb({ s }: { s: Species }) {
  const byAbs = (a: string, b: string) => (FABS[b]?.[0] ?? 2) - (FABS[a]?.[0] ?? 2);
  const ph = pharmacyItems(s.k, s.formy);
  const fb = s.formy.filter((f) => FBUY.includes(f)).sort(byAbs);
  const fh = s.formy.filter((f) => !FBUY.includes(f)).sort(byAbs);
  const item = (f: string) => {
    const F = D.forms[f];
    if (!F) return null;
    const a = FABS[f] ?? [2, "Vstřebání střední"];
    return (
      <div key={f} className="fa" id={`f-${f}`}>
        <span className="hd-fo" style={{ background: FCOLOR[f] || "#F1EFE8" }} aria-hidden="true">
          {FICON[f] || "•"}
        </span>
        <div>
          <b className="fa-n">{F[0]}</b>
          <p>{F[1]}</p>
          <div className="fa-ab">
            <span className={`ameter sm a${a[0]}`} aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span className={`fa-pill a${a[0]}`}>{a[1]}</span>
          </div>
          <p className="fa-note">
            {F[2]} <b>Kdy:</b> {F[3]}
          </p>
          <PharmList items={ph.filter((x) => x.form == f)} />
        </div>
      </div>
    );
  };
  const other = ph.filter((x) => !x.form);
  return (
    <section className="card-l" id="formy">
      <h3 className="cl-h">Možnosti použití a jak se vstřebají</h3>
      {fb.length ? (
        <>
          <h4 className="fgrp">🛍️ Koupit hotové</h4>
          {fb.map(item)}
        </>
      ) : null}
      {fh.length ? (
        <>
          <h4 className="fgrp">🏠 Připravit doma</h4>
          {fh.map(item)}
        </>
      ) : null}
      {other.length ? (
        <div className="fa-other">
          <PharmList items={other} label="Další přípravky v lékárně" />
        </div>
      ) : null}
      {ph.length ? (
        <p className="note ph-note">
          Přípravky schválené Státním ústavem pro kontrolu léčiv, seřazené abecedně – nejde o
          doporučení konkrétní značky. Před užitím si přečtěte příbalový leták nebo se poraďte s
          lékárníkem. Zdroj: SÚKL, otevřená data, stav k{" "}
          {D.sukl!.stav.split("-").reverse().join(". ").replace(/^0/, "")}.
        </p>
      ) : s.formy.some((f) => f == "kapsle" || f == "extrakt") ? (
        <p className="note ph-note">
          💊 V lékárnách a drogeriích se prodává hlavně jako <b>doplněk stravy</b> (tablety, kapky,
          sirup). Doplňky stravy nejsou v databázi léčiv SÚKL, a proto je tu nevypisujeme. Vybírejte
          podle složení a obsahu účinných látek na obalu – s výběrem poradí lékárník.
        </p>
      ) : null}
      {D.jvn?.[s.k]?.length ? (
        <details className="jvn">
          <summary>⚠️ Pozor, jen v názvu ({D.jvn[s.k]!.length})</summary>
          <p className="note">
            Tyto přípravky mají v názvu „{(s.cz.split(" (")[0] ?? s.cz).toLowerCase()}“, ale podle
            registrace tuto rostlinu neobsahují.
          </p>
          <ul className="ph-list">
            {D.jvn[s.k]!.slice(0, 12).map(([n, l]) => (
              <li key={n}>
                <b>{n}</b>
                <span className="note">
                  {" "}
                  –{" "}
                  {l.length
                    ? `obsahuje ${l.join(", ")}`
                    : "potravina pro zvláštní lékařské účely, jen příchuť"}
                </span>
              </li>
            ))}
          </ul>
          {D.jvn[s.k]!.length > 12 ? (
            <p className="note">a dalších {D.jvn[s.k]!.length - 12}</p>
          ) : null}
        </details>
      ) : null}
    </section>
  );
}

const VYDEJ: Record<string, string> = {
  F: "bez receptu",
  V: "bez receptu s omezením",
  R: "na recept",
};

/** Pharmacy products for one form of use, shown right under the form (first 3, rest on request). */
function PharmList({
  items,
  label = "Přípravky v lékárně",
}: {
  items: PharmItem[];
  label?: string;
}) {
  const [all, setAll] = useState(false);
  if (!items.length) return null;
  const shown = all ? items : items.slice(0, 3);
  return (
    <div className="ph-list ph-open">
      <div className="ph-lbl">
        💊 {label} ({items.length})
      </div>
      {shown.map((p) => (
        <div key={p.name + p.sizes.join()} className="ph-item">
          <b>{p.name}</b>
          {p.sizes.length ? <span className="note"> – {p.sizes.join(", ")}</span> : null}
          <div className="note">
            {VYDEJ[p.v] ?? p.v}
            {p.combo ? ` · směs: ${p.latky.map((l) => l.toLowerCase()).join(", ")}` : ""}
          </div>
        </div>
      ))}
      {items.length > shown.length ? (
        <button type="button" className="chip sm" onClick={() => setAll(true)}>
          Zobrazit další ({items.length - shown.length})
        </button>
      ) : null}
    </div>
  );
}

/** Collapsible section row with icon, title and count. */
export function Sec({
  icon,
  title,
  n,
  id,
  open,
  warn,
  children,
}: {
  icon: string;
  title: string;
  n?: number;
  id?: string;
  open?: boolean;
  /** red heading (warnings) */
  warn?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details className={`sec${warn ? " sec-warn" : ""}`} id={id} open={open}>
      <summary>
        <span aria-hidden="true">{icon}</span>
        <span className="sec-t">{title}</span>
        {n ? <span className="sec-n">{n}</span> : null}
      </summary>
      <div className="sec-b">{children}</div>
    </details>
  );
}
