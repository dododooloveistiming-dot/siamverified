export type Lang = "en" | "ko" | "th" | "zh" | "ja" | "ar";

export type Niche =
  | "muay-thai"
  | "yoga-pilates"
  | "wellness"
  | "cooking"
  | "diving"
  | "spa"
  | "coworking";

export interface PlaceReview {
  source: string;
  reviewer: string;
  rating: number | null;
  date: string;
  text: string;
}

export interface PlaceVideo {
  video_id: string;
  title: string;
  channel: string;
}

export interface AffiliateLinks {
  klook?: string;
  viator?: string;
  getyourguide?: string;
  agoda?: string;
  tripcom?: string;
  bookimed?: string;
}

export interface SourceBadges {
  google_reviews: number;
  photos: number;
  videos: number;
  reddit: number;
  naver: number;
  pantip: number;
  website: number;
  booking: number;
  bookimed: number;
}

export interface Place {
  // identity
  id: string;
  slug: string;
  niche: Niche;
  name: string;
  // geo
  address: string;
  city: string;
  // google signals
  rating: number | null;
  review_count: number | null;
  phone: string;
  website: string;
  category: string;
  google_maps_url: string;
  // scraped depth
  reviews_scraped_count: number;
  avg_scraped_rating: number | null;
  top_review_text: string;
  reviews_sample: PlaceReview[];
  photos_count: number;
  top_photo_url: string;
  photos_sample: string[];
  videos_count: number;
  top_video_id: string;
  videos_sample: PlaceVideo[];
  // price/hours
  price_min_thb: number;
  price_max_thb: number;
  price_unit: string;
  price_band: "budget" | "mid" | "premium" | "luxury" | "unknown";
  opening_hours_json: string;
  is_open_24h: boolean;
  // beginner / advanced
  is_beginner_friendly: boolean;
  is_advanced_oriented: boolean;
  beginner_score: number;
  // language tags (auto-detected, low confidence)
  languages: { en: boolean; ko: boolean; th: boolean; zh: boolean; ja: boolean; ar: boolean };
  // multi-source trust
  source_badges: SourceBadges;
  trust_score: number;
  is_suspected_viral: boolean;
  // affiliate
  affiliate: AffiliateLinks;
  // partnership
  is_partner: boolean;
  // community mentions (Reddit/Pantip/Naver fuzzy matches by name)
  community_mentions?: CommunityThread[];
}

export interface CommunityThread {
  kind: "reddit" | "pantip" | "naver";
  title: string;
  url: string;
  snippet: string;
  score: number;
  comments: number;
  author: string;
  subreddit: string;
  date: string;
}

export interface CommunityBundle {
  generated_at: string;
  niche: Niche;
  counts: { reddit: number; pantip: number; naver: number };
  top_reddit: CommunityThread[];
  top_pantip: CommunityThread[];
  top_naver: CommunityThread[];
}

export interface PlacesBundle {
  generated_at: string;
  total: number;
  by_niche: Record<Niche, number>;
  avg_trust: number;
  places: Place[];
}

export const NICHE_META: Record<
  Niche,
  { en: string; ko: string; th: string; emoji: string; tagline_en: string }
> = {
  "muay-thai":   { en: "Muay Thai Camps",       ko: "무에타이 캠프",     th: "ค่ายมวยไทย",       emoji: "🥊", tagline_en: "Train where champions train" },
  "yoga-pilates":{ en: "Yoga & Pilates",        ko: "요가 & 필라테스",   th: "โยคะและพิลาทิส",    emoji: "🧘", tagline_en: "Studios verified by real practitioners" },
  "wellness":    { en: "Wellness Retreats",     ko: "웰니스 리트릿",     th: "เวลเนสรีทรีต",      emoji: "🌿", tagline_en: "Detox, longevity, holistic healing" },
  "cooking":     { en: "Thai Cooking Classes",  ko: "태국 요리 클래스",  th: "เรียนทำอาหารไทย",   emoji: "🍜", tagline_en: "Learn Pad Thai from the source" },
  "diving":      { en: "Diving Schools",        ko: "다이빙 스쿨",       th: "โรงเรียนดำน้ำ",     emoji: "🤿", tagline_en: "PADI/SSI certified in the world's #1 diving country" },
  "spa":         { en: "Spa & Thai Massage",    ko: "스파 & 타이마사지", th: "สปาและนวดไทย",      emoji: "💆", tagline_en: "From street-side foot rubs to luxury day spas" },
  "coworking":   { en: "Coworking Spaces",      ko: "코워킹 스페이스",   th: "พื้นที่ทำงานร่วม", emoji: "💻", tagline_en: "Digital nomad hubs across Thailand" },
};
