/**
 * The visitor's analytics-cookie choice, kept in their own browser.
 *
 * Only optional (analytics) storage is gated by this. The sign-in cookie and
 * the contact-verification cookies are strictly necessary for the service the
 * person asked for, so they don't need consent; the cookie policy says so.
 */
export type Consent = "granted" | "denied";

const KEY = "emoraa_consent";
/** Fired on window whenever the choice changes, and to reopen the banner. */
export const CONSENT_EVENT = "emoraa:consent";
export const OPEN_SETTINGS_EVENT = "emoraa:cookie-settings";

export function readConsent(): Consent | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    // private mode or blocked storage: treat as not yet asked
    return null;
  }
}

export function writeConsent(value: Consent) {
  try {
    localStorage.setItem(KEY, value);
  } catch {
    // the choice still applies for this page view through the event below
  }
  window.dispatchEvent(new CustomEvent<Consent>(CONSENT_EVENT, { detail: value }));
}

export function openCookieSettings() {
  window.dispatchEvent(new Event(OPEN_SETTINGS_EVENT));
}
