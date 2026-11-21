import { SP, unslug } from "./data";
import { isApp } from "./platform";

// Comments go to the "feedback" Edge Function of the app's own Supabase project, which stores them
// and forwards them to the owner (Google Sheet + e-mail). The publishable key is public by design.
const FN = "https://crgjrtpjjkeubnqihuiy.supabase.co/functions/v1/feedback";
const KEY = "sb_publishable_UkQxWREkssCLUI4pFQ3MkQ_u4q1pgpt";

const PAGES: Record<string, string> = {
  "/": "Co mě trápí",
  "/atlas": "Atlas",
  "/interakce": "Interakce",
  "/lekarnik": "Rada lékárníka",
  "/zahradka": "Moje zahrádka",
  "/profil": "Můj profil",
  "/auth": "Přihlášení",
  "/soukromi": "Ochrana osobních údajů",
};

/** Human name of the page the user is on, e.g. "Detail: Meduňka lékařská". */
export function pageLabel(path: string): string {
  const p = path.replace(/\/+$/, "") || "/";
  const m = p.match(/^\/atlas\/([^/]+)$/);
  if (m) {
    const s = SP[unslug(decodeURIComponent(m[1]!))];
    return "Detail: " + (s ? s.cz.split(" (")[0] : m[1]);
  }
  return PAGES[p] ?? p;
}

export async function sendFeedback(text: string, path: string, user?: string): Promise<boolean> {
  try {
    const r = await fetch(FN, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: KEY, Authorization: `Bearer ${KEY}` },
      body: JSON.stringify({
        text,
        page: pageLabel(path),
        platform: isApp() ? "Android" : "web",
        user: user ?? "",
      }),
    });
    if (!r.ok) return false;
    const j = (await r.json()) as { ok?: boolean };
    return !!j.ok;
  } catch {
    return false;
  }
}
