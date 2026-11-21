import { useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { pageLabel, sendFeedback } from "@/lib/ll/feedback";
import { useApp } from "@/lib/ll/store";

/** "💬 Komentář" in the header: a short note about the app, sent with the page it was written on. */
export function Komentar() {
  const { account } = useApp();
  const path = useRouterState({ select: (r) => r.location.pathname });
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState("/");
  const [t, setT] = useState("");
  const [st, setSt] = useState<"" | "busy" | "ok" | "err">("");
  const close = () => {
    setOpen(false);
    if (st == "ok") {
      setT("");
      setSt("");
    }
  };
  return (
    <>
      <button
        type="button"
        className="kom-btn"
        onClick={() => (setFrom(path), setSt(""), setOpen(true))}
        aria-label="Přidat komentář k aplikaci"
      >
        💬 <span>Komentář</span>
      </button>
      {open ? (
        <div className="kom-bg" role="presentation" onClick={close}>
          <div
            className="kom-dlg"
            role="dialog"
            aria-modal="true"
            aria-label="Komentář k aplikaci"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>💬 Komentář k aplikaci</h3>
            {st == "ok" ? (
              <>
                <p>Děkujeme, komentář jsme dostali.</p>
                <button type="button" className="btn" onClick={close}>
                  Zavřít
                </button>
              </>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (t.trim().length < 2) return;
                  setSt("busy");
                  setSt((await sendFeedback(t.trim(), from, account?.email)) ? "ok" : "err");
                }}
              >
                <p className="note">
                  Stránka: <b>{pageLabel(from)}</b>. Co nefunguje, co chybí, co by šlo lépe?
                </p>
                <textarea
                  value={t}
                  onChange={(e) => setT(e.target.value)}
                  maxLength={4000}
                  rows={5}
                  autoFocus
                  aria-label="Text komentáře"
                />
                {st == "err" ? (
                  <p className="alert warn">
                    Komentář se nepodařilo odeslat. Zkontrolujte připojení a zkuste to znovu.
                  </p>
                ) : null}
                <div className="row-btns">
                  <button
                    type="submit"
                    className="btn"
                    disabled={st == "busy" || t.trim().length < 2}
                  >
                    {st == "busy" ? "Odesílám…" : "Odeslat"}
                  </button>
                  <button type="button" className="btn ghost" onClick={close}>
                    Zrušit
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
