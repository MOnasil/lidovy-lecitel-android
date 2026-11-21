import { Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { CONDS, D, FLAGS, SP, fmt, norm } from "@/lib/ll/data";
import {
  AVATAR_PRESETS,
  avatarSrc,
  ownAvatarEnabled,
  shrinkPhoto,
  uploadOwnAvatar,
} from "@/lib/ll/avatars";
import { potizeOf, recommendFor } from "@/lib/ll/doporuceni";
import { MED } from "@/lib/ll/meds";
import { searchMedsAll } from "@/lib/ll/medsSukl";
import { isApp } from "@/lib/ll/platform";
import { nameTerm } from "@/lib/ll/display";
import { useApp } from "@/lib/ll/store";
import { understand } from "@/lib/ll/understand";
import { MineButtons, Pill, SpeciesLink } from "./common";
import { StretyBox } from "./Leky";
import { formsLabel, usedFor } from "./MojeVysadba";
import { photo } from "@/lib/ll/photos";
import { Welcome } from "./Welcome";

/** Avatar picker: six plant pictures, or an own photo where uploads are available (Android app). */
export function AvatarPicker({ value, onPick }: { value: string; onPick: (a: string) => void }) {
  const { account } = useApp();
  const file = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);
  return (
    <div className="av-pick">
      {ownAvatarEnabled() && account ? (
        <>
          <button
            type="button"
            className="av-opt av-up"
            disabled={busy}
            onClick={() => file.current?.click()}
          >
            <span className="av-up-ic">{busy ? "…" : "📷"}</span>
            <span>Vlastní fotka</span>
          </button>
          <input
            ref={file}
            type="file"
            accept="image/*"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setBusy(true);
              setErr(false);
              const blob = await shrinkPhoto(f);
              const ok = blob ? await uploadOwnAvatar(blob) : false;
              setBusy(false);
              if (ok) onPick("own:" + Date.now());
              else setErr(true);
            }}
          />
        </>
      ) : null}
      {AVATAR_PRESETS.map((p) => (
        <button
          key={p.k}
          type="button"
          className="av-opt"
          aria-pressed={value == p.k}
          onClick={() => onPick(p.k)}
          title={p.n}
        >
          <img src={avatarSrc(p.k) ?? ""} alt="" />
          <span>{p.n}</span>
        </button>
      ))}
      {err ? <p className="note">Fotku se nepodařilo nahrát. Zkuste to znovu.</p> : null}
    </div>
  );
}

function ProfilHead() {
  const { account, avatar, setAvatar, theme, setTheme, saveName, signOut, syncError } = useApp();
  const [pick, setPick] = useState(false);
  const [edit, setEdit] = useState(false);
  const [name, setName] = useState("");
  const src = avatarSrc(avatar);
  const shown = account?.name ?? "";
  const startEdit = () => {
    setName(shown);
    setEdit(true);
  };
  return (
    <section className="box prof-head">
      <div className="ph-row">
        <button
          type="button"
          className="ph-av"
          onClick={() => setPick((v) => !v)}
          aria-label="Změnit profilový obrázek"
        >
          {src ? <img src={src} alt="" /> : <span>👤</span>}
          <i aria-hidden="true">✏️</i>
        </button>
        <div className="ph-main">
          {account ? (
            edit || !shown ? (
              <form
                className="ph-name-edit"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (await saveName(name)) setEdit(false);
                }}
              >
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={80}
                  placeholder="Vaše jméno"
                  aria-label="Jméno"
                  autoFocus={edit}
                />
                <button type="submit" className="btn sm" aria-label="Uložit jméno">
                  ✓
                </button>
              </form>
            ) : (
              <h2 className="ph-name">
                {shown}{" "}
                <button
                  type="button"
                  className="ph-pen"
                  onClick={startEdit}
                  aria-label="Upravit jméno"
                >
                  ✏️
                </button>
              </h2>
            )
          ) : (
            <h2 className="ph-name">Můj profil</h2>
          )}
          <p className="note">
            {account ? account.email : "Nejste přihlášeni – profil zůstává jen v tomto zařízení."}
          </p>
        </div>
      </div>
      <div className="theme-seg" role="group" aria-label="Vzhled">
        <span className="theme-lbl">Vzhled:</span>
        <button type="button" aria-pressed={theme != "dark"} onClick={() => setTheme("light")}>
          ☀️ Světlý
        </button>
        <button type="button" aria-pressed={theme == "dark"} onClick={() => setTheme("dark")}>
          🌙 Tmavý
        </button>
      </div>
      {pick ? (
        <AvatarPicker
          value={avatar}
          onPick={(a) => {
            setAvatar(a);
            setPick(false);
          }}
        />
      ) : null}
      {syncError ? (
        <div className="alert crit" role="alert">
          Změny se nepodařilo uložit. Zkontrolujte připojení k internetu a zkuste to znovu.
        </div>
      ) : null}
      <div className="ph-actions">
        {account ? (
          <button type="button" className="btn ghost sm" onClick={() => void signOut()}>
            Odhlásit se
          </button>
        ) : (
          <Link to="/auth" className="btn">
            Přihlásit se nebo vytvořit účet
          </Link>
        )}
      </div>
    </section>
  );
}

/** Medicines the catalogue does not know, kept one per line in "meds_other". */
export const ownMeds = (t: string) =>
  t
    .split(/\n|;|,/)
    .map((x) => x.trim())
    .filter(Boolean);

/** Medicine products whose name mentions a herb they do not contain (from the SÚKL list). */
export function nameOnly(q: string): { herb: string; name: string; latky: string[] }[] {
  const nq = norm(q.trim());
  if (nq.length < 3) return [];
  const out: { herb: string; name: string; latky: string[] }[] = [];
  for (const [k, list] of Object.entries(D.jvn ?? {}))
    for (const [name, latky] of list)
      if (norm(name).includes(nq)) out.push({ herb: nameTerm(k, name), name, latky });
  return out.slice(0, 5);
}

/** One search for illnesses, allergies and medicines; chosen items as removable chips. */
export function ZdraviLeky({
  title = "Moje zdraví a léky",
  compact,
}: {
  title?: string;
  compact?: boolean;
}) {
  const { account, prof, toggleProf, meds, setMeds, medsOther, saveMedsOther } = useApp();
  const [q, setQ] = useState("");
  const nq = norm(q.trim());
  const cond = [
    ...FLAGS.map(([k, n]) => ({ k, n })),
    ...CONDS.map((c) => ({ k: c.k, n: c.n, kw: c.kw })),
  ];
  const condHits = nq
    ? cond.filter((c) => norm(c.n + " " + ("kw" in c ? c.kw : "")).includes(nq))
    : [];
  const medHits = nq && nq.length >= 2 ? searchMedsAll(q).slice(0, 12) : [];
  const fake = nameOnly(q);
  const chosenCond = cond.filter((c) => prof.has(c.k));
  const own = ownMeds(medsOther);
  const toggleMed = (k: string) =>
    setMeds(meds.includes(k) ? meds.filter((m) => m != k) : [...meds, k]);
  const addOwn = (t: string) => {
    const v = t.trim().slice(0, 60);
    if (v && !own.some((x) => norm(x) == norm(v))) saveMedsOther([...own, v].join("\n"));
    setQ("");
  };
  const dropOwn = (t: string) => saveMedsOther(own.filter((x) => x != t).join("\n"));
  return (
    <section className="box">
      <h2>{title}</h2>
      {compact ? null : (
        <p className="note">
          Podle profilu označíme byliny a houby, které pro vás nejsou vhodné, a upozorníme na možné
          střety s léky.{" "}
          {account
            ? "Profil ukládáme k vašemu účtu; vidíte ho jen vy."
            : "Dokud nejste přihlášeni, zůstávají údaje jen v tomto zařízení."}
        </p>
      )}
      <div className="ask">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Napište nemoc, alergii nebo lék, např. astma, Euthyrox"
          aria-label="Hledat nemoc, alergii nebo lék"
        />
      </div>
      {nq ? (
        <div className="zl-hits">
          {condHits.map((c) => (
            <button
              key={c.k}
              type="button"
              className="zl-hit"
              aria-pressed={prof.has(c.k)}
              onClick={() => (toggleProf(c.k, !prof.has(c.k)), setQ(""))}
            >
              🩺 {c.n} <span className="zl-add">{prof.has(c.k) ? "✓ v profilu" : "➕ přidat"}</span>
            </button>
          ))}
          {medHits.map(({ m, via }) => (
            <button
              key={m.k}
              type="button"
              className="zl-hit"
              aria-pressed={meds.includes(m.k)}
              onClick={() => (toggleMed(m.k), setQ(""))}
            >
              💊 {m.n}
              {via.length ? <span className="note"> – {via.slice(0, 3).join(", ")}</span> : null}
              <span className="zl-add">
                {meds.includes(m.k) ? "✓ moje léky" : "➕ k mým lékům"}
              </span>
            </button>
          ))}
          {fake.map((f) => (
            <div key={f.name} className="alert ix-warn">
              ⚠️ <b>{f.name}</b> má v názvu „{f.herb.toLowerCase()}“, ale podle registrace tuto
              rostlinu neobsahuje.{" "}
              {f.latky.length
                ? `Účinné látky: ${f.latky.join(", ")}.`
                : "Jde o potravinu pro zvláštní lékařské účely, název označuje jen příchuť."}
            </div>
          ))}
          {q.trim().length >= 3 ? (
            <button type="button" className="zl-hit zl-own" onClick={() => addOwn(q)}>
              ➕ Přidat „{q.trim().slice(0, 60)}“ jako vlastní lék
            </button>
          ) : null}
        </div>
      ) : null}
      {chosenCond.length || meds.length || own.length ? (
        <div className="chips" aria-label="Vybráno">
          {chosenCond.map((c) => (
            <button
              key={c.k}
              type="button"
              className="chip sm"
              aria-pressed="true"
              onClick={() => toggleProf(c.k, false)}
            >
              🩺 {c.n.length > 48 ? c.n.slice(0, 46) + "…" : c.n} ✕
            </button>
          ))}
          {meds.map((k) =>
            MED[k] ? (
              <button
                key={k}
                type="button"
                className="chip sm"
                aria-pressed="true"
                onClick={() => toggleMed(k)}
              >
                💊 {MED[k]!.n} ✕
              </button>
            ) : null,
          )}
          {own.map((t) => (
            <button
              key={t}
              type="button"
              className="chip sm own-med"
              aria-pressed="true"
              onClick={() => dropOwn(t)}
              title="U vlastního léku střety nehlídáme – zeptejte se lékárníka."
            >
              💊 {t} ✕
            </button>
          ))}
        </div>
      ) : null}
      {own.length ? (
        <p className="note">
          U vlastních léků střety s bylinami nehlídáme – zeptejte se lékárníka.
        </p>
      ) : null}
      {compact ? null : (
        <>
          <h4 className="fgrp">Nejčastější</h4>
          <div>
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
        </>
      )}
    </section>
  );
}

/** "Vymazat moje data" with an in-app confirmation. */
function ResetBox() {
  const { resetData } = useApp();
  const [ask, setAsk] = useState(false);
  const [done, setDone] = useState(false);
  return (
    <section className="box">
      <h3>Začít znovu</h3>
      {done ? <p className="note">✓ Hotovo – vaše data jsme vymazali.</p> : null}
      {!ask ? (
        <button
          type="button"
          className="btn ghost danger"
          onClick={() => (setAsk(true), setDone(false))}
        >
          🗑️ Vymazat moje data a začít znovu
        </button>
      ) : (
        <div className="alert crit" role="alertdialog" aria-label="Potvrzení vymazání">
          <p>
            <b>Opravdu vymazat všechna vaše data?</b> Smažou se nemoci, alergie, léky, uložené
            potíže, seznam Mám doma a Zahrádka. Přihlášení, jméno, profilový obrázek a vzhled
            zůstanou. Nejde to vrátit.
          </p>
          <div className="row-btns">
            <button
              type="button"
              className="btn danger"
              onClick={async () => {
                await resetData();
                setAsk(false);
                setDone(true);
              }}
            >
              Vymazat
            </button>
            <button type="button" className="btn ghost" onClick={() => setAsk(false)}>
              Zrušit
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function Potize() {
  const { prof, toggleProf } = useApp();
  const [q, setQ] = useState("");
  const [miss, setMiss] = useState(false);
  const pot = potizeOf(prof);
  return (
    <section className="box">
      <h2>Co mě trápí</h2>
      <form
        className="ask compact"
        onSubmit={(e) => {
          e.preventDefault();
          const u = understand(q);
          const add = [...u.n.map((k) => "n:" + k), ...u.t.map((k) => "t:" + k)];
          setMiss(!add.length);
          add.forEach((f) => toggleProf(f, true));
          if (add.length) setQ("");
        }}
      >
        <input
          value={q}
          onChange={(e) => (setQ(e.target.value), setMiss(false))}
          placeholder="Např. špatně spím, bolí mě klouby"
          aria-label="Přidat potíž"
        />
        <button type="submit" className="btn">
          Přidat
        </button>
      </form>
      {miss ? <p className="note">Tomu jsem neporozuměl, zkuste to napsat jinak.</p> : null}
      {pot.length ? (
        <div className="chips">
          {pot.map((p) => (
            <button
              key={p.id}
              type="button"
              className="chip sm"
              aria-pressed="true"
              onClick={() => toggleProf(p.id, false)}
            >
              {p.n} ✕
            </button>
          ))}
        </div>
      ) : (
        <p className="note">
          Zatím nic. Potíže přidáte tady nebo tlačítkem „Uložit potíže do profilu“ u výsledků v Co
          mě trápí.
        </p>
      )}
    </section>
  );
}

function Doporuceni() {
  const { prof, doma } = useApp();
  const pot = potizeOf(prof);
  if (!pot.length) return null;
  const recs = recommendFor(prof, doma).slice(0, 8);
  return (
    <section className="box">
      <h2>💡 Doporučení pro vás</h2>
      <p className="note">
        Na vaše potíže studie naznačují přínos těchto bylin a hub. Vynechali jsme ty, které podle
        profilu nejsou vhodné.
      </p>
      {recs.length ? (
        <div className="rec-list">
          {recs.map((r) => (
            <SpeciesLink key={r.k} k={r.k} className="rec-row">
              {photo(r.k) ? <img src={photo(r.k)!} alt="" width={44} height={44} /> : null}
              <span className="rec-row-t">
                <b>{SP[r.k]!.cz.split(" (")[0]}</b>
                <small>
                  {r.for.length > 1 ? `Pomáhá na ${r.for.length} vaše potíže: ` : "Na "}
                  {r.for.join(", ").toLowerCase()} · {formsLabel(r.k)}
                </small>
              </span>
              <span className="rec-row-b">
                {r.home ? <span className="home-badge sm">🏠 Máte doma</span> : null}
                <Pill g={r.g} />
              </span>
            </SpeciesLink>
          ))}
        </div>
      ) : (
        <p className="note">K vašim potížím zatím nemáme bylinu testovanou na lidech.</p>
      )}
    </section>
  );
}

function MamDoma() {
  const { doma } = useApp();
  const list = doma.filter((k) => SP[k]);
  return (
    <section className="box">
      <h2>🏠 Mám doma</h2>
      {list.length ? (
        <table className="vys-table moje">
          <thead>
            <tr>
              <th>Bylina</th>
              <th>Na co</th>
              <th>Podání</th>
              <th aria-label="Odebrat" />
            </tr>
          </thead>
          <tbody className="grp-doma">
            {list.map((k) => (
              <tr key={k}>
                <td>
                  <SpeciesLink k={k} className="vys-name">
                    {photo(k) ? (
                      <img src={photo(k)!} alt="" width={28} height={28} loading="lazy" />
                    ) : null}
                    {SP[k]!.cz.split(" (")[0]}
                  </SpeciesLink>
                </td>
                <td>{usedFor(k, [])}</td>
                <td>{formsLabel(k)}</td>
                <td>
                  <MineButtons k={k} sm />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="note">Zatím nic. V Atlasu nebo u rostliny klepněte na „Mám doma“.</p>
      )}
    </section>
  );
}

export function Profil() {
  const [welcome, setWelcome] = useState(false);
  return (
    <>
      <ProfilHead />
      <ZdraviLeky />
      <StretyBox />
      <Potize />
      <Doporuceni />
      <MamDoma />
      <ResetBox />
      <section className="box">
        <h3>O aplikaci</h3>
        <p>
          Aplikace zná {D.stats.druhu} bylin a léčivých hub, rozezná {D.nem.length} konkrétních
          nemocí a příznaků a vychází z rozboru {fmt(D.stats.clanku)} volně dostupných vědeckých
          článků. Zobrazuje jen to, co studie naznačují, a to, co se tradičně používá – nic z toho
          není lékařské doporučení.
        </p>
        {isApp() ? (
          <button type="button" className="btn ghost" onClick={() => setWelcome(true)}>
            Co aplikace umí
          </button>
        ) : null}
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
      {welcome ? <Welcome force onClose={() => setWelcome(false)} /> : null}
    </>
  );
}
