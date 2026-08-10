import { redirect } from "next/navigation";

// The bare /draft path has no content of its own - H2H is the default
// sub-section. Without this, visiting /draft directly (e.g. the top nav
// link) 404s, since only /draft/h2h and /draft/cup have real pages.
export default function DraftPage() {
  redirect("/draft/h2h");
}
