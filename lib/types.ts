export type Lang = "en" | "ko" | "th" | "zh" | "ja" | "ar";

export type Niche =
  | "muay-thai"
  | "yoga-pilates"
  | "wellness"
  | "cooking"
  | "diving"
  | "spa"
  | "coworking"
  | "halal-food"
  | "muslim-hotel"
  | "halal-tour"
  | "mosque"
  | "halal-clinic"
  | "halal-beauty";

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

export interface NicheMeta {
  emoji: string;
  name: Record<Lang, string>;
  tagline: Record<Lang, string>;
}

export const NICHE_META: Record<Niche, NicheMeta> = {
  "muay-thai": {
    emoji: "🥊",
    name: {
      en: "Muay Thai Camps",
      ko: "무에타이 캠프",
      th: "ค่ายมวยไทย",
      zh: "泰拳训练营",
      ja: "ムエタイジム",
      ar: "معسكرات الملاكمة التايلاندية",
    },
    tagline: {
      en: "Train where champions train",
      ko: "챔피언이 훈련하는 그곳에서",
      th: "ฝึกที่ที่แชมป์ฝึก",
      zh: "在冠军训练的地方训练",
      ja: "チャンピオンが鍛えた場所で",
      ar: "تدرب حيث يتدرب الأبطال",
    },
  },
  "yoga-pilates": {
    emoji: "🧘",
    name: {
      en: "Yoga & Pilates",
      ko: "요가 & 필라테스",
      th: "โยคะและพิลาทิส",
      zh: "瑜伽与普拉提",
      ja: "ヨガ＆ピラティス",
      ar: "اليوغا والبيلاتس",
    },
    tagline: {
      en: "Studios verified by real practitioners",
      ko: "실제 수련자들이 검증한 스튜디오",
      th: "สตูดิโอที่ผู้ฝึกตัวจริงตรวจสอบแล้ว",
      zh: "由真实练习者验证的工作室",
      ja: "実際の練習者が検証したスタジオ",
      ar: "استوديوهات تحقق منها ممارسون حقيقيون",
    },
  },
  "wellness": {
    emoji: "🌿",
    name: {
      en: "Wellness Retreats",
      ko: "웰니스 리트릿",
      th: "เวลเนสรีทรีต",
      zh: "健康养生度假村",
      ja: "ウェルネスリトリート",
      ar: "منتجعات الرفاهية",
    },
    tagline: {
      en: "Detox, longevity, holistic healing",
      ko: "디톡스, 장수, 통합 치유",
      th: "ดีท็อกซ์ การมีอายุยืน การบำบัดแบบองค์รวม",
      zh: "排毒、长寿、整体疗愈",
      ja: "デトックス、長寿、ホリスティック・ヒーリング",
      ar: "إزالة السموم، طول العمر، الشفاء الشامل",
    },
  },
  "cooking": {
    emoji: "🍜",
    name: {
      en: "Thai Cooking Classes",
      ko: "태국 요리 클래스",
      th: "เรียนทำอาหารไทย",
      zh: "泰式烹饪课程",
      ja: "タイ料理教室",
      ar: "دروس الطبخ التايلاندي",
    },
    tagline: {
      en: "Learn Pad Thai from the source",
      ko: "팟타이를 본고장에서 배우기",
      th: "เรียนทำผัดไทยจากต้นตำรับ",
      zh: "在本地学习正宗泰式炒河粉",
      ja: "本場でパッタイを学ぼう",
      ar: "تعلم باد تاي من المصدر",
    },
  },
  "diving": {
    emoji: "🤿",
    name: {
      en: "Diving Schools",
      ko: "다이빙 스쿨",
      th: "โรงเรียนดำน้ำ",
      zh: "潜水学校",
      ja: "ダイビングスクール",
      ar: "مدارس الغوص",
    },
    tagline: {
      en: "PADI/SSI certified in the world's #1 diving country",
      ko: "세계 1위 다이빙 국가의 PADI/SSI 인증",
      th: "ใบรับรอง PADI/SSI ในประเทศดำน้ำอันดับ 1 ของโลก",
      zh: "在世界第一潜水国家获得 PADI/SSI 认证",
      ja: "世界一のダイビング国でPADI/SSI認定取得",
      ar: "شهادات PADI/SSI في بلد الغوص الأول عالميًا",
    },
  },
  "spa": {
    emoji: "💆",
    name: {
      en: "Spa & Thai Massage",
      ko: "스파 & 타이마사지",
      th: "สปาและนวดไทย",
      zh: "水疗与泰式按摩",
      ja: "スパ＆タイマッサージ",
      ar: "السبا والمساج التايلاندي",
    },
    tagline: {
      en: "From street-side foot rubs to luxury day spas",
      ko: "길거리 발마사지부터 럭셔리 데이스파까지",
      th: "ตั้งแต่นวดเท้าริมถนนจนถึงเดย์สปาหรู",
      zh: "从街边足部按摩到豪华日间水疗",
      ja: "屋台のフットマッサージから高級デイスパまで",
      ar: "من تدليك القدمين في الشوارع إلى منتجعات سبا الفاخرة",
    },
  },
  "coworking": {
    emoji: "💻",
    name: {
      en: "Coworking Spaces",
      ko: "코워킹 스페이스",
      th: "พื้นที่ทำงานร่วม",
      zh: "共享办公空间",
      ja: "コワーキングスペース",
      ar: "مساحات العمل المشتركة",
    },
    tagline: {
      en: "Digital nomad hubs across Thailand",
      ko: "태국 전역의 디지털 노마드 허브",
      th: "ศูนย์รวมดิจิทัลโนแมดทั่วประเทศไทย",
      zh: "遍布泰国的数字游民中心",
      ja: "タイ全土のデジタルノマド拠点",
      ar: "مراكز الرحالة الرقميين في جميع أنحاء تايلاند",
    },
  },
  "halal-food": {
    emoji: "🥘",
    name: {
      en: "Halal Restaurants",
      ko: "할랄 식당",
      th: "ร้านอาหารฮาลาล",
      zh: "清真餐厅",
      ja: "ハラール レストラン",
      ar: "مطاعم حلال",
    },
    tagline: {
      en: "Verified halal-certified dining across Thailand",
      ko: "태국 전역의 검증된 할랄 인증 식당",
      th: "ร้านอาหารที่ได้รับการรับรองฮาลาลทั่วประเทศไทย",
      zh: "泰国各地经过验证的清真餐厅",
      ja: "タイ全土で検証済みのハラール認証ダイニング",
      ar: "مطاعم معتمدة حلال موثوقة في جميع أنحاء تايلاند",
    },
  },
  "muslim-hotel": {
    emoji: "🏨",
    name: {
      en: "Muslim-Friendly Hotels",
      ko: "무슬림 친화 호텔",
      th: "โรงแรมสำหรับมุสลิม",
      zh: "穆斯林友好酒店",
      ja: "ムスリム フレンドリー ホテル",
      ar: "فنادق صديقة للمسلمين",
    },
    tagline: {
      en: "Prayer room, qibla, halal kitchen — verified",
      ko: "기도방, 키블라, 할랄 키친 — 검증됨",
      th: "ห้องละหมาด กิบลัต ครัวฮาลาล — ตรวจสอบแล้ว",
      zh: "礼拜室、朝向指南、清真厨房 — 已验证",
      ja: "礼拝室、キブラ、ハラールキッチン — 検証済み",
      ar: "غرفة صلاة، قبلة، مطبخ حلال — موثق",
    },
  },
  "halal-tour": {
    emoji: "✈️",
    name: {
      en: "Halal Tours & Activities",
      ko: "할랄 투어 & 액티비티",
      th: "ทัวร์มุสลิมและกิจกรรม",
      zh: "清真旅游与活动",
      ja: "ハラール ツアー＆アクティビティ",
      ar: "جولات وأنشطة حلال",
    },
    tagline: {
      en: "Family muslim-friendly tours & day trips",
      ko: "가족 무슬림 친화 투어 & 데이트립",
      th: "ทัวร์ครอบครัวมุสลิมและทริปวันเดียว",
      zh: "家庭穆斯林友好旅游和一日游",
      ja: "家族向けムスリム フレンドリー ツアー",
      ar: "جولات عائلية صديقة للمسلمين ورحلات يومية",
    },
  },
  "mosque": {
    emoji: "🕌",
    name: {
      en: "Mosques",
      ko: "모스크",
      th: "มัสยิด",
      zh: "清真寺",
      ja: "モスク",
      ar: "المساجد",
    },
    tagline: {
      en: "Find Friday prayer + daily masjid locations",
      ko: "금요예배 + 일일 마스지드 위치 찾기",
      th: "ค้นหาสถานที่ละหมาดวันศุกร์และมัสยิดประจำวัน",
      zh: "查找周五礼拜和日常清真寺位置",
      ja: "金曜礼拝と日々のマスジド情報",
      ar: "ابحث عن صلاة الجمعة ومواقع المساجد",
    },
  },
  "halal-clinic": {
    emoji: "🏥",
    name: {
      en: "Muslim-Friendly Hospitals",
      ko: "무슬림 친화 병원",
      th: "โรงพยาบาลสำหรับมุสลิม",
      zh: "穆斯林友好医院",
      ja: "ムスリム フレンドリー 病院",
      ar: "مستشفيات صديقة للمسلمين",
    },
    tagline: {
      en: "Female doctors, halal food, prayer rooms",
      ko: "여의사, 할랄 식사, 기도방",
      th: "หมอผู้หญิง อาหารฮาลาล ห้องละหมาด",
      zh: "女医生、清真餐食、礼拜室",
      ja: "女医、ハラール食、礼拝室",
      ar: "طبيبات، طعام حلال، غرف صلاة",
    },
  },
  "halal-beauty": {
    emoji: "💄",
    name: {
      en: "Halal Beauty & Salons",
      ko: "할랄 뷰티 & 살롱",
      th: "บิวตี้และซาลอนฮาลาล",
      zh: "清真美容与沙龙",
      ja: "ハラール ビューティー＆サロン",
      ar: "تجميل وصالونات حلال",
    },
    tagline: {
      en: "Halal cosmetics + women-only salons",
      ko: "할랄 화장품 + 여성전용 살롱",
      th: "เครื่องสำอางฮาลาลและซาลอนผู้หญิงล้วน",
      zh: "清真化妆品 + 仅限女性沙龙",
      ja: "ハラール化粧品＋女性専用サロン",
      ar: "مستحضرات تجميل حلال + صالونات نسائية فقط",
    },
  },
};

export function nicheName(niche: Niche, lang: Lang): string {
  return NICHE_META[niche].name[lang] || NICHE_META[niche].name.en;
}

export function nicheTagline(niche: Niche, lang: Lang): string {
  return NICHE_META[niche].tagline[lang] || NICHE_META[niche].tagline.en;
}
