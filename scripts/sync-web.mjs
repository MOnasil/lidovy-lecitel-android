// Copies the shared app code from the web project (Lovable repo MOnasil/project-migration-studio)
// into src/, then applies the few Android-specific changes. Run: npm run sync-web [-- <path to web repo>]
// Android-only files (main.tsx, routes/__root.tsx, integrations/supabase/client.ts, native/*) are never overwritten.
import { cpSync, existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const WEB = resolve(process.argv[2] ?? process.env.WEB_DIR ?? "../project-migration-studio");
if (!existsSync(join(WEB, "src/lib/ll"))) throw new Error(`Web project not found at ${WEB}`);

const copy = (rel) => {
  rmSync(join("src", rel), { recursive: true, force: true });
  cpSync(join(WEB, "src", rel), join("src", rel), { recursive: true });
};
for (const rel of ["components/ll", "lib/ll", "data", "styles.css"]) copy(rel);
// Routes: everything except the web document shell.
for (const f of ["atlas.$druh.tsx", "atlas.index.tsx", "auth.tsx", "babske.tsx", "doma.tsx", "index.tsx", "profil.tsx", "reset-password.tsx", "zahradka.tsx"])
  if (existsSync(join(WEB, "src/routes", f))) cpSync(join(WEB, "src/routes", f), join("src/routes", f));

// Photos: the app ships its own copies (public/img), so map species keys to local files.
const photos = JSON.parse(readFileSync("src/data/ll-photos.json", "utf8"));
const local = {};
for (const [k, v] of Object.entries(photos)) {
  local[k] = {};
  for (const n of Object.keys(v)) if (n == "t" || n == "1") local[k][n] = `img/${k}/${n}.jpg`;
  for (const n of Object.keys(v)) if (!local[k][n] && existsSync(`public/img/${k}/${n}.jpg`)) local[k][n] = `img/${k}/${n}.jpg`;
}
writeFileSync("src/data/ll-photos.json", JSON.stringify(local));

// Email links (sign-up confirmation, password reset) must open the app, not a web page.
const p = "src/components/ll/Prihlaseni.tsx";
let s = readFileSync(p, "utf8");
s = s
  .replace(/window\.location\.origin \+ "\/profil"/g, '"cz.lidovylecitel.app://auth"')
  .replace(/window\.location\.origin \+ "\/reset-password"/g, '"cz.lidovylecitel.app://reset-password"');
writeFileSync(p, s);

// No service worker inside the app.
writeFileSync("src/lib/ll/pwa.ts", "export async function setupOffline() {}\nexport function isRefusedContext() {\n  return true;\n}\n");
console.log("Synced from", WEB);
