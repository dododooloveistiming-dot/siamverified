import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <div className="text-7xl font-black text-ink-200 dark:text-ink-700">404</div>
      <p className="mt-3 text-sm muted">
        EN: Page not found · KO: 페이지를 찾을 수 없습니다 · TH: ไม่พบหน้านี้ · ZH: 找不到页面 · JA: ページが見つかりません · AR: الصفحة غير موجودة
      </p>
      <Link
        href="/en/"
        className="mt-8 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
      >
        ← Back to home
      </Link>
    </main>
  );
}
