// Profile pictures: six preset plant photos (the app's own Commons photos; the porcini is a drawn
// illustration) or the user's own photo where an upload backend is configured (Android app).
import { photoUrl } from "./photos";

const HRIB_SVG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" fill="#e8f0dc"/><ellipse cx="48" cy="84" rx="30" ry="5" fill="#9bb87a"/><path d="M36 52c0 0-4 22 2 30 4 5 16 5 20 0 6-8 2-30 2-30z" fill="#efe3c8" stroke="#c9b48a" stroke-width="2"/><path d="M14 54c0-20 15-34 34-34s34 14 34 34c0 4-6 6-34 6s-34-2-34-6z" fill="#8a4b22"/><path d="M22 46c4-12 14-20 26-21" stroke="#b06a35" stroke-width="5" stroke-linecap="round" fill="none" opacity=".7"/></svg>`,
  );

export const AVATAR_PRESETS: { k: string; n: string; sp?: string; src?: string }[] = [
  { k: "slunecnice", n: "Slunečnice", sp: "helianthus_annuus" },
  { k: "hermanek", n: "Heřmánek", sp: "matricaria_chamomilla" },
  { k: "hrib", n: "Hřib pravý", src: HRIB_SVG },
  { k: "levandule", n: "Levandule", sp: "lavandula_angustifolia" },
  { k: "mesicek", n: "Měsíček", sp: "calendula_officinalis" },
  { k: "trapatka", n: "Třapatkovka", sp: "echinacea_purpurea" },
];

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
export const uploadOwnAvatar = (blob: Blob) =>
  backend ? backend.upload(blob) : Promise.resolve(false);

/** Image URL for a stored avatar value ("hermanek", "own:1700000000"), or null. */
export function avatarSrc(a: string): string | null {
  if (!a) return null;
  if (a.startsWith("own:")) return backend?.url(a.slice(4)) ?? null;
  const p = AVATAR_PRESETS.find((x) => x.k == a);
  if (!p) return null;
  return p.src ?? (p.sp ? photoUrl(p.sp, "t") : null);
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
