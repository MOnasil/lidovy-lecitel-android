import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { GardenMode } from "./garden";
import { MED_PREFIX } from "./meds";

// Signed out: profile, "Co mám doma" list and theme live only in this browser (localStorage);
// keys are kept identical so existing visitors keep their data. Signed in: health profile
// checkboxes and medicines live in the user's own `profiles` row (RLS: owner only).
const KEY_PROFILE = "ll-profil";
/** Saved herbs live in the profile flags as "fav:<species key>" (no extra database column needed). */
export const FAV_PREFIX = "fav:";
const KEY_DOMA = "ll-doma";
const KEY_THEME = "ll-theme";

function read<T>(k: string, d: T): T {
  try {
    const v = localStorage.getItem(k);
    return v == null ? d : (JSON.parse(v) as T);
  } catch {
    return d;
  }
}
function write(k: string, v: unknown) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* storage unavailable */
  }
}

export type Theme = "light" | "dark";
export type UIState = {
  // Poradce
  q: string;
  picked: string[];
  nem: string[];
  sub: string | null;
  pf: string;
  less: boolean;
  showPf: boolean;
  allT: boolean;
  // Co mám doma
  ds: string;
  // Atlas
  af: string;
  as: string;
  // Babské rady
  bf: string;
  bs: string;
  bv: string;
  // Zahrádka
  gt: string[];
  gm: GardenMode;
  gs: number;
  gl: string;
};
const INITIAL: UIState = {
  q: "",
  picked: [],
  nem: [],
  sub: null,
  pf: "vse",
  less: false,
  showPf: false,
  allT: false,
  ds: "",
  af: "vse",
  as: "",
  bf: "vse",
  bs: "",
  bv: "vse",
  gt: [],
  gm: "zahrada",
  gs: 4,
  gl: "S",
};

export type Account = { id: string; email: string; name: string };

type Ctx = {
  /** null = signed out; undefined = still checking the session */
  account: Account | null | undefined;
  /** Chosen medicine keys (signed in only) */
  meds: string[];
  setMeds: (m: string[]) => void;
  medsOther: string;
  saveMedsOther: (t: string) => void;
  saveName: (n: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  syncError: boolean;
  ui: UIState;
  setUI: (patch: Partial<UIState> | ((s: UIState) => Partial<UIState>)) => void;
  prof: ReadonlySet<string>;
  toggleProf: (k: string, on: boolean) => void;
  /** Herbs saved to "Můj seznam" (signed-in only; stored in the profile flags as "fav:<key>"). */
  favs: string[];
  toggleFav: (k: string) => void;
  doma: string[];
  toggleDoma: (k: string) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
};
const AppCtx = createContext<Ctx | null>(null);

export function applyTheme(t: Theme) {
  document.documentElement.classList.toggle("dark", t == "dark");
  const m = document.querySelector('meta[name="theme-color"]');
  if (m) m.setAttribute("content", t == "dark" ? "#101812" : "#eef5ee");
}

type ProfileRow = { display_name: string; flags: string[]; meds: string[]; meds_other: string };

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [ui, setUIState] = useState<UIState>(INITIAL);
  const [flags, setFlags] = useState<ReadonlySet<string>>(() => new Set());
  const [meds, setMedsState] = useState<string[]>([]);
  const [medsOther, setMedsOther] = useState("");
  const [account, setAccount] = useState<Account | null | undefined>(undefined);
  const [syncError, setSyncError] = useState(false);
  const [doma, setDoma] = useState<string[]>([]);
  const [theme, setThemeState] = useState<Theme>("light");
  const uid = useRef<string | null>(null);

  // Read browser-only data after hydration so server and client render the same first frame.
  useEffect(() => {
    setFlags(new Set(read<string[]>(KEY_PROFILE, [])));
    setDoma(read<string[]>(KEY_DOMA, []));
    setThemeState(read<Theme>(KEY_THEME, "light"));
  }, []);

  // Session: load the signed-in user's profile row; fall back to the browser profile when signed out.
  useEffect(() => {
    let alive = true;
    async function load(user: User | null) {
      if (!user) {
        uid.current = null;
        setAccount(null);
        setMedsState([]);
        setMedsOther("");
        setFlags(new Set(read<string[]>(KEY_PROFILE, [])));
        return;
      }
      if (uid.current == user.id) return;
      uid.current = user.id;
      const metaName = String(user.user_metadata?.["display_name"] ?? "");
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, flags, meds, meds_other")
        .eq("id", user.id)
        .maybeSingle();
      if (!alive || uid.current != user.id) return;
      let row: ProfileRow | null = data;
      if (error) setSyncError(true);
      // First sign-in on this device: carry over the checkboxes filled in before signing in.
      const local = read<string[]>(KEY_PROFILE, []);
      if (!error && (!row || (!row.flags.length && local.length))) {
        const next = {
          id: user.id,
          display_name: row?.display_name || metaName,
          flags: local,
          meds: row?.meds ?? [],
          meds_other: row?.meds_other ?? "",
        };
        const r = await supabase
          .from("profiles")
          .upsert(next)
          .select("display_name, flags, meds, meds_other")
          .single();
        if (!alive) return;
        row = r.data ?? next;
      }
      setAccount({ id: user.id, email: user.email ?? "", name: row?.display_name || metaName });
      setFlags(new Set(row?.flags ?? []));
      setMedsState(row?.meds ?? []);
      setMedsOther(row?.meds_other ?? "");
    }
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event == "TOKEN_REFRESHED") return;
      // Defer: Supabase calls made inside this callback can deadlock the auth client.
      setTimeout(() => void load(session?.user ?? null), 0);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const saveRow = useCallback(async (patch: Partial<ProfileRow>) => {
    const id = uid.current;
    if (!id) return true;
    const { error } = await supabase.from("profiles").update(patch).eq("id", id);
    setSyncError(!!error);
    return !error;
  }, []);

  const setUI = useCallback<Ctx["setUI"]>((patch) => {
    setUIState((s) => ({ ...s, ...(typeof patch == "function" ? patch(s) : patch) }));
  }, []);
  const toggleProf = useCallback(
    (k: string, on: boolean) => {
      setFlags((p) => {
        const n = new Set(p);
        if (on) n.add(k);
        else n.delete(k);
        if (uid.current) void saveRow({ flags: [...n] });
        else write(KEY_PROFILE, [...n]);
        return n;
      });
    },
    [saveRow],
  );
  const setMeds = useCallback(
    (m: string[]) => {
      setMedsState(m);
      void saveRow({ meds: m });
    },
    [saveRow],
  );
  const saveMedsOther = useCallback(
    (t: string) => {
      setMedsOther(t);
      void saveRow({ meds_other: t.slice(0, 1000) });
    },
    [saveRow],
  );
  const saveName = useCallback(
    async (n: string) => {
      const name = n.trim().slice(0, 80);
      const ok = await saveRow({ display_name: name });
      if (ok) setAccount((a) => (a ? { ...a, name } : a));
      return ok;
    },
    [saveRow],
  );
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);
  const toggleDoma = useCallback((k: string) => {
    setDoma((d) => {
      const n = d.includes(k) ? d.filter((x) => x != k) : [...d, k];
      write(KEY_DOMA, n);
      return n;
    });
  }, []);
  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    write(KEY_THEME, t);
    applyTheme(t);
  }, []);

  const favs = useMemo(
    () => [...flags].filter((f) => f.startsWith(FAV_PREFIX)).map((f) => f.slice(FAV_PREFIX.length)),
    [flags],
  );
  const toggleFav = useCallback(
    (k: string) => {
      if (!uid.current) return;
      toggleProf(FAV_PREFIX + k, !flags.has(FAV_PREFIX + k));
    },
    [flags, toggleProf],
  );

  // Everything that checks warnings reads one set: profile checkboxes plus "med:<key>" entries.
  const prof = useMemo<ReadonlySet<string>>(
    () => (meds.length ? new Set([...flags, ...meds.map((m) => MED_PREFIX + m)]) : flags),
    [flags, meds],
  );

  const value = useMemo(
    () => ({
      account,
      meds,
      setMeds,
      medsOther,
      saveMedsOther,
      saveName,
      signOut,
      syncError,
      ui,
      setUI,
      prof,
      toggleProf,
      favs,
      toggleFav,
      doma,
      toggleDoma,
      theme,
      setTheme,
    }),
    [
      account,
      meds,
      setMeds,
      medsOther,
      saveMedsOther,
      saveName,
      signOut,
      syncError,
      ui,
      setUI,
      prof,
      toggleProf,
      favs,
      toggleFav,
      doma,
      toggleDoma,
      theme,
      setTheme,
    ],
  );
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp must be used inside AppStateProvider");
  return c;
}

/** Inline script for <head>: applies the saved theme before first paint. */
export const THEME_BOOT_SCRIPT = `try{if(JSON.parse(localStorage.getItem("${KEY_THEME}"))==="dark"){document.documentElement.classList.add("dark")}}catch(e){}`;
