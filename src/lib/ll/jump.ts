// Scrolling to a part of a page (a preparation form, the warnings…) without touching the URL hash:
// the Android app and the preview use hash routing, where "#pozor" would navigate away.

let pending: string | null = null;

/** Remember an element id to scroll to after the next page has rendered (e.g. a form on the detail page). */
export function setPendingAnchor(id: string) {
  pending = id;
}
export function takePendingAnchor(): string | null {
  const p = pending;
  pending = null;
  return p;
}

/** Open every collapsed section around the element, scroll it to the top of the screen below the
 *  sticky header and flash it. Returns false when the element is not on the page. */
export function scrollToAnchor(id: string, flash = true): boolean {
  if (typeof document == "undefined") return false;
  const el = document.getElementById(id);
  if (!el) return false;
  for (let d = el.closest("details"); d; d = d.parentElement?.closest("details") ?? null)
    d.open = true;
  if (el.tagName == "DETAILS") (el as HTMLDetailsElement).open = true;
  const head = document.querySelector<HTMLElement>(".site-header")?.offsetHeight ?? 0;
  const y = el.getBoundingClientRect().top + window.scrollY - head - 8;
  window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
  if (flash) {
    el.classList.remove("hl");
    void el.offsetWidth;
    el.classList.add("hl");
  }
  return true;
}
