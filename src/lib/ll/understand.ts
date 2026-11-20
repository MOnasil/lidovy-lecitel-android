import { D, NM, norm } from "./data";

function lev1(a: string, b: string) {
  if (a === b) return true;
  const la = a.length,
    lb = b.length;
  if (Math.abs(la - lb) > 1) return false;
  let i = 0,
    j = 0,
    e = 0;
  while (i < la && j < lb) {
    if (a[i] === b[j]) {
      i++;
      j++;
      continue;
    }
    if (++e > 1) return false;
    if (la > lb) i++;
    else if (lb > la) j++;
    else {
      i++;
      j++;
    }
  }
  return e + (la - i) + (lb - j) <= 1;
}
type Kw = { p?: string; x?: string; s?: string };
const parseKw = (kw: string): Kw[] =>
  kw
    .split(" ")
    .filter(Boolean)
    .map((w) =>
      w.includes("_")
        ? { p: w.replace(/_/g, " ") }
        : w.endsWith(".")
          ? { x: w.slice(0, -1) }
          : { s: w },
    );
const KWT = D.topics.map((t) => ({ k: t.k, items: parseKw(t.kw) }));
const KWN = D.nem.map((n) => ({ k: n.k, items: parseKw(n.kw) }));

function hits(items: Kw[], nq: string, toks: string[]) {
  let n = 0;
  for (const it of items) {
    if (it.p) {
      if (nq.includes(it.p)) n += 2;
    } else if (it.x) {
      if (toks.includes(it.x)) n++;
    } else if (it.s) {
      const s = it.s;
      if (
        toks.some(
          (w) =>
            w.startsWith(s) ||
            (s.length >= 6 &&
              w.length >= s.length - 1 &&
              (lev1(w.slice(0, s.length), s) ||
                lev1(w.slice(0, s.length + 1), s) ||
                lev1(w.slice(0, s.length - 1), s))),
        )
      )
        n++;
    }
  }
  return n;
}

/** Turns a free-text description of complaints into condition keys (n) and topic keys (t). */
export function understand(q: string): { t: string[]; n: string[] } {
  const nq =
    " " +
    norm(q)
      .replace(/[^a-z0-9 ]+/g, " ")
      .replace(/\s+/g, " ")
      .trim() +
    " ";
  if (!nq.trim()) return { t: [], n: [] };
  const toks = nq.trim().split(" ");
  let n = KWN.map((x) => [x.k, hits(x.items, nq, toks)] as const)
    .filter((x) => x[1])
    .sort((a, b) => b[1] - a[1])
    .map((x) => x[0]);
  // drop the more general condition when a more specific one in the same area matched
  if (n.includes("migrena")) n = n.filter((k) => k != "bolest_hlavy");
  if (n.includes("pasovy_opar")) n = n.filter((k) => k != "opar");
  if (n.includes("senna")) n = n.filter((k) => k != "nachlazeni");
  const gut = /\b(strev|brich|bris|zalud|kolik)/.test(nq);
  if (gut || n.includes("zily")) n = n.filter((k) => k != "krece");
  if (n.includes("paleni_zahy")) n = n.filter((k) => k != "popaleniny");
  if (n.includes("kojeni")) n = n.filter((k) => k != "rany");
  if (n.includes("sije")) n = n.filter((k) => k != "krk");
  if (n.includes("zavrate")) n = n.filter((k) => k != "bolest_hlavy");
  if (n.includes("modriny")) n = n.filter((k) => k != "svaly");
  if (/\b(pokozk|vlas|lupy)/.test(nq)) n = n.filter((k) => k != "bolest_hlavy");
  n = n.slice(0, 4);
  let t = KWT.map((x) => [x.k, hits(x.items, nq, toks)] as const)
    .filter((x) => x[1])
    .sort((a, b) => b[1] - a[1])
    .map((x) => x[0]);
  if (!gut && n.some((k) => k == "krece" || k == "neuro" || k == "zily"))
    t = t.filter((k) => k != "traveni");
  if (n.includes("sije")) t = t.filter((k) => k != "plice");
  if (/\b(pokozk|vlas|lupy)/.test(nq)) t = t.filter((k) => k != "hlava");
  if (n.includes("paleni_zahy")) t = t.filter((k) => k != "kuze");
  t = t.filter((k) => !n.some((nk) => NM[nk]?.tp == k)).slice(0, 3);
  return { t, n };
}
