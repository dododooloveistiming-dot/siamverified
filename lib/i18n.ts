import type { Lang } from "./types";

export const SUPPORTED_LANGS: Lang[] = ["en", "ko", "th", "zh", "ja", "ar"];
export const DEFAULT_LANG: Lang = "en";

export const SITE = {
  origin: "https://siamverified.com",
  name: "Siam Verified",
  tagline: {
    en: "Thailand's independent activity directory. Verified by 6 sources. No paid promotion.",
    ko: "광고 거품 없는 태국 활동 디렉토리. 6개 소스에서 교차 검증.",
    th: "ไดเรกทอรีกิจกรรมในไทย ตรวจสอบจาก 6 แหล่ง ไม่มีโปรโมชันที่จ่ายเงิน",
    zh: "泰国独立活动指南 — 来自6个独立来源的验证，不含付费推广。",
    ja: "タイのアクティビティ独立ガイド — 6つの独立情報源で検証、有料宣伝なし。",
    ar: "الدليل المستقل لأنشطة تايلاند — تم التحقق من 6 مصادر، بدون ترويج مدفوع.",
  },
} as const;

export const T = {
  // navigation
  nav_explore: { en: "Explore", ko: "탐색", th: "สำรวจ", zh: "探索", ja: "探索", ar: "استكشف" },
  nav_about: { en: "About", ko: "소개", th: "เกี่ยวกับ", zh: "关于", ja: "概要", ar: "حول" },

  // landing hero
  hero_title: {
    en: "Verified Thailand. No paid hype.",
    ko: "검증된 태국. 광고 거품 X.",
    th: "ไทยแลนด์ที่ตรวจสอบแล้ว ไม่มีโฆษณาเกินจริง",
    zh: "可信泰国，无虚假宣传。",
    ja: "信頼できるタイ。誇大広告なし。",
    ar: "تايلاند الموثقة. بدون دعاية مدفوعة.",
  },
  hero_subtitle: {
    en: "Camps. Studios. Retreats. Cooking schools. Dive shops. Spas. Workspaces. Independently scored across 6 sources.",
    ko: "캠프, 스튜디오, 리트릿, 요리학교, 다이빙샵, 스파, 워크스페이스 — 6개 독립 소스로 점수화.",
    th: "ค่าย สตูดิโอ รีทรีต โรงเรียนทำอาหาร ร้านดำน้ำ สปา และพื้นที่ทำงาน — ให้คะแนนจาก 6 แหล่งอิสระ",
    zh: "训练营、工作室、度假村、烹饪学校、潜水店、水疗中心和共享空间 — 来自6个独立来源的评分。",
    ja: "キャンプ、スタジオ、リトリート、料理学校、ダイビングショップ、スパ、コワーキング — 6つの情報源で独自スコア化。",
    ar: "معسكرات. استوديوهات. منتجعات. مدارس طبخ. مراكز غوص. سبا. مساحات عمل. مقيّمة من 6 مصادر مستقلة.",
  },

  // multi-source pitch
  sources_pitch: {
    en: "Each place is cross-checked against Google · Reddit · Naver · Pantip · YouTube · Bookimed",
    ko: "각 장소는 구글 · Reddit · 네이버 · Pantip · 유튜브 · Bookimed에서 교차 검증",
    th: "แต่ละสถานที่ตรวจสอบจาก Google · Reddit · Naver · Pantip · YouTube · Bookimed",
    zh: "每个地点都经过 Google · Reddit · Naver · Pantip · YouTube · Bookimed 交叉验证",
    ja: "各スポットは Google · Reddit · Naver · Pantip · YouTube · Bookimed で相互検証",
    ar: "كل مكان تم التحقق منه عبر Google و Reddit و Naver و Pantip و YouTube و Bookimed",
  },

  // category section
  browse_categories: { en: "Browse categories", ko: "카테고리 둘러보기", th: "เรียกดูหมวดหมู่", zh: "浏览分类", ja: "カテゴリーを見る", ar: "تصفح الفئات" },
  see_all: { en: "See all", ko: "전체 보기", th: "ดูทั้งหมด", zh: "查看全部", ja: "すべて見る", ar: "عرض الكل" },
  places_count: { en: "places", ko: "곳", th: "แห่ง", zh: "处", ja: "件", ar: "أماكن" },

  // directory
  trust_score: { en: "Trust Score", ko: "신뢰 점수", th: "คะแนนความน่าเชื่อถือ", zh: "信任分数", ja: "信頼スコア", ar: "درجة الثقة" },
  filter_out_viral: {
    en: "Hide suspected ad/viral listings",
    ko: "광고/바이럴 의심 제외",
    th: "ซ่อนรายการที่สงสัยว่าเป็นโฆษณา",
    zh: "隐藏疑似广告/水军条目",
    ja: "広告/やらせ疑いを除外",
    ar: "إخفاء الإعلانات المشبوهة",
  },
  sort_by: { en: "Sort by", ko: "정렬", th: "เรียงตาม", zh: "排序", ja: "並び替え", ar: "ترتيب" },
  sort_trust: { en: "Trust Score", ko: "신뢰 점수", th: "คะแนน", zh: "信任分数", ja: "信頼スコア", ar: "درجة الثقة" },
  sort_reviews: { en: "Most reviewed", ko: "리뷰 많은 순", th: "รีวิวมากที่สุด", zh: "评论最多", ja: "レビュー数", ar: "الأكثر تقييمًا" },
  sort_rating: { en: "Highest rated", ko: "별점 높은 순", th: "คะแนนสูงสุด", zh: "评分最高", ja: "評価順", ar: "الأعلى تقييمًا" },
  search_ph: {
    en: "Search places, cities, categories…",
    ko: "장소·도시·카테고리 검색…",
    th: "ค้นหาสถานที่ เมือง หมวดหมู่…",
    zh: "搜索场所、城市、分类…",
    ja: "場所・都市・カテゴリーを検索…",
    ar: "ابحث عن أماكن، مدن، فئات…",
  },

  // filters
  filter_beginner: { en: "Beginner-friendly", ko: "초보 친화", th: "เหมาะกับมือใหม่", zh: "适合初学者", ja: "初心者向け", ar: "مناسب للمبتدئين" },
  filter_korean_friendly: { en: "Korean-friendly", ko: "한국어 가능", th: "รองรับเกาหลี", zh: "韩语友好", ja: "韓国語対応", ar: "يدعم الكورية" },
  filter_24h: { en: "Open 24h", ko: "24시간 운영", th: "เปิด 24 ชม.", zh: "24小时营业", ja: "24時間営業", ar: "مفتوح 24 ساعة" },
  price_band: { en: "Price", ko: "가격대", th: "ราคา", zh: "价格", ja: "価格", ar: "السعر" },
  price_budget: { en: "Budget", ko: "저렴", th: "ประหยัด", zh: "经济", ja: "格安", ar: "اقتصادي" },
  price_mid: { en: "Mid", ko: "중간", th: "ปานกลาง", zh: "中等", ja: "普通", ar: "متوسط" },
  price_premium: { en: "Premium", ko: "프리미엄", th: "พรีเมียม", zh: "高端", ja: "プレミアム", ar: "متميز" },
  price_luxury: { en: "Luxury", ko: "럭셔리", th: "หรูหรา", zh: "奢华", ja: "ラグジュアリー", ar: "فاخر" },

  // place detail
  patient_voices: { en: "What people actually said", ko: "진짜 사람들의 후기", th: "ผู้คนพูดว่ายังไง", zh: "真实评价", ja: "実際の声", ar: "ماذا قال الناس فعلاً" },
  faq: { en: "Frequently asked", ko: "자주 묻는 질문", th: "คำถามที่พบบ่อย", zh: "常见问题", ja: "よくある質問", ar: "أسئلة شائعة" },
  hours: { en: "Hours", ko: "운영시간", th: "เวลาทำการ", zh: "营业时间", ja: "営業時間", ar: "ساعات العمل" },
  price_range: { en: "Price range", ko: "가격대", th: "ช่วงราคา", zh: "价格范围", ja: "価格帯", ar: "نطاق السعر" },

  // CTAs
  cta_book_klook: { en: "Book on Klook", ko: "Klook 예약", th: "จองบน Klook", zh: "Klook 预订", ja: "Klookで予約", ar: "احجز عبر Klook" },
  cta_book_viator: { en: "Book on Viator", ko: "Viator 예약", th: "จองบน Viator", zh: "Viator 预订", ja: "Viatorで予約", ar: "احجز عبر Viator" },
  cta_book_gyg: { en: "Book on GetYourGuide", ko: "GetYourGuide 예약", th: "จองบน GetYourGuide", zh: "GetYourGuide 预订", ja: "GetYourGuideで予約", ar: "احجز عبر GetYourGuide" },
  cta_book_agoda: { en: "Find on Agoda", ko: "Agoda 검색", th: "หาบน Agoda", zh: "Agoda 查找", ja: "Agodaで探す", ar: "ابحث على Agoda" },
  cta_view_map: { en: "View on Google Maps", ko: "구글 맵에서 보기", th: "ดูบน Google Maps", zh: "Google 地图查看", ja: "Google マップで見る", ar: "عرض على خرائط جوجل" },

  // sources (badges)
  source_google: { en: "Google", ko: "구글", th: "Google", zh: "Google", ja: "Google", ar: "جوجل" },
  source_reddit: { en: "Reddit", ko: "Reddit", th: "Reddit", zh: "Reddit", ja: "Reddit", ar: "Reddit" },
  source_naver: { en: "Naver", ko: "네이버", th: "Naver", zh: "Naver", ja: "Naver", ar: "نيفر" },
  source_pantip: { en: "Pantip", ko: "Pantip", th: "Pantip", zh: "Pantip", ja: "Pantip", ar: "Pantip" },
  source_youtube: { en: "YouTube", ko: "유튜브", th: "YouTube", zh: "YouTube", ja: "YouTube", ar: "يوتيوب" },
  source_bookimed: { en: "Bookimed", ko: "Bookimed", th: "Bookimed", zh: "Bookimed", ja: "Bookimed", ar: "Bookimed" },
  source_website: { en: "Official site", ko: "공식 사이트", th: "เว็บไซต์ทางการ", zh: "官网", ja: "公式サイト", ar: "الموقع الرسمي" },

  // footer
  footer_blurb: {
    en: "Siam Verified is an independent directory. Affiliate commissions from booking partners support the site but never influence Trust Scores.",
    ko: "Siam Verified는 독립 디렉토리입니다. 예약 파트너로부터 수수료를 받지만 신뢰 점수에 영향을 주지 않습니다.",
    th: "Siam Verified เป็นไดเรกทอรีอิสระ ค่าคอมมิชชั่นจากพาร์ทเนอร์ไม่ส่งผลต่อคะแนน",
    zh: "Siam Verified 是独立目录。来自预订合作伙伴的佣金支持网站运营，但不影响信任分数。",
    ja: "Siam Verifiedは独立したディレクトリです。提携先からの手数料はサイト運営を支えますが、信頼スコアには影響しません。",
    ar: "Siam Verified دليل مستقل. عمولات الشركاء تدعم الموقع لكنها لا تؤثر على درجات الثقة.",
  },
} as const;

export function t<K extends keyof typeof T>(key: K, lang: Lang): string {
  const node = T[key] as Record<string, string>;
  return node[lang] ?? node[DEFAULT_LANG];
}
