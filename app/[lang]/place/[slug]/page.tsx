import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadPlaces, getPlaceBySlug, getSimilarPlaces, getPlaceMentions } from "@/lib/data";
import { SITE, SUPPORTED_LANGS, T, t } from "@/lib/i18n";
import type { Lang, Place } from "@/lib/types";
import { NICHE_META, nicheName } from "@/lib/types";
import StickyBookBar from "@/components/StickyBookBar";
import InquiryForm from "@/components/InquiryForm";
import PhotoGallery from "@/components/PhotoGallery";

export const dynamic = "force-static";

export function generateStaticParams() {
  const bundle = loadPlaces();
  const params: Array<{ lang: Lang; slug: string }> = [];
  for (const lang of SUPPORTED_LANGS) {
    for (const p of bundle.places) {
      params.push({ lang, slug: p.slug });
    }
  }
  return params;
}

export async function generateMetadata({ params }: { params: { lang: Lang; slug: string } }): Promise<Metadata> {
  const place = getPlaceBySlug(params.slug);
  if (!place) return {};
  const url = `${SITE.origin}/${params.lang}/place/${place.slug}/`;
  const cat = nicheName(place.niche, params.lang);
  return {
    title: `${place.name} — ${cat} | ${SITE.name}`,
    description: `Trust Score ${place.trust_score}. ${place.review_count ?? 0} reviews on Google. ${t("sources_pitch", params.lang)}.`,
    alternates: {
      canonical: url,
      languages: Object.fromEntries(SUPPORTED_LANGS.map((l) => [l, `${SITE.origin}/${l}/place/${place.slug}/`])),
    },
    openGraph: {
      title: place.name,
      description: `${cat} · Trust Score ${place.trust_score}`,
      url,
      images: place.top_photo_url ? [{ url: place.top_photo_url, width: 1200, height: 630 }] : [],
    },
  };
}

function AffiliateCTA({ place, lang }: { place: Place; lang: Lang }) {
  // Hide the placeholder affiliate IDs from the actual displayed URL when env not set.
  const out: Array<{ label: string; href: string; tone: string }> = [];
  if (place.affiliate.klook) out.push({ label: t("cta_book_klook", lang), href: place.affiliate.klook, tone: "bg-rose-600 hover:bg-rose-700" });
  if (place.affiliate.viator) out.push({ label: t("cta_book_viator", lang), href: place.affiliate.viator, tone: "bg-emerald-600 hover:bg-emerald-700" });
  if (place.affiliate.getyourguide) out.push({ label: t("cta_book_gyg", lang), href: place.affiliate.getyourguide, tone: "bg-orange-600 hover:bg-orange-700" });
  if (place.niche === "wellness" || place.niche === "spa" || place.niche === "coworking") {
    if (place.affiliate.agoda) out.push({ label: t("cta_book_agoda", lang), href: place.affiliate.agoda, tone: "bg-sky-600 hover:bg-sky-700" });
  }
  if (place.affiliate.bookimed) out.push({ label: "Get Free Quote (Bookimed)", href: place.affiliate.bookimed, tone: "bg-blue-600 hover:bg-blue-700" });
  if (out.length === 0) return null;
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {out.map((b) => (
        <a
          key={b.label}
          href={b.href}
          target="_blank"
          rel="nofollow sponsored noopener"
          className={`rounded-xl px-4 py-3 text-center text-sm font-bold text-white shadow-sm transition ${b.tone}`}
        >
          {b.label} →
        </a>
      ))}
    </div>
  );
}

export default function PlaceDetailPage({ params }: { params: { lang: Lang; slug: string } }) {
  const { lang, slug } = params;
  const place = getPlaceBySlug(slug);
  if (!place) notFound();
  const meta = NICHE_META[place.niche];
  const similar = getSimilarPlaces(place, 4);
  const mentions = getPlaceMentions(place.id);

  // Source badges
  const sources = [
    { name: "Google", value: place.source_badges.google_reviews, icon: "★" },
    { name: "Reddit", value: place.source_badges.reddit, icon: "💬" },
    { name: "YouTube", value: place.source_badges.videos, icon: "▶" },
    { name: "Naver", value: place.source_badges.naver, icon: "🇰🇷" },
    { name: "Pantip", value: place.source_badges.pantip, icon: "🇹🇭" },
    { name: "Photos", value: place.source_badges.photos, icon: "📸" },
    { name: "Website", value: place.source_badges.website, icon: "🔗" },
    { name: "Bookimed", value: place.source_badges.bookimed, icon: "🏥" },
  ].filter((s) => s.value > 0);

  const hours = (() => {
    if (!place.opening_hours_json) return null;
    try {
      return JSON.parse(place.opening_hours_json) as Record<string, string>;
    } catch {
      return null;
    }
  })();

  // JSON-LD: LocalBusiness + AggregateRating + FAQ
  const jsonLd: any = {
    "@context": "https://schema.org",
    "@type": place.niche === "wellness" ? "HealthAndBeautyBusiness" : "LocalBusiness",
    name: place.name,
    address: { "@type": "PostalAddress", streetAddress: place.address, addressLocality: place.city, addressCountry: "TH" },
    telephone: place.phone || undefined,
    url: place.website || undefined,
    image: place.top_photo_url || undefined,
    aggregateRating: place.rating
      ? { "@type": "AggregateRating", ratingValue: place.rating, reviewCount: place.review_count ?? 1 }
      : undefined,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="mx-auto max-w-5xl px-4 pb-28 md:pb-20">
        <nav className="mt-6 text-xs muted">
          <Link href={`/${lang}/`} className="hover:underline">{SITE.name}</Link>
          <span className="mx-2">/</span>
          <Link href={`/${lang}/c/${place.niche}/`} className="hover:underline">{nicheName(place.niche, lang)}</Link>
          <span className="mx-2">/</span>
          <span className="truncate">{place.name}</span>
        </nav>

        {/* HEADER */}
        <section className="mt-3 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {place.top_photo_url ? (
              <div className="aspect-[16/9] overflow-hidden rounded-2xl bg-ink-50 dark:bg-ink-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={place.top_photo_url} alt={place.name} className="h-full w-full object-cover" />
              </div>
            ) : (
              <div className="flex aspect-[16/9] items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 to-amber-50 text-7xl dark:from-emerald-950/40 dark:to-amber-950/30">
                {meta.emoji}
              </div>
            )}
            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">{place.name}</h1>
            <p className="mt-1 text-sm muted">
              {place.city ? `${place.city} · ` : ""}{nicheName(place.niche, lang)}
              {place.category ? ` · ${place.category}` : ""}
            </p>
            {place.is_suspected_viral && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-orange-100 px-3 py-1.5 text-xs font-medium text-orange-800 dark:bg-orange-900/40 dark:text-orange-300">
                ⚠ {t("low_signal_warn", lang)}
              </div>
            )}
          </div>

          {/* TRUST SUMMARY */}
          <aside className="rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black tabular-nums text-emerald-700 dark:text-emerald-400">
                {place.trust_score}
              </span>
              <span className="text-xs muted">/ 100</span>
            </div>
            <div className="text-sm font-bold">{t("trust_score", lang)}</div>
            <p className="mt-1 text-xs muted">Cross-checked across {sources.length} sources</p>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {sources.map((s) => (
                <span
                  key={s.name}
                  className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                  title={`${s.name}: ${s.value}`}
                >
                  <span>{s.icon}</span>
                  <span>{s.name}</span>
                </span>
              ))}
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-ink-100 pt-4 text-xs dark:border-ink-800">
              <div>
                <dt className="muted">Google rating</dt>
                <dd className="font-bold">{place.rating ? `★ ${place.rating.toFixed(1)}` : "—"}</dd>
              </div>
              <div>
                <dt className="muted">Reviews</dt>
                <dd className="font-bold tabular-nums">{(place.review_count ?? 0).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="muted">Photos collected</dt>
                <dd className="font-bold tabular-nums">{place.photos_count}</dd>
              </div>
              <div>
                <dt className="muted">Videos found</dt>
                <dd className="font-bold tabular-nums">{place.videos_count}</dd>
              </div>
              {place.price_band !== "unknown" && (
                <div className="col-span-2">
                  <dt className="muted">{t("price_range", lang)}</dt>
                  <dd className="font-bold">
                    {place.price_min_thb > 0 ? `฿${place.price_min_thb.toLocaleString()}` : "—"}
                    {place.price_max_thb > place.price_min_thb ? ` – ฿${place.price_max_thb.toLocaleString()}` : ""}
                    <span className="ml-1 text-[10px] muted">/ {place.price_unit}</span>
                  </dd>
                </div>
              )}
            </dl>

            <div className="mt-5 flex flex-wrap gap-1.5">
              {place.is_beginner_friendly && (
                <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-medium text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
                  ✓ {t("filter_beginner", lang)}
                </span>
              )}
              {place.languages.ko && (
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-medium text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
                  🇰🇷 Korean-friendly
                </span>
              )}
              {place.languages.zh && (
                <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-medium text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300">
                  🇨🇳 Chinese
                </span>
              )}
              {place.languages.ja && (
                <span className="rounded-full bg-pink-100 px-2 py-0.5 text-[10px] font-medium text-pink-700 dark:bg-pink-900/40 dark:text-pink-300">
                  🇯🇵 Japanese
                </span>
              )}
              {place.is_open_24h && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                  24h
                </span>
              )}
            </div>
          </aside>
        </section>

        {/* INQUIRY FORM — direct contact via Verified Thai */}
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide muted">
            Contact {place.name}
          </h2>
          <InquiryForm placeId={place.slug} placeName={place.name} lang={lang} />
        </section>

        {/* AFFILIATE CTAs */}
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide muted">{t("book_or_inquire", lang)}</h2>
          <AffiliateCTA place={place} lang={lang} />
          <p className="mt-2 text-[10px] muted">{t("affiliate_disclaimer", lang)}</p>
        </section>

        {/* OWN THIS LISTING? */}
        <section className="mt-8 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/40 p-4 text-sm dark:border-emerald-700 dark:bg-emerald-950/20">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-bold text-emerald-900 dark:text-emerald-200">
                Own {place.name}?
              </div>
              <p className="mt-1 text-xs text-emerald-800 dark:text-emerald-300">
                Claim this listing to manage hours, descriptions, photos, and reach Korean / English / Thai customers.
              </p>
            </div>
            <a
              href={`/auth/signin?callbackUrl=/dashboard/claim/${place.slug}`}
              className="shrink-0 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
            >
              Claim this listing →
            </a>
          </div>
        </section>

        {/* TOP REVIEW */}
        {place.top_review_text && (
          <section className="mt-10">
            <h2 className="mb-3 text-lg font-bold">{t("patient_voices", lang)}</h2>
            <blockquote className="rounded-2xl border-l-4 border-emerald-400 bg-emerald-50/50 p-4 text-sm leading-relaxed dark:bg-emerald-950/20">
              "{place.top_review_text}"
            </blockquote>
            {place.reviews_sample.length > 1 && (
              <ul className="mt-4 space-y-3">
                {place.reviews_sample.slice(1, 5).map((rv, i) => (
                  <li key={i} className="rounded-xl border border-ink-100 bg-white p-3 text-sm dark:border-ink-800 dark:bg-ink-900">
                    <div className="text-xs muted">
                      {rv.reviewer || "Anonymous"} {rv.rating ? `· ★ ${rv.rating}` : ""} {rv.date ? `· ${rv.date}` : ""}
                    </div>
                    <p className="mt-1">{rv.text}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* PHOTOS */}
        {place.photos_sample.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-3 text-lg font-bold">{t("photos_label", lang)} ({place.photos_count})</h2>
            <PhotoGallery photos={place.photos_sample} alt={place.name} />
          </section>
        )}

        {/* HOURS */}
        {hours && (
          <section className="mt-10">
            <h2 className="mb-3 text-lg font-bold">{t("hours", lang)}</h2>
            <dl className="grid grid-cols-1 gap-1 text-sm sm:grid-cols-2">
              {Object.entries(hours).map(([day, val]) => (
                <div key={day} className="flex justify-between rounded-lg bg-white px-3 py-2 dark:bg-ink-900">
                  <dt className="muted">{day}</dt>
                  <dd className="font-medium">{val}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {/* PER-PLACE NAVER (Korean blogs about this specific business) */}
        {mentions.naver.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
              <span>🇰🇷</span> Korean blog reviews
              <span className="text-xs font-normal muted">({mentions.naver.length})</span>
            </h2>
            <ul className="space-y-2">
              {mentions.naver.map((b, i) => (
                <li key={i}>
                  <a
                    href={b.blog_url}
                    target="_blank"
                    rel="nofollow noopener"
                    className="block rounded-xl border border-ink-100 bg-white p-3 transition hover:border-emerald-400 dark:border-ink-800 dark:bg-ink-900"
                  >
                    <div className="text-xs muted">
                      {b.blogger_name ? `blog.naver.com/${b.blogger_name}` : "Naver Blog"}
                      {b.blog_date ? ` · ${b.blog_date}` : ""}
                    </div>
                    <div className="mt-1 text-sm font-medium">{b.blog_title}</div>
                    {b.blog_snippet && (
                      <p className="mt-1 line-clamp-2 text-xs muted">{b.blog_snippet}</p>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* PER-PLACE YOUTUBE */}
        {mentions.youtube.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
              <span>▶</span> Videos about {place.name}
              <span className="text-xs font-normal muted">({mentions.youtube.length})</span>
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {mentions.youtube.map((v, i) => (
                <a
                  key={i}
                  href={v.video_url}
                  target="_blank"
                  rel="nofollow noopener"
                  className="group block overflow-hidden rounded-xl border border-ink-100 bg-white transition hover:border-emerald-400 dark:border-ink-800 dark:bg-ink-900"
                >
                  <div className="relative aspect-video bg-ink-100 dark:bg-ink-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://i.ytimg.com/vi/${v.video_id}/hqdefault.jpg`}
                      alt={v.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 grid place-items-center bg-black/20 transition group-hover:bg-black/30">
                      <div className="grid h-12 w-12 place-items-center rounded-full bg-red-600 text-white shadow-lg">
                        ▶
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="line-clamp-2 text-xs font-semibold leading-snug">{v.title}</div>
                    <div className="mt-1 text-[10px] muted">{v.channel_title}</div>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* PER-PLACE PANTIP (Thai forum threads) */}
        {mentions.pantip.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
              <span>🇹🇭</span> Local Thai discussions
              <span className="text-xs font-normal muted">({mentions.pantip.length})</span>
            </h2>
            <ul className="space-y-2">
              {mentions.pantip.map((p, i) => (
                <li key={i}>
                  <a
                    href={p.topic_url}
                    target="_blank"
                    rel="nofollow noopener"
                    className="block rounded-xl border border-ink-100 bg-white p-3 transition hover:border-emerald-400 dark:border-ink-800 dark:bg-ink-900"
                  >
                    <div className="text-xs muted">
                      Pantip
                      {p.reply_count ? ` · ${p.reply_count} replies` : ""}
                      {p.posted_date ? ` · ${p.posted_date}` : ""}
                    </div>
                    <div className="mt-1 text-sm font-medium">{p.title}</div>
                    {p.summary && (
                      <p className="mt-1 line-clamp-2 text-xs muted">{p.summary}</p>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* COMMUNITY MENTIONS — fuzzy-matched by place name */}
        {place.community_mentions && place.community_mentions.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-3 text-lg font-bold">{t("mentions_in_community", lang)}</h2>
            <p className="mb-4 text-xs muted">{t("mentions_blurb", lang)}</p>
            <ul className="space-y-3">
              {place.community_mentions.map((m, i) => {
                const sourceLabel = m.kind === "reddit" ? `r/${m.subreddit || "all"}`
                                  : m.kind === "pantip" ? "Pantip"
                                  : "Naver Blog";
                const accent = m.kind === "reddit" ? "border-orange-300 dark:border-orange-700"
                             : m.kind === "pantip" ? "border-fuchsia-300 dark:border-fuchsia-700"
                             : "border-emerald-300 dark:border-emerald-700";
                const icon = m.kind === "reddit" ? "💬" : m.kind === "pantip" ? "🇹🇭" : "🇰🇷";
                return (
                  <li key={i}>
                    <a href={m.url} target="_blank" rel="nofollow noopener" className={`block rounded-xl border-l-4 ${accent} bg-white p-3 transition hover:shadow dark:bg-ink-900`}>
                      <div className="flex items-center gap-2 text-xs muted">
                        <span>{icon}</span>
                        <span className="font-semibold">{sourceLabel}</span>
                        {m.score ? <span>· {m.score}↑</span> : null}
                        {m.comments ? <span>· {m.comments} comments</span> : null}
                        {m.date ? <span>· {m.date}</span> : null}
                      </div>
                      <div className="mt-1 text-sm font-medium leading-snug">{m.title}</div>
                      {m.snippet && <div className="mt-1 line-clamp-2 text-xs muted">{m.snippet}</div>}
                    </a>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* CONTACT */}
        <section className="mt-10 rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
          <h2 className="mb-3 text-lg font-bold">{t("contact_links", lang)}</h2>
          <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            {place.address && (
              <div><dt className="muted">{t("address_label", lang)}</dt><dd>{place.address}</dd></div>
            )}
            {place.phone && (
              <div><dt className="muted">{t("phone_label", lang)}</dt><dd><a href={`tel:${place.phone}`} className="text-emerald-700 hover:underline dark:text-emerald-400">{place.phone}</a></dd></div>
            )}
            {place.website && (
              <div><dt className="muted">{t("website_label", lang)}</dt><dd><a href={place.website} target="_blank" rel="noopener" className="text-emerald-700 hover:underline dark:text-emerald-400">{place.website}</a></dd></div>
            )}
            {place.google_maps_url && (
              <div><dt className="muted">Google Maps</dt><dd><a href={place.google_maps_url} target="_blank" rel="noopener" className="text-emerald-700 hover:underline dark:text-emerald-400">{t("cta_view_map", lang)} ↗</a></dd></div>
            )}
          </dl>
        </section>

        {/* SIMILAR PLACES — same niche, prefer same city */}
        {similar.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-4 text-lg font-bold">
              More {nicheName(place.niche, lang)} {place.city ? `in ${place.city}` : "in Thailand"}
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {similar.map((p) => (
                <Link
                  key={p.id}
                  href={`/${lang}/place/${p.slug}/`}
                  className="group block overflow-hidden rounded-xl border border-ink-100 bg-white transition hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow dark:border-ink-800 dark:bg-ink-900"
                >
                  <div className="relative aspect-square bg-ink-50 dark:bg-ink-800">
                    {p.top_photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.top_photo_url} alt={p.name} className="h-full w-full object-cover transition group-hover:scale-[1.04]" loading="lazy" />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-3xl">{meta.emoji}</div>
                    )}
                    <div className="absolute right-1.5 top-1.5 rounded-md bg-emerald-500 px-1.5 py-0.5 text-[10px] font-black text-white">
                      {p.trust_score}
                    </div>
                  </div>
                  <div className="p-2.5">
                    <div className="line-clamp-2 text-xs font-bold leading-tight">{p.name}</div>
                    <div className="mt-1 text-[10px] muted">{p.city}</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="mt-10 text-xs muted">
          <Link href={`/${lang}/c/${place.niche}/`} className="hover:underline">
            ← Back to {nicheName(place.niche, lang)}
          </Link>
        </div>

        {/* Schema.org LocalBusiness — boosts SEO + AEO (LLM citing) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "@id": `${SITE.origin}/${lang}/place/${place.slug}/`,
              name: place.name,
              address: place.address
                ? {
                    "@type": "PostalAddress",
                    streetAddress: place.address,
                    addressLocality: place.city,
                    addressCountry: "TH",
                  }
                : undefined,
              telephone: place.phone || undefined,
              url: place.website || undefined,
              image: place.top_photo_url || undefined,
              priceRange:
                place.price_min_thb > 0
                  ? `฿${place.price_min_thb}${place.price_max_thb > place.price_min_thb ? `–฿${place.price_max_thb}` : ""}`
                  : undefined,
              aggregateRating:
                place.rating && place.review_count
                  ? {
                      "@type": "AggregateRating",
                      ratingValue: place.rating,
                      reviewCount: place.review_count,
                    }
                  : undefined,
            }),
          }}
        />
      </main>
      <StickyBookBar place={place} lang={lang} />
    </>
  );
}
