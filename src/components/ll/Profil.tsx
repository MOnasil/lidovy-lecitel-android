import { Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { CONDS, D, FLAGS, NM, SP, TP, fmt, norm } from "@/lib/ll/data";
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
import { isKnownPlain, searchMedsAll, searchSuklPlain } from "@/lib/ll/medsSukl";
import { isApp } from "@/lib/ll/platform";
import { nameTerm } from "@/lib/ll/display";
import { useApp } from "@/lib/ll/store";
import { understand } from "@/lib/ll/understand";
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

/** The six medicines people take most often, offered as one-tap picks. */
const QUICK_MEDS = ["paracetamol", "nsaid", "antikoncepce", "tlak", "statiny", "stitna"];
const QUICK_LABEL: Record<string, string> = {
  paracetamol: "Paralen (paracetamol)",
  nsaid: "Ibalgin / Nurofen (ibuprofen)",
  antikoncepce: "Hormonální antikoncepce",
  tlak: "Léky na tlak",
  statiny: "Léky na cholesterol (statiny)",
  stitna: "Euthyrox (štítná žláza)",
};

const cap = (n: string) => (n ? n[0]!.toUpperCase() + n.slice(1).toLowerCase() : n);

/** One search for illnesses, complaints, allergies and medicines; chosen items as removable chips. */
/** The one place to enter medicines, illnesses and complaints (used on "Moje léky"). */
export function ZdraviLeky({ title = "Přidat lék nebo nemoc" }: { title?: string }) {
  const { prof, toggleProf, meds, setMeds, medsOther, saveMedsOther } = useApp();
  const [q, setQRaw] = useState("");
  const inp = useRef<HTMLInputElement>(null);
  // after picking a result the field empties but stays ready for the next medicine
  const setQ = (v: string) => {
    setQRaw(v);
    if (!v) setTimeout(() => inp.current?.focus(), 0);
  };
  const nq = norm(q.trim());
  const cond = [
    ...FLAGS.map(([k, n]) => ({ k, n })),
    ...CONDS.map((c) => ({ k: c.k, n: c.n, kw: c.kw })),
  ];
  const condHits = nq
    ? cond.filter((c) => norm(c.n + " " + ("kw" in c ? c.kw : "")).includes(nq)).slice(0, 6)
    : [];
  const u = nq.length >= 3 ? understand(q) : { n: [], t: [] };
  const potHits = [
    ...u.n.filter((k) => NM[k]).map((k) => ({ id: "n:" + k, n: NM[k]!.n })),
    ...u.t.filter((k) => TP[k]).map((k) => ({ id: "t:" + k, n: TP[k]!.n })),
  ].slice(0, 5);
  const medHits = nq && nq.length >= 2 ? searchMedsAll(q).slice(0, 10) : [];
  const plain = searchSuklPlain(q);
  const fake = nameOnly(q);
  const own = ownMeds(medsOther);
  const toggleMed = (k: string) =>
    setMeds(meds.includes(k) ? meds.filter((m) => m != k) : [...meds, k]);
  const addOwn = (t: string) => {
    const v = t.trim().slice(0, 60);
    if (v && !own.some((x) => norm(x) == norm(v))) saveMedsOther([...own, v].join("\n"));
    setQ("");
  };
  const exact = medHits.length + plain.length > 0 && plain.some((p) => norm(p) == nq);
  return (
    <section className="box">
      {title ? <h2>{title}</h2> : null}
      <div className="ask">
        <input
          ref={inp}
          value={q}
          onChange={(e) => setQRaw(e.target.value)}
          placeholder="Nemoc, potíž, alergie nebo lék, např. astma, nespavost, Paralen"
          aria-label="Hledat nemoc, potíž, alergii nebo lék"
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
          {potHits.map((p) => (
            <button
              key={p.id}
              type="button"
              className="zl-hit"
              aria-pressed={prof.has(p.id)}
              onClick={() => (toggleProf(p.id, !prof.has(p.id)), setQ(""))}
            >
              😣 {p.n}{" "}
              <span className="zl-add">{prof.has(p.id) ? "✓ trápí mě" : "➕ co mě trápí"}</span>
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
          {plain.map((n) => (
            <button
              key={n}
              type="button"
              className="zl-hit"
              aria-pressed={own.some((x) => norm(x) == norm(n))}
              onClick={() => addOwn(cap(n))}
            >
              💊 {cap(n)} <span className="note"> – známé střety s bylinami nemáme</span>
              <span className="zl-add">
                {own.some((x) => norm(x) == norm(n)) ? "✓ moje léky" : "➕ k mým lékům"}
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
          {q.trim().length >= 3 && !exact && !condHits.length && !potHits.length ? (
            <button type="button" className="zl-hit zl-own" onClick={() => addOwn(q)}>
              ➕ Přidat „{q.trim().slice(0, 60)}“ jako vlastní lék
            </button>
          ) : null}
        </div>
      ) : null}
      {QUICK_MEDS.some((k) => MED[k] && !meds.includes(k)) ? (
        <div className="quick-meds">
          {QUICK_MEDS.filter((k) => MED[k] && !meds.includes(k)).map((k) => (
            <button key={k} type="button" className="chip" onClick={() => toggleMed(k)}>
              ➕ {QUICK_LABEL[k] ?? MED[k]!.n}
            </button>
          ))}
        </div>
      ) : null}
      {own.some((t) => !isKnownPlain(t)) ? (
        <p className="note">
          U vlastních léků (čárkovaný rámeček) střety s bylinami nehlídáme – zeptejte se lékárníka.
        </p>
      ) : null}
      {
        <>
          <h4 className="fgrp">Nejčastější stavy</h4>
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
      }
    </section>
  );
}

/** Read-only overview of the profile; editing lives in "Moje léky" and "Moje zahrádka". */
function ProfilPrehled() {
  const { prof, meds, medsOther, doma } = useApp();
  const medN = [
    ...meds.map((k) => MED[k]?.n).filter((x): x is string => !!x),
    ...ownMeds(medsOther),
  ];
  const conds = [...FLAGS.map(([k, n]) => ({ k, n })), ...CONDS.map((c) => ({ k: c.k, n: c.n }))]
    .filter((c) => c.k != "leky" && prof.has(c.k))
    .map((c) => (c.n.length > 48 ? c.n.slice(0, 46) + "…" : c.n));
  const pot = potizeOf(prof).map((p) => p.n);
  const home = doma.filter((k) => SP[k]);
  const row = (h: string, items: string[], to: "/interakce" | "/zahradka", where: string) => (
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
      <h2>Moje léky a zdraví</h2>
      <p className="note">
        Podle profilu označíme byliny, které pro vás nejsou vhodné, a doporučíme byliny na vaše
        potíže. Léky a nemoci vyplníte v Moje léky, rostliny v Moje zahrádka.
      </p>
      <div className="pchips">
        {row("💊 Léky", medN, "/interakce", "Moje léky")}
        {row("🩺 Nemoci a stavy", conds, "/interakce", "Moje léky")}
        {row("😣 Co mě trápí", pot, "/interakce", "Moje léky")}
        {row(
          "🏠 Mám doma",
          home.map((k) => SP[k]!.cz.split(" (")[0]!),
          "/zahradka",
          "Moje zahrádka",
        )}
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
