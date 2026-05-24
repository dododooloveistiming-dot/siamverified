import { signIn, auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string };
}) {
  const session = await auth();
  if (session?.user) {
    redirect(searchParams.callbackUrl ?? "/dashboard");
  }

  async function emailSignIn(formData: FormData) {
    "use server";
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    if (!email) return;
    await signIn("resend", {
      email,
      redirectTo: searchParams.callbackUrl ?? "/dashboard",
    });
  }

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-black tracking-tight">Sign in to Verified Thai</h1>
      <p className="mt-2 text-sm text-ink-600 dark:text-ink-400">
        We&apos;ll email you a one-time sign-in link. No password needed.
      </p>

      <form action={emailSignIn} className="mt-8 space-y-4">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-700 dark:text-ink-300">
            Email address
          </span>
          <input
            type="email"
            name="email"
            required
            autoFocus
            placeholder="you@example.com"
            className="mt-1 w-full rounded-xl border border-ink-200 bg-white px-3 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-ink-700 dark:bg-ink-900"
          />
        </label>
        <button
          type="submit"
          className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
        >
          Send magic link →
        </button>
      </form>

      <p className="mt-6 text-xs text-ink-500 dark:text-ink-500">
        By signing in you agree to act in good faith — only claim listings you have a real business relationship with.
      </p>
    </main>
  );
}
