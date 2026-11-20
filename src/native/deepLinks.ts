// Opens links from e-mails inside the app: cz.lidovylecitel.app://auth (sign-up confirmation)
// and cz.lidovylecitel.app://reset-password (new password). Supabase sends either ?code= (PKCE)
// or #access_token=…&refresh_token=… ; both are turned into a session here.
import { App } from "@capacitor/app";
import { supabase } from "@/integrations/supabase/client";

export async function handleAuthLink(url: string, go: (path: string) => void) {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return;
  }
  if (u.protocol != "cz.lidovylecitel.app:") return;
  const target = u.host == "reset-password" || u.pathname.includes("reset-password") ? "reset-password" : "auth";
  const hash = new URLSearchParams(u.hash.replace(/^#/, ""));
  const code = u.searchParams.get("code");
  const err = u.searchParams.get("error_description") ?? hash.get("error_description");
  if (err) {
    go("/auth");
    return;
  }
  if (code) await supabase.auth.exchangeCodeForSession(code);
  else if (hash.get("access_token") && hash.get("refresh_token"))
    await supabase.auth.setSession({
      access_token: hash.get("access_token")!,
      refresh_token: hash.get("refresh_token")!,
    });
  const recovery = target == "reset-password" || hash.get("type") == "recovery";
  go(recovery ? "/reset-password" : "/profil");
}

export function listenForAuthLinks(go: (path: string) => void) {
  void App.addListener("appUrlOpen", (e) => void handleAuthLink(e.url, go));
  void App.getLaunchUrl().then((r) => {
    if (r?.url) void handleAuthLink(r.url, go);
  });
}
