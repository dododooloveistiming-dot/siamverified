export const dynamic = "force-static";

export default function CheckEmailPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-16 text-center">
      <div className="text-5xl">📬</div>
      <h1 className="mt-4 text-2xl font-black tracking-tight">Check your email</h1>
      <p className="mt-2 text-sm text-ink-600 dark:text-ink-400">
        We sent a one-time sign-in link to your inbox. Click it to finish signing in.
      </p>
      <p className="mt-6 text-xs text-ink-500 dark:text-ink-500">
        Didn&apos;t get it within a minute? Check spam, or{" "}
        <a href="/auth/signin" className="underline">try again</a>.
      </p>
    </main>
  );
}
