import { useState } from "react";
import { CONDS, FLAGS, SP } from "@/lib/ll/data";
import { MED } from "@/lib/ll/meds";
import { potizeOf } from "@/lib/ll/doporuceni";
import { ownMeds } from "./Profil";
import { Link } from "@tanstack/react-router";
import {
  CENA_KC,
  KEY_LEKARNIK,
  LHUTA_H,
  MAX_ZNAKU,
  TEST_ODPOVED,
  novyDotaz,
  overDotaz,
  prvniZdarma,
  termin,
  type Dotaz,
} from "@/lib/ll/lekarnik";
import { useLocal } from "@/lib/ll/local";
import { useApp } from "@/lib/ll/store";

const fmtCas = (d: Date) =>
  d.toLocaleString("cs-CZ", {
    day: "numeric",
    month: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

/** "Zeptejte se lékárníka" – TEST VERSION: stays in this browser, nothing is sent or charged. */
export function Lekarnik() {
  const { prof, meds: medKeys, medsOther, doma } = useApp();
  const [list, setList] = useLocal<Dotaz[]>(KEY_LEKARNIK, []);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [sProfilem, setSProfilem] = useState(true);
  const [chyba, setChyba] = useState<string | null>(null);
  const [urgent, setUrgent] = useState<string | null>(null);
  const [platba, setPlatba] = useState(false);
  const zdarma = prvniZdarma(list);
  const flags = [
    ...FLAGS.filter((f) => prof.has(f[0])),
    ...CONDS.filter((c) => prof.has(c.k)).map((c) => [c.k, c.n] as [string, string]),
  ];
  const medNames = [
    ...medKeys.map((k) => MED[k]?.n).filter((x): x is string => !!x),
    ...ownMeds(medsOther),
  ];
  const meds = medNames.length;
  const pot = potizeOf(prof).map((p) => p.n);
  const home = doma.filter((k) => SP[k]).map((k) => SP[k]!.cz.split(" (")[0]!);
  const short = (n: string) => (n.length > 50 ? n.slice(0, 48) + "…" : n);

  function odeslat(placeno: boolean) {
    const v = overDotaz(q);
    if (!v.ok) {
      if (v.urgent) {
        setUrgent(v.urgent);
        setChyba(null);
      } else setChyba(v.duvod);
      return;
    }
    if (!zdarma && !placeno) {
      setPlatba(true);
      return;
    }
    setList((l) => [novyDotaz(q, sProfilem, !zdarma), ...l]);
    setQ("");
    setChyba(null);
    setUrgent(null);
    setPlatba(false);
    setOpen(false);
  }

  return (
    <section className="box ask-ph" id="lekarnik">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3>Zeptejte se lékárníka</h3>
        <span className="test-tag">testovací verze</span>
      </div>
      <p className="note">
        Napište otázku k bylinám, houbám nebo jejich kombinaci s léky. Odpověď od lékárníka
        dostanete do {LHUTA_H} hodin.{" "}
        {zdarma ? <b>První otázka je zdarma.</b> : <>Další otázka stojí {CENA_KC} Kč.</>}
      </p>
      {!open ? (
        <div>
          <button type="button" className="btn" onClick={() => setOpen(true)}>
            Položit otázku
          </button>
        </div>
      ) : null}
      <div className="lek-sum">
        {medNames.length || flags.length || pot.length || home.length ? (
          <>
            {medNames.length ? (
              <p>
                💊 <b>Léky:</b> {medNames.join(", ")}
              </p>
            ) : null}
            {flags.length ? (
              <p>
                🩺 <b>Nemoci a alergie:</b> {flags.map((f) => short(f[1])).join(", ")}
              </p>
            ) : null}
            {pot.length ? (
              <p>
                😣 <b>Co mě trápí:</b> {pot.join(", ").toLowerCase()}
              </p>
            ) : null}
            {home.length ? (
              <p>
                🏠 <b>Mám doma:</b> {home.join(", ")}
              </p>
            ) : null}
            <Link to="/profil" className="note">
              Upravit v profilu
            </Link>
          </>
        ) : (
          <p className="note">
            <Link to="/profil">Vyplňte léky a potíže v profilu</Link> – lékárník vám odpoví
            přesněji.
          </p>
        )}
      </div>
      {!open ? null : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            odeslat(false);
          }}
          className="flex flex-col gap-2"
        >
          <label htmlFor="lek-q" className="note">
            Vaše otázka
          </label>
          <textarea
            id="lek-q"
            value={q}
            maxLength={MAX_ZNAKU}
            placeholder="Např. Můžu pít meduňkový čaj, když beru léky na spaní?"
            onChange={(e) => {
              setQ(e.target.value);
              setPlatba(false);
            }}
          />
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={sProfilem}
              onChange={(e) => setSProfilem(e.target.checked)}
            />
            <span>
              Připojit k dotazu přehled výše
              {flags.length || meds
                ? ` (${[flags.length ? `${flags.length} zdravotních omezení` : "", meds ? `${meds} léků` : ""].filter(Boolean).join(", ")})`
                : " (zatím prázdný)"}
              , aby lékárník věděl, co užíváte.
            </span>
          </label>
          {urgent ? (
            <div className="alert crit alert-lg">
              <b>Na tohle nečekejte 24 hodin.</b> {urgent}
            </div>
          ) : null}
          {chyba ? <div className="alert warn">{chyba}</div> : null}
          {platba ? (
            <div className="alert warn">
              <p>
                <b>Tato otázka je placená ({CENA_KC} Kč).</b> V testovací verzi se nic neúčtuje –
                platbu jen simulujeme.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" className="btn" onClick={() => odeslat(true)}>
                  Zaplatit {CENA_KC} Kč (test) a odeslat
                </button>
                <button type="button" className="btn ghost" onClick={() => setPlatba(false)}>
                  Zpět
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button type="submit" className="btn">
                {zdarma ? "Odeslat zdarma" : `Pokračovat k platbě (${CENA_KC} Kč)`}
              </button>
              <button type="button" className="btn ghost" onClick={() => setOpen(false)}>
                Zrušit
              </button>
            </div>
          )}
          <p className="note">
            Lékárník neurčuje diagnózu a nenahrazuje lékaře. V testovací verzi zůstává otázka jen v
            tomto prohlížeči a nikam se neodesílá.
          </p>
        </form>
      )}
      {list.length ? (
        <div className="flex flex-col gap-2">
          <h4 className="fgrp">Moje otázky</h4>
          {list.map((d) => (
            <div key={d.id} className="q-item">
              <span className={`q-badge${d.odpoved ? " ok" : ""}`}>
                {d.odpoved ? "Zodpovězeno" : `Čeká na odpověď – nejpozději ${fmtCas(termin(d))}`}
              </span>
              <p>
                <b>Otázka:</b> {d.q}
              </p>
              <p className="note">
                Položeno {fmtCas(new Date(d.ts))} ·{" "}
                {d.placeno ? `placená (${CENA_KC} Kč, test)` : "zdarma"}
                {d.profil ? " · s profilem" : ""}
              </p>
              {d.odpoved ? (
                <p>
                  <b>Lékárník:</b> {d.odpoved}
                </p>
              ) : (
                <div>
                  <button
                    type="button"
                    className="chip sm"
                    onClick={() =>
                      setList((l) =>
                        l.map((x) =>
                          x.id == d.id
                            ? { ...x, odpoved: TEST_ODPOVED, odpovezeno: Date.now() }
                            : x,
                        ),
                      )
                    }
                  >
                    Simulovat odpověď lékárníka (jen test)
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
