import { Fragment, useMemo, useRef, useState } from "react";
import { CONDS, D, FLAGS, SP, norm } from "@/lib/ll/data";
import { MED } from "@/lib/ll/meds";
import { isKnownPlain, searchMedsAll, searchSuklPlain } from "@/lib/ll/medsSukl";
import { GUIDE, RULE_T } from "@/lib/ll/ixguide";
import { photoUrl } from "@/lib/ll/photos";
import { riskOf, risksByItem, type Risk } from "@/lib/ll/risks";
import { useApp } from "@/lib/ll/store";
import { IxBadge, SpeciesLink, XField } from "./common";
import { nameOnly, ownMeds } from "./Profil";

/** Profile flags for herbs taken regularly and for medicines kept at home. */
export const UZ = "uz:";
export const DM = "dm:";
export const DMO = "dmo:";

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

const cap = (n: string) => (n ? n[0]!.toUpperCase() + n.slice(1).toLowerCase() : n);
const short = (n: string) => n.split(" (")[0]!;

/** Food, drink and supplement rules for one medicine (from the interaction guide). */
function medRules(k: string) {
  return GUIDE.filter((g) => g.rel.includes(k))
    .flatMap((g) => g.rules)
    .filter((r) => !r.sp?.length);
}

function RuleList({ k }: { k: string }) {
  const rules = medRules(k);
  if (!rules.length) return null;
  return (
    <>
      <h4 className="fgrp">Jídlo, pití a doplňky</h4>
      <ul className="ix-list">
        {rules.map((r) => (
          <li key={r.co}>
            <IxBadge label={RULE_T[r.t][0]} cls={RULE_T[r.t][1]} />
            <b className="ix-p">{r.co}</b>
            <div>{r.proc}</div>
          </li>
        ))}
      </ul>
    </>
  );
}

type Row = {
  id: string;
  ic: string;
  n: string;
  sub: string;
  /** null = unknown medicine, [] = no known clash */
  list: Risk[] | null;
  extra?: React.ReactNode;
  drop: () => void;
};

const plural = (n: number) => (n == 1 ? "bylina" : n < 5 ? "byliny" : "bylin");

/** A table whose rows open the herbs (and rules) that concern them. */
function Tabulka({ rows, empty }: { rows: Row[]; empty: string }) {
  const [open, setOpen] = useState<string | null>(null);
  if (!rows.length) return <p className="note">{empty}</p>;
  const label = (r: Row) => {
    if (r.list == null) return <span className="note">neznámý lék – zeptejte se lékárníka</span>;
    if (!r.list.length)
      return r.extra ? (
        <span className="mt-cnt sev-n">podrobnosti ▾</span>
      ) : (
        <span className="note">známé střety nemáme</span>
      );
    const red = r.list.some((x) => x.sev == "r");
    return (
      <span className={`mt-cnt sev-${red ? "r" : "y"}`}>
        {red ? "🔴" : "🟡"} {r.list.length} {plural(r.list.length)} ▾
      </span>
    );
  };
  return (
    <div className="mtab" role="table">
      {rows.map((r) => {
        const can = !!r.list?.length || !!r.extra;
        return (
          <Fragment key={r.id}>
            <div className={`mt-row${open == r.id ? " on" : ""}`} role="row">
              <button
                type="button"
                className="mt-main"
                aria-expanded={open == r.id}
                disabled={!can}
                onClick={() => setOpen(open == r.id ? null : r.id)}
              >
                <span className="mt-n">
                  <span>
                    <span aria-hidden="true">{r.ic}</span> {r.n}
                  </span>
                  <small>{r.sub}</small>
                </span>
                {label(r)}
              </button>
              <button
                type="button"
                className="x-btn"
                aria-label={`Odebrat ${r.n}`}
                onClick={() => {
                  r.drop();
                  if (open == r.id) setOpen(null);
                }}
              >
                ✕
              </button>
            </div>
            {open == r.id && can ? (
              <div className="mt-tiles">
                {r.list?.length ? <RiskTiles list={r.list} /> : null}
                {r.extra}
              </div>
            ) : null}
          </Fragment>
        );
      })}
    </div>
  );
}

type AddMode = "uzivam" | "nemoci" | "doma";

/** Search for one section: medicines + herbs, or illnesses; stays open after each pick. */
function Pridat({ mode, onClose }: { mode: AddMode; onClose: () => void }) {
  const { prof, toggleProf, meds, setMeds, medsOther, saveMedsOther, doma, toggleDoma } = useApp();
  const [q, setQ] = useState("");
  const inp = useRef<HTMLInputElement>(null);
  const nq = norm(q.trim());
  const own = ownMeds(medsOther);
  const done = () => {
    setQ("");
    setTimeout(() => inp.current?.focus(), 0);
  };
  const conds = [
    ...FLAGS.map(([k, n]) => ({ k, n, kw: "" })),
    ...CONDS.map((c) => ({ k: c.k, n: c.n, kw: c.kw })),
  ].filter((c) => c.k != "leky");
  const condHits =
    mode == "nemoci" && nq
      ? conds.filter((c) => norm(c.n + " " + c.kw).includes(nq)).slice(0, 8)
      : [];
  const medHits = mode != "nemoci" && nq.length >= 2 ? searchMedsAll(q).slice(0, 8) : [];
  const plain = mode != "nemoci" ? searchSuklPlain(q) : [];
  const herbHits =
    mode != "nemoci" && nq.length >= 2
      ? D.species
          .filter(
            (s) =>
              s.k != "houby" &&
              norm(s.cz + " " + s.lat + " " + (s.ln ?? []).join(" ")).includes(nq),
          )
          .slice(0, 6)
      : [];
  const fake = mode != "nemoci" ? nameOnly(q) : [];
  const medOn = (k: string) => (mode == "uzivam" ? meds.includes(k) : prof.has(DM + k));
  const medToggle = (k: string) => {
    if (mode == "uzivam") setMeds(meds.includes(k) ? meds.filter((m) => m != k) : [...meds, k]);
    else toggleProf(DM + k, !prof.has(DM + k));
    done();
  };
  const plainOn = (n: string) =>
    mode == "uzivam" ? own.some((x) => norm(x) == norm(n)) : prof.has(DMO + cap(n));
  const plainAdd = (n: string) => {
    const v = cap(n).slice(0, 60);
    if (mode == "uzivam") {
      if (!own.some((x) => norm(x) == norm(v))) saveMedsOther([...own, v].join("\n"));
    } else toggleProf(DMO + v, true);
    done();
  };
  const herbOn = (k: string) => (mode == "uzivam" ? prof.has(UZ + k) : doma.includes(k));
  const herbToggle = (k: string) => {
    if (mode == "uzivam") toggleProf(UZ + k, !prof.has(UZ + k));
    else toggleDoma(k);
    done();
  };
  const ownAdd = () => {
    const v = q.trim().slice(0, 60);
    if (!v) return;
    if (mode == "uzivam") {
      if (!own.some((x) => norm(x) == norm(v))) saveMedsOther([...own, v].join("\n"));
    } else toggleProf(DMO + v, true);
    done();
  };
  const anyHit = condHits.length + medHits.length + plain.length + herbHits.length > 0;
  return (
    <div className="pridat">
      <div className="ask">
        <XField value={q} onClear={() => setQ("")}>
          <input
            ref={inp}
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={
              mode == "nemoci"
                ? "Nemoc nebo stav, např. astma, těhotenství, cukrovka"
                : "Lék nebo bylina, např. Paralen, Euthyrox, třezalka"
            }
            aria-label={mode == "nemoci" ? "Hledat nemoc nebo stav" : "Hledat lék nebo bylinu"}
          />
        </XField>
      </div>
      {nq ? (
        <div className="zl-hits">
          {condHits.map((c) => (
            <button
              key={c.k}
              type="button"
              className="zl-hit"
              aria-pressed={prof.has(c.k)}
              onClick={() => (toggleProf(c.k, !prof.has(c.k)), done())}
            >
              🩺 {c.n} <span className="zl-add">{prof.has(c.k) ? "✓ přidáno" : "➕ přidat"}</span>
            </button>
          ))}
          {medHits.map(({ m, via }) => (
            <button
              key={m.k}
              type="button"
              className="zl-hit"
              aria-pressed={medOn(m.k)}
              onClick={() => medToggle(m.k)}
            >
              💊 {m.n}
              {via.length ? <span className="note"> – {via.slice(0, 3).join(", ")}</span> : null}
              <span className="zl-add">{medOn(m.k) ? "✓ přidáno" : "➕ přidat"}</span>
            </button>
          ))}
          {plain.map((n) => (
            <button
              key={n}
              type="button"
              className="zl-hit"
              aria-pressed={plainOn(n)}
              onClick={() => plainAdd(n)}
            >
              💊 {cap(n)}
              <span className="zl-add">{plainOn(n) ? "✓ přidáno" : "➕ přidat"}</span>
            </button>
          ))}
          {herbHits.map((s) => (
            <button
              key={s.k}
              type="button"
              className="zl-hit"
              aria-pressed={herbOn(s.k)}
              onClick={() => herbToggle(s.k)}
            >
              🌿 {s.cz}
              <span className="zl-add">{herbOn(s.k) ? "✓ přidáno" : "➕ přidat"}</span>
            </button>
          ))}
          {fake.map((f) => (
            <div key={f.name} className="alert ix-warn">
              ⚠️ <b>{f.name}</b> má v názvu „{f.herb.toLowerCase()}“, ale podle registrace tuto
              rostlinu neobsahuje.
            </div>
          ))}
          {mode != "nemoci" && q.trim().length >= 3 && !anyHit ? (
            <button type="button" className="zl-hit zl-own" onClick={ownAdd}>
              ➕ Přidat „{q.trim().slice(0, 60)}“ jako vlastní lék
            </button>
          ) : null}
          {mode == "nemoci" && !condHits.length ? (
            <p className="note">Nic jsme nenašli. Potíže jako nespavost zadejte v Co mě trápí.</p>
          ) : null}
        </div>
      ) : null}
      {mode == "uzivam" && !nq ? (
        <div className="quick-meds">
          {QUICK_MEDS.filter((k) => MED[k] && !meds.includes(k)).map((k) => (
            <button key={k} type="button" className="chip" onClick={() => medToggle(k)}>
              ➕ {QUICK_LABEL[k]}
            </button>
          ))}
        </div>
      ) : null}
      {mode == "nemoci" ? (
        <div className="checks">
          {FLAGS.map((f) => (
            <label key={f[0]} className="check" htmlFor={`p-${f[0]}`}>
              <input
                type="checkbox"
                id={`p-${f[0]}`}
                checked={prof.has(f[0])}
                onChange={(e) => toggleProf(f[0], e.target.checked)}
              />
              <span>{f[1]}</span>
            </label>
          ))}
        </div>
      ) : null}
      <button type="button" className="linkish pridat-done" onClick={onClose}>
        Hotovo
      </button>
    </div>
  );
}

const QUICK_MEDS = ["paracetamol", "nsaid", "antikoncepce", "tlak", "statiny", "stitna"];
const QUICK_LABEL: Record<string, string> = {
  paracetamol: "Paralen (paracetamol)",
  nsaid: "Ibalgin / Nurofen (ibuprofen)",
  antikoncepce: "Hormonální antikoncepce",
  tlak: "Léky na tlak",
  statiny: "Léky na cholesterol (statiny)",
  stitna: "Euthyrox (štítná žláza)",
};

function Sekce({
  title,
  add,
  mode,
  children,
}: {
  title: string;
  add: string;
  mode: AddMode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <section className="box">
      <div className="sek-h">
        <h2>{title}</h2>
        {open ? null : (
          <button type="button" className="btn sm" onClick={() => setOpen(true)}>
            ➕ {add}
          </button>
        )}
      </div>
      {children}
      {open ? <Pridat mode={mode} onClose={() => setOpen(false)} /> : null}
    </section>
  );
}

/** "Moje léky": what I take regularly, my illnesses, and what I keep at home. */
export function MojeLeky() {
  const { prof, toggleProf, meds, setMeds, medsOther, saveMedsOther, doma, toggleDoma } = useApp();
  const by = useMemo(() => risksByItem(prof), [prof]);
  const own = ownMeds(medsOther);

  const uzivam: Row[] = [
    ...meds
      .filter((k) => MED[k])
      .map((k) => ({
        id: "m:" + k,
        ic: "💊",
        n: short(MED[k]!.n),
        sub: "lék",
        list: by.get("med:" + MED[k]!.n) ?? [],
        extra: medRules(k).length ? <RuleList k={k} /> : undefined,
        drop: () => setMeds(meds.filter((m) => m != k)),
      })),
    ...own.map((t) => ({
      id: "o:" + t,
      ic: "💊",
      n: t,
      sub: "lék",
      list: isKnownPlain(t) ? [] : null,
      drop: () => saveMedsOther(own.filter((x) => x != t).join("\n")),
    })),
    ...[...prof]
      .filter((f) => f.startsWith(UZ) && SP[f.slice(UZ.length)])
      .map((f) => {
        const k = f.slice(UZ.length);
        const r = riskOf(k, prof);
        return {
          id: f,
          ic: "🌿",
          n: short(SP[k]!.cz),
          sub: "bylina – pravidelně",
          list: [] as Risk[],
          extra: r ? (
            <p className={`alert ${r.sev == "r" ? "crit" : "ix-warn"}`}>
              {r.sev == "r" ? "🔴" : "🟡"} {r.why ? <b>{r.why}: </b> : null}
              {r.t}
            </p>
          ) : (
            <p className="note">
              S vašimi léky a nemocemi jsme u ní střet nenašli.{" "}
              <SpeciesLink k={k}>Detail byliny ›</SpeciesLink>
            </p>
          ),
          drop: () => toggleProf(f, false),
        };
      }),
  ];
  const nemoci: Row[] = [
    ...FLAGS.map(([k, n]) => ({ k, n })),
    ...CONDS.map((c) => ({ k: c.k, n: c.n })),
  ]
    .filter((c) => c.k != "leky" && prof.has(c.k))
    .map((c) => ({
      id: "c:" + c.k,
      ic: "🩺",
      n: short(c.n),
      sub: "nemoc nebo stav",
      list: by.get(c.k) ?? [],
      drop: () => toggleProf(c.k, false),
    }));
  const domaRows: Row[] = [
    ...[...prof]
      .filter((f) => f.startsWith(DM) && MED[f.slice(DM.length)])
      .map((f) => {
        const k = f.slice(DM.length);
        const m = MED[k]!;
        // what would clash if this medicine were taken
        const would = risksByItem(new Set([...prof, "med:" + k])).get("med:" + m.n) ?? [];
        return {
          id: f,
          ic: "💊",
          n: short(m.n),
          sub: "lék doma – kdybyste ho vzal",
          list: would,
          extra: medRules(k).length ? <RuleList k={k} /> : undefined,
          drop: () => toggleProf(f, false),
        };
      }),
    ...[...prof]
      .filter((f) => f.startsWith(DMO))
      .map((f) => ({
        id: f,
        ic: "💊",
        n: f.slice(DMO.length),
        sub: "lék doma",
        list: isKnownPlain(f.slice(DMO.length)) ? [] : null,
        drop: () => toggleProf(f, false),
      })),
    ...doma
      .filter((k) => SP[k])
      .map((k) => {
        const r = riskOf(k, prof);
        return {
          id: "d:" + k,
          ic: "🌿",
          n: short(SP[k]!.cz),
          sub: "bylina doma",
          list: [] as Risk[],
          extra: r ? (
            <p className={`alert ${r.sev == "r" ? "crit" : "ix-warn"}`}>
              {r.sev == "r" ? "🔴" : "🟡"} {r.why ? <b>{r.why}: </b> : null}
              {r.t}
            </p>
          ) : (
            <p className="note">
              S vašimi léky a nemocemi jsme u ní střet nenašli.{" "}
              <SpeciesLink k={k}>Detail byliny ›</SpeciesLink>
            </p>
          ),
          drop: () => toggleDoma(k),
        };
      }),
  ];
  return (
    <>
      <Sekce
        title="Léky a byliny, co pravidelně používám"
        add="Přidat lék nebo bylinu"
        mode="uzivam"
      >
        <Tabulka
          rows={uzivam}
          empty="Zatím nic. Přidejte léky a byliny, které berete pravidelně – aplikace pohlídá, s čím je nekombinovat."
        />
      </Sekce>
      <Sekce title="Moje nemoci a stavy" add="Přidat nemoc" mode="nemoci">
        <Tabulka
          rows={nemoci}
          empty="Zatím nic. Přidejte nemoci nebo stavy (např. těhotenství) – označíme byliny, kterým se vyhnout."
        />
      </Sekce>
      <Sekce title="Léky a byliny, co mám doma" add="Přidat lék nebo bylinu" mode="doma">
        <Tabulka
          rows={domaRows}
          empty="Zatím nic. Patří sem i vše, co označíte 🏠 Mám doma v Atlasu nebo v Zahrádce."
        />
      </Sekce>
    </>
  );
}
