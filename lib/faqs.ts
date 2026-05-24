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
];

export function getFaq(slug: string): Faq | undefined {
  return FAQS.find((f) => f.slug === slug);
}

export function listFaqs(): Faq[] {
  return FAQS;
}
