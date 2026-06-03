import type { PerPlaceNaverHit, PerPlaceCafeHit } from "@/lib/data";

type Snippet = { title: string; snippet: string; url: string; date?: string; source: string };

function toSnippets(naver: PerPlaceNaverHit[], cafe: PerPlaceCafeHit[]): Snippet[] {
  const a = naver.map((h) => ({
    title: h.blog_title || "",
    snippet: h.blog_snippet || "",
    url: h.blog_url,
    date: h.blog_date,
    source: `네이버 블로그${h.blogger_name ? ` · ${h.blogger_name}` : ""}`,
  }));
  const b = cafe.map((h) => ({
    title: h.post_title || "",
    snippet: h.post_snippet || "",
    url: h.cafe_url,
    date: h.post_date,
    source: `네이버 카페${h.cafe_name ? ` · ${h.cafe_name}` : ""}`,
  }));
  return [...a, ...b].filter((s) => s.title || s.snippet);
}

function Card({ s }: { s: Snippet }) {
  return (
    <a
      href={s.url}
      target="_blank"
      rel="nofollow noopener"
      className="block rounded-xl border border-rose-200 bg-white p-3 transition hover:border-rose-400 hover:shadow dark:border-rose-900/50 dark:bg-ink-900"
    >
      <div className="text-xs text-rose-700 dark:text-rose-300">
        {s.source}{s.date ? ` · ${s.date}` : ""}
      </div>
      {s.title && <div className="mt-1 line-clamp-1 text-sm font-bold">{s.title}</div>}
      {s.snippet && <p className="mt-0.5 line-clamp-2 text-xs muted">{s.snippet}</p>}
    </a>
  );
}

export default function KoreanProof({ naver, cafe }: { naver: PerPlaceNaverHit[]; cafe: PerPlaceCafeHit[] }) {
  const snippets = toSnippets(naver, cafe);
  if (snippets.length === 0) return null;
  const top = snippets.slice(0, 3);
  const rest = snippets.slice(3);
  return (
    <section className="mt-6 rounded-2xl border-2 border-rose-200 bg-rose-50/40 p-4 dark:border-rose-900/50 dark:bg-rose-950/20">
      <div className="mb-1 flex items-center gap-2">
        <span className="text-base">🇰🇷</span>
        <h2 className="text-base font-black">한국인 후기 {snippets.length}개</h2>
      </div>
      <p className="mb-3 text-[11px] muted">구글·트립어드바이저엔 없는, 한국인이 직접 다녀와서 쓴 실후기예요.</p>
      <div className="grid grid-cols-1 gap-2">
        {top.map((s, i) => <Card key={i} s={s} />)}
      </div>
      {rest.length > 0 && (
        <details className="mt-2 group">
          <summary className="cursor-pointer list-none text-xs font-bold text-rose-700 dark:text-rose-300">
            한국 후기 {rest.length}개 더보기 ▾
          </summary>
          <div className="mt-2 grid grid-cols-1 gap-2">
            {rest.map((s, i) => <Card key={i} s={s} />)}
          </div>
        </details>
      )}
    </section>
  );
}
