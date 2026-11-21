import { Link, useNavigate } from "@tanstack/react-router";
import { Fragment, useEffect, useState, type ReactNode } from "react";
import {
  CONDS,
  D,
  FLAGS,
  NM,
  RED,
  SP,
  TOP,
  TP,
  U,
  best,
  bestOf,
  blocked,
  fmt,
  grade,
  isHumanGrade,
  kat,
  ngrade,
  norm,
  nscore,
  nstudies,
  score,
  slug,
  warns,
} from "@/lib/ll/data";
import { understand } from "@/lib/ll/understand";
import { MED } from "@/lib/ll/meds";
import { ownMeds } from "./Profil";
import { useApp, type UIState } from "@/lib/ll/store";
import type { Grade, Species, Study } from "@/lib/ll/types";
import {
  GeneralAlerts,
  HowToUse,
  MineButtons,
  PackedChips,
  Pill,
  SpeciesLink,
  WarnAlert,
  Who,
  XField,
} from "./common";
import { setPendingAnchor } from "@/lib/ll/jump";
import { FormIcons } from "./DruhHead";

type Label = { id: string; n: string; g: (sp: string) => Grade | null };
type Row = [string, Grade];
/** A rendered piece of the result list; `art` marks a recommendation card. */
type Item = { key: string; el: ReactNode; art?: boolean };

/** Strongest evidence first: S (many studies), A (tested on people), B (first human tests), C (lab). */
const GRANK: Record<Grade, number> = { S: 0, A: 1, B: 2, C: 3 };

/** How many of the most common topics are shown before "Další potíže…". */
const COMMON_TOPICS = 10;
/** The most common illnesses, offered as quick picks next to the topics. */
const COMMON_NEM = [
  "nachlazeni",
  "kasel",
  "krk",
  "chripka",
  "bolest_hlavy",
  "zada",
  "nespavost",
  "paleni_zahy",
  "zacpa",
  "mocovy",
];

const PF: [string, string][] = [
  ["vse", "Vše"],
  ["bylina", "Byliny z ČR"],
  ["houba", "Houby"],
  ["exot", "Dovážené"],
  ["vcela", "Včelí produkty"],
  ["potr", "Potraviny"],
];

function selLabels(ui: UIState): Label[] {
  const tps = ui.picked.concat(ui.sub && !ui.picked.includes(ui.sub) ? [ui.sub] : []);
  return [
    ...ui.nem.map((k) => ({
      id: "n:" + k,
      n: NM[k]!.n,
      g: (sp: string) => ngrade(sp, k) || grade(sp, NM[k]!.tp),
    })),
    ...tps.map((k) => ({ id: "t:" + k, n: TP[k]!.n, g: (sp: string) => grade(sp, k) })),
  ];
}

function FitChips({ sp, labels }: { sp: string; labels: Label[] }) {
  if (labels.length < 2) return null;
  return (
    <div className="fit" aria-label="Na které z vašich potíží se hodí">
      {labels.map((l) => {
        const y = isHumanGrade(l.g(sp));
        return (
          <span key={l.id} className={y ? "y" : ""}>
            {y ? "✓ " : ""}
            {l.n}
          </span>
        );
      })}
    </div>
  );
}

function RecCard({
  sp,
  g,
  b,
  feat,
  labels,
  prof,
  home,
  cover,
}: {
  sp: string;
  g: Grade;
  b: Study | undefined;
  feat: boolean;
  labels: Label[];
  prof: ReadonlySet<string>;
  home?: boolean;
  /** "covers all / n of m chosen complaints" headline for the top card */
  cover?: string | undefined;
}) {
  const s = SP[sp]!;
  const nav = useNavigate();
  const w = warns(sp, prof);
  const hit = w.filter((x) => x.hit);
  const u = U(sp);
  const cls =
    (hit.length ? " no" : g == "C" ? " less" : g == "B" ? " gb" : " ga") +
    (feat ? " feat" : "") +
    (home ? " home" : "");
  const open = (form?: string) => {
    if (form) setPendingAnchor("f-" + form);
    void nav({ to: "/atlas/$druh", params: { druh: slug(sp) } });
  };
  return (
    <article
      className={`box rec rec-click${cls}`}
      onClick={(e) => {
        // the whole card opens the plant; buttons and links inside keep their own action
        if ((e.target as HTMLElement).closest("button, a, input, select, summary")) return;
        open();
      }}
    >
      {cover ? (
        <div className="eyebrow cover">{cover}</div>
      ) : feat ? (
        <div className="eyebrow">Nejsilnější doporučení</div>
      ) : null}
      <div className="top rec-top">
        <Who s={s} picLink extra={<Pill g={g} />} />
        <FormIcons s={s} onPick={(f) => open(f)} />
      </div>
      <MineButtons k={sp} sm />
      <FitChips sp={sp} labels={labels} />
      {hit.map((x, i) => (
        <WarnAlert key={i} w={x} />
      ))}
      {b ? (
        <p>
          <b>{g == "C" ? "Pokusy naznačují" : "Studie naznačují"}:</b> {b.s}
        </p>
      ) : null}
      {u && !hit.length ? <HowToUse s={s} u={u} noForms /> : null}
      {hit.length
        ? null
        : w
            .filter((x) => x.soft)
            .concat(w.filter((x) => x.f == "*").slice(0, 1))
            .map((x, i) => <WarnAlert key={i} w={x} />)}
      <div className="rec-actions">
        <SpeciesLink k={sp} className="btn more-btn">
          Více o této {kat(s)[1]} →
        </SpeciesLink>
      </div>
    </article>
  );
}

const KEY_HINT = "ll-tip-profil";
/** What the profile holds (medicines, illnesses), or a nudge to fill it in. */
function ProfilStrip() {
  const { prof, meds, medsOther } = useApp();
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    try {
      setHidden(localStorage.getItem(KEY_HINT) == "1");
    } catch {
      /* storage blocked */
    }
  }, []);
  const medN = [
    ...meds.map((k) => MED[k]?.n.split(" (")[0]).filter((x): x is string => !!x),
    ...ownMeds(medsOther),
  ];
  const conds = [...FLAGS.map(([k, n]) => ({ k, n })), ...CONDS.map((c) => ({ k: c.k, n: c.n }))]
    .filter((c) => c.k != "leky" && prof.has(c.k))
    .map((c) => c.n.split(" (")[0]!);
  if (medN.length || conds.length)
    return (
      <p className="prof-strip">
        {medN.length ? (
          <span>
            💊 <b>Vaše léky:</b> {medN.join(", ")}
          </span>
        ) : null}
        {conds.length ? (
          <span>
            🩺 {conds.slice(0, 4).join(", ")}
            {conds.length > 4 ? "…" : ""}
          </span>
        ) : null}
        <Link to="/interakce" className="linkish">
          Upravit
        </Link>
      </p>
    );
  if (hidden) return null;
  return (
    <div className="prof-tip">
      <span>
        💡 Vyplňte si nemoci a léky, které užíváte. Pak u bylin upozorníme, které pro vás nejsou
        vhodné nebo se nesnesou s vašimi léky.
      </span>
      <span className="row-btns">
        <Link to="/interakce" className="btn sm">
          Vyplnit
        </Link>
        <button
          type="button"
          className="x-btn"
          aria-label="Skrýt upozornění"
          onClick={() => {
            setHidden(true);
            try {
              localStorage.setItem(KEY_HINT, "1");
            } catch {
              /* storage blocked */
            }
          }}
        >
          ✕
        </button>
      </span>
    </div>
  );
}

export function Poradce() {
  const { ui, setUI, prof, doma, toggleProf } = useApp();
  const [draft, setDraft] = useState(ui.q);
  useEffect(() => setDraft(ui.q), [ui.q]);

  const inPool = (s: Species) =>
    ui.pf == "vse" || s.kat == ui.pf || (ui.pf == "houba" && s.k == "houby");
  const labels = selLabels(ui);

  const card = (
    key: string,
    sp: string,
    g: Grade,
    b: Study | undefined,
    feat = false,
    cover?: string,
  ): Item => ({
    key,
    art: true,
    el: (
      <RecCard
        sp={sp}
        g={g}
        b={b}
        feat={feat}
        labels={labels}
        prof={prof}
        home={doma.includes(sp)}
        cover={cover}
      />
    ),
  });

  function listBlock(
    prefix: string,
    rows: Row[],
    bfn: (sp: string) => Study | undefined,
    emptyMsg: string,
  ): Item[] {
    const sure = rows.filter((r) => r[1] != "C");
    const less = rows.filter((r) => r[1] == "C");
    const ok = sure.filter((r) => !blocked(r[0], prof));
    const no = sure.filter((r) => blocked(r[0], prof));
    const out: Item[] = [];
    if (!ok.length)
      out.push({
        key: prefix + "empty",
        el: (
          <div className="box">
            <p>
              {emptyMsg}
              {ui.pf != "vse" ? " (v právě zvolené skupině – zkuste nahoře přepnout na Vše)" : ""}
            </p>
          </div>
        ),
      });
    else {
      // strongest evidence first; within the same strength, herbs the user has at home go first
      const sorted = ok
        .map((r, i) => ({ r, i }))
        .sort(
          (a, b) =>
            GRANK[a.r[1]] - GRANK[b.r[1]] ||
            Number(doma.includes(b.r[0])) - Number(doma.includes(a.r[0])) ||
            a.i - b.i,
        )
        .map((x) => x.r);
      const first = sorted[0];
      if (first) out.push(card(prefix + "f" + first[0], first[0], first[1], bfn(first[0]), true));
      if (sorted.length > 1) {
        out.push({ key: prefix + "more", el: <h3>Další možnosti</h3> });
        for (const r of sorted.slice(1, 6))
          out.push(card(prefix + "o" + r[0], r[0], r[1], bfn(r[0])));
      }
    }
    if (no.length) {
      out.push({ key: prefix + "noh", el: <h3>Raději ne (podle vašeho profilu)</h3> });
      for (const r of no.slice(0, 3)) out.push(card(prefix + "n" + r[0], r[0], r[1], bfn(r[0])));
    }
    if (less.length) {
      if (ui.less) {
        out.push({
          key: prefix + "lessh",
          el: (
            <>
              <h3>Méně jisté</h3>
              <p className="note">
                Přínos se ukázal jen u zvířat nebo v laboratoři, u lidí ho zatím nikdo neověřil.
              </p>
            </>
          ),
        });
        for (const r of less.filter((r) => !blocked(r[0], prof)).slice(0, 5))
          out.push(card(prefix + "l" + r[0], r[0], r[1], bfn(r[0])));
      } else
        out.push({
          key: prefix + "lessb",
          el: (
            <div>
              <button type="button" className="btn ghost" onClick={() => setUI({ less: true })}>
                Zobrazit i méně jisté ({less.length}) – jen pokusy na zvířatech a v laboratoři
              </button>
            </div>
          ),
        });
    }
    return out;
  }

  function topicBlock(tk: string): Item[] {
    const rows = D.species
      .filter(inPool)
      .map((s) => [s.k, grade(s.k, tk)] as const)
      .filter((r): r is Row => r[1] != null)
      .sort((a, b) => score(b[0], tk) - score(a[0], tk));
    const head: Item[] = [{ key: "t" + tk + "h", el: <h2>{TP[tk]!.n}</h2> }];
    if (tk == "onko")
      head.push({
        key: "t" + tk + "onko",
        el: (
          <div className="alert crit">
            <b>Důležité:</b> žádná bylina ani houba neléčí rakovinu. Studie zkoumaly jen doplněk ke
            standardní léčbě. Cokoli užíváte, řekněte svému onkologovi.
          </div>
        ),
      });
    head.push({
      key: "t" + tk + "n",
      el: (
        <p className="note">
          Na tento problém studie naznačují přínos těchto bylin a hub. Nahoře je ta, kterou
          podporuje nejvíc studií s lidmi.
        </p>
      ),
    });
    return head.concat(
      listBlock(
        "t" + tk,
        rows,
        (sp) => best(sp, tk),
        "K této potíži zatím nemáme žádnou bylinu ani houbu testovanou na lidech. Podívejte se do Atlasu, co se používá tradičně.",
      ),
    );
  }

  function nemBlock(nk: string): Item[] {
    const n = NM[nk]!;
    const p = "n" + nk;
    // first species studied directly for this condition, then fill in from the broader topic
    const spec = D.species
      .filter(inPool)
      .map((s) => [s.k, ngrade(s.k, nk)] as const)
      .filter((r): r is Row => r[1] != null)
      .sort((a, b) => nscore(b[0], nk) - nscore(a[0], nk));
    const have = new Set(spec.filter((r) => r[1] != "C").map((r) => r[0]));
    const gen = D.species
      .filter(inPool)
      .filter((s) => !have.has(s.k))
      .map((s) => [s.k, grade(s.k, n.tp)] as const)
      .filter((r): r is Row => r[1] != null && r[1] != "C")
      .sort((a, b) => score(b[0], n.tp) - score(a[0], n.tp));
    const cond: Item = {
      key: p + "cond",
      el: (
        <div className="box cond">
          <p>{n.tip}</p>
          <div className="alert warn">
            <b>K lékaři:</b> {n.doc}
          </div>
        </div>
      ),
    };
    let h: Item[] = [{ key: p + "h", el: <h2>{n.n}</h2> }];
    const specSure = spec.filter((r) => r[1] != "C");
    if (specSure.length) {
      h.push({
        key: p + "intro",
        el: <p className="note">Tyto byliny a houby byly testovány přímo na tuto potíž.</p>,
      });
      h = h.concat(listBlock(p, spec, (sp) => bestOf(nstudies(sp, nk)) || best(sp, n.tp), ""));
    } else if (spec.length && !gen.length)
      h = h.concat(
        listBlock(
          p,
          spec,
          (sp) => bestOf(nstudies(sp, nk)),
          "Přímo na tuto potíž zatím nemáme studie s lidmi.",
        ),
      );
    if (gen.length) {
      h.push({
        key: p + "genh",
        el: (
          <h3>
            {specSure.length
              ? "Další možnosti z oblasti"
              : "Přímo na tuto potíž zatím nemáme studie s lidmi. Z oblasti"}{" "}
            „{TP[n.tp]!.n}“
          </h3>
        ),
      });
      for (const r of gen.slice(0, specSure.length ? 2 : 4))
        h.push(card(p + "g" + r[0], r[0], r[1], best(r[0], n.tp)));
    }
    if (!spec.length && !gen.length)
      h.push({
        key: p + "none",
        el: (
          <div className="box">
            <p>K této potíži zatím nemáme žádnou bylinu ani houbu testovanou na lidech.</p>
          </div>
        ),
      });
    // general advice ("avoid triggers…") and "see a doctor" come after the herbs
    h.push(cond);
    return h;
  }

  /* ---------- interactions (same rules as the original app) ---------- */
  const submit = () => {
    const u = understand(draft);
    setUI({ q: draft, picked: u.t, nem: u.n, sub: null, less: false, allT: false });
  };
  const clickTopic = (t: string) =>
    setUI((s) => {
      let picked = [...s.picked];
      let nem = s.nem;
      const i = picked.indexOf(t);
      if (i >= 0) picked.splice(i, 1);
      else {
        if (!s.q.trim()) {
          picked = [];
          nem = [];
        }
        picked.push(t);
      }
      return { allT: false, picked, nem, sub: null, q: !picked.length && !nem.length ? "" : s.q };
    });
  const removeNem = (k: string) =>
    setUI((s) => {
      const nem = s.nem.filter((x) => x != k);
      return { nem, q: !s.picked.length && !nem.length ? "" : s.q };
    });

  /* ---------- render ---------- */
  const nq = norm(ui.q);
  const red = RED.find((r) => r[0].test(nq));
  const tps = [...ui.picked];
  if (ui.sub && !tps.includes(ui.sub)) tps.push(ui.sub);
  const main = ui.picked[0] || (ui.nem[0] ? NM[ui.nem[0]]?.tp : undefined);
  const sel = tps.length || ui.nem.length;
  const topShown = ui.allT
    ? TOP
    : sel
      ? TOP.filter((t) => ui.picked.includes(t.k))
      : TOP.slice(0, COMMON_TOPICS);
  const related = main ? D.related[main] : undefined;

  const ask = (
    <section className="box">
      <h2>Co vás trápí?</h2>
      {sel ? null : (
        <p className="note">
          Popište potíže vlastními slovy (i víc najednou, klidně i název nemoci), nebo vyberte téma.
        </p>
      )}
      <form
        className={`ask${sel ? " compact" : ""}`}
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <XField value={draft} wide onClear={() => setDraft("")}>
          <textarea
            rows={sel ? 1 : 2}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key == "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Např. mám atopický ekzém a špatně spím, nebo: bolí mě v krku a kašlu"
            aria-label="Popište, co vás trápí"
          />
        </XField>
        <button className="btn">Vyhledat</button>
      </form>
      <ProfilStrip />
      <PackedChips
        className={sel ? "chips" : "chips packed"}
        items={[
          ...topShown.map((t) => ({
            k: "t:" + t.k,
            el: (
              <button
                type="button"
                className="chip"
                aria-pressed={ui.picked.includes(t.k)}
                onClick={() => clickTopic(t.k)}
              >
                {t.n}
              </button>
            ),
          })),
          ...(sel ? [] : COMMON_NEM.filter((k) => NM[k])).map((k) => ({
            k: "n:" + k,
            el: (
              <button
                type="button"
                className="chip"
                onClick={() =>
                  setUI({ q: NM[k]!.n, picked: [], nem: [k], sub: null, less: false, allT: false })
                }
              >
                {NM[k]!.n}
              </button>
            ),
          })),
        ]}
        tail={
          <button
            type="button"
            className="chip sm"
            onClick={() => setUI((s) => ({ allT: !s.allT }))}
          >
            {ui.allT ? "Skrýt ostatní témata" : sel ? "Jiné téma…" : "Další potíže…"}
          </button>
        }
      />
      {related ? (
        <div>
          <p className="note mb-1.5">K tomu často patří. Trápí vás zároveň i tohle?</p>
          <div className="chips">
            {related
              .filter((k) => !ui.picked.includes(k))
              .map((k) => (
                <button
                  key={k}
                  type="button"
                  className="chip sm"
                  aria-pressed={ui.sub == k}
                  onClick={() => setUI((s) => ({ sub: s.sub == k ? null : k }))}
                >
                  {TP[k]?.n}
                </button>
              ))}
          </div>
        </div>
      ) : null}
    </section>
  );

  if (red)
    return (
      <>
        {ask}
        <div className="alert crit alert-lg">
          <b>Nejdřív tohle.</b> {red[1]}
        </div>
      </>
    );

  if (!tps.length && !ui.nem.length)
    return (
      <>
        {ask}
        {ui.q.trim() ? (
          <div className="box">
            <p>
              Tomuhle popisu jsem neporozuměl. Zkuste to říct jinak (například „bolí mě v krku a
              kašlu“ nebo „mám lupénku“), nebo vyberte téma výše.
            </p>
          </div>
        ) : (
          <div className="box">
            <h3>Jak to funguje</h3>
            <p>
              Prošli jsme {fmt(D.stats.clanku)} volně dostupných vědeckých článků o {D.stats.druhu}{" "}
              bylinách a léčivých houbách. Aplikace rozezná přes {D.nem.length} konkrétních nemocí a
              příznaků. U každé potíže ukážeme nahoře to, co bylo nejvíc testováno na lidech. Méně
              jisté výsledky jsou schované.
            </p>
            <p className="note">
              Vyplňte si <Link to="/profil">profil</Link> – označíme, co pro vás není vhodné.
            </p>
          </div>
        )}
      </>
    );

  const items = [...ui.nem.flatMap(nemBlock), ...tps.flatMap(topicBlock)];

  // With several complaints: the herb that covers all (or most) of them goes first.
  let coverItem: Item | null = null;
  if (labels.length >= 2) {
    const c = D.species
      .filter(inPool)
      .filter((x) => !blocked(x.k, prof))
      .map((x) => {
        const gs = labels.map((l) => l.g(x.k));
        const yes = gs.filter((g): g is Grade => isHumanGrade(g));
        return {
          k: x.k,
          n: yes.length,
          str: yes.reduce((a, g) => a + 4 - GRANK[g], 0),
          home: doma.includes(x.k),
          g: [...yes].sort((a, b) => GRANK[a] - GRANK[b])[0],
          lab: labels.find((l) => isHumanGrade(l.g(x.k))),
        };
      })
      .filter((x) => x.n >= 2 && x.g)
      .sort((a, b) => b.n - a.n || b.str - a.str || Number(b.home) - Number(a.home))[0];
    if (c && c.g && c.lab) {
      const id = c.lab.id;
      const st = id.startsWith("n:") ? bestOf(nstudies(c.k, id.slice(2))) : best(c.k, id.slice(2));
      const txt =
        c.n == labels.length
          ? "Pomáhá na všechny vybrané potíže"
          : `Pomáhá na ${c.n} z ${labels.length} vybraných potíží`;
      coverItem = card("cover" + c.k, c.k, c.g, st, false, txt);
    }
  }
  const potize = [...ui.nem.map((k) => "n:" + k), ...ui.picked.map((k) => "t:" + k)];
  const saved = potize.length > 0 && potize.every((f) => prof.has(f));

  return (
    <>
      {ask}
      {ui.q.trim() ? (
        <div className="understood">
          <span>Rozumím tomu takto:</span>
          {ui.nem.map((k) => (
            <button
              key={k}
              type="button"
              className="chip sm"
              aria-pressed="true"
              aria-label={`Odebrat ${NM[k]?.n}`}
              onClick={() => removeNem(k)}
            >
              {NM[k]?.n} ✕
            </button>
          ))}
          {ui.picked.map((k) => (
            <button
              key={k}
              type="button"
              className="chip sm"
              aria-pressed="true"
              aria-label={`Odebrat ${TP[k]?.n}`}
              onClick={() => clickTopic(k)}
            >
              {TP[k]?.n} ✕
            </button>
          ))}
        </div>
      ) : null}
      <div className="seg seg-row">
        <span className="note">Hledat mezi:</span>
        {PF.map((x) => (
          <button
            key={x[0]}
            type="button"
            className="chip sm"
            aria-pressed={ui.pf == x[0]}
            onClick={() => setUI({ pf: x[0] })}
          >
            {x[1]}
          </button>
        ))}
      </div>
      {potize.length ? (
        <div>
          <button
            type="button"
            className="chip sm"
            aria-pressed={saved}
            onClick={() => potize.forEach((f) => toggleProf(f, !saved))}
          >
            {saved ? "✓ Uloženo v profilu" : "💾 Uložit potíže do profilu"}
          </button>
        </div>
      ) : null}
      <GeneralAlerts />
      {coverItem ? coverItem.el : null}
      {items.map((x) => (
        <Fragment key={x.key}>{x.el}</Fragment>
      ))}
      <div className="box">
        <h3>Kdy k lékaři</h3>
        <p>
          Když potíž trvá déle než 2 týdny, zhoršuje se, budí vás v noci, nebo se přidá horečka,
          krev či neúmyslné hubnutí.
        </p>
      </div>
    </>
  );
}
