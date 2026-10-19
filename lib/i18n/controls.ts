import type { Locale } from "@/lib/i18n";

/**
 * The few words the shared form controls (Field, Select) add on
 * their own, in both languages.
 *
 * A file of its own, with nothing imported beyond the locale type, because
 * those controls are on nearly every page and should not pull anything else
 * into the bundle. Could fold into copy.ts once nobody else is editing it.
 */
export type ControlCopy = {
  optional: string;
  required: string;
  choose: string;
  showPassword: string;
  hidePassword: string;
};

const CONTROLS: Record<Locale, ControlCopy> = {
  en: {
    optional: "optional",
    required: "(required)",
    choose: "Choose…",
    showPassword: "Show password",
    hidePassword: "Hide password",
  },
  hi: {
    optional: "ज़रूरी नहीं",
    required: "(ज़रूरी)",
    choose: "चुनिए…",
    showPassword: "पासवर्ड दिखाइए",
    hidePassword: "पासवर्ड छिपाइए",
  },
};

export function controlCopy(locale: Locale): ControlCopy {
  return CONTROLS[locale] ?? CONTROLS.en;
}
