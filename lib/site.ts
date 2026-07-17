import type { Lang } from "./types";

// Pure constants split out of lib/i18n.ts so client components that only
// need SITE/SUPPORTED_LANGS (e.g. Header) don't pull in ui_i18n.json — the
// 201KB machine-translation sidecar for all 8 locales — into their bundle.
// lib/i18n.ts re-exports everything here, so existing `from "@/lib/i18n"`
// imports keep working unchanged; only bundle-sensitive client components
// need to switch to importing from here directly.

// `id` (Indonesian) is fully scaffolded and translated (UI sidecar
// ui_i18n.json + FAQ corpus faq_i18n.json), so it's active: route
// generation, sitemap, and hreflang now include it. The FAQ indexing gate
// (isFaqTranslated) keeps any untranslated FAQ noindexed per locale.
export const SUPPORTED_LANGS: Lang[] = ["en", "ko", "th", "zh", "ja", "ar", "id", "vi"];
export const DEFAULT_LANG: Lang = "en";

// Single source of truth for the "N sources" trust claim — matches the
// Trust Score methodology (see tr_a1/tr_a6 in lib/i18n.ts). Bookimed is a
// booking affiliate, not a verification source, so deliberately excluded.
export const TRUST_SOURCES = ["Google", "Reddit", "Naver", "Pantip", "YouTube", "Official sites"] as const;

export const SITE = {
  origin: "https://verifiedthai.com",
  name: "Verified Thai",
  tagline: {
    en: "Thailand's independent business directory. Verified by 6 sources. No paid promotion.",
    ko: "광고 거품 없는 태국 비즈니스 디렉토리. 6개 소스에서 교차 검증.",
    th: "ไดเรกทอรีธุรกิจในไทย ตรวจสอบจาก 6 แหล่ง ไม่มีโปรโมชันที่จ่ายเงิน",
    zh: "泰国独立商家指南 — 来自6个独立来源的验证，不含付费推广。",
    ja: "タイのビジネス独立ガイド — 6つの独立情報源で検証、有料宣伝なし。",
    ar: "الدليل المستقل لأعمال تايلاند — تم التحقق من 6 مصادر، بدون ترويج مدفوع.",
    id: "Direktori bisnis independen Thailand. Diverifikasi dari 6 sumber. Tanpa promosi berbayar.",
    vi: "Danh bạ doanh nghiệp độc lập của Thái Lan. Được xác minh từ 6 nguồn. Không quảng cáo trả phí.",
  },
} as const;
