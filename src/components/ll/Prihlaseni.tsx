import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { czAuthError } from "@/lib/ll/auth-errors";
import { useApp } from "@/lib/ll/store";
import { AvatarPicker } from "./Profil";
import { rememberStaySignedIn } from "@/lib/ll/session";

type Mode = "login" | "signup" | "forgot";
const TABS: [Mode, string][] = [
  ["login", "Přihlásit se"],
  ["signup", "Vytvořit účet"],
];

export function Prihlaseni() {
  const { account } = useApp();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  // "Registrovat se" in the first-run intro opens the sign-up tab
  useEffect(() => {
    try {
      if (sessionStorage.getItem("ll-auth-rezim") == "signup") {
        sessionStorage.removeItem("ll-auth-rezim");
        setMode("signup");
      }
    } catch {
      /* storage blocked */
    }
  }, []);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState("");
  const [av, setAv] = useState("");
  const [stay, setStay] = useState(true);

  // Already signed in (or just signed in): the profile is where medicines are filled in.
  useEffect(() => {
    if (account) void navigate({ to: "/profil", replace: true });
  }, [account, navigate]);

  const go = (m: Mode) => {
    setMode(m);
    setErr("");
    setDone("");
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setDone("");
    if (mode == "signup" && !name.trim()) return setErr("Vyplňte jméno.");
    if (mode != "forgot" && pass.length < 8) return setErr("Heslo musí mít aspoň 8 znaků.");
    setBusy(true);
    try {
      if (mode == "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: pass,
        });
        if (error) setErr(czAuthError(error.message));
        else rememberStaySignedIn(stay);
      } else if (mode == "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: pass,
          options: {
            emailRedirectTo: "cz.lidovylecitel.app://auth",
            data: { display_name: name.trim().slice(0, 80), avatar: av },
          },
        });
        if (error) setErr(czAuthError(error.message));
        else if (!data.session)
          setDone(
            `Hotovo. Na adresu ${email.trim()} jsme poslali odkaz – po kliknutí na něj budete přihlášeni.`,
          );
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: "cz.lidovylecitel.app://reset-password",
        });
        if (error) setErr(czAuthError(error.message));
        else
          setDone(
            "Pokud k tomuto e-mailu existuje účet, poslali jsme na něj odkaz pro nastavení nového hesla.",
          );
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="box">
      <h2>{mode == "forgot" ? "Zapomenuté heslo" : "Účet"}</h2>
      {mode != "forgot" ? (
        <div className="chips" role="tablist">
          {TABS.map((t) => (
            <button
              key={t[0]}
              type="button"
              role="tab"
              className="chip"
              aria-pressed={mode == t[0]}
              aria-selected={mode == t[0]}
              onClick={() => go(t[0])}
            >
              {t[1]}
            </button>
          ))}
        </div>
      ) : null}
      <p className="note">
        {mode == "signup"
          ? "S účtem si zapíšete léky, které užíváte, a aplikace vás upozorní na byliny a houby, které se s nimi nemusí snášet. Profil a léky uvidíte jen vy."
          : mode == "forgot"
            ? "Zadejte e-mail, se kterým jste se registrovali. Pošleme vám odkaz pro nastavení nového hesla."
            : "Přihlaste se e-mailem a heslem."}
      </p>
      {done ? (
        <div className="alert ok" role="status">
          {done}
        </div>
      ) : (
        <form className="form" onSubmit={submit} noValidate>
          {mode == "signup" ? (
            <div className="field">
              Profilový obrázek (nepovinné)
              <AvatarPicker value={av} onPick={(a) => setAv(a == av ? "" : a)} />
            </div>
          ) : null}
          {mode == "signup" ? (
            <label className="field">
              Jméno
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                maxLength={80}
                required
              />
            </label>
          ) : null}
          <label className="field">
            E-mail
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>
          {mode != "forgot" ? (
            <label className="field">
              Heslo
              <input
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                autoComplete={mode == "signup" ? "new-password" : "current-password"}
                minLength={8}
                required
              />
              {mode == "signup" ? <span className="note">Aspoň 8 znaků.</span> : null}
            </label>
          ) : null}
          {mode == "login" ? (
            <label className="check" htmlFor="stay-in">
              <input
                type="checkbox"
                id="stay-in"
                checked={stay}
                onChange={(e) => setStay(e.target.checked)}
              />
              <span>
                Zůstat přihlášen
                <small className="note"> – odškrtněte na cizím nebo sdíleném zařízení</small>
              </span>
            </label>
          ) : null}
          {err ? (
            <div className="alert crit" role="alert">
              {err}
            </div>
          ) : null}
          <div>
            <button type="submit" className="btn" disabled={busy}>
              {busy
                ? "Chvilku…"
                : mode == "login"
                  ? "Přihlásit se"
                  : mode == "signup"
                    ? "Vytvořit účet"
                    : "Poslat odkaz"}
            </button>
          </div>
        </form>
      )}
      <p className="note">
        {mode == "login" ? (
          <button type="button" className="linkbtn" onClick={() => go("forgot")}>
            Zapomněli jste heslo?
          </button>
        ) : mode == "forgot" ? (
          <button type="button" className="linkbtn" onClick={() => go("login")}>
            Zpět na přihlášení
          </button>
        ) : null}
      </p>
      <p className="note">
        Bez přihlášení můžete aplikaci používat dál – profil pak zůstane jen v tomto prohlížeči.{" "}
        <Link to="/">Zpět do aplikace</Link>
      </p>
    </section>
  );
}

export function NoveHeslo() {
  const navigate = useNavigate();
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (pass.length < 8) return setErr("Heslo musí mít aspoň 8 znaků.");
    if (pass != pass2) return setErr("Hesla se neshodují.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pass });
    setBusy(false);
    if (error) return setErr(czAuthError(error.message));
    void navigate({ to: "/profil", replace: true });
  }

  return (
    <section className="box">
      <h2>Nové heslo</h2>
      <p className="note">Zvolte si nové heslo k účtu.</p>
      <form className="form" onSubmit={submit} noValidate>
        <label className="field">
          Nové heslo
          <input
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>
        <label className="field">
          Heslo znovu
          <input
            type="password"
            value={pass2}
            onChange={(e) => setPass2(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>
        {err ? (
          <div className="alert crit" role="alert">
            {err} {err.includes("vypršel") ? <Link to="/auth">Poslat nový odkaz</Link> : null}
          </div>
        ) : null}
        <div>
          <button type="submit" className="btn" disabled={busy}>
            {busy ? "Chvilku…" : "Uložit heslo"}
          </button>
        </div>
      </form>
    </section>
  );
}
