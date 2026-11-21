import photos from "@/data/ll-photos.json";
import { D } from "./data";

// Species photos are hosted on Lovable's CDN; ll-photos.json maps species key → file → URL,
// where file is "t" (thumbnail) or "1", "2", … (full photos in D.ph order).
const P = photos as Record<string, Record<string, string>>;

/** Photos that do not show the plant itself (microscope, collage, building…) – hidden until replaced. */
const HIDDEN = new Set([
  "avena_sativa",
  "cichorium_intybus",
  "spirulina",
  "panax_ginseng",
]);

export const photoUrl = (k: string, file: string): string | null =>
  HIDDEN.has(k) ? null : (P[k]?.[file] ?? null);

/** True when the species has a usable photo of the plant. */
export const hasPhoto = (k: string): boolean => !HIDDEN.has(k) && !!D.ph[k]?.length && !!P[k];

/** Thumbnail URL used in lists, or null when the species has no photo. */
export function photo(k: string): string | null {
  if (!hasPhoto(k)) return null;
  return photoUrl(k, D.ph[k]![0]!.not ? "1" : "t");
}
