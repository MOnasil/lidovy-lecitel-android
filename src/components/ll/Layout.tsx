import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { SP } from "@/lib/ll/data";
import { useApp } from "@/lib/ll/store";

const NAV = [
  { to: "/", label: "Co mě trápí", exact: true },
  { to: "/atlas", label: "Atlas" },
  { to: "/zahradka", label: "Zahrádka" },
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

/** Top-right account area: small "Přihlásit se" + profile icon when signed out, initials when signed in. */
function AccountLink() {
  const { account } = useApp();
  if (account === undefined) return <div className="acct-area" />;
  if (account) {
    const name = account.name || account.email;
    const ini = name
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((x) => x[0]!.toUpperCase())
      .join("");
    return (
      <div className="acct-area">
        <Link
          to="/profil"
          className="acct-av"
          title={`Profil – ${account.email}`}
          aria-label="Profil"
        >
          {ini || "👤"}
        </Link>
      </div>
    );
  }
  return (
    <div className="acct-area">
      <Link to="/auth" className="acct-in">
        Přihlásit se
      </Link>
      <Link to="/profil" className="acct-av" aria-label="Profil">
        👤
      </Link>
    </div>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const [zoom, setZoom] = useState<{ src: string; alt: string } | null>(null);

  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => e.key == "Escape" && setZoom(null);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [zoom]);

  // Any element with data-zoom opens its photo full-screen (same as the original app).
  const onClickCapture = (e: React.MouseEvent) => {
    const z = (e.target as Element).closest<HTMLElement>("[data-zoom]");
    if (!z) return;
    e.preventDefault();
    e.stopPropagation();
    const img = z.tagName == "IMG" ? (z as HTMLImageElement) : z.querySelector("img");
    setZoom({ src: z.dataset["zoom"]!, alt: img?.alt ?? "" });
  };

  return (
    <>
      <header className="site-header">
        <div className="bar">
          <div className="brand">
            <Link to="/" className="brand-link" aria-label="Lidový léčitel – úvod">
              <Logo />
              <h1>Lidový léčitel</h1>
            </Link>
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
      <div className="wrap" onClickCapture={onClickCapture}>
        <main className="site-main">{children}</main>
        <p className="note mt-[22px]">
          Informační encyklopedie, ne diagnóza ani léčebné doporučení. Texty shrnují, co naznačují
          vědecké studie a co se tradičně používá; vznikly rozborem volně dostupných článků
          (většinou jen abstraktů) a zatím je nezkontroloval farmaceut ani lékař. Při potížích,
          které trvají nebo se zhoršují, jděte k lékaři. Užíváte-li léky, poraďte se před užitím
          bylin s lékárníkem.
        </p>
      </div>
      {zoom ? (
        <div className="lb" role="dialog" aria-label="Zvětšená fotka" onClick={() => setZoom(null)}>
          <img src={zoom.src} alt={zoom.alt} />
          <button type="button" className="lbx" aria-label="Zavřít">
            ✕
          </button>
        </div>
      ) : null}
      <LegacyHashRedirect />
    </>
  );
}
