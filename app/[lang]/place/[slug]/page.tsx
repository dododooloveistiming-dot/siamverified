import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadPlaces, getPlaceBySlug, getSimilarPlaces, getPlaceMentions, getOwnerProfile, getReplyTimeStats, getReviewKo, getYoutubeSearch, toMapMarker } from "@/lib/data";
import { getPlaceSignals, emailProviderLabel, trustBreakdown, formatSubs } from "@/lib/signals";
import { SITE, SUPPORTED_LANGS, T, t, tf, withXDefault } from "@/lib/i18n";
import { isIndexablePlace, cleanReviewText, pickFeaturedReview, isThaiText } from "@/lib/reviews";
import { buildPlaceFaqs } from "@/lib/place-faqs";
import { placeHighlights } from "@/lib/highlights";
import PlaceHighlights from "@/components/PlaceHighlights";
import PrimaryCTA from "@/components/PrimaryCTA";
import KoreanProof from "@/components/KoreanProof";
import type { Lang, Place } from "@/lib/types";
import { NICHE_META, nicheName } from "@/lib/types";
import InquiryForm from "@/components/InquiryForm";
import HeroMosaic from "@/components/HeroMosaic";
import AdSlot from "@/components/AdSlot";
import YouTubeFacade from "@/components/YouTubeFacade";
import PlaceFAQ from "@/components/PlaceFAQ";
import BookingForm from "@/components/BookingForm";
import PlacePlaceholder from "@/components/PlacePlaceholder";
import SafeImg from "@/components/SafeImg";
import ViewPing from "@/components/ViewPing";
import RecentlyViewed from "@/components/RecentlyViewed";
import { cityForPlace } from "@/lib/cities";
import { hasEnoughGuidePlaces } from "@/lib/guides";
import ShareButton from "@/components/ShareButton";
import WishlistButton from "@/components/WishlistButton";
import PlaceMap from "@/components/PlaceMap";

// ISR — initially built static; owner-profile edits are pushed live
// immediately via revalidatePath() from the profile API route (see
// app/api/listings/[id]/profile/route.ts), so this interval is just a
// long-tail safety net, not the primary update path. 24h keeps regeneration
// (and its lambda cost) far off the request hot path.
export const revalidate = 60 * 60 * 24;

// Allow on-demand rendering of place pages not pre-built below (the App
// Router default, made explicit here because it's load-bearing).
export const dynamicParams = true;

// Pre-render ONLY indexable places, and ONLY the canonical `en` route.
// Building all 4,206 places × 6 langs (~25k pages) overran Vercel's 45-min
// build limit and failed every deploy since the dataset expansion. Everything
// not pre-built here (other languages, thin/noindexed places) renders on first
// request and is then cached via ISR (`revalidate` above). The sitemap only
// lists indexable `en` place URLs, so crawlers warm exactly this set.
export function generateStaticParams() {
  const bundle = loadPlaces();
  return bundle.places
    .filter(isIndexablePlace)
    .map((p) => ({ lang: "en" as Lang, slug: p.slug }));
}

export async function generateMetadata({ params }: { params: { lang: Lang; slug: string } }): Promise<Metadata> {
  const place = getPlaceBySlug(params.slug);
  if (!place) return {};
  const url = `${SITE.origin}/${params.lang}/place/${place.slug}/`;
  const cat = nicheName(place.niche, params.lang);
  return {
    title: `${place.name} — ${cat} | ${SITE.name}`,
    description: (() => {
      const parts: string[] = [];
      parts.push(`${cat} in ${place.city}, Thailand`);
      if (place.rating && place.review_count) parts.push(`★ ${place.rating.toFixed(1)} · ${place.review_count.toLocaleString()} reviews`);
      if (place.trust_score) parts.push(`Trust ${place.trust_score}/100`);
      if (place.is_beginner_friendly) parts.push("Beginner-friendly");
      const signals = getPlaceSignals(place.id);
      if (signals.govCert?.type === "sha") parts.push("SHA Certified");
      if (place.price_min_thb > 0) parts.push(`from ฿${place.price_min_thb.toLocaleString()}`);
      return parts.join(" · ") + ". " + t("sources_pitch", params.lang) + ".";
    })(),
    robots: isIndexablePlace(place)
      ? undefined
      : { index: false, follow: true },
    alternates: {
      canonical: url,
      languages: withXDefault(Object.fromEntries(SUPPORTED_LANGS.map((l) => [l, `${SITE.origin}/${l}/place/${place.slug}/`]))),
    },
    openGraph: {
      title: place.name,
      description: `${cat} · Trust Score ${place.trust_score}`,
      url,
      images: [{
        url: `${SITE.origin}/api/og/place/${place.slug}`,
        width: 1200, height: 630,
        alt: place.name,
      }],
    },
    twitter: {
      card: "summary_large_image",
      title: place.name,
      description: `${cat} · Trust ${place.trust_score}/100`,
      images: [`${SITE.origin}/api/og/place/${place.slug}`],
    },
  };
}

export default async function PlaceDetailPage({ params }: { params: { lang: Lang; slug: string } }) {
  const { lang, slug } = params;
  const place = getPlaceBySlug(slug);
  if (!place) notFound();
  const meta = NICHE_META[place.niche];
  const ytVideos = getYoutubeSearch(place.id).slice(0, 4);
  const similar = getSimilarPlaces(place, 4);
  const hubCity = cityForPlace(place); // for place → guide → city cross-links
  const mentions = getPlaceMentions(place.id);
  // Owner-facing tables (listingProfiles, inquiries, placeViews) are all
  // keyed by the URL slug, not the Google place id — dashboard routes
  // (/dashboard/claim/[id], /dashboard/listings/[id]/edit) pass place.slug
  // as `id`, so reads here must match that key or owner edits never surface.
  const ownerProfile = await getOwnerProfile(place.slug);
  const replyStats = ownerProfile ? await getReplyTimeStats(place.slug) : null;
  const signals = getPlaceSignals(place.id);
  const highlights = placeHighlights(place, lang, signals);
  const reviewKo = lang === "ko" ? getReviewKo(place.id) : null;

  // Owner-controlled overlays (live DB) take precedence over scraped values
  const displayHours = ownerProfile?.hours || null;
  const displayDescription = ownerProfile?.description || null;
  const displayPhotos =
    ownerProfile && ownerProfile.ownerPhotos.length > 0
      ? ownerProfile.ownerPhotos
      : place.photos_sample;
  const displayHeroPhoto = displayPhotos[0] || place.top_photo_url;
  const services = ownerProfile?.services || [];
  const whatsapp = ownerProfile?.whatsapp || null;
  const lineId = ownerProfile?.lineId || null;

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

  // sameAs: external identity links only (not the canonical url field)
  const sameAs: string[] = [];
  if (place.google_maps_url) sameAs.push(place.google_maps_url);

  // Localized per-place FAQ items — drive both the visible accordion and the
  // FAQPage JSON-LD (the AEO payload). Built from structured data in one place.
  const faqs = buildPlaceFaqs(place, lang);

  // Photos for the mosaic — owner uploads first, otherwise scraped
  const mosaicPhotos = displayPhotos.slice(0, 30);

  // Social proof shows expanded only when it matches the visitor's language;
  // otherwise collapsed (e.g. a Japanese reader isn't led with Korean blogs).
  const expandKorean = lang === "ko";
  const expandPantip = lang === "th";
  const expandGoogleReviews = lang === "th"; // raw Google reviews are Thai

  return (
    <>
      <main className="pb-28 md:pb-20">
        {/* HERO — clean text header + Airbnb-style photo mosaic */}
        <section className="mx-auto max-w-5xl px-4 pt-6 sm:pt-8">
          <nav className="text-xs muted">
            <Link href={`/${lang}/`} className="hover:underline">{SITE.name}</Link>
            <span className="mx-2">/</span>
            <Link href={`/${lang}/c/${place.niche}/`} className="hover:underline">{nicheName(place.niche, lang)}</Link>
            <span className="mx-2">/</span>
            <span className="truncate">{place.name}</span>
          </nav>

          <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
            <h1 className="text-3xl font-black leading-tight tracking-tight sm:text-4xl md:text-5xl">
              {place.name}
            </h1>
            <div className="flex items-center gap-2">
              <WishlistButton place={place} variant="inline" />
              <ShareButton
                url={`${SITE.origin}/${lang}/place/${place.slug}/`}
                title={place.name}
                text={`${place.name} — ${nicheName(place.niche, lang)}${place.city ? ` (${place.city})` : ""} · Trust ${place.trust_score}/100 on ${SITE.name}`}
                label={({ en: "Share", ko: "공유", ja: "シェア", zh: "分享", th: "แชร์", ar: "مشاركة", id: "Bagikan", vi: "Chia sẻ" } as const)[lang]}
              />
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm muted">
            {place.rating != null && (
              <span className="font-semibold text-ink-900 dark:text-ink-100">
                ★ {place.rating.toFixed(1)}
                <span className="ml-1 font-normal muted">(Google)</span>
                {place.review_count ? <span className="ml-1 underline-offset-2 hover:underline">({place.review_count.toLocaleString()} reviews)</span> : null}
              </span>
            )}
            {place.rating != null && <span className="opacity-40">·</span>}
            <span>{meta.emoji} {nicheName(place.niche, lang)}</span>
            {place.city && <><span className="opacity-40">·</span><span>{place.city}</span></>}
            {place.is_partner && (
              <>
                <span className="opacity-40">·</span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">✓ {t("verified_partner", lang)}</span>
              </>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
            {(() => {
              const items = trustBreakdown(signals);
              const totalBoost = Math.min(25, items.reduce((s, i) => s + i.pts, 0));
              const base = Math.max(0, place.trust_score - totalBoost);
              const tip = items.length > 0
                ? `Base ${base} + ${items.map((i) => `${i.label} +${i.pts}`).join(" + ")} = ${place.trust_score}/100`
                : `Computed from Google reviews, photo count, cross-source mentions, and website signals.`;
              return (
                <Link
                  href={`/${lang}/trust/`}
                  title={tip + " — see /trust for methodology"}
                  className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-0.5 font-bold text-white transition hover:bg-emerald-600"
                >
                  <span>Trust {place.trust_score}/100</span>
                  <span className="text-[9px] opacity-80">ⓘ</span>
                </Link>
              );
            })()}
            {signals.govCert?.type === "sha" && (
              <span
                className="rounded-full bg-blue-100 px-2.5 py-0.5 font-bold text-blue-900 dark:bg-blue-950/40 dark:text-blue-300"
                title={`Thailand SHA (Safety & Health Administration) certified · ${signals.govCert.certId}`}
              >
                🏛 SHA Certified · {signals.govCert.certId}
              </span>
            )}
            {signals.govCert?.type === "tat" && (
              <span
                className="rounded-full bg-blue-100 px-2.5 py-0.5 font-bold text-blue-900 dark:bg-blue-950/40 dark:text-blue-300"
                title="Registered with Thailand's Tourism Authority (TAT)"
              >
                🏛 TAT Registered
              </span>
            )}
            {signals.recencyTier === "very_active" && (
              <span
                className="rounded-full bg-emerald-100 px-2.5 py-0.5 font-bold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                title="At least one Google review in the last 30 days"
              >
                🟢 Active last 30d
              </span>
            )}
            {signals.ageTier === "veteran" && signals.foundingYear && (
              <span
                className="rounded-full bg-amber-100 px-2.5 py-0.5 font-bold text-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
                title={`First archived ${signals.foundingYear} (${signals.ageYears}y online)`}
              >
                🏛 Since {signals.foundingYear}
              </span>
            )}
            {signals.ageTier === "established" && signals.foundingYear && (
              <span
                className="rounded-full bg-ink-100 px-2.5 py-0.5 font-semibold dark:bg-ink-800"
                title={`First archived ${signals.foundingYear} (${signals.ageYears}y online)`}
              >
                📅 Since {signals.foundingYear}
              </span>
            )}
            {place.price_band !== "unknown" && place.price_min_thb > 0 && (
              <span className="rounded-full bg-ink-100 px-2.5 py-0.5 font-semibold text-ink-900 dark:bg-ink-800 dark:text-ink-100">
                ฿{place.price_min_thb.toLocaleString()}
                {place.price_max_thb > place.price_min_thb ? `–${place.price_max_thb.toLocaleString()}` : ""}
                {place.price_unit && place.price_unit !== "unknown" && (
                  <span className="ml-1 opacity-75">/ {place.price_unit}</span>
                )}
              </span>
            )}
            {place.is_beginner_friendly && (
              <span className="rounded-full bg-sky-100 px-2.5 py-0.5 font-semibold text-sky-800 dark:bg-sky-950/40 dark:text-sky-300">
                🟢 Beginner-friendly
              </span>
            )}
            {place.languages.ko && (
              <span className="rounded-full bg-ink-100 px-2.5 py-0.5 font-semibold dark:bg-ink-800">
                🇰🇷 Korean OK
              </span>
            )}
            {place.languages.ja && (
              <span className="rounded-full bg-ink-100 px-2.5 py-0.5 font-semibold dark:bg-ink-800">
                🇯🇵 Japanese OK
              </span>
            )}
            {place.is_open_24h && (
              <span className="rounded-full bg-ink-100 px-2.5 py-0.5 font-semibold dark:bg-ink-800">
                🌙 24h
              </span>
            )}
            {place.is_suspected_viral && (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                ⚠ {t("low_signal_warn", lang)}
              </span>
            )}
          </div>
        </section>

        {/* IN-PAGE NAV — anchor TOC for long detail pages (native smooth scroll) */}
        <nav className="mx-auto mt-4 max-w-5xl px-4">
          <ul className="flex flex-wrap gap-2 text-xs font-semibold">
            {[
              { href: "#reviews", label: `⭐ ${t("patient_voices", lang)}` },
              { href: "#services", label: `💲 ${t("toc_services", lang)}` },
              { href: "#location", label: `📍 ${t("toc_location", lang)}` },
              { href: "#book", label: `📩 ${t("toc_book", lang)}` },
            ].map((a) => (
              <li key={a.href}>
                <a href={a.href} className="inline-block rounded-full border border-ink-200 px-3 py-1 text-ink-700 transition hover:border-emerald-400 hover:text-emerald-700 dark:border-ink-700 dark:text-ink-300">
                  {a.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* PHOTO MOSAIC — Airbnb-style 1+4 grid with fullscreen lightbox.
            When no photos exist but coords do, swap to a map-as-hero —
            map of the venue location is more useful to a traveler than
            yet another generic placeholder. */}
        <section className="mx-auto mt-5 max-w-5xl px-4">
          {mosaicPhotos.length === 0 && Number.isFinite(place.lat) && Number.isFinite(place.lng) ? (
            <PlaceMap places={[toMapMarker(place)]} lang={lang} height={400} />
          ) : (
            <HeroMosaic
              photos={mosaicPhotos}
              alt={place.name}
              placeholder={<PlacePlaceholder niche={place.niche} size="xl" />}
            />
          )}
        </section>

        {/* TRUST STRIP — sources cross-checked */}
        <section className="border-y border-ink-100 bg-white py-4 dark:border-ink-800 dark:bg-ink-950">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 text-xs">
            <span className="muted">{t("trust_crosschecked", lang)}</span>
            <div className="flex flex-wrap gap-1.5">
              {sources.map((s) => (
                <span
                  key={s.name}
                  className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                  title={`${s.name}: ${s.value}`}
                >
                  <span>{s.icon}</span>
                  <span>{s.name}</span>
                </span>
              ))}
              {signals.emailProvider && (
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 font-medium text-sky-800 dark:bg-sky-950/40 dark:text-sky-300"
                  title={`Business email runs on ${emailProviderLabel(signals.emailProvider)} — sign of a real, maintained operation`}
                >
                  <span>📧</span>
                  <span>{emailProviderLabel(signals.emailProvider)}</span>
                </span>
              )}
              {signals.instagram && (
                <a
                  href={signals.instagram.url}
                  target="_blank"
                  rel="noopener nofollow"
                  className="inline-flex items-center gap-1 rounded-full bg-pink-50 px-2.5 py-1 font-medium text-pink-800 transition hover:bg-pink-100 dark:bg-pink-950/30 dark:text-pink-300"
                  title={`@${signals.instagram.handle} · ${signals.instagram.followers.toLocaleString()} Instagram followers`}
                >
                  <span>📸</span>
                  <span>{formatSubs(signals.instagram.followers)} on Instagram</span>
                </a>
              )}
              {signals.whoisExpiryYear && (
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-ink-50 px-2.5 py-1 font-medium text-ink-700 dark:bg-ink-800 dark:text-ink-300"
                  title={`Domain registration paid until ${signals.whoisExpiryYear} — business isn't planning to disappear`}
                >
                  <span>🔒</span>
                  <span>Domain until {signals.whoisExpiryYear}</span>
                </span>
              )}
            </div>
            <span className="muted hidden sm:inline">
              {place.photos_count} photos · {place.videos_count} videos
            </span>
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-4">
        <PlaceHighlights items={highlights} title={t("hl_title", lang)} />
        <PrimaryCTA lang={lang} />
        {reviewKo && (
          <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/60 px-5 py-4 dark:border-blue-900/40 dark:bg-blue-950/20">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-blue-500">🇰🇷 한국어 리뷰 요약</p>
            <p className="text-sm leading-relaxed text-ink-800 dark:text-ink-200">{reviewKo}</p>
          </div>
        )}
        {lang === "ko" && <KoreanProof naver={mentions.naver} cafe={mentions.cafe} />}

        {/* REVIEW ACTIVITY — recency bars (unique: TripAdvisor doesn't show this) */}
        {signals.reviews365d > 0 && (() => {
          const bars = [
            { label: t("ra_30d", lang), count: signals.reviews30d },
            { label: t("ra_90d", lang), count: signals.reviews90d },
            { label: t("ra_year", lang), count: signals.reviews365d },
          ];
          const daysAgo = signals.recencyDaysSince;
          const lastLabel = daysAgo == null ? null
            : daysAgo <= 1   ? "today"
            : daysAgo <= 7   ? `${daysAgo}d ago`
            : daysAgo <= 60  ? `${Math.round(daysAgo / 7)}w ago`
            : daysAgo <= 730 ? `${Math.round(daysAgo / 30)}mo ago`
            : `${Math.round(daysAgo / 365)}y ago`;
          return (
            <div className="mt-6 rounded-2xl border border-ink-100 bg-white px-5 py-4 dark:border-ink-800 dark:bg-ink-900">
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-ink-500 dark:text-ink-400">{t("ra_title", lang)}</p>
              <div className="space-y-2">
                {bars.map(({ label, count }) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="w-24 shrink-0 text-xs text-ink-500 dark:text-ink-400">{label}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
                      <div
                        className="h-2 rounded-full bg-emerald-500 transition-all"
                        style={{ width: `${Math.round((count / signals.reviews365d) * 100)}%` }}
                      />
                    </div>
                    <span className="w-4 text-right text-xs font-semibold tabular-nums text-ink-700 dark:text-ink-300">{count}</span>
                  </div>
                ))}
              </div>
              {lastLabel && (
                <p className="mt-3 text-xs text-ink-400 dark:text-ink-500">{tf("ra_lastreviewed", lang, { ago: lastLabel })}</p>
              )}
            </div>
          );
        })()}

        {/* REVIEWS — Booking.com-style rating summary widget + sample quotes */}
        {(place.top_review_text || place.rating) && (
          <details id="reviews" className="scroll-mt-20 mt-10 group" open={expandGoogleReviews}>
            <summary className="mb-4 flex cursor-pointer list-none items-center gap-2 text-lg font-bold">{t("patient_voices", lang)}<span className="ml-auto text-xs font-normal muted group-open:hidden">{t("social_more", lang)} ▾</span></summary>

            {place.rating && (
              <div className="mb-4 grid gap-4 rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900 sm:grid-cols-[auto_1fr] sm:items-center">
                <div className="flex items-center gap-3 sm:flex-col sm:items-start">
                  <div className="rounded-xl bg-emerald-600 px-3 py-2 text-2xl font-black text-white tabular-nums sm:text-3xl">
                    {place.rating.toFixed(1)}
                  </div>
                  <div>
                    <div className="text-sm font-bold leading-tight">
                      {place.rating >= 4.7 ? t("rate_exceptional", lang) : place.rating >= 4.3 ? t("rate_excellent", lang) : place.rating >= 3.8 ? t("rate_verygood", lang) : t("rate_good", lang)}
                    </div>
                    <div className="text-xs muted">
                      {(place.review_count ?? 0).toLocaleString()} Google reviews
                    </div>
                  </div>
                </div>
                {/* Per-review ratings are absent from most Google scrapes, so
                    only render the distribution histogram when we actually have
                    at least one rated sample — otherwise it shows 0% across the
                    board which looks broken. */}
                {place.reviews_sample && place.reviews_sample.length > 0 && place.reviews_sample.some((r) => (r.rating ?? 0) > 0) && (() => {
                  const dist = [5, 4, 3, 2, 1].map((stars) => {
                    const n = place.reviews_sample.filter(
                      (r) => Math.round(r.rating || 0) === stars,
                    ).length;
                    return { stars, n };
                  });
                  const total = dist.reduce((s, d) => s + d.n, 0) || 1;
                  return (
                    <ul className="space-y-1 text-xs">
                      {dist.map((d) => {
                        const pct = Math.round((d.n / total) * 100);
                        return (
                          <li key={d.stars} className="flex items-center gap-2">
                            <span className="w-7 shrink-0 text-right tabular-nums muted">{d.stars}★</span>
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
                              <div
                                className="h-full rounded-full bg-emerald-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="w-9 shrink-0 text-right tabular-nums muted">{pct}%</span>
                          </li>
                        );
                      })}
                    </ul>
                  );
                })()}
                {place.reviews_sample && place.reviews_sample.length > 0 && !place.reviews_sample.some((r) => (r.rating ?? 0) > 0) && (
                  <div className="text-xs muted">
                    {(place.review_count ?? 0).toLocaleString()} reviews aggregated from Google Maps. Per-review breakdown coming soon.
                  </div>
                )}
              </div>
            )}

            {(() => {
              const featured = pickFeaturedReview(place, lang);
              if (!featured) return null;
              return (
                <blockquote className="rounded-2xl border-l-4 border-emerald-400 bg-emerald-50/50 p-4 text-sm leading-relaxed dark:bg-emerald-950/20">
                  {featured.isThai && (
                    <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                      🇹🇭 {t("review_orig_thai", lang)}
                    </div>
                  )}
                  "{featured.text}"
                </blockquote>
              );
            })()}
            {place.reviews_sample.length > 1 && (
              <ul className="mt-4 space-y-3">
                {place.reviews_sample.slice(1, 5).map((rv, i) => {
                  const body = cleanReviewText(rv.text || "");
                  if (!body) return null;
                  const bodyIsThai = lang !== "th" && isThaiText(body);
                  return (
                    <li key={i} className="rounded-xl border border-ink-100 bg-white p-3 text-sm dark:border-ink-800 dark:bg-ink-900">
                      <div className="text-xs muted">
                        {rv.reviewer || t("review_anon", lang)} {rv.rating ? `· ★ ${rv.rating}` : ""} {rv.date ? `· ${rv.date}` : ""}
                        {bodyIsThai && <> · 🇹🇭 {t("review_orig_thai", lang)}</>}
                      </div>
                      <p className="mt-1">{body}</p>
                    </li>
                  );
                })}
              </ul>
            )}
          </details>
        )}

        {/* DIRECT BOOKING — 0% commission CTA card, above-the-fold (primary intent) */}
        <section id="book" className="scroll-mt-20 mt-6">
          <div className="rounded-2xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 to-white p-4 dark:border-emerald-700 dark:from-emerald-950/30 dark:to-ink-900">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base">💎</span>
                  <h2 className="text-base font-black">{tf("book_direct_title", lang, { name: place.name })}</h2>
                </div>
                <p className="mt-0.5 text-[11px] muted">
                  {t("book_direct_sub", lang)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="rounded-full bg-emerald-600 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow">
                  {t("fee_0", lang)}
                </span>
                {replyStats && (
                  <span
                    className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                    title={`Average reply time across ${replyStats.sampleSize} inquiries`}
                  >
                    ⏱ {tf("reply_in", lang, { t: replyStats.avgHours < 1 ? `${Math.round(replyStats.avgHours * 60)}min` : `${replyStats.avgHours}h` })}
                  </span>
                )}
              </div>
            </div>

            <div className="mb-3 rounded-lg border border-emerald-200/70 bg-white/70 p-2.5 text-[11px] dark:border-emerald-800/70 dark:bg-ink-900/40">
              <div className="font-black text-emerald-700 dark:text-emerald-400">💎 Direct (this form)</div>
              <ul className="mt-1 space-y-0.5 text-ink-700 dark:text-ink-300">
                <li>✓ 0% platform fee</li>
                <li>✓ Venue keeps every baht</li>
                <li>· Reply usually within 24h</li>
              </ul>
            </div>
            <BookingForm
              placeId={place.slug}
              placeName={place.name}
              lang={lang}
              services={services}
            />
          </div>
        </section>

        {/* AD SLOT — reclaimed from the removed Klook affiliate offer */}
        <AdSlot slot="0000000000" className="mt-6 min-h-[250px]" />

        {/* OWNER-WRITTEN DESCRIPTION */}
        {displayDescription && (
          <section className="mt-8 rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide muted">{t("nav_about", lang)}</h2>
            <p className="whitespace-pre-wrap text-base leading-relaxed">{displayDescription}</p>
            {ownerProfile?.koreanStaffNote && (
              <p className="mt-3 inline-flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                🇰🇷 {ownerProfile.koreanStaffNote}
              </p>
            )}
          </section>
        )}

        {/* SERVICES & PRICING */}
        {services.length > 0 && (
          <section id="services" className="scroll-mt-20 mt-8 rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide muted">{t("services_pricing", lang)}</h2>
            <ul className="space-y-2">
              {services.map((s, i) => (
                <li
                  key={i}
                  className="flex items-baseline justify-between gap-3 border-b border-ink-100 py-2 last:border-0 dark:border-ink-800"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-bold">{s.name}</div>
                    {s.description && (
                      <p className="mt-0.5 text-xs muted">{s.description}</p>
                    )}
                    {s.duration_min && (
                      <span className="mt-0.5 inline-block text-[10px] muted">{s.duration_min} min</span>
                    )}
                  </div>
                  {s.price_thb !== undefined && (
                    <div className="shrink-0 text-base font-black tabular-nums text-emerald-700 dark:text-emerald-400">
                      ฿{s.price_thb.toLocaleString()}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* DIRECT CONTACT — WhatsApp / LINE buttons + LINE QR (one-tap) */}
        {(whatsapp || lineId || signals.lineQrUrl) && (
          <section className="mt-8">
            {(whatsapp || lineId) && (
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide muted">
                💬 {tf("msg_directly", lang, { name: place.name })}
              </h2>
            )}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {whatsapp && (
                <a
                  href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener nofollow"
                  className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-green-700"
                >
                  <span>📱</span>
                  <span>WhatsApp</span>
                </a>
              )}
              {lineId && (
                <a
                  href={`https://line.me/ti/p/~${encodeURIComponent(lineId)}`}
                  target="_blank"
                  rel="noopener nofollow"
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#06C755] px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#05a847]"
                >
                  <span>💚</span>
                  <span>LINE</span>
                </a>
              )}
            </div>
            {signals.lineQrUrl && (
              <div className="mt-4 flex items-center gap-4 rounded-xl border border-ink-100 bg-white p-3 dark:border-ink-800 dark:bg-ink-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={signals.lineQrUrl} alt="LINE QR code" width={80} height={80} loading="lazy" className="shrink-0 rounded-lg" />
                <div>
                  <p className="text-sm font-bold">{t("line_scan_title", lang)}</p>
                  <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">{t("line_scan_sub", lang)}</p>
                </div>
              </div>
            )}
          </section>
        )}

        {/* INQUIRY FORM — direct contact, 0% markup. Lead CTA. */}
        <section className="mt-8 rounded-2xl border-2 border-emerald-300 bg-emerald-50/30 p-4 dark:border-emerald-700 dark:bg-emerald-950/20">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-base font-black">📩 {t("send_inquiry_title", lang)}</h2>
            <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
              0% commission
            </span>
          </div>
          <p className="mb-3 text-xs muted">
            {tf("inquiry_goes_to", lang, { name: place.name })}
          </p>
          <InquiryForm placeId={place.slug} placeName={place.name} lang={lang} />
        </section>

        {/* OWN THIS LISTING? */}
        <section className="mt-8 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/40 p-4 text-sm dark:border-emerald-700 dark:bg-emerald-950/20">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-bold text-emerald-900 dark:text-emerald-200">
                {tf("own_q", lang, { name: place.name })}
              </div>
              <p className="mt-1 text-xs text-emerald-800 dark:text-emerald-300">
                {t("claim_blurb", lang)}
              </p>
            </div>
            <a
              href={`/auth/signin?callbackUrl=/dashboard/claim/${place.slug}`}
              className="shrink-0 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
            >
              {t("claim_cta", lang)}
            </a>
          </div>
        </section>

        {/* (Photos moved to top-of-page mosaic) */}

        {/* HOURS — prefer owner-entered free-form text, fall back to scraped dict */}
        {displayHours ? (
          <section className="mt-10">
            <h2 className="mb-3 text-lg font-bold">{t("hours", lang)}</h2>
            <p className="whitespace-pre-wrap rounded-lg bg-white px-4 py-3 text-sm dark:bg-ink-900">
              {displayHours}
            </p>
          </section>
        ) : hours ? (
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
        ) : null}

        {/* PER-PLACE NAVER (Korean blogs + cafe posts about this specific business) */}
        {lang !== "ko" && (mentions.naver.length > 0 || mentions.cafe.length > 0) && (
          <details className="mt-10 group" open={expandKorean}>
            <summary className="mb-3 flex cursor-pointer list-none items-center gap-2 text-lg font-bold">
              <span>🇰🇷</span> {t("sec_korean_reviews", lang)}
              <span className="text-xs font-normal muted">
                ({mentions.naver.length + mentions.cafe.length})
              </span>
              <span className="ml-auto text-xs font-normal muted group-open:hidden">{t("social_more", lang)} ▾</span>
            </summary>
            <ul className="space-y-2">
              {mentions.naver.map((b, i) => (
                <li key={`b${i}`}>
                  <a
                    href={b.blog_url}
                    target="_blank"
                    rel="nofollow noopener"
                    className="block rounded-xl border border-ink-100 bg-white p-3 transition hover:border-emerald-400 dark:border-ink-800 dark:bg-ink-900"
                  >
                    <div className="text-xs muted">
                      Naver Blog{b.blogger_name ? ` · ${b.blogger_name}` : ""}
                      {b.blog_date ? ` · ${b.blog_date}` : ""}
                    </div>
                    <div className="mt-1 text-sm font-medium">{b.blog_title}</div>
                    {b.blog_snippet && (
                      <p className="mt-1 line-clamp-2 text-xs muted">{b.blog_snippet}</p>
                    )}
                  </a>
                </li>
              ))}
              {mentions.cafe.map((c, i) => (
                <li key={`c${i}`}>
                  <a
                    href={c.cafe_url}
                    target="_blank"
                    rel="nofollow noopener"
                    className="block rounded-xl border border-ink-100 bg-white p-3 transition hover:border-emerald-400 dark:border-ink-800 dark:bg-ink-900"
                  >
                    <div className="text-xs muted">
                      Naver Cafe{c.cafe_name ? ` · ${c.cafe_name}` : ""}
                      {c.post_date ? ` · ${c.post_date}` : ""}
                    </div>
                    <div className="mt-1 text-sm font-medium">{c.post_title}</div>
                    {c.post_snippet && (
                      <p className="mt-1 line-clamp-2 text-xs muted">{c.post_snippet}</p>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </details>
        )}

        {/* PER-PLACE YOUTUBE — facade-loaded players (1 featured + grid) */}
        {mentions.youtube.length > 0 && (() => {
          // Prefer Korean-channel/title videos as featured (matches our KR audience).
          const sorted = [...mentions.youtube].sort((a, b) => {
            const isKo = (s: string) => /[가-힯]/.test(s);
            const aKo = (isKo(a.channel_title || "") ? 2 : 0) + (isKo(a.title || "") ? 1 : 0);
            const bKo = (isKo(b.channel_title || "") ? 2 : 0) + (isKo(b.title || "") ? 1 : 0);
            return bKo - aKo;
          });
          const featured = sorted[0];
          const rest = sorted.slice(1, 4);
          const featuredIsKo = /[가-힯]/.test(featured.channel_title || "") || /[가-힯]/.test(featured.title || "");
          return (
            <section className="mt-10">
              <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
                <span>▶</span> {tf("sec_videos_about", lang, { name: place.name })}
                <span className="text-xs font-normal muted">({mentions.youtube.length})</span>
                {featuredIsKo && (
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                    🇰🇷 Korean review
                  </span>
                )}
              </h2>
              {/* Featured video — full-size embed on click */}
              <YouTubeFacade
                videoId={featured.video_id}
                title={featured.title}
                channel={featured.channel_title}
              />
              <div className="mt-1.5 px-1 text-xs">
                <div className="line-clamp-2 font-semibold leading-snug">{featured.title}</div>
                <div className="mt-0.5 text-[10px] muted">{featured.channel_title}</div>
              </div>
              {rest.length > 0 && (
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {rest.map((v) => (
                    <div key={v.video_id}>
                      <YouTubeFacade
                        videoId={v.video_id}
                        title={v.title}
                        channel={v.channel_title}
                      />
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })()}

        {/* YOUTUBE SEARCH — travel vlogs & reviews featuring this place */}
        {ytVideos.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 text-lg font-bold">▶ {t("sec_featured_yt", lang)}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {ytVideos.map((v) => (
                <a
                  key={v.video_id}
                  href={v.url}
                  target="_blank"
                  rel="noopener nofollow"
                  className="group flex gap-3 rounded-xl border border-ink-100 bg-white p-3 transition hover:border-red-300 hover:shadow dark:border-ink-800 dark:bg-ink-900"
                >
                  <div className="relative shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://i.ytimg.com/vi/${v.video_id}/mqdefault.jpg`}
                      alt={v.title}
                      width={120}
                      height={68}
                      loading="lazy"
                      className="rounded-lg object-cover"
                    />
                    {v.duration && (
                      <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 text-[10px] font-bold text-white">
                        {v.duration}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-sm font-semibold leading-snug group-hover:text-red-600 dark:group-hover:text-red-400">
                      {v.title}
                    </p>
                    <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">{v.channel}</p>
                    <p className="mt-0.5 text-xs text-ink-400 dark:text-ink-500">
                      {v.views_text}{v.published ? ` · ${v.published}` : ""}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* PER-PLACE PANTIP (Thai forum threads) */}
        {mentions.pantip.length > 0 && (
          <details className="mt-10 group" open={expandPantip}>
            <summary className="mb-3 flex cursor-pointer list-none items-center gap-2 text-lg font-bold">
              <span>🇹🇭</span> {t("sec_thai_disc", lang)}
              <span className="text-xs font-normal muted">({mentions.pantip.length})</span>
              <span className="ml-auto text-xs font-normal muted group-open:hidden">{t("social_more", lang)} ▾</span>
            </summary>
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
          </details>
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
        <section id="location" className="scroll-mt-20 mt-10 rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
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

        {/* AD SLOT — reclaimed from the removed affiliate-CTA fallback */}
        <AdSlot slot="0000000001" className="mt-8 min-h-[250px]" />

        {/* FAQ — accordion + FAQPage JSON-LD for SEO/AEO */}
        {faqs.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-4 text-lg font-bold">{t("faq_section", lang)}</h2>
            <PlaceFAQ items={faqs} />
          </section>
        )}

        {/* SIMILAR PLACES — same niche, prefer same city */}
        {similar.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-4 text-lg font-bold">
              {tf("more_niche_in", lang, { niche: nicheName(place.niche, lang), place: place.city || t("country_thailand", lang) })}
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {similar.map((p) => (
                <Link
                  key={p.id}
                  href={`/${lang}/place/${p.slug}/`}
                  className="group block overflow-hidden rounded-xl border border-ink-100 bg-white transition hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow dark:border-ink-800 dark:bg-ink-900"
                >
                  <div className="relative aspect-square bg-ink-50 dark:bg-ink-800">
                    <SafeImg src={p.top_photo_url} alt={p.name} niche={p.niche} className="h-full w-full object-cover transition group-hover:scale-[1.04]" loading="lazy" />
                    <div className="absolute right-1.5 top-1.5 rounded-md bg-emerald-500 px-1.5 py-0.5 text-[10px] font-black text-white" title={`Trust ${p.trust_score}/100`}>
                      {p.trust_score}<span className="font-semibold opacity-80">/100</span>
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

        {/* EXPLORE MORE — place → city×niche guide + city hub (retention + internal SEO) */}
        {hubCity && (
          <section className="mt-12">
            <h2 className="mb-3 text-lg font-bold">{t("pl_explore_more", lang)}</h2>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {hasEnoughGuidePlaces(hubCity, place.niche) && (
                <Link
                  href={`/${lang}/guide/${hubCity.slug}-${place.niche}/`}
                  className="rounded-xl border border-ink-100 bg-white p-3 text-sm font-semibold transition hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow dark:border-ink-800 dark:bg-ink-900"
                >
                  {NICHE_META[place.niche].emoji}{" "}
                  {tf("pl_see_all", lang, { niche: nicheName(place.niche, lang), city: hubCity.label })}
                </Link>
              )}
              <Link
                href={`/${lang}/city/${hubCity.slug}/`}
                className="rounded-xl border border-ink-100 bg-white p-3 text-sm font-semibold transition hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow dark:border-ink-800 dark:bg-ink-900"
              >
                {hubCity.emoji} {tf("pl_explore_city", lang, { city: hubCity.label })}
              </Link>
            </div>
          </section>
        )}

        {/* RECENTLY VIEWED — records this place + surfaces prior ones (retention) */}
        <RecentlyViewed
          lang={lang}
          title={t("recently_viewed", lang)}
          record={{
            slug: place.slug,
            name: place.name,
            photo: place.top_photo_url || undefined,
            city: place.city || undefined,
            trust: place.trust_score,
          }}
        />

        <div className="mt-10 text-xs muted">
          <Link href={`/${lang}/c/${place.niche}/`} className="hover:underline">
            {tf("back_to_niche", lang, { niche: nicheName(place.niche, lang) })}
          </Link>
        </div>

        {/* Schema.org LocalBusiness — single canonical block, SEO + AEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": place.niche === "wellness" ? "HealthAndBeautyBusiness" : "LocalBusiness",
              "@id": `${SITE.origin}/${lang}/place/${place.slug}/`,
              name: place.name,
              description:
                tf("schema_place_desc", lang, {
                  niche: nicheName(place.niche, lang),
                  city: place.city,
                  score: place.trust_score,
                }) + (place.is_beginner_friendly ? ` ${t("filter_beginner", lang)}.` : ""),
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
              foundingDate: signals.foundingYear ? String(signals.foundingYear) : undefined,
              sameAs: sameAs.length > 0 ? sameAs : undefined,
              priceRange:
                place.price_min_thb > 0
                  ? `฿${place.price_min_thb}${place.price_max_thb > place.price_min_thb ? `–฿${place.price_max_thb}` : ""}`
                  : undefined,
              // Only aggregateRating, never a `review` array: these are
              // scraped Google reviews, not reviews collected by this site,
              // and Google's review-snippet guidelines require markup to be
              // "directly produced by your site" — marking third-party
              // reviews as our own risks a manual action against ALL rich
              // results, sitewide. Also drop the fabricated `?? 1` count;
              // an unknown review count shouldn't render a fake "1 review".
              aggregateRating: place.rating && place.review_count
                ? {
                    "@type": "AggregateRating",
                    ratingValue: place.rating,
                    reviewCount: place.review_count,
                  }
                : undefined,
            }),
          }}
        />

        {/* BreadcrumbList — SERP breadcrumb trail */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: SITE.name, item: `${SITE.origin}/${lang}/` },
                { "@type": "ListItem", position: 2, name: nicheName(place.niche, lang), item: `${SITE.origin}/${lang}/c/${place.niche}/` },
                { "@type": "ListItem", position: 3, name: place.name, item: `${SITE.origin}/${lang}/place/${place.slug}/` },
              ],
            }),
          }}
        />

        {/* FAQPage schema — surfaces Q&A in Google "People also ask" + AEO */}
        {faqs.length > 0 && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: faqs.map((f) => ({
                  "@type": "Question",
                  name: f.q,
                  acceptedAnswer: { "@type": "Answer", text: f.a },
                })),
              }),
            }}
          />
        )}
        </div>
      </main>
      {/* Mobile bottom bar previously showed an affiliate booking CTA here
          (StickyBookBar, removed) — left clear for AdSense's Auto ads
          anchor unit once the site has an approved account. */}
      <ViewPing placeId={place.slug} />
    </>
  );
}
