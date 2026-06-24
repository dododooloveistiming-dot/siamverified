"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Lang } from "@/lib/types";

// Client-side "recently viewed" rail backed by localStorage. On a place page it
// records the current place and shows the others; on the homepage (no `record`)
// it just shows the rail. Purely engagement/retention — survives navigation and
// return visits, gives search-landed users an onward path (lower bounce, more
// pages/session). No backend, works with static/ISR pages.
export type RecentItem = {
  slug: string;
  name: string;
  photo?: string;
  city?: string;
  trust?: number;
};

const KEY = "vt_recent";
const CAP = 12;

export default function RecentlyViewed({
  lang,
  title,
  record,
}: {
  lang: Lang;
  title: string;
  record?: RecentItem;
}) {
  const [items, setItems] = useState<RecentItem[]>([]);

  useEffect(() => {
    let list: RecentItem[] = [];
    try {
      list = JSON.parse(localStorage.getItem(KEY) || "[]");
      if (!Array.isArray(list)) list = [];
    } catch {
      list = [];
    }
    if (record?.slug) {
      list = [record, ...list.filter((x) => x?.slug && x.slug !== record.slug)].slice(0, CAP);
      try {
        localStorage.setItem(KEY, JSON.stringify(list));
      } catch {
        /* quota / private mode — ignore */
      }
    }
    setItems(list.filter((x) => x?.slug && x.slug !== record?.slug));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [record?.slug]);

  if (items.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="mb-4 text-lg font-bold tracking-tight">{title}</h2>
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-6">
        {items.map((p) => (
          <Link
            key={p.slug}
            href={`/${lang}/place/${p.slug}/`}
            className="group block w-36 shrink-0 overflow-hidden rounded-xl border border-ink-100 bg-white transition hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow dark:border-ink-800 dark:bg-ink-900 sm:w-auto"
          >
            <div className="relative aspect-square bg-ink-50 dark:bg-ink-800">
              {p.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.photo}
                  alt={p.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition group-hover:scale-[1.04]"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-emerald-200 to-amber-200 dark:from-emerald-900/40 dark:to-amber-900/30" />
              )}
              {typeof p.trust === "number" && (
                <div className="absolute right-1.5 top-1.5 rounded-md bg-emerald-500 px-1.5 py-0.5 text-[10px] font-black text-white shadow">
                  {p.trust}
                </div>
              )}
            </div>
            <div className="p-2.5">
              <div className="line-clamp-2 text-xs font-bold leading-tight">{p.name}</div>
              {p.city && <div className="mt-1 text-[10px] muted">{p.city}</div>}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
