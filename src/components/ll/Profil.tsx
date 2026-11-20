import { useState } from "react";
import { CONDS, D, FLAGS, SP, fmt, norm } from "@/lib/ll/data";
import { useApp, type Theme } from "@/lib/ll/store";
import { FavButton, SpeciesLink } from "./common";
import { LekyBox, UcetBox } from "./Leky";

export function Profil() {
  const { account, prof, toggleProf, theme, setTheme, favs } = useApp();
  const [cq, setCq] = useState("");
  const nq = norm(cq.trim());
  const flags = FLAGS.filter((f) => !nq || norm(f[1]).includes(nq));
  const conds = CONDS.filter((c) => !nq || norm(c.n + " " + c.kw).includes(nq));
  const themes: [Theme, string][] = [
    ["light", "Světlý"],
    ["dark", "Tmavý"],
  ];
  return (
    <>
      <UcetBox />
      <section className="box">
        <h2>Můj zdravotní profil</h2>
        <p className="note">
          Podle profilu označíme byliny a houby, které pro vás nejsou vhodné.{" "}
          {account
            ? "Protože jste přihlášeni, ukládáme profil k vašemu účtu, abyste ho měli na všech zařízeních. Vidíte ho jen vy a kdykoli ho můžete změnit."
            : "Dokud nejste přihlášeni, zůstávají údaje jen v tomto prohlížeči a nikam se neposílají."}
        </p>
        <div className="ask">
          <input
            value={cq}
            onChange={(e) => setCq(e.target.value)}
            placeholder="Hledat nemoc nebo alergii, např. astma, štítná žláza"
            aria-label="Hledat nemoc nebo alergii"
          />
        </div>
        <div>
          {flags.map((f) => (
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
        {conds.length ? <h4 className="fgrp">Další nemoci a alergie</h4> : null}
        <div>
          {conds.map((c) => (
            <label key={c.k} className="check" htmlFor={`p-${c.k}`}>
              <input
                type="checkbox"
                id={`p-${c.k}`}
                checked={prof.has(c.k)}
                onChange={(e) => toggleProf(c.k, e.target.checked)}
              />
              <span>{c.n}</span>
            </label>
          ))}
        </div>
        {!flags.length && !conds.length ? <p className="note">Nic nenalezeno.</p> : null}
      </section>
      {account ? (
        <section className="box" id="seznam">
          <h2>Můj seznam bylin</h2>
          {favs.filter((k) => SP[k]).length ? (
            <div className="rows">
              {favs
                .filter((k) => SP[k])
                .map((k) => (
                  <div key={k} className="row">
                    <SpeciesLink k={k}>{SP[k]!.cz}</SpeciesLink>
                    <FavButton k={k} />
                  </div>
                ))}
            </div>
          ) : (
            <p className="note">
              Zatím prázdný. U byliny klepněte na ☆ „Uložit do seznamu“ – v doporučeních i na
              stránce rostliny.
            </p>
          )}
        </section>
      ) : null}
      <LekyBox />
      <section className="box">
        <h3>Vzhled</h3>
        <div className="chips">
          {themes.map((x) => (
            <button
              key={x[0]}
              type="button"
              className="chip"
              aria-pressed={theme == x[0]}
              onClick={() => setTheme(x[0])}
            >
              {x[1]}
            </button>
          ))}
        </div>
      </section>
      <section className="box">
        <h3>O aplikaci</h3>
        <p>
          Aplikace zná {D.stats.druhu} bylin a léčivých hub, rozezná {D.nem.length} konkrétních
          nemocí a příznaků a vychází z rozboru {fmt(D.stats.clanku)} volně dostupných vědeckých
          článků. Zobrazuje jen to, co studie naznačují, a to, co se tradičně používá – nic z toho
          není lékařské doporučení.
        </p>
        <p>
          <b>Připravujeme:</b> rozpoznání rostlin z fotky, dotaz na lékárníka (první zdarma, odpověď
          do 24 hodin), vstřebatelnost podle studií, včelí produkty.
        </p>
      </section>
      <section className="box">
        <h3>Zdroje a licence</h3>
        <p className="note">
          Studie: články s otevřenou licencí (CC BY, CC BY-SA, CC0) z Europe PMC; u každé je odkaz
          na zdroj. Fotografie: Wikimedia Commons, autor a licence jsou uvedeny u každé fotky.
          Výskyt: GBIF.org (CC BY 4.0, CC0). Hranice ČR: Natural Earth (volné dílo). Bezpečnost pro
          játra: LiverTox, NIDDK/NIH (volné dílo). Lidové názvy: česká Wikipedie (CC BY-SA 4.0).
          Užívání, dostupnost a zpracování jsou obecné informace.
        </p>
      </section>
    </>
  );
}
