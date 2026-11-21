// Supabase Edge Function "feedback": stores a comment from the app, adds it to the Google Sheet
// "Lidový léčitel připomínky" and e-mails it to the app owner.
// Secrets: RESEND_API_KEY, FEEDBACK_EMAIL, SHEETS_URL, SHEETS_TOKEN (+ default SUPABASE_URL and secret key).
// Deploy with "Verify JWT" off – the app calls it with the public (publishable) key.
import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const clip = (v: unknown, n: number) => String(v ?? "").slice(0, n);
const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

Deno.serve(async (req) => {
  if (req.method == "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method != "POST") return json({ error: "method" }, 405);
  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return json({ error: "json" }, 400);
  }
  const row = {
    text: clip(b.text, 4000).trim(),
    page: clip(b.page, 200),
    platform: clip(b.platform, 40),
    user_email: clip(b.user, 200),
  };
  if (row.text.length < 2) return json({ error: "empty" }, 400);

  const results: Record<string, boolean> = {};
  const secret =
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
    (Object.values(JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}"))[0] as string);
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, secret, {
    auth: { persistSession: false },
  });
  const ins = await sb.from("feedback").insert(row);
  results.db = !ins.error;
  const errs: string[] = [];
  if (ins.error) errs.push("db: " + ins.error.message);

  const sheet = Deno.env.get("SHEETS_URL");
  if (sheet) {
    try {
      const r = await fetch(sheet, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          token: Deno.env.get("SHEETS_TOKEN"),
          page: row.page,
          text: row.text,
          user: row.user_email,
          platform: row.platform,
        }),
        redirect: "follow",
      });
      results.sheet = r.ok;
    } catch {
      results.sheet = false;
    }
  }

  const key = Deno.env.get("RESEND_API_KEY");
  const to = (Deno.env.get("FEEDBACK_EMAIL") ?? "").trim().replace(/^["'<]+|["'>]+$/g, "");
  if (key && to) {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Lidový léčitel <onboarding@resend.dev>",
        to: [to],
        subject: `Připomínka: ${row.page || "aplikace"}`,
        html:
          `<p><b>Stránka:</b> ${esc(row.page)}<br><b>Zařízení:</b> ${esc(row.platform)}` +
          (row.user_email ? `<br><b>Uživatel:</b> ${esc(row.user_email)}` : "") +
          `</p><p>${esc(row.text).replace(/\n/g, "<br>")}</p>`,
      }),
    });
    results.mail = r.ok;
    if (!r.ok) errs.push("mail: " + (await r.text()).slice(0, 300));
  }
  return json({ ok: results.db || results.sheet || results.mail, ...results, errs });
});
