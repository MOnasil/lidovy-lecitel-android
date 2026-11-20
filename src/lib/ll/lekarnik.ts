import { RED, norm } from "./data";

/**
 * "Zeptejte se lékárníka" – TEST VERSION. Questions stay in this browser only; nothing is sent
 * and no payment is taken. A real version needs a questions table, a pharmacist inbox and a
 * payment provider (set up through Lovable).
 */
export type Dotaz = {
  id: string;
  q: string;
  /** created, ms */
  ts: number;
  /** pharmacist may see the user's profile flags and medicines */
  profil: boolean;
  /** true once the (test) payment step was confirmed; the first question is free */
  placeno: boolean;
  odpoved?: string;
  odpovezeno?: number;
};

export const KEY_LEKARNIK = "ll-lekarnik";
export const LHUTA_H = 24;
/** Placeholder price for the test version; the real price is not decided yet. */
export const CENA_KC = 99;
export const MIN_ZNAKU = 15;
export const MAX_ZNAKU = 1500;

/** The first question is free; every later one goes through the (test) payment step. */
export const prvniZdarma = (list: Dotaz[]) => list.length == 0;

export const termin = (d: Dotaz) => new Date(d.ts + LHUTA_H * 3600e3);

export function overDotaz(q: string): { ok: true } | { ok: false; duvod: string; urgent?: string } {
  const t = q.trim();
  const red = RED.find((r) => r[0].test(norm(t)));
  if (red) return { ok: false, duvod: "urgent", urgent: red[1] };
  if (t.length < MIN_ZNAKU)
    return {
      ok: false,
      duvod: `Napište prosím aspoň ${MIN_ZNAKU} znaků, ať lékárník ví, o co jde.`,
    };
  if (t.length > MAX_ZNAKU)
    return { ok: false, duvod: `Otázka může mít nejvýš ${MAX_ZNAKU} znaků.` };
  return { ok: true };
}

export function novyDotaz(q: string, profil: boolean, placeno: boolean, now = Date.now()): Dotaz {
  return {
    id: `${now.toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    q: q.trim(),
    ts: now,
    profil,
    placeno,
  };
}

export const TEST_ODPOVED =
  "Toto je testovací odpověď. V ostré verzi sem do 24 hodin napíše odpověď skutečný lékárník. Odpověď nenahrazuje návštěvu lékaře.";
