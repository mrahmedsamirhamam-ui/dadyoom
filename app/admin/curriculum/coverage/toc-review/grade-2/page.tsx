import { redirect } from "next/navigation";
// Backward-compatible route for the existing evidence intake page link.
export default function Grade2TocRedirect() {
  redirect("/admin/curriculum/coverage/toc-review/basic/2");
}
