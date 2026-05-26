import type { KlookPlace } from "@/lib/data";

/**
 * Compact Klook booking card — sits above-the-fold so visitors immediately
 * see "you can book this instantly" without scrolling past the description.
 *
 * Layout:
 * - Featured product on the left (large photo + title + rating + CTA)
 * - Up to 2 alternative products on the right (compact rows)
 *
 * NB: prices in our Klook scrape are not extractable (price_thb is null
 * across the board), so we surface rating + review count instead. Klook's
 * own "Free cancellation" badge gives buyers the confidence cue normally
 * provided by a price preview.
 */
export default function KlookOffer({
  data,
  placeName,
}: {
  data: KlookPlace;
  placeName: string;
}) {
  const products = data.products.slice(0, 3);
  if (products.length === 0) return null;
  const [top, ...rest] = products;

  return (
    <section className="overflow-hidden rounded-2xl border-2 border-rose-200 bg-gradient-to-br from-rose-50 to-orange-50 shadow-sm dark:border-rose-800 dark:from-rose-950/30 dark:to-orange-950/20">
      <div className="flex items-center justify-between gap-3 border-b border-rose-200 bg-white/50 px-4 py-2 backdrop-blur dark:border-rose-800 dark:bg-ink-900/40">
        <div className="flex items-center gap-2 text-sm font-black text-rose-700 dark:text-rose-300">
          <span>⚡</span>
          <span>Bookable on Klook</span>
        </div>
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
          Free cancellation
        </span>
      </div>

      <div className="grid gap-4 p-4 md:grid-cols-[1.4fr_1fr]">
        {/* FEATURED — large card */}
        <a
          href={top.product_url}
          target="_blank"
          rel="nofollow sponsored noopener"
          className="group block overflow-hidden rounded-xl border border-rose-100 bg-white transition hover:-translate-y-0.5 hover:shadow-lg dark:border-rose-900 dark:bg-ink-900"
        >
          {top.photo_url ? (
            <div className="relative aspect-video bg-ink-100 dark:bg-ink-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={top.photo_url}
                alt={top.title}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <span className="absolute right-2 top-2 rounded-md bg-rose-600 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-white shadow">
                Klook
              </span>
            </div>
          ) : (
            <div className="grid aspect-video place-items-center bg-gradient-to-br from-rose-100 to-orange-100 text-4xl dark:from-rose-950/40 dark:to-orange-950/30">
              ⚡
            </div>
          )}
          <div className="p-3">
            <h3 className="line-clamp-2 text-sm font-black leading-snug">{top.title}</h3>
            <div className="mt-1.5 flex items-center justify-between text-xs">
              {top.rating != null ? (
                <span className="font-bold">
                  ★ {top.rating.toFixed(1)}
                  {top.review_count ? (
                    <span className="ml-1 font-normal muted">
                      ({top.review_count.toLocaleString()} reviews)
                    </span>
                  ) : null}
                </span>
              ) : (
                <span className="muted">No reviews yet</span>
              )}
              <span className="font-black text-rose-700 dark:text-rose-300">
                Reserve →
              </span>
            </div>
          </div>
        </a>

        {/* ALTERNATIVES */}
        <div className="space-y-2">
          {rest.length > 0 ? (
            rest.map((p, i) => (
              <a
                key={i}
                href={p.product_url}
                target="_blank"
                rel="nofollow sponsored noopener"
                className="group flex gap-3 rounded-xl border border-rose-100 bg-white p-2.5 transition hover:border-rose-300 hover:shadow dark:border-rose-900 dark:bg-ink-900"
              >
                {p.photo_url ? (
                  <div className="relative aspect-square w-20 shrink-0 overflow-hidden rounded-lg bg-ink-100 dark:bg-ink-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.photo_url}
                      alt={p.title}
                      className="h-full w-full object-cover transition group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="grid aspect-square w-20 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-rose-100 to-orange-100 text-xl dark:from-rose-950/40 dark:to-orange-950/30">
                    ⚡
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="line-clamp-2 text-xs font-bold leading-snug">{p.title}</div>
                  <div className="mt-1 flex items-center justify-between text-[10px]">
                    {p.rating != null && (
                      <span className="font-semibold">
                        ★ {p.rating.toFixed(1)}
                        {p.review_count ? <span className="muted"> ({p.review_count.toLocaleString()})</span> : null}
                      </span>
                    )}
                    <span className="font-bold text-rose-700 dark:text-rose-300">Reserve →</span>
                  </div>
                </div>
              </a>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-rose-200 bg-white/40 p-4 text-xs muted dark:border-rose-900 dark:bg-ink-900/40">
              Only one Klook listing available for {placeName}.
            </div>
          )}

          <a
            href={data.search_url}
            target="_blank"
            rel="nofollow sponsored noopener"
            className="block rounded-xl border border-rose-300 bg-white px-3 py-2 text-center text-[11px] font-bold text-rose-700 transition hover:bg-rose-50 dark:border-rose-700 dark:bg-ink-900 dark:text-rose-300 dark:hover:bg-rose-950/40"
          >
            See all options on Klook →
          </a>
        </div>
      </div>
    </section>
  );
}
