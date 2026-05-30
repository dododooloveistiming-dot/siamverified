import type { Lang, Niche } from "./types";

// Thailand has 3 functional seasons (cool / hot / wet) but local rhythms
// vary by region — Phuket is wet Jun-Oct, the rest cool Nov-Feb. The picks
// here lean toward activities that match weather + cultural events.

export type SeasonContext = {
  emoji: string;
  headline: Record<Lang, string>;
  context: Record<Lang, string>;
  niches: Niche[];          // top 2 niches to surface this month
  cities: string[];         // suggested city slugs (matches CITIES in lib/cities)
};

const SEASONS: Record<number, SeasonContext> = {
  1: {
    emoji: "❄️",
    headline: {
      en: "Cool, dry, peak season",
      ko: "쾌적한 건기 · 성수기",
      ja: "涼しく乾燥 · ハイシーズン",
      zh: "凉爽干燥 · 旺季",
      th: "เย็นแห้ง · ไฮซีซั่น",
      ar: "بارد وجاف · موسم الذروة",
    },
    context: {
      en: "Best month for outdoor everything — diving in Phuket/Koh Tao is at peak visibility, Muay Thai bootcamps in cool weather. Book early; prices and crowds are highest.",
      ko: "야외 활동 다 좋은 달 — 푸켓·꼬따오 다이빙 시야 최상, 무에타이 캠프도 시원한 날씨. 가격·인파 다 피크라 빨리 예약.",
      ja: "アウトドア全般のベストシーズン — プーケット/コタオのダイビングは最高の透明度、ムエタイキャンプも涼しく快適。料金・混雑ピークなので早めの予約を。",
      zh: "户外活动最佳月份 — 普吉/涛岛潜水能见度最高,泰拳训练营天气凉爽。价格和人流都达高峰,需尽早预订。",
      th: "เดือนที่ดีที่สุดสำหรับกิจกรรมกลางแจ้ง — ดำน้ำที่ภูเก็ต/เกาะเต่าทัศนวิสัยดีที่สุด ค่ายมวยอากาศเย็น ราคาและความหนาแน่นสูงสุด",
      ar: "أفضل شهر لكل النشاطات الخارجية — الغوص في فوكيت/كوه تاو في ذروته. احجز مبكراً.",
    },
    niches: ["diving", "muay-thai"],
    cities: ["phuket", "koh-tao"],
  },
  2: {
    emoji: "🌸",
    headline: {
      en: "Cool & breezy", ko: "선선한 바람", ja: "涼やか", zh: "凉爽", th: "เย็นสบาย", ar: "بارد ولطيف",
    },
    context: {
      en: "Last full month of dry-cool weather before the heat. Great for Bangkok coworking + day trips to nearby beaches. Valentine + Maha Bucha = popular spa/retreat bookings.",
      ko: "더위 전 마지막 건기-쾌적한 달. 방콕 코워킹 + 근교 비치 당일치기. 발렌타인·마하부차 시즌 = 스파·리트릿 인기.",
      ja: "暑くなる前の最後の涼しい月。バンコクのコワーキング+近郊ビーチ日帰り、バレンタインとマーカブーチャでスパ・リトリート人気。",
      zh: "炎热前最后一个凉爽月份。曼谷共享办公+周边海滩一日游,情人节和万佛节带动水疗/度假预订。",
      th: "เดือนสุดท้ายของอากาศเย็นก่อนความร้อน ดีสำหรับโคเวิร์กกิ้งในกรุงเทพ + ไปเที่ยวชายหาดใกล้ๆ",
      ar: "آخر شهر بارد قبل الحر. مثالي للعمل المشترك في بانكوك ورحلات الشاطئ القريبة.",
    },
    niches: ["coworking", "wellness"],
    cities: ["bangkok", "hua-hin"],
  },
  3: {
    emoji: "☀️",
    headline: {
      en: "Heat kicks in", ko: "더위 시작", ja: "暑さ本格化", zh: "炎热开始", th: "ความร้อนเริ่ม", ar: "بدء الحر",
    },
    context: {
      en: "Temperatures climb past 35°C inland. Wellness retreats and spa go-time — escape the heat. Yoga retreats in Chiang Mai are still pleasant in the hills.",
      ko: "내륙 35°C 돌파. 웰니스/스파 시즌 본격 시작 — 더위 피하기. 치앙마이 산악 요가 리트릿은 아직 쾌적.",
      ja: "内陸は35°C超え。ウェルネスとスパ本番 — 暑さ避け。チェンマイの山ヨガはまだ快適。",
      zh: "内陆超过35°C。养生水疗黄金期 — 避暑。清迈山区瑜伽仍然舒适。",
      th: "อุณหภูมิเกิน 35°C ในแผ่นดิน เวลเนส/สปาเริ่มต้น เชียงใหม่บนภูเขายังเย็น",
      ar: "الحرارة تتجاوز 35°م. وقت السبا والعافية لتجنب الحر.",
    },
    niches: ["spa", "yoga-pilates"],
    cities: ["chiang-mai", "bangkok"],
  },
  4: {
    emoji: "💦",
    headline: {
      en: "Songkran (water festival)", ko: "송끄란 (물 축제)", ja: "ソンクラーン (水祭り)",
      zh: "宋干节 (泼水节)", th: "สงกรานต์", ar: "سونغكران (مهرجان الماء)",
    },
    context: {
      en: "April 13-15 = Songkran water-throwing across the country. Avoid muay-thai outdoors. Indoor cooking classes are the smart move; spa retreats outside Bangkok stay quiet.",
      ko: "4월 13-15일 송끄란 — 전국 물싸움. 무에타이 야외 금지. 실내 쿠킹 클래스가 정답. 방콕 외곽 스파 리트릿 조용.",
      ja: "4月13-15日ソンクラーン — 全国水掛け。屋外ムエタイ厳禁。屋内料理教室がベスト。バンコク郊外スパは静か。",
      zh: "4月13-15日宋干节 — 全国泼水。避开户外泰拳,室内烹饪课是首选,曼谷郊区水疗安静。",
      th: "13-15 เม.ย. สงกรานต์ทั่วประเทศ มวยกลางแจ้งหลีกเลี่ยง คลาสทำอาหารในร่มดีที่สุด",
      ar: "13-15 أبريل سونغكران - رش الماء في كل البلاد. تجنب المواي تاي الخارجي.",
    },
    niches: ["cooking", "spa"],
    cities: ["bangkok", "chiang-mai"],
  },
  5: {
    emoji: "🌧️",
    headline: {
      en: "Pre-monsoon humidity", ko: "장마 전 습기", ja: "雨季前の蒸し暑さ",
      zh: "雨季前湿气", th: "ก่อนหน้ามรสุม", ar: "رطوبة ما قبل الموسم",
    },
    context: {
      en: "Hottest, muggiest month before the rains. Wellness + Pilates indoors. South coast (Phuket, Krabi) start of low season — better deals, occasional showers.",
      ko: "장마 직전 가장 더운 달. 웰니스·필라테스 실내. 남부 (푸켓·끄라비) 비수기 시작 — 가격 좋고 가끔 비.",
      ja: "雨期前の最も蒸し暑い月。ウェルネスとピラティスは屋内で。南部(プーケット・クラビ)はローシーズン入り。",
      zh: "雨季前最闷热月份。养生和普拉提室内进行。南部(普吉、甲米)进入淡季,价格优惠。",
      th: "ร้อนที่สุดก่อนฝน เวลเนส/พิลาทิสในร่ม ภาคใต้เข้าโลว์ซีซั่น ราคาดี",
      ar: "أكثر شهر حرارة قبل الأمطار. العافية والبيلاتس داخلياً.",
    },
    niches: ["wellness", "yoga-pilates"],
    cities: ["bangkok", "chiang-mai"],
  },
  6: {
    emoji: "🌦️",
    headline: {
      en: "Monsoon (south)", ko: "남부 우기 시작", ja: "南部モンスーン",
      zh: "南部雨季", th: "ฝนภาคใต้", ar: "موسم الأمطار (الجنوب)",
    },
    context: {
      en: "Andaman side (Phuket, Krabi) hits monsoon. Diving still ok at Koh Tao (Gulf side). Bangkok stays viable — Muay Thai indoor camps thrive.",
      ko: "안다만 (푸켓·끄라비) 우기. 다이빙은 꼬따오 (걸프쪽) 아직 가능. 방콕 실내 무에타이 캠프 시즌.",
      ja: "アンダマン側(プーケット・クラビ)モンスーン入り。コタオ(湾岸側)ダイビングはまだOK。バンコクの屋内ムエタイ盛況。",
      zh: "安达曼侧(普吉、甲米)进入雨季,涛岛(海湾侧)潜水仍可。曼谷室内泰拳火热。",
      th: "ฝั่งอันดามัน (ภูเก็ต กระบี่) เริ่มมรสุม เกาะเต่ายังดำน้ำได้ มวยในร่มกรุงเทพคึกคัก",
      ar: "موسم الأمطار في فوكيت وكرابي. الغوص لا يزال جيداً في كوه تاو.",
    },
    niches: ["muay-thai", "diving"],
    cities: ["bangkok", "koh-tao"],
  },
  7: {
    emoji: "☔",
    headline: {
      en: "Deep monsoon", ko: "본격 우기", ja: "本格雨季",
      zh: "深度雨季", th: "ฝนตกหนัก", ar: "ذروة الأمطار",
    },
    context: {
      en: "Wettest period. Indoor everything: cooking classes (Bangkok + Chiang Mai), coworking spaces fill with digital nomads escaping European summers.",
      ko: "비 가장 많은 시기. 실내 활동만: 쿠킹 클래스 (방콕·치앙마이), 코워킹 — 유럽 여름 피한 디지털 노마드들 몰림.",
      ja: "最も雨が多い時期。屋内中心: 料理教室、コワーキングは欧州夏を逃れたノマドで満員。",
      zh: "最潮湿时期。室内活动为主:烹饪课(曼谷+清迈),共享办公满是逃离欧洲夏季的数字游民。",
      th: "ช่วงฝนหนักที่สุด ในร่มเป็นหลัก คลาสทำอาหาร โคเวิร์กกิ้ง",
      ar: "أكثر فترة أمطار. الأنشطة الداخلية: دروس طبخ، أماكن عمل مشتركة.",
    },
    niches: ["cooking", "coworking"],
    cities: ["chiang-mai", "bangkok"],
  },
  8: {
    emoji: "🌬️",
    headline: {
      en: "Still wet, quiet", ko: "비 계속, 조용한 시즌", ja: "雨続き、静かな季節",
      zh: "雨季持续", th: "ฝนต่อ", ar: "أمطار مستمرة",
    },
    context: {
      en: "Lowest tourist density of the year. Best deals on Bangkok spa + Chiang Mai yoga retreats. Coworking spaces have space.",
      ko: "연중 관광객 최저. 방콕 스파 + 치앙마이 요가 리트릿 가격 베스트. 코워킹 자리 많음.",
      ja: "年間最も観光客が少ない月。バンコクのスパとチェンマイのヨガ最安、コワーキング空きあり。",
      zh: "全年游客最少。曼谷水疗和清迈瑜伽最实惠,共享办公空座多。",
      th: "นักท่องเที่ยวน้อยที่สุดของปี ราคาสปากรุงเทพและโยคะเชียงใหม่ดี",
      ar: "أقل كثافة سياحية في السنة. أفضل عروض السبا واليوغا.",
    },
    niches: ["spa", "yoga-pilates"],
    cities: ["bangkok", "chiang-mai"],
  },
  9: {
    emoji: "🌥️",
    headline: {
      en: "Rain tapering", ko: "비 줄어듦", ja: "雨が弱まる",
      zh: "雨势减弱", th: "ฝนเริ่มซา", ar: "تخفّ الأمطار",
    },
    context: {
      en: "Rainy season tapering. Diving on Koh Tao still good. Wellness retreats start filling for the dry-season pickup.",
      ko: "우기 막바지. 꼬따오 다이빙 양호. 웰니스 리트릿 건기 대비 예약 차기 시작.",
      ja: "雨季の終わり。コタオのダイビング良好。乾期に向けてウェルネスリトリート予約増。",
      zh: "雨季尾声。涛岛潜水仍佳。养生度假村为旱季客流做准备。",
      th: "ปลายหน้าฝน ดำน้ำเกาะเต่ายังดี เวลเนสรีทรีตเริ่มเต็ม",
      ar: "نهاية موسم الأمطار. الغوص في كوه تاو لا يزال جيداً.",
    },
    niches: ["diving", "wellness"],
    cities: ["koh-tao", "chiang-mai"],
  },
  10: {
    emoji: "🪷",
    headline: {
      en: "Cool wind returns + Vegetarian Festival", ko: "선선한 바람 + 채식 축제 (푸켓)",
      ja: "涼風 + ベジタリアン祭り", zh: "凉风回归+素食节",
      th: "ลมเย็นกลับ + เทศกาลกินเจ", ar: "عودة الرياح الباردة + مهرجان نباتي",
    },
    context: {
      en: "Vegetarian Festival in Phuket (9 days, early-mid Oct). Cool wind returns south. Diving visibility improving daily.",
      ko: "푸켓 채식 축제 (10월 초중순 9일). 남부 선선한 바람 복귀. 다이빙 시야 매일 개선.",
      ja: "プーケットのベジタリアン祭り(10月初-中旬 9日間)。南部に涼風、ダイビング透明度日々改善。",
      zh: "普吉素食节(10月初中旬9天)。南部凉风回归,潜水能见度日益改善。",
      th: "เทศกาลกินเจที่ภูเก็ต ลมเย็นกลับมาที่ภาคใต้",
      ar: "المهرجان النباتي في فوكيت. عودة الرياح الباردة جنوباً.",
    },
    niches: ["diving", "cooking"],
    cities: ["phuket", "bangkok"],
  },
  11: {
    emoji: "🪔",
    headline: {
      en: "Loy Krathong + perfect weather", ko: "러이끄라통 + 완벽한 날씨",
      ja: "ロイクラトン + 完璧な天気", zh: "水灯节+完美天气",
      th: "ลอยกระทง + อากาศดีที่สุด", ar: "لوي كراثونغ + طقس مثالي",
    },
    context: {
      en: "Best weather month of the year — Loy Krathong floats candles on water mid-Nov. Outdoor everything: muay-thai bootcamps, diving, wellness retreats all peak.",
      ko: "1년 중 최고의 날씨 — 11월 중순 러이끄라통 (물 위에 등불). 야외 다 가능: 무에타이 캠프, 다이빙, 웰니스 리트릿 모두 피크.",
      ja: "一年で最高の天気 — 11月中旬ロイクラトン(灯篭流し)。アウトドア全般ピーク。",
      zh: "全年最佳天气月 — 11月中旬水灯节。所有户外活动达到顶峰。",
      th: "เดือนอากาศดีที่สุดของปี ลอยกระทงกลางเดือน กิจกรรมกลางแจ้งทุกอย่างคึกคัก",
      ar: "أفضل شهر طقس في السنة. كل النشاطات الخارجية في ذروتها.",
    },
    niches: ["muay-thai", "wellness"],
    cities: ["chiang-mai", "phuket"],
  },
  12: {
    emoji: "🎄",
    headline: {
      en: "Peak season + Christmas/NYE", ko: "최성수기 + 크리스마스/연말",
      ja: "ピークシーズン + クリスマス/年末", zh: "旺季+圣诞跨年",
      th: "ไฮซีซั่นเต็ม + คริสต์มาส/ปีใหม่", ar: "ذروة الموسم + الكريسماس",
    },
    context: {
      en: "Highest prices, highest crowds. Book everything 2-3 weeks ahead. Wellness retreats sell out earliest. Phuket beach yoga + Koh Tao diving = sold-out classics.",
      ko: "가격 최고, 인파 최고. 모든 거 2-3주 전 예약. 웰니스 리트릿 가장 빨리 매진. 푸켓 비치 요가 + 꼬따오 다이빙 = 매진 클래식.",
      ja: "料金・混雑ピーク。2-3週間前予約必須。ウェルネスリトリート最速完売。",
      zh: "价格人流双高峰。提前2-3周预订,养生度假村最早售罄。",
      th: "ราคาและความหนาแน่นสูงสุด ต้องจอง 2-3 สัปดาห์ล่วงหน้า",
      ar: "أعلى أسعار وأعلى ازدحام. احجز قبل 2-3 أسابيع.",
    },
    niches: ["wellness", "diving"],
    cities: ["phuket", "koh-tao"],
  },
};

export function currentSeason(): SeasonContext & { month: number } {
  const month = new Date().getMonth() + 1;
  return { ...SEASONS[month], month };
}
