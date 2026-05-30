import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadPlaces, getPlaceBySlug, getSimilarPlaces, getPlaceMentions, getOwnerProfile, getPlaceKlook } from "@/lib/data";
import { getPlaceSignals, emailProviderLabel, trustBreakdown } from "@/lib/signals";
import { SITE, SUPPORTED_LANGS, T, t } from "@/lib/i18n";
import type { Lang, Place } from "@/lib/types";
import { NICHE_META, nicheName } from "@/lib/types";
import StickyBookBar from "@/components/StickyBookBar";
import InquiryForm from "@/components/InquiryForm";
import HeroMosaic from "@/components/HeroMosaic";
import KlookOffer from "@/components/KlookOffer";
import YouTubeFacade from "@/components/YouTubeFacade";
import PlaceFAQ from "@/components/PlaceFAQ";
import BookingForm from "@/components/BookingForm";
import type { FAQItem } from "@/components/PlaceFAQ";
import PlacePlaceholder from "@/components/PlacePlaceholder";
import ViewPing from "@/components/ViewPing";
import ShareButton from "@/components/ShareButton";
import PlaceMap from "@/components/PlaceMap";

// ISR — initially built static, refreshed from DB (owner profile) every
// 10 minutes. Owner edits go live within ~10 min; trade-off for 90% fewer
// function invocations vs 60s revalidation.
export const revalidate = 600;

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

export default async function PlaceDetailPage({ params }: { params: { lang: Lang; slug: string } }) {
  const { lang, slug } = params;
  const place = getPlaceBySlug(slug);
  if (!place) notFound();
  const meta = NICHE_META[place.niche];
  const similar = getSimilarPlaces(place, 4);
  const mentions = getPlaceMentions(place.id);
  const klookData = getPlaceKlook(place.id);
  const ownerProfile = await getOwnerProfile(place.id);
  const signals = getPlaceSignals(place.id);

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

  // JSON-LD: LocalBusiness + AggregateRating + FAQ
  const jsonLd: any = {
    "@context": "https://schema.org",
    "@type": place.niche === "wellness" ? "HealthAndBeautyBusiness" : "LocalBusiness",
    name: place.name,
    address: { "@type": "PostalAddress", streetAddress: place.address, addressLocality: place.city, addressCountry: "TH" },
    telephone: place.phone || undefined,
    url: place.website || undefined,
    image: place.top_photo_url || undefined,
    foundingDate: signals.foundingYear ? String(signals.foundingYear) : undefined,
    aggregateRating: place.rating
      ? { "@type": "AggregateRating", ratingValue: place.rating, reviewCount: place.review_count ?? 1 }
      : undefined,
  };

  // Build FAQ items from data — drives both visible accordion + FAQPage JSON-LD
  const faqs: FAQItem[] = [];
  faqs.push({
    q: `Where is ${place.name} located?`,
    a: `${place.address || place.city || "Thailand"}.${
      place.google_maps_url ? ` Open in Google Maps: ${place.google_maps_url}` : ""
    }`,
  });
  faqs.push({
    q: `How do I book or contact ${place.name}?`,
    a: `Use the inquiry form on this page — it goes directly to ${place.name} with 0% commission. ${
      place.bookable?.klook ? "You can also book through Klook for instant confirmation." : ""
    }${place.phone ? ` Or call ${place.phone}.` : ""}`,
  });
  const langsSpoken = Object.entries(place.languages)
    .filter(([, v]) => v)
    .map(([k]) => ({ en: "English", ko: "Korean", th: "Thai", zh: "Chinese", ja: "Japanese", ar: "Arabic" }[k] || k));
  if (langsSpoken.length > 0) {
    faqs.push({
      q: `What languages do they speak?`,
      a: `Based on our research, ${place.name} serves customers in ${langsSpoken.join(", ")}.`,
    });
  }
  if (place.price_min_thb > 0) {
    faqs.push({
      q: `How much does it cost?`,
      a: `Typical price is ฿${place.price_min_thb.toLocaleString()}${
        place.price_max_thb > place.price_min_thb
          ? `–฿${place.price_max_thb.toLocaleString()}`
          : ""
      } per ${place.price_unit}. Prices may vary by season and service — confirm with the venue.`,
    });
  }
  if (place.review_count && place.rating) {
    faqs.push({
      q: `Is ${place.name} popular / well-reviewed?`,
      a: `${place.name} has ${place.review_count.toLocaleString()} Google reviews with an average rating of ★ ${place.rating.toFixed(
        1,
      )}/5.${place.is_partner ? " It's a verified partner on our platform." : ""}`,
    });
  }
  if (place.is_beginner_friendly) {
    faqs.push({
      q: `Is ${place.name} good for beginners?`,
      a: `Yes — ${place.name} is rated beginner-friendly. Expect welcoming staff, intro sessions, and equipment provided for first-time visitors.`,
    });
  }
  if (place.is_open_24h) {
    faqs.push({
      q: `Is ${place.name} open 24 hours?`,
      a: `Yes, ${place.name} operates 24 hours. Confirm specific service hours by inquiry.`,
    });
  }

  // Photos for the mosaic — owner uploads first, otherwise scraped
  const mosaicPhotos = displayPhotos.slice(0, 30);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
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
            <ShareButton
              url={`${SITE.origin}/${lang}/place/${place.slug}/`}
              title={place.name}
              text={`${place.name} — ${nicheName(place.niche, lang)}${place.city ? ` (${place.city})` : ""} · Trust ${place.trust_score}/100 on ${SITE.name}`}
              label={({ en: "Share", ko: "공유", ja: "シェア", zh: "分享", th: "แชร์", ar: "مشاركة" } as const)[lang]}
            />
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm muted">
            {place.rating != null && (
              <span className="font-semibold text-ink-900 dark:text-ink-100">
                ★ {place.rating.toFixed(1)}
                {place.review_count ? <span className="ml-1 underline-offset-2 hover:underline">({place.review_count.toLocaleString()} reviews)</span> : null}
              </span>
            )}
            {place.rating != null && <span className="opacity-40">·</span>}
            <span>{meta.emoji} {nicheName(place.niche, lang)}</span>
            {place.city && <><span className="opacity-40">·</span><span>{place.city}</span></>}
            {place.is_partner && (
              <>
                <span className="opacity-40">·</span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">✓ Verified Partner</span>
              </>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
            {(() => {
              const items = trustBreakdown(signals);
              const totalBoost = items.reduce((s, i) => s + i.pts, 0);
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
            {place.bookable?.klook && (
              <span className="rounded-full bg-rose-600 px-2.5 py-0.5 font-bold text-white">
                ⚡ Instant book on Klook
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
                <span className="ml-1 opacity-75">/ {place.price_unit}</span>
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

        {/* PHOTO MOSAIC — Airbnb-style 1+4 grid with fullscreen lightbox.
            When no photos exist but coords do, swap to a map-as-hero —
            map of the venue location is more useful to a traveler than
            yet another generic placeholder. */}
        <section className="mx-auto mt-5 max-w-5xl px-4">
          {mosaicPhotos.length === 0 && Number.isFinite(place.lat) && Number.isFinite(place.lng) ? (
            <PlaceMap places={[place]} lang={lang} height={400} />
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
            <span className="muted">Cross-checked across:</span>
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
            </div>
            <span className="muted hidden sm:inline">
              {place.photos_count} photos · {place.videos_count} videos
            </span>
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-4">

        {/* DIRECT BOOKING — 0% commission CTA card, above-the-fold (primary intent) */}
        <section className="mt-6">
          <div className="rounded-2xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 to-white p-4 dark:border-emerald-700 dark:from-emerald-950/30 dark:to-ink-900">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base">💎</span>
                  <h2 className="text-base font-black">Book directly with {place.name}</h2>
                </div>
                <p className="mt-0.5 text-[11px] muted">
                  No commission · No booking platform markup · Pay at the venue
                </p>
              </div>
              <span className="rounded-full bg-emerald-600 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow">
                0% fee
              </span>
            </div>
            {klookData && klookData.products.length > 0 && (
              <div className="mb-3 grid grid-cols-2 gap-2 rounded-lg border border-emerald-200/70 bg-white/70 p-2.5 text-[11px] dark:border-emerald-800/70 dark:bg-ink-900/40">
                <div>
                  <div className="font-black text-emerald-700 dark:text-emerald-400">💎 Direct (this form)</div>
                  <ul className="mt-1 space-y-0.5 text-ink-700 dark:text-ink-300">
                    <li>✓ 0% platform fee</li>
                    <li>✓ Venue keeps every baht</li>
                    <li>· Reply usually within 24h</li>
                  </ul>
                </div>
                <div>
                  <div className="font-black text-ink-700 dark:text-ink-300">⚡ Klook (also below)</div>
                  <ul className="mt-1 space-y-0.5 muted">
                    <li>✗ ~20-25% to platform</li>
                    <li>· Free cancellation</li>
                    <li>· Instant confirmation</li>
                  </ul>
                </div>
              </div>
            )}
            <BookingForm
              placeId={place.slug}
              placeName={place.name}
              lang={lang}
              services={services}
            />
          </div>
        </section>

        {/* KLOOK OFFER — third-party booking option (alternative, with commission) */}
        {klookData && klookData.products.length > 0 && (
          <section className="mt-6">
            <div className="mb-2 text-[10px] font-black uppercase tracking-wider muted">
              Or book via Klook
            </div>
            <KlookOffer data={klookData} placeName={place.name} />
            <p className="mt-2 text-[10px] muted">{t("affiliate_disclaimer", lang)}</p>
          </section>
        )}

        {/* OWNER-WRITTEN DESCRIPTION */}
        {displayDescription && (
          <section className="mt-8 rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide muted">About</h2>
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
          <section className="mt-8 rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide muted">Services & pricing</h2>
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

        {/* DIRECT CONTACT — WhatsApp / LINE buttons (one-tap) */}
        {(whatsapp || lineId) && (
          <section className="mt-8">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide muted">
              💬 Message {place.name} directly
            </h2>
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
          </section>
        )}

        {/* INQUIRY FORM — direct contact, 0% markup. Lead CTA. */}
        <section className="mt-8 rounded-2xl border-2 border-emerald-300 bg-emerald-50/30 p-4 dark:border-emerald-700 dark:bg-emerald-950/20">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-base font-black">📩 Send inquiry directly</h2>
            <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
              0% commission
            </span>
          </div>
          <p className="mb-3 text-xs muted">
            Goes straight to {place.name}. No booking platform markup.
          </p>
          <InquiryForm placeId={place.slug} placeName={place.name} lang={lang} />
        </section>

        {/* AFFILIATE CTAs — secondary fallback for places without Klook data */}
        {!(klookData && klookData.products.length > 0) && (
          <section className="mt-6">
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wide muted">
              Or book through a partner platform
            </h2>
            <AffiliateCTA place={place} lang={lang} />
            <p className="mt-2 text-[10px] muted">{t("affiliate_disclaimer", lang)}</p>
          </section>
        )}

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

        {/* REVIEWS — Booking.com-style rating summary widget + sample quotes */}
        {(place.top_review_text || place.rating) && (
          <section className="mt-10">
            <h2 className="mb-4 text-lg font-bold">{t("patient_voices", lang)}</h2>

            {place.rating && (
              <div className="mb-4 grid gap-4 rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900 sm:grid-cols-[auto_1fr] sm:items-center">
                <div className="flex items-center gap-3 sm:flex-col sm:items-start">
                  <div className="rounded-xl bg-emerald-600 px-3 py-2 text-2xl font-black text-white tabular-nums sm:text-3xl">
                    {place.rating.toFixed(1)}
                  </div>
                  <div>
                    <div className="text-sm font-bold leading-tight">
                      {place.rating >= 4.7 ? "Exceptional" : place.rating >= 4.3 ? "Excellent" : place.rating >= 3.8 ? "Very good" : "Good"}
                    </div>
                    <div className="text-xs muted">
                      {(place.review_count ?? 0).toLocaleString()} reviews
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

            {place.top_review_text && (
              <blockquote className="rounded-2xl border-l-4 border-emerald-400 bg-emerald-50/50 p-4 text-sm leading-relaxed dark:bg-emerald-950/20">
                "{place.top_review_text}"
              </blockquote>
            )}
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
        {(mentions.naver.length > 0 || mentions.cafe.length > 0) && (
          <section className="mt-10">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
              <span>🇰🇷</span> Korean reviews
              <span className="text-xs font-normal muted">
                ({mentions.naver.length + mentions.cafe.length})
              </span>
            </h2>
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
          </section>
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
                <span>▶</span> Videos about {place.name}
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

        {/* FAQ — accordion + FAQPage JSON-LD for SEO/AEO */}
        {faqs.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-4 text-lg font-bold">Frequently asked questions</h2>
            <PlaceFAQ items={faqs} />
          </section>
        )}

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
                      <PlacePlaceholder niche={p.niche} size="md" />
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
              foundingDate: signals.foundingYear ? String(signals.foundingYear) : undefined,
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
              // Embed sample reviews for Google rich snippets
              review: (place.reviews_sample || []).slice(0, 3).map((rv) => ({
                "@type": "Review",
                reviewBody: (rv.text || "").slice(0, 200),
                author: { "@type": "Person", name: rv.reviewer || "Verified visitor" },
                ...(rv.rating
                  ? {
                      reviewRating: {
                        "@type": "Rating",
                        ratingValue: rv.rating,
                        bestRating: 5,
                      },
                    }
                  : {}),
              })),
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
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: f.a,
                  },
                })),
              }),
            }}
          />
        )}
        </div>
      </main>
      <StickyBookBar place={place} lang={lang} />
      <ViewPing placeId={place.id} />
    </>
  );
}
