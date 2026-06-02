import type { Highlight } from "@/lib/highlights";

const TONE: Record<Highlight["tone"], string> = {
  default: "bg-ink-100 text-ink-900 dark:bg-ink-800 dark:text-ink-100",
  good: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  accent: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300",
};

export default function PlaceHighlights({ items, title }: { items: Highlight[]; title: string }) {
  if (items.length === 0) return null;
  return (
    <section className="mt-6">
      <h2 className="mb-2 text-sm font-bold uppercase tracking-wide muted">{title}</h2>
      <ul className="flex flex-wrap gap-2">
        {items.map((h, i) => (
          <li
            key={i}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold ${TONE[h.tone]}`}
          >
            <span aria-hidden>{h.icon}</span>
            <span>{h.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
