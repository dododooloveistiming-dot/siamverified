// Root "/" — redirect to /en/ via meta refresh (works on static export).
// Vercel rewrites can also handle this but this is simpler for `output: "export"`.
import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/en/");
}
