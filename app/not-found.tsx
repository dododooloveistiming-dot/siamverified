import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <div className="text-6xl font-bold text-ink-200">404</div>
      <p className="mt-2 text-sm text-ink-700">This clinic page wasn't found.</p>
      <Link href="/en/" className="mt-6 rounded-lg bg-clinic px-4 py-2 text-sm font-semibold text-white">
        Back to directory
      </Link>
    </main>
  );
}
