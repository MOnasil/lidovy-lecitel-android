import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { isApp } from "@/lib/ll/platform";
import { Logo } from "./Layout";

const KEY = "ll-uvitani";

/** Shown once after installing the Android app (and again from the profile). */
export function Welcome({ force, onClose }: { force?: boolean; onClose?: () => void }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (force) setShow(true);
    else if (isApp()) {
      try {
        if (!localStorage.getItem(KEY)) setShow(true);
      } catch {
        /* storage unavailable */
      }
    }
  }, [force]);
  if (!show) return null;
  const close = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* storage unavailable */
    }
    setShow(false);
    onClose?.();
  };
  return (
    <div className="welcome" role="dialog" aria-label="Co aplikace umí">
      <div className="welcome-in">
        <div className="welcome-logo">
          <Logo size={56} />
          <h2>Lidový léčitel</h2>
        </div>
        <ul className="welcome-list">
          <li>
            🔍 Popište, co vás trápí, a uvidíte byliny a houby, u kterých studie naznačují přínos.
          </li>
          <li>🌿 Atlas 200 rostlin a hub – jak je užívat, jak je poznat a kde je sehnat.</li>
          <li>⚠️ Co nekombinovat s léky, jídlem a jinými bylinami.</li>
          <li>🌱 Zahrádka – co máte doma, co pěstovat a kdy sklízet.</li>
        </ul>
        <h3>Proč se přihlásit</h3>
        <ul className="welcome-list">
          <li>
            Aplikace hlídá vaše nemoci, alergie a léky a upozorní na byliny, které pro vás nejsou
            vhodné.
          </li>
          <li>Profil se bezpečně uloží a zůstane i po přeinstalování nebo v jiném zařízení.</li>
        </ul>
        <div className="welcome-btns">
          <Link to="/auth" className="btn" onClick={close}>
            Přihlásit se / vytvořit účet
          </Link>
          <button type="button" className="btn ghost" onClick={close}>
            Pokračovat bez přihlášení
          </button>
        </div>
      </div>
    </div>
  );
}
