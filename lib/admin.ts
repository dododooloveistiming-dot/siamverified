import { auth } from "@/lib/auth";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "dododooloveistiming@gmail.com")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export async function requireAdmin() {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  if (!email || !ADMIN_EMAILS.includes(email)) {
    return { session: null, isAdmin: false as const };
  }
  return { session, isAdmin: true as const };
}

export async function isAdminSession(): Promise<boolean> {
  const r = await requireAdmin();
  return r.isAdmin;
}
