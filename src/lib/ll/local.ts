import { useCallback, useEffect, useState } from "react";

/** Browser-only state that survives reloads. Reads after hydration so SSR and the first client frame match. */
export function useLocal<T>(key: string, initial: T): [T, (v: T | ((prev: T) => T)) => void] {
  const [val, setVal] = useState<T>(initial);
  useEffect(() => {
    try {
      const v = localStorage.getItem(key);
      if (v != null) setVal(JSON.parse(v) as T);
    } catch {
      /* storage unavailable */
    }
  }, [key]);
  const set = useCallback(
    (v: T | ((prev: T) => T)) => {
      setVal((prev) => {
        const next = typeof v == "function" ? (v as (p: T) => T)(prev) : v;
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch {
          /* storage unavailable */
        }
        return next;
      });
    },
    [key],
  );
  return [val, set];
}
