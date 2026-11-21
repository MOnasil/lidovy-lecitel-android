import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";

const KEY = "ll-uvod-videno";
const SLIDES = [
  {
    ic: "🌿",
    h: "Co vás trápí?",
    t: "Napište potíže vlastními slovy a aplikace doporučí byliny a houby, které se na ně používají – jak je užívat a jak dobře jsou podložené studiemi.",
  },
  {
    ic: "📖",
    h: "Atlas a Moje zahrádka",
    t: "Přes 200 bylin a hub s fotkami: kde a kdy je sbírat, co si vypěstovat doma a kdy sít a sklízet.",
  },
  {
    ic: "💊",
    h: "Moje léky a bezpečnost",
    t: "Vyplňte léky a nemoci a aplikace upozorní, které byliny se s nimi nesnesou a co nekombinovat.",
  },
  {
    ic: "👤",
    h: "Proč se přihlásit",
    t: "Profil, léky i zahrádka se uloží k vašemu účtu a uvidíte je na všech zařízeních. Bez přihlášení zůstanou jen v tomto zařízení.",
  },
];

export function showIntroAgain() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* storage blocked */
  }
  window.dispatchEvent(new Event("ll-uvod"));
}

/** First-run introduction: four slides, swipe or tap through, skippable, shown once. */
export function Uvod() {
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);
  const nav = useNavigate();
  const x0 = useRef<number | null>(null);
  useEffect(() => {
    const check = () => {
      try {
        if (localStorage.getItem(KEY) != "1") {
          setI(0);
          setOpen(true);
        }
      } catch {
        /* storage blocked: skip the intro */
      }
    };
    check();
    window.addEventListener("ll-uvod", check);
    return () => window.removeEventListener("ll-uvod", check);
  }, []);
  if (!open) return null;
  const done = (to?: string) => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* storage blocked */
    }
    setOpen(false);
    if (to) void nav({ to });
  };
  const s = SLIDES[i]!;
  const last = i == SLIDES.length - 1;
  return (
    <div className="uvod-bg" role="dialog" aria-modal="true" aria-label="Jak aplikace funguje">
      <div
        className="uvod"
        onTouchStart={(e) => (x0.current = e.touches[0]!.clientX)}
        onTouchEnd={(e) => {
          if (x0.current == null) return;
          const dx = e.changedTouches[0]!.clientX - x0.current;
          x0.current = null;
          if (dx < -40 && !last) setI(i + 1);
          if (dx > 40 && i > 0) setI(i - 1);
        }}
      >
        <button type="button" className="uvod-skip" onClick={() => done()}>
          Přeskočit
        </button>
        <div className="uvod-ic" aria-hidden="true">
          {s.ic}
        </div>
        <h2>{s.h}</h2>
        <p>{s.t}</p>
        <div className="uvod-dots" aria-hidden="true">
          {SLIDES.map((_, j) => (
            <i key={j} className={j == i ? "on" : ""} />
          ))}
        </div>
        {last ? (
          <div className="uvod-btns">
            <button type="button" className="btn" onClick={() => done("/auth")}>
              Přihlásit se
            </button>
            <button type="button" className="btn ghost" onClick={() => done()}>
              Pokračovat bez přihlášení
            </button>
          </div>
        ) : (
          <div className="uvod-btns">
            {i > 0 ? (
              <button type="button" className="btn ghost" onClick={() => setI(i - 1)}>
                Zpět
              </button>
            ) : null}
            <button type="button" className="btn" onClick={() => setI(i + 1)}>
              Další
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
