import { useEffect, useState } from "react";
import { D, SP } from "@/lib/ll/data";
import {
  KEY_NOTIF,
  MES,
  dueReminders,
  gardenEvents,
  type GardenEvent,
  type Planting,
} from "@/lib/ll/garden";
import { useLocal } from "@/lib/ll/local";
import { FICON, SpeciesLink } from "./common";
import { FSHORT } from "./DruhHead";
import { useApp } from "@/lib/ll/store";
import { TOP, TP, grade } from "@/lib/ll/data";
import { photo } from "@/lib/ll/photos";

/** One or two complaints the herb is grown for: the planner's chosen ones first, else its best-backed ones. */
export function usedFor(k: string, topics: string[]): string {
  const ok = (t: string) => {
    const g = grade(k, t);
    return g != null && g != "C";
  };
  const mine = topics.filter(ok);
  const list = mine.length ? mine : TOP.map((t) => t.k).filter(ok);
  return (
    list
      .slice(0, 2)
      .map((t) => TP[t]?.n.split(/,| a /)[0]?.toLowerCase())
      .filter(Boolean)
      .join(", ") || "–"
  );
}

/** The nearest garden task (sow, care, harvest) with its month. */
function nextStep(k: string, p: Planting): { t: string; za: number } {
  const ev = gardenEvents(k, p).sort((a, b) => a.za - b.za)[0];
  if (!ev) return { t: "–", za: 99 };
  const word = ev.typ == "vysadba" ? "zasadit" : ev.typ == "sklizen" ? "sklízet" : "péče";
  const when = ev.nyni ? "teď" : MES[(new Date().getMonth() + ev.za) % 12];
  return { t: `${word}: ${when}`, za: ev.za };
}

export type { Vysadba } from "@/lib/ll/store";
type Vysadba = import("@/lib/ll/store").Vysadba;

/** Shared with every "Chci pěstovat" button (state lives in the app context). */
export function useVysadba(): [Vysadba, (f: (p: Vysadba) => Vysadba) => void] {
  const { vys, setVys } = useApp();
  return [vys, setVys];
}

const today = () => new Date().toISOString().slice(0, 10);

/** Two toggles on a plan card: "planning to plant" / "already planted". */
export function PlantButtons({
  k,
  v,
  setV,
}: {
  k: string;
  v: Vysadba;
  setV: (f: (p: Vysadba) => Vysadba) => void;
}) {
  const cur = v[k]?.stav;
  const set = (stav: Planting["stav"]) =>
    setV((p) => {
      const n = { ...p };
      if (n[k]?.stav == stav) delete n[k];
      else n[k] = { stav, od: today() };
      return n;
    });
  return (
    <div className="plant-btns">
      <button
        type="button"
        className="chip sm"
        aria-pressed={cur == "plan"}
        onClick={() => set("plan")}
      >
        Plánuji vysadit
      </button>
      <button
        type="button"
        className="chip sm"
        aria-pressed={cur == "vysazeno"}
        onClick={() => set("vysazeno")}
      >
        Už jsem vysadil
      </button>
    </div>
  );
}

async function notify(e: GardenEvent) {
  const opts = { body: e.text.slice(0, 220), tag: e.klic };
  try {
    const reg =
      "serviceWorker" in navigator ? await navigator.serviceWorker.getRegistration() : undefined;
    if (reg) await reg.showNotification(e.titulek, opts);
    else new Notification(e.titulek, opts);
  } catch {
    /* notifications unavailable */
  }
}

const notifSupported = () => typeof window != "undefined" && "Notification" in window;

type Row = { k: string; g: "vysazeno" | "plan" | "doma" };
const GROUPS: { g: Row["g"]; icon: string; t: string }[] = [
  { g: "doma", icon: "🏠", t: "Mám doma" },
  { g: "vysazeno", icon: "🌱", t: "Pěstuji" },
  { g: "plan", icon: "📝", t: "Budu pěstovat" },
];

/** Forms the herb is used in (icons + names), for the "Mám doma" rows. */
export function formsLabel(k: string): string {
  const f = SP[k]?.formy ?? [];
  return (
    f
      .slice(0, 2)
      .map((x) => `${FICON[x] ?? ""} ${FSHORT[x] ?? D.forms[x]?.[0] ?? ""}`.trim())
      .join(", ") || "–"
  );
}

/**
 * "Moje byliny a houby" at the top of Zahrádka: what the user has at home, grows and plans to grow
 * (each group with its own colour), with reminders for planting, care and harvest below.
 */
export function MojeVysadba({
  v,
  setV,
  topics = [],
}: {
  v: Vysadba;
  setV: (f: (p: Vysadba) => Vysadba) => void;
  /** complaints chosen in the garden planner – used for the "Na co" column */
  topics?: string[];
}) {
  const { doma, toggleDoma } = useApp();
  const [sent, setSent] = useLocal<string[]>(KEY_NOTIF, []);
  // "na" until mounted: the server can't know notification support, so SSR and the first client frame match.
  const [perm, setPerm] = useState<string>("na");
  const [pridat, setPridat] = useState("");
  useEffect(() => {
    if (notifSupported()) setPerm(Notification.permission);
  }, []);

  // Send each due reminder once (while the app is open; background push needs a server).
  useEffect(() => {
    const due = dueReminders(v, sent);
    if (!due.length) return;
    if (perm == "granted") due.forEach((e) => void notify(e));
    if (perm == "granted") setSent((s) => [...s, ...due.map((e) => e.klic)].slice(-300));
  }, [v, sent, perm, setSent]);

  const keys = Object.keys(v).filter((k) => SP[k] && D.garden[k]);
  const home = doma.filter((k) => SP[k]);
  const rows: Row[] = [
    ...home.map((k) => ({ k, g: "doma" as const })),
    ...keys
      .filter((k) => v[k]!.stav == "vysazeno")
      .sort((a, b) => nextStep(a, v[a]!).za - nextStep(b, v[b]!).za)
      .map((k) => ({ k, g: "vysazeno" as const })),
    ...keys
      .filter((k) => v[k]!.stav == "plan")
      .sort((a, b) => nextStep(a, v[a]!).za - nextStep(b, v[b]!).za)
      .map((k) => ({ k, g: "plan" as const })),
  ];
  const choices = D.species
    .filter((s) => s.k != "houby")
    .map((s) => s.k)
    .sort((a, b) => SP[a]!.cz.localeCompare(SP[b]!.cz, "cs"));
  const growable = !!pridat && !!D.garden[pridat];

  const plant = (k: string, stav: Planting["stav"]) =>
    setV((p) => ({ ...p, [k]: { stav, od: today() } }));
  const unplant = (k: string) =>
    setV((p) => {
      const n = { ...p };
      delete n[k];
      return n;
    });
  /** Change a row's state from the select in the table. */
  const change = (r: Row, to: string) => {
    if (to == r.g) return;
    if (r.g == "doma") toggleDoma(r.k);
    else unplant(r.k);
    if (to == "doma" && !doma.includes(r.k)) toggleDoma(r.k);
    if (to == "vysazeno" || to == "plan") plant(r.k, to);
  };

  return (
    <section className="box" id="moje-vysadba">
      <h2>Moje byliny a houby</h2>
      <p className="note">
        Co máte doma, co pěstujete a co budete pěstovat. Byliny přidáte tady, tlačítkem 🏠 Mám doma
        v Atlasu nebo v plánovači níže. U pěstovaných připomeneme, kdy sázet, jak se starat a kdy
        sklízet.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <select
          aria-label="Přidat bylinu nebo houbu"
          value={pridat}
          onChange={(e) => setPridat(e.target.value)}
          className="chip"
        >
          <option value="">Přidat bylinu nebo houbu…</option>
          {choices.map((k) => (
            <option key={k} value={k}>
              {SP[k]!.cz}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="chip sm"
          disabled={!pridat || doma.includes(pridat)}
          onClick={() => {
            if (pridat && !doma.includes(pridat)) toggleDoma(pridat);
            setPridat("");
          }}
        >
          🏠 Mám doma
        </button>
        <button
          type="button"
          className="chip sm"
          disabled={!growable}
          onClick={() => {
            if (growable) plant(pridat, "vysazeno");
            setPridat("");
          }}
        >
          🌱 Pěstuji
        </button>
        <button
          type="button"
          className="chip sm"
          disabled={!growable}
          onClick={() => {
            if (growable) plant(pridat, "plan");
            setPridat("");
          }}
        >
          📝 Budu pěstovat
        </button>
      </div>
      {pridat && !growable ? (
        <p className="note">
          Tuto bylinu u nás doma nepěstujeme – můžete ji přidat jen do Mám doma.
        </p>
      ) : null}
      {!rows.length ? (
        <p className="note">Zatím nic. Přidejte bylinu výše, v Atlasu nebo v plánu níže.</p>
      ) : (
        <table className="vys-table moje">
          <thead>
            <tr>
              <th>Bylina</th>
              <th>Na co</th>
              <th>Další krok</th>
              <th>Stav</th>
            </tr>
          </thead>
          {GROUPS.map((G) => {
            const rs = rows.filter((r) => r.g == G.g);
            if (!rs.length) return null;
            return (
              <tbody key={G.g} className={`grp-${G.g}`}>
                <tr className="grp-h">
                  <th colSpan={4}>
                    <span aria-hidden="true">{G.icon}</span> {G.t}{" "}
                    <span className="note">({rs.length})</span>
                  </th>
                </tr>
                {rs.map((r) => (
                  <tr key={r.g + r.k}>
                    <td>
                      <SpeciesLink k={r.k} className="vys-name">
                        {photo(r.k) ? (
                          <img src={photo(r.k)!} alt="" width={28} height={28} loading="lazy" />
                        ) : null}
                        {SP[r.k]!.cz.split(" (")[0]}
                      </SpeciesLink>
                    </td>
                    <td>{usedFor(r.k, topics)}</td>
                    <td>{r.g == "doma" ? formsLabel(r.k) : nextStep(r.k, v[r.k]!).t}</td>
                    <td>
                      <select
                        aria-label={`Stav: ${SP[r.k]!.cz}`}
                        className={`st-sel ${r.g}`}
                        value={r.g}
                        onChange={(e) => change(r, e.target.value)}
                      >
                        <option value="doma">🏠 doma</option>
                        {D.garden[r.k] ? <option value="vysazeno">🌱 pěstuji</option> : null}
                        {D.garden[r.k] ? <option value="plan">📝 plán</option> : null}
                        <option value="x">✕ odebrat</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            );
          })}
        </table>
      )}
      {keys.length && perm != "na" ? (
        perm == "granted" ? (
          <p className="note">
            Upozornění jsou zapnutá. Přijdou při otevření aplikace v den, kdy nastane čas.
          </p>
        ) : perm == "denied" ? (
          <p className="note">
            Upozornění jsou v prohlížeči zakázaná. Připomínky uvidíte jen tady.
          </p>
        ) : (
          <div>
            <button
              type="button"
              className="btn ghost"
              onClick={() => void Notification.requestPermission().then((p) => setPerm(p))}
            >
              Zapnout upozornění
            </button>
            <p className="note">
              Na iPhonu fungují jen u aplikace přidané na plochu (Sdílet → Přidat na plochu).
            </p>
          </div>
        )
      ) : null}
      {keys.length ? <h4 className="fgrp">Připomínky a péče</h4> : null}
      {keys.map((k) => {
        const p = v[k]!;
        const ev = gardenEvents(k, p);
        return (
          <details key={k} className="q-item">
            <summary>
              <b>{SP[k]!.cz}</b>
            </summary>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <b>
                <SpeciesLink k={k}>{SP[k]!.cz}</SpeciesLink>
              </b>
              <span className={`q-badge${p.stav == "vysazeno" ? " ok" : ""}`}>
                {p.stav == "vysazeno"
                  ? `Vysazeno ${p.od.split("-").reverse().join(". ")}`
                  : "Plánuji vysadit"}
              </span>
            </div>
            {ev.map((e) => (
              <div key={e.typ} className={`reminder${e.nyni ? "" : " later"}`}>
                <b>{e.titulek}</b>
                {!e.nyni ? (
                  <span className="note">
                    {" "}
                    – za {e.za} {e.za == 1 ? "měsíc" : e.za < 5 ? "měsíce" : "měsíců"} (
                    {MES[(new Date().getMonth() + e.za) % 12]})
                  </span>
                ) : null}
                <div>{e.text}</div>
              </div>
            ))}
            <div className="plant-btns">
              {p.stav == "plan" ? (
                <button
                  type="button"
                  className="chip sm"
                  onClick={() => setV((x) => ({ ...x, [k]: { stav: "vysazeno", od: today() } }))}
                >
                  Už jsem vysadil
                </button>
              ) : null}
              <button
                type="button"
                className="chip sm"
                onClick={() =>
                  setV((x) => {
                    const n = { ...x };
                    delete n[k];
                    return n;
                  })
                }
              >
                Odebrat
              </button>
            </div>
          </details>
        );
      })}
    </section>
  );
}
