import { permanentRedirect } from "next/navigation";

/**
 * "Doctors" is what people type. It is not what most of these people are.
 *
 * Ten of the eleven practitioners are psychologists: registered to practise,
 * and not medically qualified to prescribe. Labelling the page "Doctors" would
 * imply otherwise to every visitor, and on a mental-health site in India that
 * is not a wording preference — a clinical psychologist and a psychiatrist are
 * different registrations with different powers, and someone arriving in need
 * of medication has to be able to tell.
 *
 * So the search term is honoured and the page is named truthfully: this
 * redirects, permanently, so the address people guess still works and only one
 * URL is ever indexed.
 */
export default function DoctorsPage() {
  permanentRedirect("/therapists");
}
