"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { loadWishlist, type WishlistItem } from "@/components/WishlistButton";

// Client page — wishlist lives in localStorage, no SSR data needed.
// Stored items carry a snapshot of the venue's display fields so the
// compare view renders instantly without round-tripping places.json.

export default function WishlistPage() {
  const params = useParams();
  const lang = (params?.lang as string) || "en";
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(loadWishlist());
    setHydrated(true);
    const onChange = () => setItems(loadWishlist());
    window.addEventListener("wishlist-changed", onChange);
    return () => window.removeEventListener("wishlist-changed", onChange);
  }, []);

  const clear = () => {
    if (!confirm("Clear all saved venues?")) return;
    localStorage.removeItem("verifiedthai.wishlist");
    window.dispatchEvent(new CustomEvent("wishlist-changed"));
  };

  return (
    <main className="pb-20">
      <section className="border-b border-ink-100 bg-gradient-to-b from-amber-50/60 to-white py-10 dark:border-ink-800 dark:from-amber-950/20 dark:to-ink-950">
        <div className="mx-auto max-w-5xl px-4">
          <nav className="text-xs muted">
            <Link href={`/${lang}/`} className="hover:underline">Verified Thai</Link>
            <span className="mx-2">/</span>
            <span>Saved venues</span>
          </nav>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                ★ Your saved venues
              </h1>
              <p className="mt-2 text-sm muted">
                Saved locally in your browser. Compare side-by-side, share the list, or
                send an inquiry to all of them at once.
              </p>
            </div>
            {hydrated && items.length > 0 && (
              <button
                type="button"
                onClick={clear}
                className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-950/40"
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4">
        {!hydrated ? (
          <div className="mt-12 text-center text-sm muted">Loading…</div>
        ) : items.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-dashed border-ink-200 bg-white p-10 text-center dark:border-ink-700 dark:bg-ink-900">
            <div className="text-5xl">☆</div>
            <p className="mt-3 text-base font-bold">No saved venues yet</p>
            <p className="mt-2 text-sm muted">
              Tap the star on any venue card to add it here. Build a shortlist of 3-5,
              then compare or share with friends.
            </p>
            <Link
              href={`/${lang}/`}
              className="mt-5 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
            >
              Browse venues →
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-6 text-xs muted">
              {items.length} venue{items.length === 1 ? "" : "s"} saved
            </div>
            <ul className="mt-3 space-y-3">
              {items
                .slice()
                .sort((a, b) => b.addedAt - a.addedAt)
                .map((it) => (
                  <li key={it.id}>
                    <Link
                      href={`/${lang}/place/${it.slug}/`}
                      className="group flex gap-4 rounded-2xl border border-ink-100 bg-white p-3 transition hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-lg dark:border-ink-800 dark:bg-ink-900"
                    >
                      <div className="relative aspect-square w-28 shrink-0 overflow-hidden rounded-xl bg-ink-50 dark:bg-ink-800">
                        {it.top_photo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={it.top_photo_url} alt={it.name} className="h-full w-full object-cover transition group-hover:scale-105" />
                        ) : (
                          <div className="grid h-full w-full place-items-center text-2xl muted">📍</div>
                        )}
                        <div className="absolute right-1 top-1 rounded-md bg-emerald-500 px-1.5 py-0.5 text-[10px] font-black text-white shadow">
                          {it.trust_score}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="line-clamp-2 text-base font-bold leading-snug">{it.name}</h2>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs muted">
                          {it.city && <span>📍 {it.city}</span>}
                          <span>· {it.niche}</span>
                          {it.rating != null && (
                            <span className="font-semibold text-amber-600 dark:text-amber-400">
                              ★ {it.rating.toFixed(1)}
                            </span>
                          )}
                        </div>
                        {it.price_min_thb && it.price_min_thb > 0 && (
                          <div className="mt-2 text-sm font-black tabular-nums text-emerald-700 dark:text-emerald-400">
                            ฿{it.price_min_thb.toLocaleString()}
                            {it.price_max_thb && it.price_max_thb > it.price_min_thb
                              ? `–${it.price_max_thb.toLocaleString()}`
                              : ""}
                          </div>
                        )}
                        <div className="mt-2 text-[11px] muted">
                          Saved {new Date(it.addedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
            </ul>
          </>
        )}
      </div>
    </main>
  );
}
