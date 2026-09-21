import { revalidatePath } from "next/cache";

/** Every page that shows a therapist, so an admin's edit is live at once. */
export function refreshExpertPages() {
  for (const path of ["/", "/services", "/book", "/match"]) revalidatePath(path);
}
