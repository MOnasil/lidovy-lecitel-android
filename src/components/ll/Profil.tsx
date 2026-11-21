import { Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { CONDS, D, FLAGS, SP, fmt, norm } from "@/lib/ll/data";
import { myRisks } from "@/lib/ll/risks";
import { showIntroAgain } from "./Uvod";
import {
  AVATAR_PRESETS,
  avatarSrc,
  blobToDataUrl,
  ownAvatarEnabled,
  saveLocalAvatar,
  shrinkPhoto,
  uploadOwnAvatar,
} from "@/lib/ll/avatars";
import { potizeOf, recommendFor } from "@/lib/ll/doporuceni";
import { MED } from "@/lib/ll/meds";
import { isApp } from "@/lib/ll/platform";
import { nameTerm } from "@/lib/ll/display";
import { useApp } from "@/lib/ll/store";
import { Pill, SpeciesLink } from "./common";
import { formsLabel } from "./MojeVysadba";
import { photo } from "@/lib/ll/photos";
import { Welcome } from "./Welcome";

/** Avatar picker: own photo first (to the account where uploads exist, else on this device), then six painted pictures. */
export function AvatarPicker({ value, onPick }: { value: string; onPick: (a: string) => void }) {
  const { account } = useApp();
  const file = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);
  return (
    <div className="av-pick">
      <button
        type="button"
        className="av-opt av-up"
        disabled={busy}
        onClick={() => file.current?.click()}
        title="Vlastní fotka"
      >
        <span className="av-up-ic">{busy ? "…" : "📷"}</span>
        <span>Vlastní foto</span>
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
          let ok = false;
          let v = "";
          if (blob && ownAvatarEnabled() && account) {
            ok = await uploadOwnAvatar(blob);
            v = "own:" + Date.now();
          } else if (blob) {
            ok = saveLocalAvatar(await blobToDataUrl(blob));
            v = "local:" + Date.now();
          }
          setBusy(false);
          e.target.value = "";
          if (ok) onPick(v);
          else setErr(true);
        }}
      />
      {AVATAR_PRESETS.map((p) => (
        <button
          key={p.k}
          type="button"
          className="av-opt"
          aria-pressed={value == p.k}
          onClick={() => onPick(p.k)}
          title={p.n}
        >
          <img src={avatarSrc(p.k) ?? ""} alt={p.n} />
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

/** One search for illnesses, complaints, allergies and medicines; chosen items as removable chips. */
/** Read-only overview of the profile; editing lives in "Moje léky" and "Moje zahrádka". */
function ProfilPrehled() {
  const { prof, meds, medsOther, doma } = useApp();
  const herb = (k: string) => SP[k]!.cz.split(" (")[0]!;
  const uz = [
    ...meds.map((k) => MED[k]?.n.split(" (")[0]).filter((x): x is string => !!x),
    ...ownMeds(medsOther),
    ...[...prof].filter((f) => f.startsWith("uz:") && SP[f.slice(3)]).map((f) => herb(f.slice(3))),
  ];
  const conds = [...FLAGS.map(([k, n]) => ({ k, n })), ...CONDS.map((c) => ({ k: c.k, n: c.n }))]
    .filter((c) => c.k != "leky" && prof.has(c.k))
    .map((c) => (c.n.length > 48 ? c.n.slice(0, 46) + "…" : c.n));
  const pot = potizeOf(prof).map((p) => p.n);
  const home = [
    ...[...prof]
      .filter((f) => f.startsWith("dm:") && MED[f.slice(3)])
      .map((f) => MED[f.slice(3)]!.n.split(" (")[0]!),
    ...[...prof].filter((f) => f.startsWith("dmo:")).map((f) => f.slice(4)),
    ...doma.filter((k) => SP[k]).map(herb),
  ];
  const row = (h: string, items: string[], to: "/interakce" | "/", where: string) => (
    <p>
      <span className="pchips-h">{h}</span>
      {items.length ? (
        items.map((n) => (
          <span key={n} className="chip sm static">
            {n}
          </span>
        ))
      ) : (
        <span className="note">Zatím nic.</span>
      )}
      <Link to={to} className="chip sm ghost-chip">
        {items.length ? "Upravit" : "Vyplnit"} v {where} ›
      </Link>
    </p>
  );
  return (
    <section className="box">
      <h2>Moje léky a byliny</h2>
      <p className="note">
        Podle toho označíme byliny, které pro vás nejsou vhodné, a doporučíme byliny na vaše potíže.
      </p>
      <div className="pchips">
        {row("💊 Pravidelně používám", uz, "/interakce", "Moje léky")}
        {row("🩺 Nemoci a stavy", conds, "/interakce", "Moje léky")}
        {row("🏠 Mám doma", home, "/interakce", "Moje léky")}
        {row("😣 Co mě trápí", pot, "/", "Co mě trápí")}
      </div>
    </section>
  );
}

/** Links from the profile to what it changes elsewhere: clashes (Interakce) and recommendations. */
function ProfilLinks() {
  const { prof } = useApp();
  const n = useMemo(() => myRisks(prof).length, [prof]);
  if (!n) return null;
  return (
    <Link to="/interakce" className="box prof-link">
      ⚠️{" "}
      <b>
        {n} {n == 1 ? "možný střet" : n < 5 ? "možné střety" : "možných střetů"}
      </b>{" "}
      s bylinami podle vašeho profilu <span aria-hidden="true">›</span>
    </Link>
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

export function Profil() {
  const [welcome, setWelcome] = useState(false);
  return (
    <>
      <ProfilHead />
      <ProfilPrehled />
      <ProfilLinks />
      <Doporuceni />
      <ResetBox />
      <section className="box">
        <h3>O aplikaci</h3>
        <p>
          Aplikace zná {D.stats.druhu} bylin a léčivých hub, rozezná {D.nem.length} konkrétních
          nemocí a příznaků a vychází z rozboru {fmt(D.stats.clanku)} volně dostupných vědeckých
          článků. Zobrazuje jen to, co studie naznačují, a to, co se tradičně používá – nic z toho
          není lékařské doporučení.
        </p>
        <p className="row-btns">
          <button type="button" className="linkish" onClick={showIntroAgain}>
            Jak aplikace funguje
          </button>
          <Link to="/soukromi">Ochrana osobních údajů (GDPR)</Link>
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
