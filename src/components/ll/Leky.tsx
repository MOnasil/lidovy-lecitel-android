import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SP, interactions } from "@/lib/ll/data";
import { MED, MED_GROUPS } from "@/lib/ll/meds";
import { searchMedsAll } from "@/lib/ll/medsSukl";
import { useApp } from "@/lib/ll/store";
import { SpeciesLink } from "./common";

/** Account box at the top of the profile: who is signed in, name change, sign out. */
export function UcetBox() {
  const { account, saveName, signOut, syncError } = useApp();
  const [name, setName] = useState("");
  const [saved, setSaved] = useState<"" | "ok" | "err">("");
  useEffect(() => setName(account?.name ?? ""), [account?.name]);

  if (account === undefined) return null;
  if (!account)
    return (
      <section className="box feat">
        <h2>Užíváte léky?</h2>
        <p>
          Vytvořte si účet a zapište si léky, které berete. Aplikace pak u bylin a hub upozorní na
          možné střety s nimi.
        </p>
        <div>
          <Link to="/auth" className="btn">
            Přihlásit se nebo vytvořit účet
          </Link>
        </div>
      </section>
    );

  return (
    <section className="box">
      <h2>Můj účet</h2>
      <p className="note">Přihlášen(a) jako {account.email}</p>
      <form
        className="ask compact"
        onSubmit={async (e) => {
          e.preventDefault();
          setSaved((await saveName(name)) ? "ok" : "err");
        }}
      >
        <input
          value={name}
          onChange={(e) => (setName(e.target.value), setSaved(""))}
          maxLength={80}
          aria-label="Jméno"
          placeholder="Vaše jméno"
        />
        <button type="submit" className="btn ghost">
          Uložit jméno
        </button>
      </form>
      {saved == "ok" ? <p className="note">Jméno uloženo.</p> : null}
      {saved == "err" || syncError ? (
        <div className="alert crit" role="alert">
          Změny se nepodařilo uložit. Zkontrolujte připojení k internetu a zkuste to znovu.
        </div>
      ) : null}
      <div>
        <button type="button" className="btn ghost" onClick={() => void signOut()}>
          Odhlásit se
        </button>
      </div>
    </section>
  );
}

/** Medicine picker + overview of herbs that may clash with the chosen medicines (signed in only). */
export function LekyBox() {
  const { account, meds, setMeds, medsOther, saveMedsOther } = useApp();
  const [q, setQ] = useState("");
  const [other, setOther] = useState("");
  useEffect(() => setOther(medsOther), [medsOther]);
  if (!account) return null;

  const found = searchMedsAll(q);
  const toggle = (k: string, on: boolean) =>
    setMeds(on ? [...meds, k] : meds.filter((m) => m != k));
  const hits = interactions(meds);

  return (
    <>
      <section className="box">
        <h2>Léky, které užívám</h2>
        <p className="note">
          Zaškrtněte léky, které pravidelně berete. U bylin a hub, které se s nimi nemusí snášet,
          uvidíte červené upozornění „Možný střet s lékem“. Seznam ukládáme k vašemu účtu a vidíte
          ho jen vy.
        </p>
        {meds.length ? (
          <div className="chips" aria-label="Vybrané léky">
            {meds.map((k) =>
              MED[k] ? (
                <button
                  key={k}
                  type="button"
                  className="chip sm"
                  aria-pressed="true"
                  onClick={() => toggle(k, false)}
                  title="Odebrat"
                >
                  {MED[k]!.n} ✕
                </button>
              ) : null,
            )}
          </div>
        ) : null}
        <div className="ask">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Hledat lék, např. Xarelto nebo Euthyrox"
            aria-label="Hledat lék"
          />
        </div>
        <div className="medlist">
          {found.length ? (
            MED_GROUPS.map((g) => {
              const inG = found.filter((x) => x.m.g == g);
              if (!inG.length) return null;
              return (
                <div key={g}>
                  <h4 className="fgrp">{g}</h4>
                  {inG.map(({ m, via }) => (
                    <label key={m.k} className="check" htmlFor={`m-${m.k}`}>
                      <input
                        type="checkbox"
                        id={`m-${m.k}`}
                        checked={meds.includes(m.k)}
                        onChange={(e) => toggle(m.k, e.target.checked)}
                      />
                      <span>
                        {m.n}
                        {via.length ? (
                          <span className="note"> – nalezeno: {via.join(", ")}</span>
                        ) : null}
                      </span>
                    </label>
                  ))}
                </div>
              );
            })
          ) : (
            <p className="note">Tento lék v seznamu nemáme. Napište ho prosím do pole níže.</p>
          )}
        </div>
        <label className="field">
          Jiné léky, které v seznamu nejsou
          <textarea
            value={other}
            onChange={(e) => setOther(e.target.value)}
            onBlur={() => other != medsOther && saveMedsOther(other)}
            maxLength={1000}
            rows={2}
            placeholder="Např. Prednison, Milurit…"
          />
          <span className="note">
            Tyto léky zatím neumíme automaticky porovnat s bylinami – u každé byliny ale uvidíte
            obecné upozornění, pokud ovlivňuje léky. Poraďte se s lékárníkem.
          </span>
        </label>
      </section>
      {meds.length ? (
        <section className="box">
          <h3>Možné střety s vašimi léky</h3>
          {hits.map(({ med, items }) => (
            <details key={med.k}>
              <summary>
                {med.n}:{" "}
                {items.length
                  ? `${items.length} ${items.length == 1 ? "bylina" : items.length < 5 ? "byliny" : "bylin"}`
                  : "žádný známý střet"}
              </summary>
              {items.length ? (
                <ul className="ints">
                  {items.map((x) => (
                    <li key={x.k}>
                      <SpeciesLink k={x.k}>{SP[x.k]!.cz}</SpeciesLink> –{" "}
                      <span className="note">{x.t}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="note">
                  V našich datech jsme nenašli žádnou bylinu, která by s tímto lékem měla známý
                  střet. To ale neznamená, že žádný neexistuje.
                </p>
              )}
            </details>
          ))}
          <p className="note">
            Přehled vychází z upozornění u jednotlivých bylin a není úplný. Před užitím bylin se
            vždy poraďte s lékárníkem nebo lékařem.
          </p>
        </section>
      ) : null}
    </>
  );
}
