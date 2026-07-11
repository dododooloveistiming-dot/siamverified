// Scraped photo URLs (Google's `/p/` and `/gps-cs-s/` CDN formats under
// lh3.googleusercontent.com) carry a size suffix like `=w203-h114-k-no` —
// the scrape only ever requested tiny thumbnails (max ~203px, some literally
// 32×32 avatar crops), then the site rendered them at full hero/card width.
// The CDN honors a plain `=wN` suffix to serve a proportionally-scaled
// image at N px wide, so rewrite the suffix per display slot instead of
// stretching the thumbnail.
const GOOGLE_PHOTO_SUFFIX = /=w\d+-h\d+[a-z0-9-]*$/i;

export function resizeGooglePhoto(url: string | undefined | null, width: number): string | undefined {
  if (!url) return url ?? undefined;
  if (!GOOGLE_PHOTO_SUFFIX.test(url)) return url;
  return url.replace(GOOGLE_PHOTO_SUFFIX, `=w${width}`);
}

// 32×32 (and similarly tiny) crops are avatar/icon photos that slipped into
// photos_sample — never usable as a hero or card image at any resize target.
export function isTinyGooglePhoto(url: string): boolean {
  const m = /=w(\d+)-h(\d+)/i.exec(url);
  if (!m) return false;
  return Number(m[1]) <= 32 && Number(m[2]) <= 32;
}
