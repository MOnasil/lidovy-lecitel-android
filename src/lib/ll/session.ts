// "Zůstat přihlášen": when unticked at sign-in, the session ends once the app or browser is closed.
// sessionStorage survives reloads and switching apps but not closing the app / browser, so a missing
// marker on start means "closed since sign-in" → sign out locally.

const KEY_ONLY_SESSION = "ll-jen-relace";
const KEY_ALIVE = "ll-relace";

/** Remember the choice made on the sign-in form. */
export function rememberStaySignedIn(stay: boolean) {
  try {
    if (stay) localStorage.removeItem(KEY_ONLY_SESSION);
    else localStorage.setItem(KEY_ONLY_SESSION, "1");
    sessionStorage.setItem(KEY_ALIVE, "1");
  } catch {
    /* storage unavailable – stays signed in */
  }
}

/** True when the user chose not to stay signed in and the app/browser has been closed since. */
export function sessionExpired(): boolean {
  try {
    if (localStorage.getItem(KEY_ONLY_SESSION) != "1") return false;
    if (sessionStorage.getItem(KEY_ALIVE) == "1") return false;
    localStorage.removeItem(KEY_ONLY_SESSION);
    return true;
  } catch {
    return false;
  }
}
