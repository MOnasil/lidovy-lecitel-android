// Profile pictures: six painted pictures or the user's own photo where an upload backend is
// configured (Android app).

// Painted (watercolour-style) SVG pictures, drawn for the app – no third-party images.
const svg = (s: string) => "data:image/svg+xml;utf8," + encodeURIComponent(s);

export const AVATAR_PRESETS: { k: string; n: string; src: string }[] = [
  {
    k: "caj",
    n: "Čaj",
    src: svg(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><defs><filter id="w" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="11" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="7"/><feGaussianBlur stdDeviation="0.7"/></filter><filter id="p"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3"/><feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.4  0 0 0 0 0.3  0 0 0 0.10 0"/><feComposite in2="SourceGraphic" operator="in"/></filter><radialGradient id="bg" cx="40%" cy="35%" r="75%"><stop offset="0" stop-color="#fbf7ec"/><stop offset="1" stop-color="#ece4cf"/></radialGradient></defs><circle cx="48" cy="48" r="48" fill="url(#bg)"/><circle cx="48" cy="48" r="48" fill="#fff" filter="url(#p)"/><g filter="url(#w)"><ellipse cx="48" cy="76" rx="36" ry="9" fill="#b98a5e" opacity=".55"/>\n<ellipse cx="48" cy="74" rx="26" ry="5" fill="#e9dcc3" opacity=".9"/>\n<path d="M27 46h38l-3 20c-1 6-6 9-16 9s-15-3-16-9z" fill="#7fae8e" opacity=".85"/>\n<path d="M30 49h32l-1 6H31z" fill="#a8cdb2" opacity=".7"/>\n<path d="M64 52c8-2 11 3 9 8s-7 6-10 5" fill="none" stroke="#6f9d7e" stroke-width="4" stroke-linecap="round" opacity=".85"/>\n<ellipse cx="46" cy="47" rx="18" ry="3" fill="#c98a3c" opacity=".7"/>\n<path d="M40 38c-4-5 2-8-1-13M50 37c-4-5 2-8-1-13" fill="none" stroke="#c9b9a3" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>\n<path d="M58 60c4-6 10-6 12-3-3 4-8 6-12 3z" fill="#6aa04e" opacity=".8"/></g></svg>',
    ),
  },
  {
    k: "bylinka",
    n: "Bylinka",
    src: svg(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><defs><filter id="w" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="22" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="7"/><feGaussianBlur stdDeviation="0.7"/></filter><filter id="p"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3"/><feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.4  0 0 0 0 0.3  0 0 0 0.10 0"/><feComposite in2="SourceGraphic" operator="in"/></filter><radialGradient id="bg" cx="40%" cy="35%" r="75%"><stop offset="0" stop-color="#fbf7ec"/><stop offset="1" stop-color="#ece4cf"/></radialGradient></defs><circle cx="48" cy="48" r="48" fill="url(#bg)"/><circle cx="48" cy="48" r="48" fill="#fff" filter="url(#p)"/><g filter="url(#w)"><path d="M48 82C47 62 49 45 48 22" stroke="#4f7d3a" stroke-width="3" fill="none" stroke-linecap="round"/>\n<path d="M48 36c-14-8-22-2-22 4 8 4 16 3 22-4z" fill="#7cb05c" opacity=".85"/>\n<path d="M48 30c12-10 21-5 22 1-8 5-16 4-22-1z" fill="#8fc06a" opacity=".85"/>\n<path d="M48 52c-15-6-23 1-22 7 9 3 17 1 22-7z" fill="#6ca34f" opacity=".85"/>\n<path d="M48 47c14-8 23-2 23 4-9 4-17 3-23-4z" fill="#7cb05c" opacity=".85"/>\n<path d="M48 66c-12-4-19 2-18 7 7 2 14 0 18-7z" fill="#5f9446" opacity=".8"/>\n<path d="M48 62c12-5 19 0 19 5-7 3-14 2-19-5z" fill="#6ca34f" opacity=".8"/>\n<path d="M48 24c-5-6-1-10 0-12 2 3 5 7 0 12z" fill="#9fcf78" opacity=".9"/></g></svg>',
    ),
  },
  {
    k: "houba",
    n: "Houba",
    src: svg(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><defs><filter id="w" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="33" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="7"/><feGaussianBlur stdDeviation="0.7"/></filter><filter id="p"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3"/><feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.4  0 0 0 0 0.3  0 0 0 0.10 0"/><feComposite in2="SourceGraphic" operator="in"/></filter><radialGradient id="bg" cx="40%" cy="35%" r="75%"><stop offset="0" stop-color="#fbf7ec"/><stop offset="1" stop-color="#ece4cf"/></radialGradient></defs><circle cx="48" cy="48" r="48" fill="url(#bg)"/><circle cx="48" cy="48" r="48" fill="#fff" filter="url(#p)"/><g filter="url(#w)"><ellipse cx="48" cy="80" rx="30" ry="6" fill="#8fb36b" opacity=".55"/>\n<path d="M38 52c-2 10-3 20 0 27 5 4 15 4 20 0 3-7 2-17 0-27z" fill="#f1e5c8"/>\n<path d="M40 60c4 2 12 2 16 0" stroke="#d8c59c" stroke-width="2" fill="none" opacity=".7"/>\n<path d="M14 54c0-20 15-34 34-34s34 14 34 34c-6 5-20 6-34 6s-28-1-34-6z" fill="#8b4f27" opacity=".92"/>\n<path d="M22 44c5-12 14-18 25-19" stroke="#c07a42" stroke-width="6" stroke-linecap="round" fill="none" opacity=".55"/>\n<path d="M18 55c10 4 50 4 60 0" stroke="#5e3418" stroke-width="2" fill="none" opacity=".45"/>\n<path d="M64 76c3-6 8-7 11-5-3 4-7 6-11 5zM24 77c-2-5-7-6-9-4 2 3 6 5 9 4z" fill="#6aa04e" opacity=".8"/></g></svg>',
    ),
  },
  {
    k: "strom",
    n: "Strom",
    src: svg(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><defs><filter id="w" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="44" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="7"/><feGaussianBlur stdDeviation="0.7"/></filter><filter id="p"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3"/><feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.4  0 0 0 0 0.3  0 0 0 0.10 0"/><feComposite in2="SourceGraphic" operator="in"/></filter><radialGradient id="bg" cx="40%" cy="35%" r="75%"><stop offset="0" stop-color="#fbf7ec"/><stop offset="1" stop-color="#ece4cf"/></radialGradient></defs><circle cx="48" cy="48" r="48" fill="url(#bg)"/><circle cx="48" cy="48" r="48" fill="#fff" filter="url(#p)"/><g filter="url(#w)"><ellipse cx="48" cy="82" rx="30" ry="5" fill="#8fb36b" opacity=".55"/>\n<path d="M44 82c1-10 1-20 0-28h8c-1 8-1 18 0 28z" fill="#7a5233"/>\n<path d="M48 60l-9-8M48 57l9-9" stroke="#7a5233" stroke-width="3" stroke-linecap="round"/>\n<circle cx="48" cy="36" r="22" fill="#5f9a4a" opacity=".85"/>\n<circle cx="33" cy="45" r="14" fill="#73ad55" opacity=".85"/>\n<circle cx="63" cy="45" r="14" fill="#6aa34f" opacity=".85"/>\n<circle cx="40" cy="28" r="12" fill="#8cc068" opacity=".7"/>\n<circle cx="58" cy="30" r="10" fill="#7fb85d" opacity=".7"/>\n<circle cx="52" cy="22" r="7" fill="#a6d07f" opacity=".6"/></g></svg>',
    ),
  },
  {
    k: "kvet",
    n: "Květ",
    src: svg(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><defs><filter id="w" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="55" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="7"/><feGaussianBlur stdDeviation="0.7"/></filter><filter id="p"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3"/><feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.4  0 0 0 0 0.3  0 0 0 0.10 0"/><feComposite in2="SourceGraphic" operator="in"/></filter><radialGradient id="bg" cx="40%" cy="35%" r="75%"><stop offset="0" stop-color="#fbf7ec"/><stop offset="1" stop-color="#ece4cf"/></radialGradient></defs><circle cx="48" cy="48" r="48" fill="url(#bg)"/><circle cx="48" cy="48" r="48" fill="#fff" filter="url(#p)"/><g filter="url(#w)"><path d="M48 84c0-14 1-24 0-34" stroke="#4f7d3a" stroke-width="3" fill="none" stroke-linecap="round"/>\n<path d="M48 70c-10-6-17-2-17 3 6 3 12 2 17-3z" fill="#6ca34f" opacity=".85"/>\n<g transform="translate(48 40)" opacity=".9">\n<ellipse rx="7" ry="15" cy="-14" fill="#e98fa6"/><ellipse rx="7" ry="15" cy="-14" fill="#ee9fb2" transform="rotate(45)"/>\n<ellipse rx="7" ry="15" cy="-14" fill="#e98fa6" transform="rotate(90)"/><ellipse rx="7" ry="15" cy="-14" fill="#ee9fb2" transform="rotate(135)"/>\n<ellipse rx="7" ry="15" cy="-14" fill="#e98fa6" transform="rotate(180)"/><ellipse rx="7" ry="15" cy="-14" fill="#ee9fb2" transform="rotate(225)"/>\n<ellipse rx="7" ry="15" cy="-14" fill="#e98fa6" transform="rotate(270)"/><ellipse rx="7" ry="15" cy="-14" fill="#ee9fb2" transform="rotate(315)"/>\n<circle r="9" fill="#e8b23a"/><circle r="5" fill="#c98a1e" opacity=".6"/></g></g></svg>',
    ),
  },
  {
    k: "zahradka",
    n: "Zahrádka",
    src: svg(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><defs><filter id="w" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="66" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="7"/><feGaussianBlur stdDeviation="0.7"/></filter><filter id="p"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3"/><feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.4  0 0 0 0 0.3  0 0 0 0.10 0"/><feComposite in2="SourceGraphic" operator="in"/></filter><radialGradient id="bg" cx="40%" cy="35%" r="75%"><stop offset="0" stop-color="#fbf7ec"/><stop offset="1" stop-color="#ece4cf"/></radialGradient><clipPath id="c"><circle cx="48" cy="48" r="47"/></clipPath></defs><circle cx="48" cy="48" r="48" fill="url(#bg)"/><circle cx="48" cy="48" r="48" fill="#fff" filter="url(#p)"/><g clip-path="url(#c)"><g filter="url(#w)"><path d="M0 66c20-5 70-5 96 0v30H0z" fill="#8a6142" opacity=".75"/><path d="M6 70c18-3 66-3 84 0" stroke="#6e4a30" stroke-width="2" fill="none" opacity=".6"/><path d="M8 80c18-3 62-3 80 0" stroke="#6e4a30" stroke-width="2" fill="none" opacity=".5"/><path d="M14 66c0-8 0-14 0-20M24 66V40M34 66V48" stroke="#c8a77a" stroke-width="2.6" stroke-linecap="round" opacity=".8"/><path d="M12 46h24M12 54h24" stroke="#c8a77a" stroke-width="2" opacity=".7"/><path d="M48 67c0-8 0-14 0-22" stroke="#4f7d3a" stroke-width="2.6" fill="none"/><path d="M48 54c-9-6-15-1-15 3 6 3 11 2 15-3zM48 50c9-7 15-2 15 2-6 3-11 3-15-2z" fill="#7cb05c" opacity=".85"/><circle cx="48" cy="40" r="6" fill="#e9c24a" opacity=".9"/><circle cx="48" cy="40" r="2.6" fill="#b9821e" opacity=".7"/><path d="M66 67c-1-6 0-12-1-17M72 67c0-5 1-10 0-14M78 67c-1-4 0-8-1-11" stroke="#5f9446" stroke-width="2.2" fill="none" stroke-linecap="round"/><ellipse cx="65" cy="48" rx="4" ry="6" fill="#9b7fd0" opacity=".85"/><ellipse cx="72" cy="51" rx="3.5" ry="5" fill="#a98ad8" opacity=".85"/><ellipse cx="78" cy="55" rx="3" ry="4.5" fill="#9b7fd0" opacity=".8"/><path d="M24 64c-6-3-9 0-8 2 3 1 6 1 8-2zM30 64c5-4 9-1 8 1-3 2-6 2-8-1z" fill="#6ca34f" opacity=".8"/><ellipse cx="22" cy="28" rx="10" ry="4" fill="#fff" opacity=".7"/><circle cx="74" cy="22" r="8" fill="#f3cf6b" opacity=".7"/></g></g></svg>',
    ),
  },
];

/** Earlier photo presets → nearest painted picture. */
const LEGACY: Record<string, string> = {
  slunecnice: "kvet",
  hermanek: "kvet",
  hrib: "houba",
  levandule: "bylinka",
  mesicek: "kvet",
  trapatka: "kvet",
};

/** Own-photo upload, set up by the app shell when a storage backend exists (null on the web). */
export type OwnAvatarBackend = {
  upload: (blob: Blob) => Promise<boolean>;
  url: (version: string) => string | null;
};
let backend: OwnAvatarBackend | null = null;
export function configureOwnAvatar(b: OwnAvatarBackend) {
  backend = b;
}
export const ownAvatarEnabled = () => backend != null;

/** Without an upload backend (web, signed out) the own photo is kept on this device only. */
const KEY_LOCAL = "ll-avatar-vlastni";
export function saveLocalAvatar(dataUrl: string): boolean {
  try {
    localStorage.setItem(KEY_LOCAL, dataUrl);
    return true;
  } catch {
    return false;
  }
}
const localAvatar = (): string | null => {
  try {
    return localStorage.getItem(KEY_LOCAL);
  } catch {
    return null;
  }
};
export const blobToDataUrl = (b: Blob) =>
  new Promise<string>((r) => {
    const fr = new FileReader();
    fr.onload = () => r(String(fr.result));
    fr.readAsDataURL(b);
  });
export const uploadOwnAvatar = (blob: Blob) =>
  backend ? backend.upload(blob) : Promise.resolve(false);

/** Image URL for a stored avatar value ("hermanek", "own:1700000000"), or null. */
export function avatarSrc(a: string): string | null {
  if (!a) return null;
  if (a.startsWith("own:")) return backend?.url(a.slice(4)) ?? null;
  if (a.startsWith("local:")) return localAvatar();
  const p = AVATAR_PRESETS.find((x) => x.k == (LEGACY[a] ?? a));
  return p ? p.src : null;
}

/** Square-crop and shrink a picked photo to a small JPEG before upload. */
export async function shrinkPhoto(file: File, size = 256): Promise<Blob | null> {
  const bmp = await createImageBitmap(file).catch(() => null);
  if (!bmp) return null;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const side = Math.min(bmp.width, bmp.height);
  c.getContext("2d")!.drawImage(
    bmp,
    (bmp.width - side) / 2,
    (bmp.height - side) / 2,
    side,
    side,
    0,
    0,
    size,
    size,
  );
  return new Promise((r) => c.toBlob((b) => r(b), "image/jpeg", 0.85));
}
