import { redirect } from "next/navigation";
import { site } from "@/lib/site";

/**
 * emoraa.com/join — the address printed as a QR code on the practitioner
 * brochure and pamphlet.
 *
 * Paper cannot be updated, so the print points here and this decides where it
 * goes: today the application form in `site.practitionerForm`, later a page of
 * our own. A temporary redirect on purpose: a permanent one is cached by
 * browsers, and phones that scanned it once would never see the new home.
 */
export default function JoinPage() {
  redirect(site.practitionerForm || "/contact");
}
