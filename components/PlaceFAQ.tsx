"use client";
import { useState } from "react";

export type FAQItem = { q: string; a: string };

export default function PlaceFAQ({ items }: { items: FAQItem[] }) {
  const [open, setOpen] = useState<number | null>(0);
  if (items.length === 0) return null;
  return (
    <ul className="divide-y divide-ink-100 rounded-2xl border border-ink-100 bg-white dark:divide-ink-800 dark:border-ink-800 dark:bg-ink-900">
      {items.map((it, i) => {
        const isOpen = open === i;
        return (
          <li key={i}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-start justify-between gap-3 px-4 py-4 text-left transition hover:bg-ink-50/50 dark:hover:bg-ink-800/30"
              aria-expanded={isOpen}
            >
              <span className="text-sm font-bold leading-snug">{it.q}</span>
              <span
                className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink-100 text-xs font-bold transition ${
                  isOpen ? "rotate-45 bg-emerald-500 text-white" : "dark:bg-ink-800"
                }`}
              >
                +
              </span>
            </button>
            {isOpen && (
              <div className="px-4 pb-4 text-sm leading-relaxed text-ink-700 dark:text-ink-300">
                {it.a.split("\n").map((line, j) => (
                  <p key={j} className={j > 0 ? "mt-2" : ""}>
                    {line}
                  </p>
                ))}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
