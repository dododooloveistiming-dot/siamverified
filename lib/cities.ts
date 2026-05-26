import type { Niche, Place } from "./types";

export type CitySlug = {
  slug: string;
  label: string;
  matches: string[];
  emoji: string;
  blurb: Partial<Record<"en" | "ko" | "th" | "zh" | "ja" | "ar", string>>;
};

export const CITIES: CitySlug[] = [
  {
    slug: "bangkok",
    label: "Bangkok",
    matches: ["bangkok"],
    emoji: "🏙️",
    blurb: {
      en: "Thailand's capital — the densest hub for Muay Thai, spa, cooking classes, and coworking. Best for short stays and city-based training.",
      ko: "태국의 수도이자 무에타이, 스파, 쿠킹 클래스, 코워킹의 최대 허브. 단기 체류와 도시형 트레이닝에 최적.",
      th: "เมืองหลวงของไทย — ศูนย์รวมมวยไทย สปา คลาสทำอาหาร และโคเวิร์กกิ้งสเปซที่หนาแน่นที่สุด เหมาะกับการพักระยะสั้นและฝึกแบบในเมือง",
      zh: "泰国首都 — 泰拳、水疗、烹饪课程和共享办公空间最密集的中心。适合短期停留和都市型训练。",
      ja: "タイの首都 — ムエタイ、スパ、料理教室、コワーキングの最大の集積地。短期滞在や都市型トレーニングに最適。",
      ar: "عاصمة تايلاند — أكثف مركز للمواي تاي، السبا، دروس الطبخ، ومساحات العمل المشتركة. الأنسب للإقامات القصيرة والتدريب الحضري.",
    },
  },
  {
    slug: "chiang-mai",
    label: "Chiang Mai",
    matches: ["chiang mai", "chiangmai"],
    emoji: "🏔️",
    blurb: {
      en: "Northern Thailand's cultural capital — laid-back, mountain-cool, and home to long-stay yoga, wellness, and slow-travel cooking schools.",
      ko: "태국 북부의 문화 중심지. 여유로운 분위기, 시원한 산악 기후, 장기 체류 요가, 웰니스, 슬로우 트래블 쿠킹 클래스의 거점.",
      th: "เมืองหลวงทางวัฒนธรรมของไทยตอนเหนือ — บรรยากาศชิว เย็นสบายเชิงเขา และเป็นแหล่งโยคะ เวลเนส และโรงเรียนทำอาหารแบบสโลว์ทราเวล",
      zh: "泰国北部的文化首都 — 悠闲、凉爽的山区，是长住瑜伽、健康养生和慢旅烹饪课程的家。",
      ja: "タイ北部の文化的中心地 — のんびりとした雰囲気、涼しい山の気候、長期滞在ヨガ、ウェルネス、スローな料理教室の拠点。",
      ar: "العاصمة الثقافية لشمال تايلاند — أجواء هادئة، جبال باردة، ومركز لليوغا والعافية ومدارس الطبخ للسفر البطيء.",
    },
  },
  {
    slug: "phuket",
    label: "Phuket",
    matches: ["phuket"],
    emoji: "🏝️",
    blurb: {
      en: "Thailand's biggest island — flagship destination for Muay Thai fight camps, diving, and beach-side wellness retreats.",
      ko: "태국 최대의 섬. 무에타이 파이트 캠프, 다이빙, 비치사이드 웰니스 리트릿의 대표 목적지.",
      th: "เกาะที่ใหญ่ที่สุดของไทย — จุดหมายเรือธงสำหรับค่ายมวย ดำน้ำ และรีทรีตเพื่อสุขภาพริมหาด",
      zh: "泰国最大的岛屿 — 泰拳格斗营、潜水和海滨健康度假村的旗舰目的地。",
      ja: "タイ最大の島 — ムエタイファイトキャンプ、ダイビング、ビーチサイドのウェルネスリトリートのフラッグシップ拠点。",
      ar: "أكبر جزر تايلاند — الوجهة الرئيسية لمعسكرات المواي تاي، الغوص، ومنتجعات العافية الشاطئية.",
    },
  },
  {
    slug: "pattaya",
    label: "Pattaya",
    matches: ["pattaya"],
    emoji: "🏖️",
    blurb: {
      en: "Coast east of Bangkok — fastest beach access from BKK airport, family-friendly diving, and a growing wellness scene.",
      ko: "방콕 동쪽 해안. 방콕 공항에서 가장 빠른 해변, 가족 다이빙, 그리고 점점 커지는 웰니스 씬.",
      th: "ชายฝั่งทางตะวันออกของกรุงเทพ — เข้าถึงชายหาดได้รวดเร็วที่สุดจากสนามบินสุวรรณภูมิ ดำน้ำสำหรับครอบครัว และวงการเวลเนสที่กำลังเติบโต",
      zh: "曼谷东部海岸 — 从曼谷机场最快到达的海滩，适合家庭的潜水，以及不断发展的健康养生场景。",
      ja: "バンコクの東の海岸 — BKK空港から最速のビーチアクセス、家族向けダイビング、そして成長中のウェルネスシーン。",
      ar: "الساحل شرق بانكوك — أسرع وصول للشاطئ من مطار بانكوك، غوص ملائم للعائلات، ومشهد متنامي للعافية.",
    },
  },
  {
    slug: "hua-hin",
    label: "Hua Hin",
    matches: ["hua hin", "huahin"],
    emoji: "🌅",
    blurb: {
      en: "Royal seaside town south of Bangkok — slower pace, premium golf and spa retreats, popular with long-stay retirees.",
      ko: "방콕 남쪽의 왕실 해변 도시. 여유로운 페이스, 프리미엄 골프와 스파 리트릿, 장기 체류 은퇴자에게 인기.",
      th: "เมืองตากอากาศของพระราชวงศ์ทางใต้ของกรุงเทพ — จังหวะช้า กอล์ฟพรีเมียม รีทรีตสปา ยอดนิยมในหมู่ผู้พักระยะยาวและผู้เกษียณ",
      zh: "曼谷南部的皇家海滨小镇 — 节奏更慢，高端高尔夫和水疗度假村，深受长住退休人士欢迎。",
      ja: "バンコクの南にある王室の海辺の町 — ゆっくりとしたペース、プレミアムなゴルフとスパリトリート、長期滞在の退職者に人気。",
      ar: "بلدة ساحلية ملكية جنوب بانكوك — إيقاع أبطأ، رياضة جولف ومنتجعات سبا فاخرة، شعبية بين المقيمين والمتقاعدين على المدى الطويل.",
    },
  },
  {
    slug: "koh-samui",
    label: "Koh Samui",
    matches: ["koh samui", "samui"],
    emoji: "🌴",
    blurb: {
      en: "Gulf-side resort island — destination wellness retreats (Kamalaya, Six Senses) and a vibrant Korean/Japanese tourist scene.",
      ko: "타이만의 리조트 섬. 데스티네이션 웰니스 리트릿 (Kamalaya, Six Senses)과 활발한 한국·일본 관광객 씬.",
      th: "เกาะรีสอร์ตฝั่งอ่าวไทย — เดสติเนชั่นเวลเนสรีทรีต (Kamalaya, Six Senses) และวงการนักท่องเที่ยวเกาหลี/ญี่ปุ่นที่คึกคัก",
      zh: "暹罗湾度假岛 — 目的地健康度假村（Kamalaya、Six Senses）以及充满活力的韩日游客场景。",
      ja: "タイ湾のリゾート島 — デスティネーション・ウェルネス・リトリート（Kamalaya、Six Senses）と活気ある韓国・日本人観光客のシーン。",
      ar: "جزيرة منتجع في خليج تايلاند — منتجعات عافية وجهة (كامالايا، ستة حواس) ومشهد حيوي للسياح الكوريين/اليابانيين.",
    },
  },
];

export function getCityBySlug(slug: string): CitySlug | undefined {
  return CITIES.find((c) => c.slug === slug);
}

export function placesInCity(places: Place[], city: CitySlug): Place[] {
  return places.filter((p) => {
    const c = (p.city || "").toLowerCase();
    return city.matches.some((m) => c === m || c.includes(m));
  });
}

export function countNichesInCity(
  bundlePlaces: Place[],
  city: CitySlug,
): Record<Niche, number> {
  const counts: Record<string, number> = {};
  for (const p of placesInCity(bundlePlaces, city)) {
    counts[p.niche] = (counts[p.niche] ?? 0) + 1;
  }
  return counts as Record<Niche, number>;
}
