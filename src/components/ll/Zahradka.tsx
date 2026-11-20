import { useState } from "react";
import { NM, SP, TOP, TP, U, warns } from "@/lib/ll/data";
import { understand } from "@/lib/ll/understand";
import {
  GSIZE,
  KEY_GARDEN_EDITS,
  MES,
  gardenAlternatives,
  gardenPlan,
  gardenPrice,
  type GardenEdits,
  type GardenMode,
} from "@/lib/ll/garden";
import { useLocal } from "@/lib/ll/local";
import { useApp } from "@/lib/ll/store";
import { FormChips, SpeciesLink, Who } from "./common";
import { MojeVysadba, PlantButtons, useVysadba } from "./MojeVysadba";
import { MonthBar, MonthLegend, TICON } from "./DruhHead";

const MODES: [GardenMode, string][] = [
  ["zahrada", "Zahrada"],
  ["balkon", "Balkon / terasa"],
  ["okno", "Parapet"],
];
const LIGHT: [string, string][] = [
  ["S", "Slunce většinu dne"],
  ["P", "Polostín"],
  ["T", "Stín"],
];
/** How many of the most common topics are offered before "Další potíže…". */
const COMMON_TOPICS = 10;
const LIFE: Record<string, string> = { J: "jednoletá", D: "dvouletá", T: "trvalka", K: "keř" };

function Chip({
  on,
  sm,
  onClick,
  children,
}: {
  on: boolean;
  sm?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button type="button" className={`chip${sm ? " sm" : ""}`} aria-pressed={on} onClick={onClick}>
      {children}
    </button>
  );
}

export function Zahradka() {
  const { ui, setUI, prof } = useApp();
  const [vys, setVys] = useVysadba();
  const moje = <MojeVysadba v={vys} setV={setVys} topics={ui.gt} />;
  const [edits, setEdits] = useLocal<GardenEdits>(KEY_GARDEN_EDITS, { skip: [], force: [] });
  const [swapFor, setSwapFor] = useState<string | null>(null);
  const edited = edits.skip.length + edits.force.length > 0;
  const plural = (n: number) => (n == 1 ? "rostlina" : n < 5 ? "rostliny" : "rostlin");
  const [q, setQ] = useState("");
  const [allT, setAllT] = useState(false);
  const [miss, setMiss] = useState(false);
  const topShown = allT ? TOP : TOP.filter((t, i) => i < COMMON_TOPICS || ui.gt.includes(t.k));
  const search = () => {
    const u = understand(q);
    const t = [...new Set([...u.t, ...u.n.map((n) => NM[n]?.tp).filter((x): x is string => !!x)])];
    setMiss(!t.length);
    if (t.length) setUI((s) => ({ gt: [...new Set([...s.gt, ...t])] }));
  };

  const form = (
    <section className="box">
      <h2>Plánovač bylinné zahrádky</h2>
      <p className="note">
        Naklikejte, co vás trápí a kolik máte místa. Doporučíme byliny, u kterých studie s lidmi
        naznačují přínos, a k nim kdy sázet, kdy sklízet a jak je použít.
      </p>
      <h4 className="fgrp">1. Co vás trápí</h4>
      <form
        className="ask compact"
        onSubmit={(e) => {
          e.preventDefault();
          search();
        }}
      >
        <input
          value={q}
          onChange={(e) => (setQ(e.target.value), setMiss(false))}
          placeholder="Napište vlastními slovy, např. špatně spím"
          aria-label="Co vás trápí"
        />
        <button type="submit" className="btn">
          Hledat
        </button>
      </form>
      {miss ? (
        <p className="note">Tomu jsem neporozuměl, zkuste to jinak nebo vyberte níže.</p>
      ) : null}
      <div className="chips">
        {topShown.map((x) => (
          <Chip
            key={x.k}
            on={ui.gt.includes(x.k)}
            onClick={() =>
              setUI((s) => ({
                gt: s.gt.includes(x.k) ? s.gt.filter((k) => k != x.k) : [...s.gt, x.k],
              }))
            }
          >
            {x.n}
          </Chip>
        ))}
        <Chip sm on={false} onClick={() => setAllT((v) => !v)}>
          {allT ? "Skrýt ostatní" : "Další potíže…"}
        </Chip>
      </div>
      <h4 className="fgrp">2. Kde budete pěstovat</h4>
      <div className="chips">
        {MODES.map((x) => (
          <Chip
            key={x[0]}
            on={ui.gm == x[0]}
            onClick={() => setUI({ gm: x[0], gs: GSIZE[x[0]][1]![0] })}
          >
            {x[1]}
          </Chip>
        ))}
      </div>
      <h4 className="fgrp">3. Kolik máte místa</h4>
      <div className="chips">
        {GSIZE[ui.gm].map((x) => (
          <Chip key={x[0]} sm on={ui.gs == x[0]} onClick={() => setUI({ gs: x[0] })}>
            {x[1]}
          </Chip>
        ))}
      </div>
      <h4 className="fgrp">4. Kolik tam je slunce</h4>
      <div className="chips">
        {LIGHT.map((x) => (
          <Chip key={x[0]} on={ui.gl == x[0]} onClick={() => setUI({ gl: x[0] })}>
            {x[1]}
          </Chip>
        ))}
      </div>
    </section>
  );

  if (!ui.gt.length)
    return (
      <>
        {moje}
        {form}
        <div className="box">
          <p>Vyberte nahoře aspoň jednu potíž.</p>
        </div>
      </>
    );
  const plan = gardenPlan(ui, prof, edits);
  const { out, used } = plan;
  const price = out.reduce(
    (a, x) => {
      const p = gardenPrice(x.k);
      return [a[0] + p.od, a[1] + p.do] as [number, number];
    },
    [0, 0] as [number, number],
  );
  const stav = (k: string) => vys[k]?.stav;
  // with several complaints the plan is split into groups (herbs for more complaints first)
  type PlanItem = (typeof out)[number];
  const groups: { k: string; icon: string; t: string; items: PlanItem[] }[] =
    ui.gt.length > 1
      ? [
          {
            k: "multi",
            icon: "⭐",
            t: "Pomáhá na víc vašich potíží",
            items: out.filter((x) => x.fit.length > 1),
          },
          ...ui.gt.map((t) => ({
            k: t,
            icon: TICON[t] ?? "🌿",
            t: TP[t]?.n ?? t,
            items: out.filter((x) => x.fit.length <= 1 && x.fit[0]?.[0] == t),
          })),
        ]
      : [{ k: "all", icon: "", t: "", items: out }];
  const leftover = out.filter((x) => !groups.some((G) => G.items.includes(x)));
  if (leftover.length) groups.push({ k: "other", icon: "🌿", t: "Další", items: leftover });
  const remove = (k: string) =>
    setEdits((e) => ({ skip: [...new Set([...e.skip, k])], force: e.force.filter((x) => x != k) }));
  const replace = (k: string, by: string) =>
    setEdits((e) => ({
      skip: [...new Set([...e.skip, k])].filter((x) => x != by),
      force: [...e.force.filter((x) => x != k), by],
    }));
  if (!out.length)
    return (
      <>
        {moje}
        {form}
        <div className="box">
          <p>
            Pro tuto kombinaci jsme nenašli žádnou pěstovatelnou bylinu testovanou na lidech. Zkuste
            přidat další potíž, víc místa nebo jiné světlo.
          </p>
        </div>
      </>
    );

  return (
    <>
      {moje}
      {form}
      <section className="box">
        <h3>
          Váš plán ({out.length} {plural(out.length)})
        </h3>
        <p className="note">
          {ui.gm == "zahrada"
            ? `Zabere asi ${Math.round(used * 10) / 10} m² z ${ui.gs} m².`
            : "Každá rostlina do vlastní nádoby."}{" "}
          Nahoře jsou byliny, které pomáhají na víc vašich potíží a mají nejsilnější studie.
        </p>
        <p className="g-price">
          👛 Orientačně celkem{" "}
          <b>
            {price[0]}–{price[1]} Kč
          </b>{" "}
          za semínka a sazenice
        </p>
        {edited ? (
          <button
            type="button"
            className="chip sm"
            onClick={() => setEdits({ skip: [], force: [] })}
          >
            ↺ Obnovit původní plán
          </button>
        ) : null}
        <div className="gcal1">
          {out.map((x) => (
            <div key={x.k} className={`gcal1-r${stav(x.k) ? " st-" + stav(x.k) : ""}`}>
              <span className="gcal1-n">
                {stav(x.k) == "vysazeno" ? "🌱 " : stav(x.k) == "plan" ? "📝 " : ""}
                {SP[x.k]!.cz.split(" (")[0]}
              </span>
              <MonthBar sow={x.g[4]} harvest={x.g[5]} />
            </div>
          ))}
        </div>
        <MonthLegend />
        <p className="mleg">🌱 vysazeno · 📝 plánuji</p>
      </section>
      {groups.map((G) => [
        G.items.length && G.t ? (
          <h3 key={"h" + G.k} className="g-grp">
            {G.icon} {G.t} – {G.items.length}{" "}
            {G.items.length == 1 ? "bylina" : G.items.length < 5 ? "byliny" : "bylin"}
          </h3>
        ) : null,
        ...G.items.map((x) => {
          const s = SP[x.k]!;
          const g = x.g;
          const u = U(x.k);
          const w = warns(x.k, prof)
            .filter((y) => y.f == "*")
            .slice(0, 1);
          const side = Math.round(Math.sqrt(g[0]) * 100);
          const place =
            ui.gm == "zahrada"
              ? g[0] >= 1
                ? `asi ${g[0]} m² (${g[3] == "K" ? "keř" : "velká rostlina"})`
                : `asi ${side} × ${side} cm`
              : `nádoba aspoň ${g[1]} l`;
          return (
            <article key={x.k} className={`box rec${stav(x.k) ? " st-" + stav(x.k) : ""}`}>
              {stav(x.k) ? (
                <div className={`st-badge ${stav(x.k)}`}>
                  {stav(x.k) == "vysazeno" ? "🌱 Vysazeno" : "📝 Plánuji vysadit"}
                </div>
              ) : null}
              <div className="top">
                <Who s={s} sub={`${s.lat} · ${LIFE[g[3]] ?? ""}`} />
              </div>
              <PlantButtons k={x.k} v={vys} setV={setVys} />
              <div className="g-edit">
                <button type="button" className="chip sm" onClick={() => remove(x.k)}>
                  ✕ Odebrat
                </button>
                <button
                  type="button"
                  className="chip sm"
                  aria-expanded={swapFor == x.k}
                  onClick={() => setSwapFor((v) => (v == x.k ? null : x.k))}
                >
                  ⇄ Nahradit
                </button>
              </div>
              {swapFor == x.k ? (
                <div className="g-swap">
                  {gardenAlternatives(x.k, plan).length ? (
                    <>
                      <span className="note">Nahradit za:</span>
                      {gardenAlternatives(x.k, plan).map((a) => (
                        <button
                          key={a.k}
                          type="button"
                          className="chip sm"
                          onClick={() => (replace(x.k, a.k), setSwapFor(null))}
                        >
                          {SP[a.k]!.cz}
                        </button>
                      ))}
                    </>
                  ) : (
                    <span className="note">
                      Pro tyto potíže a místo nemáme jinou vhodnou bylinu.
                    </span>
                  )}
                </div>
              ) : null}
              <div className="why-tags" aria-label="Proč ji pěstuji">
                {x.fit.map((f) => (
                  <span key={f[0]} className="why-tag">
                    {TICON[f[0]] ?? "🌿"} {TP[f[0]]?.n.split(/,| a /)[0]?.toLowerCase()}
                  </span>
                ))}
              </div>
              <MonthBar sow={g[4]} harvest={g[5]} />
              <div className="rows">
                <div className="row">
                  <span>
                    <span className="lg s" />
                    Kdy zasadit
                  </span>
                  <span>{g[4].map((m) => MES[m - 1]).join(", ")}</span>
                </div>
                <div className="row stack">
                  <span className="note">{g[7]}</span>
                </div>
                <div className="row">
                  <span>Místo</span>
                  <span>{place}</span>
                </div>
                <div className="row">
                  <span>
                    <span className="lg h" />
                    Kdy sklidit
                  </span>
                  <span>
                    {g[5].length == 12 ? "celý rok" : g[5].map((m) => MES[m - 1]).join(", ")}
                  </span>
                </div>
                <div className="row">
                  <span>Co sklízet</span>
                  <span>{g[6]}</span>
                </div>
                <div className="row">
                  <span>Orientační cena</span>
                  <span>
                    {gardenPrice(x.k).od}–{gardenPrice(x.k).do} Kč ({gardenPrice(x.k).co})
                  </span>
                </div>
                {u ? (
                  <div className="row stack">
                    <b>Jak užívat:</b> {u[0]}
                    <FormChips s={s} />
                  </div>
                ) : null}
                {u && u[6] ? (
                  <div className="row stack">
                    <b>Sušení a skladování:</b> {u[6]}
                  </div>
                ) : null}
              </div>
              {w.map((y, i) => (
                <div key={i} className="alert warn">
                  <b>Pozor:</b> {y.t}
                </div>
              ))}
              <div>
                <SpeciesLink k={x.k} className="btn ghost">
                  Studie a podrobnosti
                </SpeciesLink>
              </div>
            </article>
          );
        }),
      ])}
      <p className="note">
        Rady k pěstování jsou obecné a sestavené z běžných zahradnických zásad; termíny platí pro
        střední polohy ČR.
      </p>
    </>
  );
}
