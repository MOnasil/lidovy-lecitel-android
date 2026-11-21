import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Komentar } from "./Komentar";
import { Uvod } from "./Uvod";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { SP } from "@/lib/ll/data";
import { avatarSrc } from "@/lib/ll/avatars";
import { useApp } from "@/lib/ll/store";
import { Welcome } from "./Welcome";

const NAV = [
  { to: "/", label: "Co mě trápí", exact: true },
  { to: "/atlas", label: "Atlas" },
  { to: "/interakce", label: "Moje léky" },
  { to: "/zahradka", label: "Moje zahrádka" },
  { to: "/lekarnik", label: "Rada lékárníka" },
] as const;

const LEGACY: Record<string, string> = {
  poradce: "/",
  doma: "/zahradka",
  atlas: "/atlas",
  babske: "/babske",
  zahradka: "/zahradka",
  profil: "/profil",
};

/** The original app used hash URLs (#atlas, #druh-matricaria-chamomilla); keep old links working. */
function LegacyHashRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    const h = window.location.hash.slice(1);
    if (!h) return;
    if (h.startsWith("druh-")) {
      const druh = h.slice(5);
      if (SP[druh.replace(/-/g, "_")])
        void navigate({ to: "/atlas/$druh", params: { druh }, replace: true });
      return;
    }
    const to = LEGACY[h];
    if (to) void navigate({ to, replace: true });
  }, [navigate]);
  return null;
}

/** The app logo: a mortar and pestle with herb leaves (same artwork as the app icon). */
export function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" className="logo">
      <rect width="100" height="100" rx="24" fill="#2F6B3A" />
      <path d="M47 56C42 41 44 27 57 16c6 15 3 29-10 40z" fill="#97C459" />
      <path d="M45 52C35 40 24 38 16 41c5 10 16 14 29 11z" fill="#C0DD97" />
      <line
        x1="60"
        y1="54"
        x2="78"
        y2="21"
        stroke="#EAF3DE"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <circle cx="79" cy="19" r="5.5" fill="#EAF3DE" />
      <path d="M20 53h60c0 15-13.4 26-30 26S20 68 20 53z" fill="#F4F6EF" />
      <rect x="18" y="50" width="64" height="6" rx="3" fill="#F4F6EF" />
      <rect x="37" y="79" width="26" height="7" rx="3.5" fill="#F4F6EF" />
    </svg>
  );
}

/** Top-right account area: profile picture (or initials / 👤) with the label "Můj profil". */
function AccountLink() {
  const { account, avatar } = useApp();
  if (account === undefined) return <div className="acct-area" />;
  const src = avatarSrc(avatar);
  const name = account ? account.name || account.email : "";
  const ini = name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0]!.toUpperCase())
    .join("");
  return (
    <div className="acct-area">
      {account ? null : (
        <Link to="/auth" className="acct-in">
          Přihlásit se
        </Link>
      )}
      <Link
        to="/profil"
        className="acct-link"
        title={account ? `Můj profil – ${account.email}` : "Můj profil"}
      >
        <span className="acct-av">{src ? <img src={src} alt="" /> : ini || "👤"}</span>
        <span className="acct-lbl">Můj profil</span>
      </Link>
    </div>
  );
}

/** Full-screen photo viewer; with several photos it has arrows, a counter and swiping. */
type Shot = { s: string; a?: string; l?: string; p?: string };

function Lightbox({
  list,
  i,
  alt,
  onClose,
  setI,
}: {
  list: Shot[];
  i: number;
  alt: string;
  onClose: () => void;
  setI: (n: number) => void;
}) {
  const n = list.length;
  const go = (d: number) => setI((i + d + n) % n);
  const [x0, setX0] = useState<number | null>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key == "Escape") onClose();
      else if (e.key == "ArrowRight" && n > 1) setI((i + 1) % n);
      else if (e.key == "ArrowLeft" && n > 1) setI((i - 1 + n) % n);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [i, n, onClose, setI]);
  return (
    <div
      className="lb"
      role="dialog"
      aria-label="Zvětšená fotka"
      onClick={onClose}
      onTouchStart={(e) => setX0(e.touches[0]?.clientX ?? null)}
      onTouchEnd={(e) => {
        const x1 = e.changedTouches[0]?.clientX;
        if (x0 != null && x1 != null && Math.abs(x1 - x0) > 40 && n > 1) go(x1 < x0 ? 1 : -1);
        setX0(null);
      }}
    >
      <img src={list[i]?.s} alt={alt} onClick={(e) => e.stopPropagation()} />
      {list[i]?.a ? (
        <span className="lb-cred" onClick={(e) => e.stopPropagation()}>
          Foto:{" "}
          {list[i]!.p ? (
            <a href={list[i]!.p} target="_blank" rel="noopener noreferrer">
              {list[i]!.a}
            </a>
          ) : (
            list[i]!.a
          )}
          {list[i]!.l ? ` · ${list[i]!.l}` : ""}
        </span>
      ) : null}
      {n > 1 ? (
        <>
          <button
            type="button"
            className="lb-nav prev"
            aria-label="Předchozí fotka"
            onClick={(e) => (e.stopPropagation(), go(-1))}
          >
            ‹
          </button>
          <button
            type="button"
            className="lb-nav next"
            aria-label="Další fotka"
            onClick={(e) => (e.stopPropagation(), go(1))}
          >
            ›
          </button>
          <span className="lb-cnt">
            {i + 1}/{n}
          </span>
        </>
      ) : null}
      <button type="button" className="lbx" aria-label="Zavřít">
        ✕
      </button>
    </div>
  );
}

/** Places that scroll sideways themselves – a swipe there must not switch tabs. */
const NO_SWIPE =
  ".seg-row, .site-nav, table, .vys-table, .hd-gal, .lb, input, textarea, select, .mbar, .gcal1, .av-pick";

export function Layout({ children }: { children: ReactNode }) {
  const [zoom, setZoom] = useState<{ list: Shot[]; i: number; alt: string } | null>(null);
  const nav = useNavigate();
  const path = useRouterState({ select: (r) => r.location.pathname });
  const touch = useRef<{ x: number; y: number; t: number } | null>(null);

  // Swipe sideways between the tabs; on a detail page or the profile a swipe right goes back.
  const tabIndex = NAV.findIndex((n) => ("exact" in n && n.exact ? path == n.to : path == n.to));
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    if (!t || e.touches.length > 1 || (e.target as Element).closest(NO_SWIPE)) {
      touch.current = null;
      return;
    }
    touch.current = { x: t.clientX, y: t.clientY, t: Date.now() };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const st = touch.current;
    touch.current = null;
    const t = e.changedTouches[0];
    if (!st || !t || zoom) return;
    const dx = t.clientX - st.x;
    const dy = t.clientY - st.y;
    if (Math.abs(dx) < 80 || Math.abs(dy) > Math.abs(dx) * 0.5 || Date.now() - st.t > 700) return;
    if (tabIndex >= 0) {
      const next = NAV[tabIndex + (dx < 0 ? 1 : -1)];
      if (next) void nav({ to: next.to });
    } else if (dx > 0 && typeof window != "undefined" && window.history.length > 1) {
      window.history.back();
    }
  };

  // keep the active tab visible in the scrolling menu
  useEffect(() => {
    document.querySelector<HTMLElement>('.site-nav a[aria-current="page"]')?.scrollIntoView({
      block: "nearest",
      inline: "center",
      behavior: "smooth",
    });
  }, [path]);

  // Any element with data-zoom opens its photo full-screen (same as the original app).
  const onClickCapture = (e: React.MouseEvent) => {
    const z = (e.target as Element).closest<HTMLElement>("[data-zoom]");
    if (!z) return;
    e.preventDefault();
    e.stopPropagation();
    const img = z.tagName == "IMG" ? (z as HTMLImageElement) : z.querySelector("img");
    const src = z.dataset["zoom"]!;
    // a gallery (several photos of one plant) can be browsed with arrows
    let list: Shot[] = [{ s: src }];
    try {
      const g = z.closest<HTMLElement>("[data-gallery]")?.dataset["gallery"];
      const parsed = g
        ? (JSON.parse(g) as (string | Shot)[])
            .map((x) => (typeof x == "string" ? { s: x } : x))
            .filter((x) => x.s)
        : [];
      if (parsed.length) list = parsed;
    } catch {
      /* no gallery */
    }
    setZoom({
      list,
      i: Math.max(
        0,
        list.findIndex((x) => x.s == src),
      ),
      alt: img?.alt ?? "",
    });
  };

  return (
    <>
      <header className="site-header">
        <div className="bar">
          <div className="brand">
            <Link
              to="/"
              className="brand-link"
              aria-label="Lidový léčitel – úvod"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              <Logo />
              <span className="brand-t">
                <h1>Lidový léčitel</h1>
                <small className="brand-sub">testovací verze</small>
              </span>
            </Link>
            <Komentar />
            <AccountLink />
          </div>
          <nav className="site-nav" aria-label="Hlavní">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                activeOptions={{ exact: "exact" in n && n.exact }}
                activeProps={{ "aria-current": "page" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <div
        className="wrap"
        onClickCapture={onClickCapture}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <main className="site-main" key={path}>
          {children}
        </main>
        <p className="note mt-[22px]">
          Informační encyklopedie, ne diagnóza ani léčebné doporučení. Texty shrnují, co naznačují
          vědecké studie a co se tradičně používá; vznikly rozborem volně dostupných článků
          (většinou jen abstraktů) a zatím je nezkontroloval farmaceut ani lékař. Při potížích,
          které trvají nebo se zhoršují, jděte k lékaři. Užíváte-li léky, poraďte se před užitím
          bylin s lékárníkem.
        </p>
      </div>
      <Uvod />
      {zoom ? (
        <Lightbox
          list={zoom.list}
          i={zoom.i}
          alt={zoom.alt}
          onClose={() => setZoom(null)}
          setI={(i) => setZoom((z) => (z ? { ...z, i } : z))}
        />
      ) : null}
      <Welcome />
      <LegacyHashRedirect />
    </>
  );
}
