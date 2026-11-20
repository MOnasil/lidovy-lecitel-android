# Lidový léčitel – aplikace pro Android (testovací verze)

Webová aplikace Lidový léčitel zabalená přes [Capacitor](https://capacitorjs.com) jako aplikace pro Android.
Přihlašování a profil běží na vlastním projektu Supabase (`crgjrtpjjkeubnqihuiy`), ne přes Lovable.

## Jak získat APK
Každé nahrání do větve `main` spustí GitHub Actions (záložka **Actions**), které sestaví APK
a zveřejní ho v **Releases** jako „Testovací verze N“. V telefonu otevřete Releases, stáhněte
`.apk` a nainstalujte (je potřeba povolit instalaci z neznámých zdrojů). Novější verze se
instaluje přes starší, přihlášení zůstane.

## Struktura
- `src/components/ll`, `src/lib/ll`, `src/data`, `src/routes` – sdílený kód z webové aplikace
  (repozitář `MOnasil/project-migration-studio`). Aktualizace: `npm run sync-web -- ../project-migration-studio`.
- Jen pro Android: `src/main.tsx`, `src/routes/__root.tsx`, `src/integrations/supabase/client.ts`,
  `src/native/deepLinks.ts`, složka `android/`.
- `public/img` – fotky rostlin (Wikimedia Commons, licence a autoři u každé fotky v aplikaci).

## Přihlášení
- E-mail + heslo, potvrzení registrace e-mailem.
- Odkazy v e-mailech vedou na `cz.lidovylecitel.app://auth` a `cz.lidovylecitel.app://reset-password`
  a otevřou aplikaci (nastaveno v Supabase → Authentication → URL Configuration).
- Publishable key v `client.ts` je veřejný; data chrání Row Level Security (tabulka `profiles`,
  skript `supabase/profiles.sql`).

## Podpis
`android/app/test-signing.jks` je testovací klíč (záměrně v repozitáři, aby šly verze instalovat
přes sebe). Před vydáním na Google Play ho nahraďte soukromým klíčem v GitHub Secrets.
