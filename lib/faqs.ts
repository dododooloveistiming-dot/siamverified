// Curated FAQs for /[lang]/faq/[slug] pages.
// Each entry produces a long-tail SEO page with FAQPage Schema.org markup
// so LLMs/search engines can quote it directly.

export type Faq = {
  slug: string;
  question: string;
  shortAnswer: string;
  longAnswer: string; // 2-4 paragraphs
  topic: "muay-thai" | "yoga-pilates" | "wellness" | "cooking" | "diving" | "spa" | "coworking" | "general";
  related: string[]; // slugs
};

export const FAQS: Faq[] = [
  // ─── Muay Thai ───────────────────────────────────────────────────────
  {
    slug: "how-much-does-muay-thai-cost-thailand",
    topic: "muay-thai",
    question: "How much does Muay Thai training cost in Thailand?",
    shortAnswer:
      "Muay Thai training in Thailand typically ranges from ฿300 per drop-in class to ฿15,000–฿25,000 per month for full-time camp programs (with accommodation).",
    longAnswer: `Daily drop-in classes at most Bangkok and Phuket gyms run ฿300–฿700, with single-session walk-ins common at tourist-friendly camps. Weekly packages often start around ฿2,500 and include 6–10 sessions.

Full-time monthly camps with on-site accommodation are the typical "Thailand fight camp" experience. Mid-tier camps charge ฿15,000–฿25,000/month including basic dorm housing, 2 trainings per day, and pad work. Premium camps (Tiger Muay Thai, Sinbi, Petchyindee) can run ฿35,000–฿60,000/month.

Phuket has the densest camp ecosystem (Tiger, Sinbi, AKA), Bangkok is best for short-term technical training at established gyms (Petchyindee, Yokkao, RSM), and Chiang Mai offers cheaper alternatives for beginners (Lanna Muay Thai, Sumalee).

Most camps require no prior experience — beginner classes are standard. Bring your own hand wraps; gloves are usually provided or rentable for ฿50/day.`,
    related: ["best-muay-thai-camps-thailand", "muay-thai-beginner-thailand"],
  },
  {
    slug: "best-muay-thai-camps-thailand",
    topic: "muay-thai",
    question: "Which are the best Muay Thai camps in Thailand?",
    shortAnswer:
      "Tiger Muay Thai (Phuket), Sinbi (Phuket), Petchyindee Academy (Bangkok), Sitmonchai (Kanchanaburi), and Lanna Muay Thai (Chiang Mai) are consistently top-rated.",
    longAnswer: `Choice depends on your goal — fight prep, fitness, or beginner introduction.

For full-time fight camps with strong international communities, Tiger Muay Thai and Sinbi in Phuket are flagship destinations. Both run 2x/day training, have English-speaking pad holders, and host actual fight cards.

In Bangkok, Petchyindee Academy is the most traditional option — gym used by active fighters competing at Lumpinee/Rajadamnern stadiums. Yokkao Training Center is more polished and beginner-friendly. RSM Boxing Camp offers a quieter alternative.

For an authentic countryside experience, Sitmonchai in Kanchanaburi has churned out world champions and offers a "monastic" no-frills program at lower cost. Lanna Muay Thai in Chiang Mai is the long-standing budget-friendly option with strong fundamentals teaching.

We rank all camps by independent Trust Score combining Google reviews, Reddit, Pantip, and YouTube mentions. No paid placements.`,
    related: ["how-much-does-muay-thai-cost-thailand", "muay-thai-beginner-thailand"],
  },
  {
    slug: "muay-thai-beginner-thailand",
    topic: "muay-thai",
    question: "Is Muay Thai in Thailand suitable for beginners?",
    shortAnswer:
      "Yes — most Thai camps explicitly welcome beginners. Beginner classes run 1–2 hours daily and require zero prior experience.",
    longAnswer: `The "fight camp" myth scares many tourists, but the reality is that 70%+ of foreign visitors to most camps are beginners. Camps make most of their revenue from tourists, so they structure programs to be accessible.

A typical beginner day: morning session (90 min, technique + light pads), break, optional afternoon session (90 min, conditioning + light sparring optional). You will NOT be forced into hard sparring.

Expect to be sore for the first 3–4 days. Many beginners over-train day 1 and quit. Start at one session per day for the first week.

Look for camps marked "beginner-friendly" in our directory — these have explicit beginner programs, clear English instruction, and pad holders trained to work with new students.`,
    related: ["how-much-does-muay-thai-cost-thailand", "best-muay-thai-camps-thailand"],
  },

  // ─── Yoga / Pilates ─────────────────────────────────────────────────
  {
    slug: "yoga-retreat-thailand-cost",
    topic: "yoga-pilates",
    question: "How much does a yoga retreat in Thailand cost?",
    shortAnswer:
      "Yoga retreats in Thailand range from ฿8,000 for a 3-day basic package to ฿120,000+ for a 7-day luxury wellness retreat including accommodation, meals, and treatments.",
    longAnswer: `Budget yoga retreats (Koh Phangan, Pai) start around ฿8,000–฿15,000 for 3 days including dorm-style housing and 2 daily classes. These attract a younger backpacker crowd and run frequent silent meditation extensions.

Mid-tier 5–7 day retreats at established centers like Wonderland Healing Center, The Sanctuary Thailand, or Samahita Retreat run ฿30,000–฿70,000 — private rooms, vegetarian meals, daily yoga, and often includes detox programs.

Luxury wellness retreats (Kamalaya, Chiva-Som, Six Senses) are ฿100,000–฿300,000+ for a week. These are full medical/wellness programs with private consultations, spa treatments, and gourmet meals.

Drop-in classes at city studios (Bangkok, Chiang Mai) are ฿300–฿600 per class. Monthly unlimited memberships at popular studios run ฿3,000–฿6,000.`,
    related: ["best-yoga-studios-bangkok", "best-yoga-retreats-chiang-mai"],
  },
  {
    slug: "best-yoga-studios-bangkok",
    topic: "yoga-pilates",
    question: "What are the best yoga studios in Bangkok?",
    shortAnswer:
      "Yoga Elements, Absolute You, Wild Sukhumvit, and Yogarine consistently rank highest in our Bangkok yoga directory for instruction quality and class variety.",
    longAnswer: `Bangkok has a mature yoga scene with studios catering to expats, locals, and short-stay tourists.

Yoga Elements (Silom/Phrom Phong) is the longest-running international studio with multiple locations and senior English-speaking teachers — best for Iyengar and alignment-focused practice.

Absolute You (multiple Sukhumvit locations) offers a gym-style high-energy approach with hot yoga rooms. Popular with the expat fitness crowd.

Wild Sukhumvit is a smaller boutique with strong vinyasa flow classes and a community vibe. Good for travelers wanting consistent style.

Yogarine (Thonglor) emphasizes therapeutic yoga and is recommended for people with injuries or seeking gentler practice.

For Korean speakers, look for studios in Sukhumvit Soi 12 and Soi 22 area — multiple studios have Korean-speaking instructors. We flag these in our directory.`,
    related: ["yoga-retreat-thailand-cost", "best-yoga-retreats-chiang-mai"],
  },
  {
    slug: "best-yoga-retreats-chiang-mai",
    topic: "yoga-pilates",
    question: "Where can I do a yoga retreat in Chiang Mai?",
    shortAnswer:
      "Wild Rose Yoga, Mahasiddha Yoga, Yoga Tree Chiang Mai, and Suan Sati are the most-reviewed Chiang Mai yoga retreats.",
    longAnswer: `Chiang Mai has emerged as Thailand's second yoga capital, especially for digital nomads and longer-stay practitioners.

Wild Rose Yoga is the most established with daily classes plus regular retreats. Strong Iyengar/alignment program. Mahasiddha Yoga offers Ashtanga and serves the Mysore-style community.

For dedicated retreats (3–10 days), Suan Sati just outside Chiang Mai runs structured silent and meditation retreats. Yoga Tree Chiang Mai is a smaller, intimate option closer to the old city.

Best months are November–February (cool, dry season). Avoid March–April due to severe air pollution from agricultural burning.

Many Chiang Mai yoga venues are walking/biking distance to vegan cafes and meditation centers, making it the best Thai city for a wellness-focused stay.`,
    related: ["yoga-retreat-thailand-cost", "best-yoga-studios-bangkok"],
  },

  // ─── Diving ─────────────────────────────────────────────────────────
  {
    slug: "padi-cost-thailand",
    topic: "diving",
    question: "How much does PADI Open Water certification cost in Thailand?",
    shortAnswer:
      "PADI Open Water in Thailand costs ฿9,500–฿18,000 (about $260–$500), with Koh Tao being the cheapest and most popular destination globally.",
    longAnswer: `Thailand is one of the world's cheapest PADI Open Water destinations. Koh Tao alone certifies more divers per year than any other location globally.

On Koh Tao, you'll find PADI Open Water packages from ฿9,500–฿12,000 covering 4-day course with all equipment, materials, certification fee, and often shared accommodation. Popular schools: Big Blue, Crystal, Roctopus, Master Divers.

Phuket prices are slightly higher (฿13,000–฿18,000) due to higher operating costs, but you get more boat diving variety (Similan, Phi Phi). Best for combining cert with vacation.

Krabi and Khao Lak run similar prices to Phuket. Pattaya is cheapest in the Gulf side (~฿11,000) but visibility is more variable.

Advanced Open Water typically adds ฿7,000–฿10,000. Rescue Diver ฿9,000–฿12,000. Dive Master internships ฿35,000–฿60,000.

Best season: Andaman side (Phuket, Khao Lak) November–April. Gulf side (Koh Tao, Koh Samui) March–September.`,
    related: ["best-diving-koh-tao", "diving-similan-islands"],
  },
  {
    slug: "best-diving-koh-tao",
    topic: "diving",
    question: "Why is Koh Tao the most popular dive destination in Thailand?",
    shortAnswer:
      "Koh Tao offers extremely affordable certification, calm shallow training waters, 25+ established dive shops, and a backpacker ecosystem optimized around diving.",
    longAnswer: `Koh Tao certifies an estimated 80,000+ divers per year — the highest density anywhere in the world.

The geography is ideal: protected coves on the west side with 5–10m sandy bottoms perfect for Open Water training. Reefs are within 15-minute boat rides. Multiple dive sites cycle through different days so courses don't get stale.

The economy revolves around diving — shops cluster in Sairee Beach with shared boats reducing costs. Accommodation, food, and bars all cater to dive students. Easy to meet other divers and continue training.

Reef condition is decent but not Thailand's best (Similan Islands win that). Visibility 10–20m typical, occasional whale shark sightings April–October.

For non-divers, Koh Tao is small (21 km²) and quiet — fewer party options than Koh Phangan but easy day trips. The trade-off for the dive-centric vibe is limited cultural attractions.`,
    related: ["padi-cost-thailand", "diving-similan-islands"],
  },
  {
    slug: "diving-similan-islands",
    topic: "diving",
    question: "When can you dive the Similan Islands?",
    shortAnswer:
      "Similan Islands dive season runs mid-October to mid-May. Outside these months, the marine park is closed to protect coral and turtle nesting.",
    longAnswer: `The Similan Islands are widely considered Thailand's best diving — clear water, manta ray and whale shark encounters, and pristine reefs in a remote marine national park.

The park closes May 16 to October 14 each year. This isn't optional weather closure — it's enforced by Thai marine authorities. Permits and entry are not sold during closure.

Liveaboard trips (3–5 days, ฿18,000–฿35,000) are the most popular way to dive Similan. Day trips from Khao Lak run during the open season but require very early departures (~7am).

Best months for visibility and manta sightings: February–April. December–January is peak season with highest prices and crowds.

Phuket is the closest international airport. Most operators include hotel pickup from Phuket or Khao Lak. Combine with Surin Islands for whale shark probability boost.`,
    related: ["best-diving-koh-tao", "padi-cost-thailand"],
  },

  // ─── Spa / Massage ──────────────────────────────────────────────────
  {
    slug: "thai-massage-price",
    topic: "spa",
    question: "How much does a Thai massage cost?",
    shortAnswer:
      "Traditional Thai massage costs ฿200–฿400 per hour at local shops, ฿800–฿1,500 at mid-tier spas, and ฿2,000–฿5,000+ at luxury hotel spas.",
    longAnswer: `Pricing varies dramatically by venue type:

**Local Thai massage shops** (the small storefronts on Sukhumvit and tourist streets) charge ฿200–฿400 per hour. Quality varies but most are legitimate. Look for licensed therapists — frame on wall.

**Mid-tier spas** (Health Land, Asia Herb Association, Let's Relax) run ฿800–฿1,500 per hour for traditional Thai. Air-conditioned, branded uniforms, slightly nicer ambiance. Most reliable for first-time visitors.

**Luxury spas** (hotel spas, Devarana, So Spa) charge ฿2,000–฿5,000+ for traditional Thai, with much longer treatments (90–120 min) and often combined with herbal compress or steam.

**Foot massage** is roughly half the body-massage price. Oil/aromatherapy massage costs 20–40% more than traditional Thai.

Tipping: ฿50–฿100 per massage is standard. Luxury venues often include service charge.

Korean-friendly massage shops cluster around Sukhumvit Soi 12 and Pratunam. Many have Korean menus and staff.`,
    related: ["best-spa-bangkok", "thai-massage-vs-oil-massage"],
  },
  {
    slug: "best-spa-bangkok",
    topic: "spa",
    question: "What are the best spas in Bangkok?",
    shortAnswer:
      "Divana Virtue Spa, So Spa Sofitel, Yunomori Onsen, Health Land, and The Oriental Spa (Mandarin Oriental) consistently rank highest.",
    longAnswer: `Bangkok's spa scene spans every budget.

**Boutique luxury**: Divana Virtue Spa (Phrom Phong, Silom) offers private treatment villas, herbal compress massage, and excellent service at $50–$120 per treatment. The Oriental Spa at Mandarin Oriental is the historic flagship, $200+ for traditional treatments.

**Authentic Thai experience**: So Spa at Sofitel So Bangkok blends Thai tradition with French luxury. Banyan Tree Spa offers a serene treetop setting.

**Onsen-style**: Yunomori Onsen (multiple locations) is a Thai-Japanese hybrid with hot baths plus massage. Great value at ฿850–฿1,500 entry plus add-on treatments.

**Mid-range chain**: Health Land has 7 Bangkok branches, consistently good quality at ฿900–฿1,500 for 2-hour Thai massage. Most reliable for travelers.

**Budget**: Asia Herb Association (Thonglor area) is family-run and authentic — ฿700–฿1,200 for hour treatments.

Korean tourists frequently visit Pum's Pampers, Thann Spa Lotus, and Lavana for Korean-language menus and staff.`,
    related: ["thai-massage-price", "thai-massage-vs-oil-massage"],
  },
  {
    slug: "thai-massage-vs-oil-massage",
    topic: "spa",
    question: "What's the difference between Thai massage and oil massage?",
    shortAnswer:
      "Traditional Thai massage uses stretching and acupressure (clothes on, no oil). Oil massage uses Western-style strokes with aromatic oil (undressed, draped).",
    longAnswer: `**Traditional Thai massage (Nuat Thai)** is an active, almost yoga-like treatment. The therapist uses palms, thumbs, elbows, knees, and feet to apply pressure along energy lines (sen) and move you through assisted stretches. You stay clothed throughout (loose pajama-style outfit provided). No oil used. Pressure can be intense — say "bao bao" (gentle) if needed.

**Oil massage / Aromatherapy massage** uses long flowing strokes similar to Western Swedish massage. Therapist uses warmed oils, sometimes with chosen aroma. You undress (briefs typical) and are covered with a sheet/towel. Gentler than traditional Thai.

**Herbal compress (Luk Pra Kob)** typically adds ฿200–฿400 to either. Steamed herbal balls are pressed against muscles for heat therapy.

**Foot reflexology** is separate — focused on feet and lower legs, no oil, can be combined with shoulder/neck rub.

**Pregnancy / prenatal massage** is offered at most mid-tier spas with trained therapists — book ahead.

For first-time spa visitors, oil massage is usually more comfortable. For chronic tension, traditional Thai is more therapeutic.`,
    related: ["thai-massage-price", "best-spa-bangkok"],
  },

  // ─── Cooking ────────────────────────────────────────────────────────
  {
    slug: "thai-cooking-class-price",
    topic: "cooking",
    question: "How much does a Thai cooking class cost?",
    shortAnswer:
      "Half-day Thai cooking classes cost ฿800–฿1,500 (includes market tour, 4–5 dishes, recipe book). Full-day classes ฿1,800–฿3,500.",
    longAnswer: `Standard half-day group cooking class includes morning market tour, prep instruction, hands-on cooking of 4–5 dishes, and you eat what you make. Priced ฿800–฿1,500 ($25–$45).

Bangkok options: Silom Thai Cooking School, Sompong Thai Cooking School, Bangkok Bold Cooking Studio. Chiang Mai is the heartland — many farm-based schools (Thai Farm Cooking, Asia Scenic, Mama Noi).

Full-day intensives (8 hours, 8+ dishes) run ฿1,800–฿3,500. Some include garden tours, ingredient education, and certificate.

Private one-on-one classes ฿3,500–฿8,000.

Most classes accommodate vegetarians and food allergies if booked in advance. Halal options exist but are limited — check Halal Thailand directories.

Standard menu: Tom Yum, Pad Thai, Green Curry, Mango Sticky Rice. Specify "spicy" preference at booking.

Recipe booklets are typically included for taking recipes home. Don't expect Michelin-quality teaching — these are tourist-oriented but enjoyable.`,
    related: ["best-cooking-class-chiang-mai", "vegan-cooking-thailand"],
  },
  {
    slug: "best-cooking-class-chiang-mai",
    topic: "cooking",
    question: "Which Thai cooking class is best in Chiang Mai?",
    shortAnswer:
      "Thai Farm Cooking School, Asia Scenic Thai Cooking, and Mama Noi Cookery School consistently top reviews for hands-on farm-based experiences.",
    longAnswer: `Chiang Mai is Thailand's cooking-class capital — over 50 schools operate, most outside the old city in farm settings.

**Thai Farm Cooking School** offers half- and full-day classes at their organic farm 17km north. Includes farm walk, herb garden tour, and 6 dishes hands-on. ~฿1,200/half-day. Pickup from city included.

**Asia Scenic Thai Cooking** runs two locations (city and farm). The farm option is more atmospheric. They were among the first major schools, now have polished operations.

**Mama Noi Cookery School** is smaller and feels more authentic — Mama Noi herself often teaches. ~฿1,000 half-day.

**Sammy's Organic Thai Cooking** offers vegetarian-only classes — recommended for vegan/vegetarian travelers.

Book 1–2 days ahead in high season (Nov–Feb). Most schools include hotel pickup. Bring sun protection for outdoor sessions.

Compared to Bangkok, Chiang Mai classes are slightly cheaper, more relaxed (farm settings vs. urban kitchens), and offer more authentic ingredient access.`,
    related: ["thai-cooking-class-price", "vegan-cooking-thailand"],
  },
  {
    slug: "vegan-cooking-thailand",
    topic: "cooking",
    question: "Are there vegan or vegetarian Thai cooking classes?",
    shortAnswer:
      "Yes — most schools accommodate vegetarians on request, and specialized vegan schools exist particularly in Chiang Mai.",
    longAnswer: `Most Thai cooking schools offer a vegetarian track if you mention it at booking — fish sauce is replaced with soy or vegetable broth, shrimp paste with miso or omitted.

**Dedicated vegan schools**:
- Sammy's Organic Thai Cooking (Chiang Mai) — 100% vegetarian/vegan menu
- May Kaidee Vegetarian Thai Cooking (Bangkok and Chiang Mai) — long-running pure vegan school
- Pun Pun Center (Chiang Mai outskirts) — organic farm cooking with vegan focus

**What to specify when booking**:
- Vegan vs. vegetarian (egg/dairy)
- Severe allergies (peanut especially common in Thai dishes)
- Spice tolerance

Most popular vegan-friendly dishes taught: Tom Kha Het (mushroom coconut soup), Pad See Ew (with tofu), Green Curry (with vegetables), Som Tam (papaya salad — easily made vegan).

Note: Standard "vegetarian" Thai food often includes fish sauce. Always say "jay" (เจ) to mean strict vegan, "mangsawirat" (มังสวิรัติ) for vegetarian-with-eggs/dairy.`,
    related: ["thai-cooking-class-price", "best-cooking-class-chiang-mai"],
  },

  // ─── Coworking / Digital Nomads ─────────────────────────────────────
  {
    slug: "coworking-bangkok-vs-chiang-mai",
    topic: "coworking",
    question: "Bangkok vs Chiang Mai for digital nomads — which is better?",
    shortAnswer:
      "Chiang Mai is cheaper, slower-paced, with a tight nomad community and excellent cafes. Bangkok offers better internet, transport, and professional networking but at 2–3x the cost.",
    longAnswer: `**Cost (monthly)**:
- Chiang Mai: $700–$1,500 for studio + nomad lifestyle
- Bangkok: $1,500–$3,500 for similar quality
Chiang Mai wins on rent (often 40–60% cheaper) and food costs.

**Internet / Infrastructure**:
Bangkok has consistently faster internet (200+ Mbps fiber common, 5G everywhere). Chiang Mai is reliable but slower (50–150 Mbps typical). Both have good cafe wifi.

**Coworking spaces**:
- Bangkok: Hubba, The Hive, JustCo, WeWork — premium spaces and professional networking events
- Chiang Mai: Punspace (multiple locations), CAMP, Alt_ChiangMai — community-driven, nomad-friendly

**Community / Lifestyle**:
Chiang Mai has the densest digital nomad community in Asia. Smaller and easier to make friends. Weekly meetups, mountain access, slower pace.

Bangkok is a real city — better restaurants, museums, expat networking, but you can feel anonymous. More opportunity for in-person business meetings with Thai/SEA companies.

**Air quality**:
Chiang Mai has severe burning season (Feb–April) with PM2.5 levels frequently over 200. Bangkok air is mediocre but doesn't have the burning issue.

**Verdict**: New to nomad life → start in Chiang Mai. Building a business / networking heavily → Bangkok. Many nomads alternate seasonally.`,
    related: ["best-coworking-bangkok", "best-coworking-chiang-mai"],
  },
  {
    slug: "best-coworking-bangkok",
    topic: "coworking",
    question: "What are the best coworking spaces in Bangkok?",
    shortAnswer:
      "Hubba, The Hive (Thonglor), JustCo, Spaces, and the W District ecosystem consistently rank highest among Bangkok coworking spaces.",
    longAnswer: `Bangkok's coworking scene is mature with options for every budget and style.

**Premium / Corporate**:
- WeWork (multiple locations) — international standard, hot-desk ฿800–฿1,200/day
- JustCo (Singapore-based) — central locations, modern fit-out
- Spaces by IWG — professional networking events

**Independent / Community**:
- Hubba Thonglor — one of Bangkok's first major coworking spaces, strong startup community
- The Hive (Thonglor / Phrom Phong) — sister to Hong Kong original, expat-heavy
- The Work Loft (Phrom Phong) — quieter, focused environment

**Cafe-coworking hybrids**:
- Roast Coffee & Eatery — workhorse for laptop nomads
- Casa Lapin — multiple branches, faster wifi than typical cafe
- Toby's (Sukhumvit 38) — heated by digital nomads for its setup

**Pricing**:
Day pass ฿300–฿800. Monthly hot desk ฿4,000–฿10,000. Dedicated desk ฿8,000–฿18,000. Private office from ฿15,000+.

Avoid: any space without a written wifi speed guarantee. Test speed before committing to a multi-month plan.`,
    related: ["coworking-bangkok-vs-chiang-mai", "best-coworking-chiang-mai"],
  },
  {
    slug: "best-coworking-chiang-mai",
    topic: "coworking",
    question: "What are the best coworking spaces in Chiang Mai?",
    shortAnswer:
      "Punspace (3 locations), CAMP (Maya mall), AlternHIVE, and Yellow Coworking are the most-recommended Chiang Mai coworking spaces.",
    longAnswer: `Chiang Mai pioneered Southeast Asia's digital nomad scene and the coworking ecosystem reflects that.

**Punspace** (Nimmanhaemin, Tha Phae Gate, Wiang Bua) — the original Chiang Mai coworking brand. Locations vary in vibe; Nimman is most polished, Wiang Bua quieter. Monthly ฿2,500–฿4,500.

**CAMP** at Maya Lifestyle Mall (Nimman) — free coworking inside a major mall, requires food/drink purchase. Reliable wifi, large space, AC. Great for short-term work.

**AlternHIVE** — newer, design-focused space in Nimman area. Quiet and good for focused work.

**Yellow Coworking** — Hipster aesthetic, strong community events, ฿200/day or ฿3,500/month.

**Cafe-as-cowork**:
- Wake Up — laptop-friendly, multiple branches
- Roast8ry — newer, fast wifi
- Graph Cafe — minimalist, quiet

**What to look for**:
- Air filtration during burning season (Feb–April)
- 24/7 access if you work late
- Backup internet (Chiang Mai outages happen)

Avoid Nimmanhaemin coworking during peak nomad season (Nov–Feb) without booking — they fill up.`,
    related: ["coworking-bangkok-vs-chiang-mai", "best-coworking-bangkok"],
  },

  // ─── Wellness ───────────────────────────────────────────────────────
  {
    slug: "best-wellness-retreats-thailand",
    topic: "wellness",
    question: "What are the best wellness retreats in Thailand?",
    shortAnswer:
      "Kamalaya (Koh Samui), Chiva-Som (Hua Hin), Amanpuri (Phuket), Six Senses Yao Noi, and The Sanctuary Thailand (Koh Phangan) are Thailand's flagship wellness retreats.",
    longAnswer: `Thailand offers wellness retreats at every budget and intensity.

**Luxury medical-wellness** ($500–$1,500/day):
- Chiva-Som (Hua Hin) — Thailand's pioneering health resort, ~30 years operating, medical-led programs
- Kamalaya (Koh Samui) — holistic wellness with monks, naturopaths, and stunning Gulf views
- Amanpuri / Six Senses — luxury hotels with strong wellness programs as add-ons

**Mid-tier retreats** ($150–$400/day):
- The Sanctuary Thailand (Koh Phangan) — long-standing detox and yoga retreat
- Samahita Retreat (Koh Samui) — yoga + ayurveda focused
- Wonderland Healing Center (Koh Phangan) — fasting and detox specialty

**Detox / fasting**:
Multiple Koh Phangan-based programs offer water fasting + colonic hydrotherapy. Quality varies — research providers carefully.

**Vipassana meditation** (often free or donation-only):
Wat Suan Mokkh near Surat Thani runs 10-day silent retreats — strict, monastic, demanding.

Best months: November–April. Avoid May–October if Koh Phangan/Samui (rainier) but Khao Lak / Hua Hin still operate.`,
    related: ["meditation-retreat-thailand", "detox-thailand-cost"],
  },
  {
    slug: "meditation-retreat-thailand",
    topic: "wellness",
    question: "Where can I do a meditation retreat in Thailand?",
    shortAnswer:
      "Wat Suan Mokkh (Surat Thani), Doi Suthep Monk Chat & Meditation (Chiang Mai), Wat Pah Nanachat (Ubon Ratchathani), and Vipassana Dhura (Bangkok) are major options.",
    longAnswer: `Thailand has strong meditation traditions across multiple Buddhist schools.

**Wat Suan Mokkh** (Suan Mokkh, Surat Thani) runs the famous 10-day silent international retreat every month, 1st–10th. Free of charge (donation-based). No phones, no talking, daily Dhamma talks. Very physically demanding — sitting and walking from 4am to 9pm. International applicants welcome.

**Doi Suthep International Buddhism Center** (Chiang Mai) offers 5–21 day retreats with monastic discipline. Donations only. English-speaking instructors.

**Wat Pah Nanachat** (Bung Wai, Ubon Ratchathani) is the international monastery of the Ajahn Chah Forest Tradition. Daily life with monks. Application required, multi-week stays.

**Vipassana Dhura Meditation Center** (Bangkok) runs 7-day retreats accessible from the city. Less strict than Wat Suan Mokkh but still meaningful.

**For beginners** uncomfortable with monastic settings: many yoga retreats (above) include daily meditation. Start with 3 days before attempting 10-day silent retreats.

Bring: loose modest clothing (white preferred at monasteries), no jewelry, mosquito repellent.`,
    related: ["best-wellness-retreats-thailand", "detox-thailand-cost"],
  },
  {
    slug: "detox-thailand-cost",
    topic: "wellness",
    question: "How much does a detox retreat in Thailand cost?",
    shortAnswer:
      "Detox programs range from $30/day for basic Koh Phangan options to $400+/day at luxury Chiva-Som / Kamalaya. Typical 7-day mid-tier program: ฿35,000–฿80,000.",
    longAnswer: `Detox / cleanse retreats in Thailand cluster on Koh Phangan with options spreading to Koh Samui, Phuket, and Hua Hin.

**Budget** ($30–$70/day): Koh Phangan-based programs like Wonderland Healing Center, Sanctuary Thailand. Basic accommodation, supervised water fasting or fruit fast, daily yoga, colonic hydrotherapy add-on. 7 days = $200–$500.

**Mid-tier** ($100–$300/day): Atmanjai (Phuket), Samahita (Samui). Better facilities, group meals, naturopathic consultations. 7-day program = ฿35,000–฿80,000.

**Luxury** ($500–$1,500/day): Chiva-Som, Kamalaya, Six Senses. Medical-led with doctor consultations, diagnostic testing, customized programs. 7-day = ฿200,000–฿500,000+.

**What you typically get**:
- Initial health consultation
- Supervised fasting (juice, water, or food-based detox)
- Daily yoga or movement
- Sauna / steam access
- Optional colonic hydrotherapy
- Meals (during eating windows)

**Caution**: Water fasting beyond 5 days requires medical supervision. Don't book extreme programs without research.`,
    related: ["best-wellness-retreats-thailand", "meditation-retreat-thailand"],
  },

  // ─── General ────────────────────────────────────────────────────────
  {
    slug: "best-time-to-visit-thailand-wellness",
    topic: "general",
    question: "When is the best time to visit Thailand for wellness / retreats?",
    shortAnswer:
      "November to February is Thailand's cool, dry season — ideal for outdoor yoga and retreats. Avoid March–April in northern Thailand (severe air pollution) and May–October on Gulf islands (rainy).",
    longAnswer: `Thailand has three seasons that affect wellness travel:

**November–February (Cool & Dry)** — best overall. Comfortable temperatures (20–30°C), low humidity, low rain. Peak tourist season, prices higher, but ideal for outdoor classes.

**March–April (Hot)** — temperatures 35°C+, increasing humidity. AVOID northern Thailand (Chiang Mai, Chiang Rai, Pai) due to agricultural burning — air quality reaches hazardous levels (PM2.5 200+). Andaman beaches (Phuket, Krabi) and Koh Samui are still excellent.

**May–October (Rainy)** — varies by coast:
- Andaman side (Phuket, Krabi): heavy rain, some shops close, but discounts. Dive season closed for Similan.
- Gulf side (Koh Samui, Koh Phangan, Koh Tao): generally better in this period, drier than Andaman. Diving still excellent on Gulf.

**Best months by activity**:
- Yoga retreats: November–February
- Muay Thai: any time (indoor)
- Diving Andaman: November–April
- Diving Gulf: March–September
- Cooking classes: any time
- Spa: any time

Korean tourists peak: December and Lunar New Year (late Jan/early Feb).`,
    related: ["padi-cost-thailand", "best-wellness-retreats-thailand"],
  },
  {
    slug: "thai-tipping-spa-yoga",
    topic: "general",
    question: "Do I need to tip in Thailand at spas, yoga studios, gyms?",
    shortAnswer:
      "Tipping is appreciated but not mandatory: ฿50–฿100 for massages, ฿20–฿50 for caddies/instructors, and rounded-up amounts at restaurants. Luxury venues often add 10% service charge.",
    longAnswer: `Thailand has a moderate tipping culture — less than the US, more than Japan.

**Massages / Spas** (most common tipping situation):
- ฿50–฿100 per therapist for hourly massage
- ฿100–฿200 for 2-hour treatments
- Slip cash directly to therapist after treatment
- Luxury hotel spas often include 10% service charge — tipping additional optional

**Restaurants**:
- Casual: round up the bill, leave ~5% change
- Mid-tier: 10% if no service charge, 5% if service charge included
- Many places now include 10% service charge automatically

**Hotels**:
- Porter: ฿20–฿50 per bag
- Housekeeping: ฿20–฿50 per day on pillow
- Concierge for special help: ฿200–฿500

**Taxis / Grab**:
- Round up to nearest ฿20
- Tip optional but appreciated

**Yoga / Pilates instructors**: not common to tip
**Muay Thai trainers**: ฿200–฿500 weekly if you're at a camp long-term

**Tour guides** (full-day private): ฿300–฿500
**Drivers**: ฿100–฿200 for full-day hire

Don't feel obligated to over-tip — Thai service culture is genuine and doesn't expect Western-level tips.`,
    related: [],
  },

  // ─── Practical / Travel logistics ────────────────────────────────────
  {
    slug: "thailand-wellness-trip-daily-budget",
    topic: "general",
    question: "How much should I budget per day for a wellness trip to Thailand?",
    shortAnswer:
      "Backpacker wellness: ฿1,500–฿2,500/day (~$45–75 USD). Mid-tier: ฿4,000–฿7,500/day. Luxury wellness retreats: ฿15,000–฿35,000/day all-in.",
    longAnswer: `Daily budgets vary wildly depending on accommodation tier and activity intensity.

**Backpacker / hostel tier — ฿1,500–฿2,500/day** ($45–$75 USD):
- Dorm bed: ฿300–฿600
- Street food: ฿150–฿300
- 1 drop-in yoga or Muay Thai class: ฿400–฿700
- 1-hr Thai massage: ฿300–฿500
- BTS / Grab transport: ฿100–฿200

**Mid-tier — ฿4,000–฿7,500/day** ($120–$225):
- Boutique hotel: ฿1,500–฿3,000
- Mix of street food + restaurants: ฿700–฿1,200
- 1–2 activities per day: ฿800–฿2,000
- Oil massage at quality spa: ฿800–฿1,500
- Grab / private driver: ฿300–฿600

**Luxury wellness retreat — ฿15,000–฿35,000/day**:
- Premium resort with spa: ฿8,000–฿20,000
- Full wellness program (3 treatments/day, meals, classes): often all-inclusive
- Examples: Kamalaya Koh Samui, Chiva-Som Hua Hin, Six Senses Yao Noi

**One-week realistic totals** (mid-tier):
- Bangkok yoga + massage week: ฿30,000–฿50,000 ($900–$1,500)
- Phuket Muay Thai camp week (with dorm): ฿15,000–฿25,000
- Chiang Mai slow-travel week with cooking: ฿20,000–฿35,000`,
    related: ["how-much-does-muay-thai-cost-thailand", "yoga-retreat-thailand-cost", "best-wellness-retreats-thailand"],
  },
  {
    slug: "thailand-safe-for-tourists-wellness",
    topic: "general",
    question: "Is Thailand safe for wellness tourism (Muay Thai, yoga, diving)?",
    shortAnswer:
      "Thailand is among the safest countries in Southeast Asia for wellness tourism. Reputable camps and studios have professional safety protocols. Main risks are road accidents and unlicensed dive shops — both avoidable.",
    longAnswer: `Thailand attracts 30M+ tourists yearly and the wellness/training industry is mature. Major safety considerations:

**Muay Thai camps** — very safe at established gyms. You won't be forced into hard sparring as a beginner. Beginners typically get 2–4 weeks of light technique work before any contact training. Stick to camps with English-speaking staff and visible insurance signage.

**Yoga retreats** — extremely safe. Main risk is improper guidance for beginners. Look for certified teachers (RYT-200/500 from Yoga Alliance) and avoid unverified "spiritual" retreats with no online reviews.

**Diving** — generally very safe at PADI/SSI 5-Star centers. Verify dive shop certification before booking. Avoid super-cheap Koh Tao "fun dive" operators with no certification on display — fatalities have occurred at unregulated shops.

**Spa / massage** — virtually risk-free, but for therapeutic massage check that the therapist has TAT (Tourism Authority of Thailand) registration if you want medical-grade work.

**Bigger actual risks**:
- Scooter/motorbike accidents — leading cause of tourist injury. Avoid renting bikes if you're not experienced.
- Tuk-tuk overcharging — agree on price first or use Grab/Bolt.
- Unlicensed dive shops or "free trial" muay thai gyms with hidden fees.

Travel insurance is strongly recommended (~$50–$100 for a 2-week trip).`,
    related: ["padi-cost-thailand", "muay-thai-beginner-thailand"],
  },
  {
    slug: "thailand-visa-long-stay-wellness",
    topic: "general",
    question: "What visa do I need for a long-stay yoga or Muay Thai trip in Thailand?",
    shortAnswer:
      "Most Western and Korean passports get 60 days visa-free on arrival. For 30+ day trips you can extend +30 days at immigration (฿1,900) or apply for a 60–90 day Tourist Visa beforehand. For 6+ months, look into Education Visa (ED) via your school/gym.",
    longAnswer: `As of 2026:

**Visa-free entry** (no application needed):
- Korea, US, UK, EU, Japan, most Western passports: 60 days on arrival
- Single extension at Bangkok Immigration: +30 days for ฿1,900
- Maximum visa-free stay: 90 days

**Tourist Visa (TR)** — apply at Thai embassy beforehand:
- 60 days single entry: ~$40 USD, extendable +30 days in country
- 6-month multi-entry: ~$200 USD, must exit and re-enter every 60 days

**Education Visa (ED)** — for 6+ months at registered schools:
- Many Muay Thai camps, yoga teacher trainings, and Thai language schools sponsor ED visas
- Costs ~฿15,000–฿25,000 for school registration + visa fees
- Allows 1 year stay with 90-day reports
- Tiger Muay Thai (Phuket), Sinbi (Phuket), some Bangkok yoga schools offer ED programs

**Retirement / Long-term**:
- O-A (50+ retirement): 1 year, requires income proof
- LTR (Long-Term Resident): 10 years, high income thresholds
- Elite Visa: 5–20 years, ฿900,000+ membership fee

Always check current rules at thaiembassy.com (your country) — Thai visa policy changes frequently.`,
    related: ["thailand-wellness-trip-daily-budget"],
  },
  {
    slug: "thailand-airport-to-wellness-destinations",
    topic: "general",
    question: "How do I get from Bangkok airport to Phuket, Chiang Mai, or Koh Samui?",
    shortAnswer:
      "Domestic flights are fastest and often cheapest: BKK→HKT (Phuket) 80 min ~฿1,500, BKK→CNX (Chiang Mai) 75 min ~฿1,200, BKK→USM (Koh Samui) 70 min ~฿3,500. Buses/trains are 10x slower but ~฿500.",
    longAnswer: `Most wellness travelers fly domestic from Suvarnabhumi (BKK) or Don Mueang (DMK).

**Bangkok → Phuket (HKT)**:
- Flight: 80 min, ฿1,500–฿3,000 (Thai AirAsia, Nok Air, Bangkok Airways)
- Bus: 12 hrs overnight, ฿800–฿1,200
- Best for: Muay Thai camps, diving, beach wellness

**Bangkok → Chiang Mai (CNX)**:
- Flight: 75 min, ฿1,000–฿2,500
- Overnight train: 12 hrs, ฿400–฿1,200 (1st class sleeper recommended)
- Bus: 9 hrs, ฿600–฿900
- Best for: Long-stay yoga, cooking classes, slow-travel

**Bangkok → Koh Samui (USM)**:
- Direct flight on Bangkok Airways: 70 min, ฿3,500–฿6,000 (monopoly route — pricey)
- Cheaper alternative: BKK → Surat Thani (฿1,500), then ferry to Samui (฿200, 1.5 hrs)
- Best for: Luxury wellness retreats, Kamalaya, Six Senses

**Bangkok → Pattaya / Hua Hin**:
- Bus / van: 2–3 hrs, ฿250–฿400
- No domestic flights — too close

**Tips**:
- Book domestic flights 2–4 weeks ahead for best prices
- Don Mueang (DMK) handles most budget airlines — different airport from BKK, allow 2 hours between connections
- Suvarnabhumi (BKK) has Airport Rail Link (฿45) and taxi/Grab options to city`,
    related: ["thailand-wellness-trip-daily-budget"],
  },
  {
    slug: "what-to-pack-thailand-wellness-trip",
    topic: "general",
    question: "What should I pack for a Muay Thai or yoga trip to Thailand?",
    shortAnswer:
      "Thailand is hot and humid year-round. Bring breathable workout clothes, sandals, a reusable water bottle, sunscreen, and basic first-aid. Gear like gloves, mats, and rashguards is cheaper to buy locally than to bring.",
    longAnswer: `**Clothes** (pack light — wash daily):
- 3–5 quick-dry athletic shorts/leggings
- 5–7 breathable workout shirts (cotton wilts in humidity)
- 1–2 sets of "going out" clothes (modest at temples)
- Sandals or flip-flops + 1 pair of trainers
- Light rain jacket (May–October)

**Gear** (buy locally — cheaper):
- Muay Thai gloves: ฿1,200–฿2,500 in Thailand vs $50–$120 abroad
- Hand wraps: ฿200/pair, bring 2–3 pairs
- Yoga mat: ฿800–฿1,500 locally (or rent at studio for ฿50/day)
- Rashguard: ฿500–฿1,500
- Brand-name (Fairtex, Twins): same prices, better selection than abroad

**Health**:
- Mosquito repellent with 30%+ DEET
- High-SPF sunscreen (50+ — expensive in Thailand)
- Basic first-aid kit: blister patches, antiseptic, ibuprofen
- Probiotics for first-week stomach adjustment
- Reef-safe sunscreen for diving (mandatory in many marine parks)

**Tech**:
- Universal adapter (Thai plugs accept US 2-pin + EU 2-pin, but not UK)
- Portable charger
- Waterproof phone case for beaches/diving

**Don't bring**:
- Heavy clothing (you'll sweat through it)
- Excessive supplements (Thai pharmacies have everything)
- Expensive jewelry (theft risk on beaches)

**Korean travelers** — Thai pharmacies don't carry Korean OTC meds (지사제, 진통제 brands you know). Bring a small kit.`,
    related: [],
  },
  {
    slug: "korean-friendly-massage-thailand",
    topic: "spa",
    question: "Where can I find Korean-friendly Thai massage shops in Bangkok?",
    shortAnswer:
      "Korean-friendly massage shops cluster in Sukhumvit Soi 12, Asoke, and Thonglor — areas with high Korean expat density. Look for shops with Korean signage or surface Korean reviews. Many staff speak basic Korean greetings.",
    longAnswer: `Bangkok's Korean tourist density means a meaningful subset of massage shops have learned basic Korean service phrases.

**Best neighborhoods for Korean-friendly massage**:
- **Sukhumvit Soi 12 / Asoke** — closest Korean enclave to Sukhumvit hotels. Multiple shops with Korean reviews on Naver.
- **Phloen Chit / Ratchadamri** — luxury hotel district, premium spas with multilingual staff.
- **Thonglor (Sukhumvit 55)** — upscale, lots of Korean expat residents → therapists used to Korean clients.
- **Phra Khanong / Ekkamai** — newer Korean expat area.

**Things to look for**:
- 한국어 OK or 한국 손님 환영 signage
- Listings with multiple Korean Naver blog reviews
- Verified Thai's place filter: 🇰🇷 Korean-friendly badge surfaces these

**Prices**:
- Foot massage: ฿250–฿450 (1 hr)
- Thai body massage: ฿350–฿600 (1 hr)
- Oil/aroma: ฿700–฿1,500 (1 hr)
- Tipping: ฿50–฿100 per therapist

**Korean tourist favorites** (you'll see these in Naver blog posts):
- Health Land — big chain, English/Korean menus
- Asia Herb Association — Sukhumvit, herbal compress specialty
- Ruen Nuad — clean, traditional, Ploenchit
- Let's Relax — modern, ubiquitous, English/Korean menus

Filter by 🇰🇷 Korean-friendly on individual listings to pre-screen for this signal.`,
    related: ["thai-massage-price", "best-spa-bangkok"],
  },

  // ─── Muay Thai deep dive ──────────────────────────────────────────────
  {
    slug: "muay-thai-trip-how-long",
    topic: "muay-thai",
    question: "How long should I stay for a Muay Thai trip to Thailand?",
    shortAnswer:
      "Minimum useful stay is 1 week (drop-in style). 2–4 weeks is ideal for technique gains. 2–3 months is the standard fight-camp experience. Diminishing returns after 4 months for amateurs.",
    longAnswer: `Your goal sets the duration:

**1 week (drop-in tourist) — ฿4,000–฿8,000 in fees**:
- 7–10 group classes, basic technique exposure
- Realistic outcome: learn proper stance, basic punches/kicks, jab-cross-low kick combo
- Best for vacation training, not for fighters

**2–4 weeks (immersive beginner)** — ฿12,000–฿30,000 in fees, plus housing:
- 20–40 sessions, significant technique improvement
- Realistic outcome: comfortable shadow boxing, pad work flow, light sparring
- Most foreign tourists pick this duration

**2–3 months (fight camp standard)** — ฿40,000–฿80,000+ all-in with housing:
- 60–120 sessions, real conditioning and skill
- Common for: weight loss goals, amateur fight prep, sabbatical training
- Body adapts to twice-daily training pace by week 3–4

**4–12 months (serious training)**:
- Required for: amateur fight competition prep, fitness transformation
- Look into Education Visa (ED) for legal long stay
- Diminishing returns unless you're working toward fighting

**Optimal trip plan**:
- First-timers: 2 weeks
- Returning: 1 month
- Sabbatical: 3 months

Pace yourself in week 1 — most beginners over-train day 1 and quit by day 4.`,
    related: ["how-much-does-muay-thai-cost-thailand", "muay-thai-beginner-thailand"],
  },
  {
    slug: "muay-thai-stadium-lumpinee-vs-rajadamnern",
    topic: "muay-thai",
    question: "Lumpinee vs Rajadamnern Stadium — which is better to watch?",
    shortAnswer:
      "Rajadamnern is older and more traditional (Bangkok's oldest stadium, est. 1945). New Lumpinee Stadium is bigger, more modern, and easier for tourists (English signs, AC, ฿2,000–฿3,000 tickets). Both show real championship fights.",
    longAnswer: `Both are sanctioned by Thailand's national Muay Thai authorities — fights are legitimate, including current champions and ranked fighters.

**New Lumpinee Stadium** (Ramintra area, north Bangkok):
- Moved from old Lumpinee location in 2014
- Modern facility: AC, English announcements, food vendors
- Fight nights: Tuesday, Friday, Saturday
- Tickets: ฿2,000 (3rd class) → ฿3,000 (2nd) → ฿4,000 (ringside)
- Easier for foreign tourists — pre-purchase tickets online
- Larger crowd, more touristy, but quality fights

**Rajadamnern Stadium** (central Bangkok, Ratchadamnoen Klang Road):
- Thailand's oldest still-active Muay Thai stadium (since 1945)
- More traditional atmosphere, intense Thai gambling crowd in 3rd class
- Fight nights: Monday, Wednesday, Thursday, Sunday
- Tickets: ฿1,500 (3rd) → ฿2,500 (2nd) → ฿3,500 (ringside)
- Walking distance from Khao San Road tourist area
- Tickets sometimes resold higher at the door — buy online for genuine prices

**Tips**:
- Best seats: 2nd class — close enough to feel the impact, far enough to see the full ring
- Avoid: cheap 3rd class if gambling chaos bothers you
- Show duration: ~3 hours, 8–10 fights
- Dress code: smart casual, no shorts/flip-flops at ringside
- Combo tickets including Muay Thai gym visit + stadium are sold at hotels — overpriced; book directly

**Worth watching even if you don't train**: A real Muay Thai stadium fight is one of Bangkok's iconic experiences.`,
    related: ["best-muay-thai-camps-thailand"],
  },
  {
    slug: "women-muay-thai-thailand",
    topic: "muay-thai",
    question: "Can women train at Muay Thai camps in Thailand?",
    shortAnswer:
      "Yes — almost all camps welcome women equally, and dedicated women's classes are common. Female-friendly camps include Sinbi (Phuket), Tiger Muay Thai (Phuket), Yokkao (Bangkok), and Lanna (Chiang Mai). 30–40% of foreign trainees at most camps are women.",
    longAnswer: `Muay Thai's female participation has grown dramatically — many world champions are women and Thailand has fully embraced female training.

**What to expect**:
- Mixed-gender classes are the default
- Some camps have women-only classes (better for absolute beginners)
- Female pad holders and trainers exist at most camps
- Hard sparring is optional — you can do technique training only

**Cultural notes** (Thai-specific Muay Thai customs):
- Women traditionally don't step over the rope into the ring — they go under it (Wai Khru cultural respect)
- Some traditional gyms ask women to avoid touching trainers' heads (Buddhist respect)
- Modern, tourist-facing camps are relaxed about these customs

**Top female-friendly camps**:
- **Sinbi Muay Thai (Phuket)** — known for international community, ~40% women
- **Tiger Muay Thai (Phuket)** — largest, dedicated women's program
- **Yokkao Training Center (Bangkok)** — polished, beginner-friendly
- **Lanna Muay Thai (Chiang Mai)** — small, intimate, gender-balanced
- **Petchyindee Academy (Bangkok)** — more traditional but welcomes women

**Practical**:
- Bring sports bra (not commonly sold in Thai athletic size ranges)
- Buy gloves locally (women's sizes available)
- Most camps provide women-friendly accommodation options

Solo female travelers are very common at Thai Muay Thai camps. The international community is welcoming, and Thailand is among the safer destinations for solo female travel.`,
    related: ["best-muay-thai-camps-thailand", "muay-thai-beginner-thailand"],
  },

  // ─── Diving deep dive ─────────────────────────────────────────────────
  {
    slug: "padi-vs-ssi-thailand",
    topic: "diving",
    question: "PADI vs SSI vs NAUI — which dive certification is best in Thailand?",
    shortAnswer:
      "Both PADI and SSI are equally valid worldwide and accepted at all Thai dive shops. PADI is the most globally recognized brand (60% market share). SSI is ~20% cheaper and uses identical safety standards. NAUI is rare in Thailand.",
    longAnswer: `All three agencies meet the same WRSTC (World Recreational Scuba Training Council) standards. Differences are marketing, not safety.

**PADI (Professional Association of Diving Instructors)**:
- Most globally recognized — ask any random dive shop and they'll know PADI
- Brand premium: courses cost ฿11,000–฿14,000 in Thailand
- Strong in: Phuket, Similan, Koh Samui
- Best if: you plan to dive worldwide and want maximum brand recognition

**SSI (Scuba Schools International)**:
- Equally valid, owned by Mares dive equipment
- 15–25% cheaper than PADI in Thailand
- Strong in: Koh Tao, Koh Lanta, Phi Phi
- Best if: budget-conscious, doing Thailand-only trip

**NAUI** — uncommon in Thailand, mainly US military and Japan
**RAID, CMAS, BSAC** — exist but rare

**Practical advice**:
- Pick instructor over agency: a great SSI instructor > mediocre PADI instructor
- Read individual dive shop reviews (Verified Thai aggregates these)
- Same exact skills are taught: 4 confined water + 4 open water dives for Open Water cert
- Once certified with any agency, you can dive at any reputable shop globally

**Course duration**: 3–4 days for Open Water (theory, pool, ocean dives)
**Minimum age**: 10 (Junior OW) or 15 (full OW)
**Health requirement**: medical questionnaire — most conditions are fine, asthma/heart issues need doctor sign-off`,
    related: ["padi-cost-thailand", "best-diving-koh-tao"],
  },
  {
    slug: "liveaboard-thailand-cost",
    topic: "diving",
    question: "How much does a Thailand diving liveaboard cost?",
    shortAnswer:
      "Similan Islands liveaboards (the gold standard) cost ฿18,000–฿35,000 for 3–4 days, all-inclusive. Premium boats (Hin Daeng/Hin Muang) up to ฿55,000. Season: November–April only.",
    longAnswer: `Liveaboards are multi-day dive trips where you sleep on the boat, diving 3–4x per day.

**Similan Islands** (Andaman, north of Phuket) — most popular:
- 3-day / 11-dive trip: ฿18,000–฿25,000
- 4-day / 14-dive trip: ฿24,000–฿32,000
- Includes: bunk berth, all meals, tanks, weights, marine park fees
- Season: November 1 – April 30 (closed in monsoon)
- Departures: Khao Lak (most common), Phuket

**Hin Daeng / Hin Muang** (south Andaman, near Phi Phi):
- 4-day from Phuket: ฿28,000–฿40,000
- Manta rays, whale sharks (March–May peak)
- Smaller boats, more advanced divers

**Premium boats** (Diva Andaman, Pawara, etc.):
- 4-day: ฿35,000–฿55,000
- Private cabins, gourmet food, smaller groups
- Best for: experienced divers, couples, honeymoons

**Budget liveaboards** (Koh Tao based):
- Day-trip alternatives: ฿2,500–฿4,500 per day, sleep on land
- 2-day camp-style trips: ฿8,000–฿14,000
- Best for: Open Water + Advanced certification combos

**What's NOT included** (usually):
- Alcohol on board
- Rental equipment (~฿1,500/day if needed)
- Marine park fee for non-Thais (~฿1,800 for Similan)
- Travel insurance

**Booking tips**:
- Book 3–6 months ahead for high season (Dec–Feb)
- Last-minute deals appear in October before season starts
- Liveaboard requires Advanced Open Water cert minimum (PADI/SSI)`,
    related: ["padi-cost-thailand", "diving-similan-islands"],
  },

  // ─── Yoga deep dive ───────────────────────────────────────────────────
  {
    slug: "yoga-teacher-training-thailand",
    topic: "yoga-pilates",
    question: "How much does Yoga Teacher Training (YTT) cost in Thailand?",
    shortAnswer:
      "200-hour YTT in Thailand costs ฿55,000–฿120,000 ($1,650–$3,600 USD) for a 3–4 week intensive, including accommodation and meals at most schools. 500-hour YTT runs ฿120,000–฿250,000.",
    longAnswer: `Thailand is the world's #2 YTT destination after Bali, with strong programs across all major styles.

**200-hour YTT** (most common — RYT-200 with Yoga Alliance):
- Duration: 3–4 weeks intensive
- Cost: ฿55,000–฿120,000 all-inclusive
- Includes: shared accommodation, 2–3 vegetarian meals/day, training, certification

**Popular 200-hr YTT schools**:
- **Wonderland Healing Center** (Koh Phangan) — Yoga Alliance certified, mid-range
- **Samahita Retreat** (Koh Samui) — premium, structured curriculum
- **The Yoga Institute Thailand** (Chiang Mai) — traditional Hatha focus
- **Vikasa** (Koh Samui) — luxury, modern facilities
- **Absolute You** (Bangkok) — urban, weekend format available

**Styles offered**:
- Hatha (traditional foundation)
- Vinyasa (flow style — most popular)
- Yin (slow, meditative)
- Ashtanga (rigorous structured series)
- Trauma-informed (newer specialty)

**300-hr advanced / 500-hr complete YTT**:
- ฿120,000–฿250,000
- Usually 4–6 weeks
- Required for: senior teaching positions, RYT-500 designation

**What to verify before signing up**:
- School registered with Yoga Alliance (RYS-200 / RYS-500)
- Teaching trainer credentials (E-RYT-500 minimum)
- Reviews from past graduates (look on Verified Thai + Reddit)
- Clear schedule — avoid programs with vague "free time" gaps

**Visa**: Most 200-hr programs fit within 30-day visa-free entry. For 500-hr, you may need to extend or get Tourist Visa.`,
    related: ["yoga-retreat-thailand-cost", "best-yoga-retreats-chiang-mai"],
  },

  // ─── Wellness comparison ──────────────────────────────────────────────
  {
    slug: "kamalaya-vs-chiva-som",
    topic: "wellness",
    question: "Kamalaya vs Chiva-Som — which luxury wellness retreat is better?",
    shortAnswer:
      "Chiva-Som (Hua Hin) is the older, more medical/clinical option — best for serious health resets. Kamalaya (Koh Samui) is more holistic and Asian-influenced — best for emotional/spiritual wellness. Both are $700–$1,500/night.",
    longAnswer: `Both are at the top of Thailand's wellness retreat hierarchy, but they serve different intents.

**Chiva-Som** (Hua Hin, 3 hrs south of Bangkok):
- Founded 1995 — Thailand's wellness pioneer
- Style: medical-spa, evidence-based, clinical
- 19-acre beachfront property, 54 rooms (intimate)
- Programs: detox, weight management, fitness, sleep enhancement, health screening
- Best for: structured medical wellness, post-illness recovery, executive resets
- Price: $800–$1,800/night all-inclusive
- Korean travelers: well-served, multilingual concierge

**Kamalaya** (Koh Samui, southwest coast):
- Founded 2005 — designed around a hillside monk's cave (yoga heritage site)
- Style: holistic, Asian healing traditions, emotional/spiritual focus
- Beachfront jungle property, 76 rooms
- Programs: yoga therapy, ayurveda, emotional balance, sleep, traditional Chinese medicine
- Best for: emotional recovery, longevity, sleep issues, burnout
- Price: $700–$1,500/night all-inclusive
- Strong Korean / Japanese clientele, multilingual

**Key differences**:
- Chiva-Som: more lab tests, body composition, IV therapy, medical practitioners
- Kamalaya: more meditation, energy work, traditional healing, naturopathy
- Chiva-Som: structured 5–7 day programs
- Kamalaya: flexible 3–14 night stays

**Alternative tier** (similar quality, ~$300–$700/night):
- **Six Senses Yao Noi** — beach luxury, light wellness
- **The Sanctuary Thailand** (Koh Phangan) — affordable wellness retreat
- **Absolute Sanctuary** (Koh Samui) — budget-luxury, yoga-focused

**Booking tip**: Both have 20–30% off-peak rates April–October. Book direct via their websites — discounts are better than via Klook/Agoda.`,
    related: ["best-wellness-retreats-thailand", "detox-thailand-cost"],
  },
  {
    slug: "silent-meditation-retreat-thailand-beginner",
    topic: "wellness",
    question: "Is silent meditation retreat in Thailand suitable for beginners?",
    shortAnswer:
      "Yes — Wat Suan Mokkh (Chaiya, monthly 10-day retreats) and Wat Pah Nanachat (Ubon) accept absolute beginners. Free or donation-based. The first 2 days are hard; most beginners adapt by day 4.",
    longAnswer: `Thailand has a 2,500-year Buddhist meditation tradition, and several monasteries run structured silent retreats specifically designed for foreigners with zero experience.

**Wat Suan Mokkh International Hermitage** (Chaiya, Surat Thani):
- 10-day retreats first 10 days of each month
- ฿2,000 donation for entire stay (very low)
- Anapanasati (mindfulness of breathing) tradition
- 4 AM wake, vegetarian, 4 hours formal meditation/day
- Accepts ~100 students per retreat — book online 1–2 months ahead
- English-speaking teachers, very accommodating to beginners
- ⚠️ Hard physical schedule, but mentally accessible

**Wat Pah Nanachat** (Ubon Ratchathani):
- Thai Forest Tradition (Ajahn Chah lineage)
- More austere — guests follow monastic schedule strictly
- 1–3 days possible for guests; longer requires more commitment
- Free/donation-based

**Dipabhavan Meditation Centre** (Koh Samui):
- 7-day retreats monthly
- ฿9,000 donation
- More structured for beginners than Wat Suan Mokkh
- Gentler intro to Vipassana

**Vipassana 10-Day Course** (Goenka tradition):
- Free, donation-based, locations near Bangkok and Chiang Mai
- Most intense — 10 hours/day meditation
- Strict noble silence
- Book 6+ months ahead — extremely popular globally

**What to expect on day 1–3**:
- Mind feels like a hyperactive monkey
- Boredom, restlessness, self-doubt
- This is normal — instructors are unfazed
- By day 4–5, most beginners hit a calmer rhythm

**Important**: Silent retreat is mentally demanding. If you have untreated trauma or severe anxiety, consult a therapist first. These centers do not provide mental health support beyond meditation instruction.`,
    related: ["meditation-retreat-thailand", "best-wellness-retreats-thailand"],
  },

  // ─── Cooking deep dive ────────────────────────────────────────────────
  {
    slug: "half-day-vs-full-day-thai-cooking",
    topic: "cooking",
    question: "Half-day vs full-day Thai cooking class — what's the difference?",
    shortAnswer:
      "Half-day (3–4 hrs, ฿800–฿1,500): 3 dishes, often no market visit, ideal for one-time tourists. Full-day (6–8 hrs, ฿1,500–฿2,800): 5–7 dishes, includes market tour, recipe book, sit-down meals. Worth the upgrade for serious learners.",
    longAnswer: `Both formats exist at most major cooking schools (Time for Thai, Sompong, Silom Thai Cooking, etc.).

**Half-day (morning or evening, 3–4 hours)**:
- 3 dishes typical: 1 curry, 1 stir-fry, 1 dessert
- Often skips the market visit
- ฿800–฿1,500 per person
- Group size: 8–12 people
- Best for: travelers on tight schedule, complete beginners

**Full-day (8 AM – 4 PM typical)**:
- 5–7 dishes: 2 curries, 1–2 stir-fries, 1 soup, 1 salad, 1 dessert
- Market visit included (60–90 min) — learn ingredients first-hand
- Recipe booklet to take home
- ฿1,500–฿2,800 per person
- Group size: 6–10 people
- Includes lunch (your own cooking)
- Best for: foodies, returning cooks, serious learners

**Multi-day courses** (Chiang Mai specialty):
- 3-day intensive: ฿4,500–฿7,500
- Different cuisine each day: northern, southern, central Thai
- Hands-on with cleaver work, curry paste from scratch
- Best for: chefs, restaurant owners, slow travelers

**Top schools**:
- **Bangkok**: Silom Thai Cooking School, Time for Thai, Sompong, Cooking with Poo
- **Chiang Mai**: Thai Farm Cooking School, Asia Scenic, Smile Thai
- **Phuket**: Pum Thai, Phuket Thai Cookery School

**Beginner tip**: Pick a school with English-speaking chefs. Larger classes (12+) feel rushed; small classes (4–6) let you ask questions.

**Skip these**: Hotel-based cooking classes — overpriced, often 1 chef cooks for you (you barely cook).`,
    related: ["thai-cooking-class-price", "best-cooking-class-chiang-mai"],
  },

  // ─── Spa deep dive ────────────────────────────────────────────────────
  {
    slug: "thai-oil-massage-vs-aromatherapy",
    topic: "spa",
    question: "Thai oil massage vs aromatherapy — what's the difference?",
    shortAnswer:
      "Thai oil massage uses neutral massage oil + Western Swedish-style strokes — therapeutic and relaxing. Aromatherapy uses scented essential oils (lavender, jasmine) with gentler strokes — purely relaxing. Aromatherapy costs 30–50% more.",
    longAnswer: `Both are oil-based and use a massage table (different from traditional Thai massage which is dry, on a mat).

**Thai oil massage (น้ำมัน) ฿700–฿1,200/hour**:
- Standard coconut/sesame oil base
- Combines Swedish-style long strokes with Thai pressure techniques
- Therapeutic — addresses tight muscles, knots, fatigue
- Most common massage at mid-tier spas
- Good for: post-workout recovery, jet lag, regular muscle tension

**Aromatherapy massage (น้ำมันหอมระเหย) ฿900–฿1,800/hour**:
- Scented essential oils — lavender (relaxation), jasmine (mood), peppermint (energy)
- Gentler strokes — focus on relaxation over therapy
- Often includes mini-facial or hot stone elements
- Most common at upscale spas
- Good for: stress relief, sleep, sensory experience

**Traditional Thai massage (นวดแผนไทย) ฿300–฿600/hour**:
- DRY — no oil, fully clothed
- Pressure point + stretching on a floor mat
- Therapeutic — more like assisted yoga
- Good for: stiffness, joint mobility, deep tissue work

**Foot massage (นวดเท้า) ฿250–฿450/hour**:
- Reflexology + lower leg work
- Often on shared loungers
- Good first-day-jetlag pick

**Hot stone massage ฿1,200–฿2,500/hour**:
- Heated basalt stones along spine + meridians
- Deep relaxation, good for cold-shouldered people

**Choosing**:
- First-time tourist: traditional Thai or foot massage
- Sore from training: oil massage
- Sensory escape: aromatherapy or hot stone
- Date / romantic: aromatherapy couples package

**Avoid**: places offering ฿199 massage in tourist zones (Khao San, Sukhumvit beer bar streets) — quality and hygiene unverified.`,
    related: ["thai-massage-price", "thai-massage-vs-oil-massage"],
  },

  // ─── Coworking deep dive ──────────────────────────────────────────────
  {
    slug: "coworking-day-pass-thailand",
    topic: "coworking",
    question: "How much is a coworking day pass in Thailand?",
    shortAnswer:
      "Day passes range from ฿250–฿450 at independent cafes, ฿500–฿900 at dedicated coworking spaces, and ฿1,200–฿2,500 at premium business clubs. Many cafes offer informal 'buy a coffee + free wifi' coworking.",
    longAnswer: `Thailand has 3 tiers of coworking depending on amenities and atmosphere.

**Cafe coworking (informal) ฿100–฿300/day**:
- Buy a coffee (฿80–฿150) and stay 3–4 hours
- Common in Chiang Mai (Nimman district), Bangkok (Ari, Ekkamai)
- Pros: cheap, atmosphere, food
- Cons: noisy, no dedicated workstation, limited outlets, weak wifi sometimes

**Dedicated coworking ฿500–฿900/day** (or ฿4,000–฿8,000/month):
- Examples: HUBBA (Bangkok), CAMP (Chiang Mai), AltSpace (Phuket)
- High-speed wifi, ergonomic chairs, meeting rooms, phone booths
- Includes coffee, tea, sometimes lunch
- Community of nomads/freelancers
- Best for: digital nomads, video calls, full work-day productivity

**Premium business clubs ฿1,200–฿2,500/day** (or ฿15,000–฿30,000/month):
- Examples: The Great Room, Common Ground, JustCo
- Suit-tier amenities: barista, gym, lockers, after-hours events
- Often in CBD towers (Asoke, Siam, Sathorn)
- Best for: business meetings, client visits, executive workspace

**Best digital nomad coworking**:
- **Chiang Mai**: CAMP (Maya Mall), Punspace (multiple locations), Hub53
- **Bangkok**: HUBBA Thonglor, The Hive Phrom Phong, Garage Society
- **Phuket**: AltSpace Phuket, The Project
- **Koh Phangan**: Beachub, Beachhouse (slower vibe, jungle wifi)

**Monthly nomad budget combos**:
- ฿4,500–฿8,000/month dedicated desk + condo (฿15,000) + food (฿15,000) = ~฿35,000–฿40,000/month nomad lifestyle
- Total: ~$1,100–$1,300 USD/month for full digital nomad setup

**Wifi caveat**: Always test wifi before committing to monthly plans. Even premium spaces sometimes have outage days during Thai storm season.`,
    related: ["best-coworking-bangkok", "best-coworking-chiang-mai", "coworking-bangkok-vs-chiang-mai"],
  },

  // ─── How to book / process ────────────────────────────────────────────
  {
    slug: "do-i-need-to-book-thailand-wellness-advance",
    topic: "general",
    question: "Do I need to book Thailand wellness activities in advance?",
    shortAnswer:
      "It depends. Walk-in friendly: spa, foot massage, cooking class. Book ahead: yoga retreats (1+ month), Muay Thai camps (2 weeks), liveaboards (3+ months in high season), Kamalaya/Chiva-Som (3+ months).",
    longAnswer: `Booking lead times by activity:

**Walk-in / same day OK** (low risk):
- Spa, massage, foot reflexology (Bangkok abundance)
- Thai cooking class (most have daily morning + afternoon sessions)
- Drop-in yoga at urban studios
- Drop-in Muay Thai single sessions
- Single-day dive trips (Koh Tao, Koh Samui)

**Book 1–7 days ahead** (preferred):
- Half-day cooking class with market tour (popular slots fill)
- Premium spa treatments (massage suites, package deals)
- Pad work / private Muay Thai sessions
- Open Water diving course (4-day commitment)

**Book 2–4 weeks ahead**:
- Muay Thai camps with included accommodation
- Yoga retreats (mid-tier 3–7 day)
- Liveaboards in shoulder season
- Cooking class chains' Saturday/Sunday slots

**Book 1–3 months ahead**:
- High-end yoga teacher training (200-hour programs)
- Premium yoga retreats (Samahita, Vikasa, Wonderland peak weeks)
- Similan/Hin Daeng liveaboards in high season
- December–February anything (peak tourist season)

**Book 3–6 months ahead**:
- Kamalaya, Chiva-Som, Six Senses (limited rooms)
- Vipassana 10-day silent retreats (very popular globally)
- Songkran (April 13–15) and New Year week — everything books out

**Booking channels**:
- Directly with venue (best price, direct relationship — Verified Thai surfaces these contacts)
- Klook / Viator (convenient, +10–15% markup)
- Hotel concierge (often overpriced 30–50%)

**Cancellation policies**: Most Thai wellness venues allow free cancellation 7–14 days out. Liveaboards and premium retreats may require 30+ days notice.`,
    related: ["thailand-wellness-trip-daily-budget"],
  },
];

export function getFaq(slug: string): Faq | undefined {
  return FAQS.find((f) => f.slug === slug);
}

export function listFaqs(): Faq[] {
  return FAQS;
}
