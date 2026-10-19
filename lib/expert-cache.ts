import { revalidatePath } from "next/cache";

/**
 * Every page that shows a therapist, so an admin's edit is live at once.
 *
 * The directory and its profiles are included by layout, not by path: each
 * profile is its own URL, and listing them one by one would mean this function
 * silently stopped covering a practitioner the day one was added.
 */
export function refreshExpertPages() {
  for (const path of ["/", "/services", "/book", "/match", "/therapists"]) {
    revalidatePath(path);
  }
  // every /therapists/<slug> at once
  revalidatePath("/therapists/[slug]", "page");
}
