// Copies the shared app code from the web project (Lovable repo MOnasil/project-migration-studio)
// into src/, then applies the few Android-specific changes. Run: npm run sync-web [-- <path to web repo>]
// Android-only files (main.tsx, routes/__root.tsx, integrations/supabase/client.ts, native/*) are never overwritten.
import { cpSync, existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const WEB = resolve(process.argv[2] ?? process.env.WEB_DIR ?? "../project-migration-studio");
if (!existsSync(join(WEB, "src/lib/ll"))) throw new Error(`Web project not found at ${WEB}`);

const copy = (rel) => {
  rmSync(join("src", rel), { recursive: true, force: true });
  cpSync(join(WEB, "src", rel), join("src", rel), { recursive: true });
};
for (const rel of ["components/ll", "lib/ll", "data", "styles.css"]) copy(rel);
// Routes: everything except the web document shell.
for (const f of readdirSync("src/routes")) if (f != "__root.tsx") rmSync(join("src/routes", f));
for (const f of readdirSync(join(WEB, "src/routes")))
  if (f.endsWith(".tsx") && f != "__root.tsx") cpSync(join(WEB, "src/routes", f), join("src/routes", f));

// Photo set of the app (more and newer photos than the web, chosen for quality): species → credits in
// the order of public/img/<species>/1.jpg, 2.jpg… The web keeps its own set on the Lovable CDN.
const set = JSON.parse(readFileSync("scripts/photo-set.json", "utf8"));
const dataPath = "src/data/ll-data.json";
const data = JSON.parse(readFileSync(dataPath, "utf8"));
for (const [k, ph] of Object.entries(set)) data.ph[k] = ph;
writeFileSync(dataPath, JSON.stringify(data));
// Species whose web photos are hidden but whose app photos show the plant.
const ph = "src/lib/ll/photos.ts";
writeFileSync(ph, readFileSync(ph, "utf8").replace('  "harpagophytum_procumbens",\n', ""));

// Photos: the app ships its own copies (public/img), so map species keys to local files.
const photos = JSON.parse(readFileSync("src/data/ll-photos.json", "utf8"));
const local = {};
for (const k of new Set([...Object.keys(photos), ...readdirSync("public/img")])) {
  if (!existsSync(`public/img/${k}`)) continue;
  const files = readdirSync(`public/img/${k}`).filter((f) => /^(t|\d+)\.jpg$/.test(f));
  if (!files.length) continue;
  local[k] = {};
  for (const f of files) local[k][f.replace(".jpg", "")] = `img/${k}/${f}`;
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
