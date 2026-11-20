/** True inside the Android app (Capacitor), false on the web. */
export function isApp(): boolean {
  if (typeof window == "undefined") return false;
  const c = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return !!c?.isNativePlatform?.();
}
