import Image from "next/image";
import type { JournalPost } from "@/types";

export const JOURNAL_POSTS: JournalPost[] = [
  {
    id: 1,
    slug: "summerland-california-underrated-beach-town",
    title: "Summerland: California’s Most Underrated Beach Town (And Why You’ll Fall in Love With It)",
    category: "Local Guide",
    date: "Dec 1, 2025",
    image: "/blog/summerland/thumbnail.jpg",
    excerpt:
      "Tucked between Montecito and Carpinteria, Summerland is a sun-soaked pocket of California where ocean air settles the soul and local still means something.",
    content: (
      <>
        <p className="mb-6">
          Tucked between Montecito’s quiet luxury and Carpinteria’s laid-back charm, Summerland is one of the Central Coast’s best-kept secrets — a breezy, sun-soaked pocket of California where time slows, ocean air settles the soul, and “local” still means something.
        </p>
        <p className="mb-6">
          With fewer crowds, more authenticity, and a coastline that still feels sacred, Summerland is spontaneous and intentional all at once. If you’ve been craving the classic California beach town that hasn’t sold its soul to tourism, this is it.
        </p>
        <p className="mb-6">Here’s how to experience Summerland the way the locals do.</p>

        <h3 className="text-xl font-serif mb-4">🌊 The Magic Starts With the Coastline</h3>
        <p className="mb-4">
          Summerland’s charm begins at the beach — wide, sandy, peaceful, and often blissfully empty even in peak season. Lookout Park, perched above the shoreline, is the perfect start to any morning: gentle waves, Channel Islands views, and dogs chasing tennis balls through the surf.
        </p>
        <p className="mb-4">Walk down the steps to the shoreline and you’ll find:</p>
        <ul className="list-disc pl-6 space-y-2 mb-6 text-stone-600">
          <li>Tide pools at low tide</li>
          <li>Plenty of space for beach picnics or yoga</li>
          <li>Soft, wade-friendly surf</li>
          <li>Sunset walks that feel like a private show</li>
        </ul>
        <p className="mb-6">Stay long enough and you may even spot dolphins cruising by.</p>

        <figure className="mb-8 rounded-3xl overflow-hidden shadow-lg">
          <Image
            src="/blog/summerland/summerland-beach-view.jpg"
            alt="Golden hour over Summerland Beach"
            width={1600}
            height={1000}
            className="w-full h-auto object-cover"
            priority
          />
          <figcaption className="text-xs uppercase tracking-[0.3em] text-stone-500 bg-white/80 px-4 py-3">
            Lookout Park at golden hour
          </figcaption>
        </figure>

        <h3 className="text-xl font-serif mb-4">🍽️ Small Town, Big Flavor</h3>
        <p className="mb-4">Summerland might be tiny, but the food scene is stacked.</p>
        <p className="mb-4">
          <strong>Summerland Beach Café</strong> — Classic California breakfast under the palms. Order the lemon-raspberry pancakes, fresh-squeezed OJ, and soak up the dog-friendly patio vibes.
        </p>
        <p className="mb-4">
          <strong>Field + Fort</strong> — Part design store, part café, entirely enchanting. Their toast boards, matcha lattes, and pottery-lined courtyard feel straight out of a lifestyle magazine.
        </p>
        <p className="mb-6">
          <strong>Tinker’s Burgers</strong> — Old-school, coastal-roadside Americana. Grab a cheeseburger and milkshake for a nostalgic lunch before strolling down Lillie Ave.
        </p>
        <p className="mb-6">
          Craving upscale dining? Montecito’s Coast Village Road is just three minutes away with sushi, wood-fired Italian, and cocktails poured beside the ocean.
        </p>

        <figure className="mb-8 rounded-3xl overflow-hidden shadow-lg">
          <Image
            src="/blog/summerland/fresh-locally-sourced.jpg"
            alt="Field + Fort courtyard with breakfast boards"
            width={1600}
            height={1000}
            className="w-full h-auto object-cover"
          />
          <figcaption className="text-xs uppercase tracking-[0.3em] text-stone-500 bg-white/80 px-4 py-3">
            Breakfast at Field + Fort
          </figcaption>
        </figure>

        <h3 className="text-xl font-serif mb-4">🛍️ Boutiques, Antiques & Hidden Finds</h3>
        <p className="mb-4">Summerland is a treasure trove for curated shops:</p>
        <ul className="list-disc pl-6 space-y-2 mb-6 text-stone-600">
          <li>The Well – spiritual home goods, candles, and artisan gifts</li>
          <li>Botanica – coastal home décor with a collected feel</li>
          <li>Garde – minimalist luxury design</li>
          <li>Summerland Antique Collective – endless vintage finds</li>
        </ul>
        <p className="mb-6">There’s even a wine-tasting room in town, because of course there is.</p>

        <figure className="mb-8 rounded-3xl overflow-hidden shadow-lg">
          <Image
            src="/blog/summerland/solitude-in-summerland.jpg"
            alt="Sunlit boutique storefronts along Lillie Avenue"
            width={1600}
            height={1000}
            className="w-full h-auto object-cover"
          />
          <figcaption className="text-xs uppercase tracking-[0.3em] text-stone-500 bg-white/80 px-4 py-3">
            Boutiques along Lillie Ave
          </figcaption>
        </figure>

        <h3 className="text-xl font-serif mb-4">🧘‍♀️ A Slower, Softer Pace</h3>
        <p className="mb-6">
          Wake up early. Walk along the cliffside. Browse the boutiques. Sip coffee. Spend the afternoon with your toes in the sand. Watch the sun melt behind the mountains. Light the fire pit. Open a bottle of local Chardonnay. Life doesn’t need to be more complicated than that.
        </p>

        <h3 className="text-xl font-serif mb-4">🏡 Why Summerland Loves Bunks</h3>
        <p className="mb-4">Summerland pairs beautifully with Bunks’ philosophy:</p>
        <ul className="list-disc pl-6 space-y-2 mb-6 text-stone-600">
          <li>Peaceful, elevated guest experiences</li>
          <li>Walkable access to beach, shops, and coffee</li>
          <li>Design-driven spaces made for lingering</li>
          <li>Relaxed luxury without pretension</li>
          <li>Perfect for couples, families, or anyone craving calm</li>
        </ul>
        <p className="mb-6">Every stay here feels like a reset — and people return year after year because it stays wonderfully unchanged.</p>

        <h3 className="text-xl font-serif mb-4">✨ Ready to stay in Summerland?</h3>
        <p>
          Explore our Summerland properties and discover the coastal hideaway locals would love to keep for themselves.
        </p>
      </>
    ),
  },
  {
    id: 2,
    slug: "steamboat-springs-year-round-adventure",
    title: "Steamboat Springs: A Year-Round Adventure Town With a Heart of Gold",
    category: "Mountain Guide",
    date: "Dec 1, 2025",
    image: "/blog/steamboat/thumbnail.jpg",
    excerpt:
      "Beyond champagne powder® and Olympians, Steamboat is a soulful, year-round community where wild beauty meets small-town warmth.",
    content: (
      <>
        <p className="mb-6">
          Steamboat Springs has a funny way of surprising people. Most know it as a legendary ski town — home to champagne powder®, Olympians, and a mountain that feels alive with energy. What many don’t realize is that Steamboat is also one of the most welcoming, soulful, year-round communities in Colorado.
        </p>
        <p className="mb-6">
          Whether you’re visiting for winter thrills, summer sunshine, or a restorative mountain escape, Steamboat delivers the perfect blend of wild beauty, small-town warmth, and unforgettable experiences.
        </p>

        <h3 className="text-xl font-serif mb-4">🏔️ Winter: The Stuff of Legend</h3>
        <p className="mb-4">
          Steamboat is home to some of the lightest, driest powder in North America — the kind that makes you laugh into your neck gaiter because it’s so soft.
        </p>
        <ul className="list-disc pl-6 space-y-2 mb-6 text-stone-600">
          <li>World-famous champagne powder®</li>
          <li>Massive terrain for every level</li>
          <li>The iconic trees of Shadows & Closets</li>
          <li>Night skiing under the lights</li>
          <li>A ski village buzzing with music, mulled wine, and energy</li>
        </ul>
        <p className="mb-6">
          Add in snowshoeing, Nordic trails, fat biking, and snowmobile tours, and winter here feels endless in the best possible way.
        </p>

        <figure className="mb-8 rounded-3xl overflow-hidden shadow-lg">
          <Image
            src="/blog/steamboat/photo0jpg.jpg"
            alt="Skier floating through Steamboat champagne powder"
            width={1600}
            height={1000}
            className="w-full h-auto object-cover"
          />
          <figcaption className="text-xs uppercase tracking-[0.3em] text-stone-500 bg-white/80 px-4 py-3">
            Champagne powder mornings
          </figcaption>
        </figure>

        <h3 className="text-xl font-serif mb-4">🌄 Summer: Colorado at Its Purest</h3>
        <p className="mb-4">Locals say “you come for the winter, but stay for the summer.” Here’s why:</p>
        <ul className="list-disc pl-6 space-y-2 mb-6 text-stone-600">
          <li>Paddle the Yampa River as it winds through town</li>
          <li>Hike Fish Creek Falls and feel the spray on your face</li>
          <li>Float through wildflower meadows on horseback</li>
          <li>Bike miles of singletrack before sunset</li>
          <li>Listen to live music downtown and catch alpenglow skies</li>
        </ul>
        <p className="mb-6">
          Warm days, crisp nights, and a festival calendar packed with farmer’s markets, art fairs, and rodeo nights make summer feel golden.
        </p>

        <h3 className="text-xl font-serif mb-4">💦 Hot Springs: Steamboat’s Soul</h3>
        <p className="mb-6">
          Steamboat is defined by its mineral springs — a natural phenomenon that’s part of its history and its healing charm.
        </p>
        <p className="mb-4">
          <strong>Old Town Hot Springs</strong> — Family-friendly, central, and easy to slip into between ski laps or shopping downtown.
        </p>
        <p className="mb-6">
          <strong>Strawberry Park Hot Springs</strong> — Remote, rustic, silent, and downright magical. A moonlit soak in winter is unforgettable; just check the road report because 4WD is often required.
        </p>

        <figure className="mb-8 rounded-3xl overflow-hidden shadow-lg">
          <Image
            src="/blog/steamboat/strawberry-park-hot-springs.jpg"
            alt="Steam rising from Strawberry Park Hot Springs"
            width={1600}
            height={1000}
            className="w-full h-auto object-cover"
          />
          <figcaption className="text-xs uppercase tracking-[0.3em] text-stone-500 bg-white/80 px-4 py-3">
            Strawberry Park Hot Springs
          </figcaption>
        </figure>

        <h3 className="text-xl font-serif mb-4">🍽️ Where to Eat & Drink</h3>
        <p className="mb-4">Steamboat’s dining scene is deceptively good for a mountain town:</p>
        <ul className="list-disc pl-6 space-y-2 mb-6 text-stone-600">
          <li><strong>Aurum Food & Wine</strong> — Elevated dining on the river.</li>
          <li><strong>Mambo Italiano</strong> — Handmade pasta and local wines.</li>
          <li><strong>Winona’s</strong> — Breakfast institution with cinnamon rolls the size of your head.</li>
          <li><strong>Mountain Tap Brewery</strong> — Wood-fired pizza, fresh beer, perfect après energy.</li>
        </ul>
        <p className="mb-6">Whether you crave craft beer, casual BBQ, or fine dining, you’ll find something genuinely excellent.</p>

        <figure className="mb-8 rounded-3xl overflow-hidden shadow-lg">
          <Image
            src="/blog/steamboat/fish-creek-falls.jpg"
            alt="Hiker overlooking Fish Creek Falls"
            width={1600}
            height={1000}
            className="w-full h-auto object-cover"
          />
          <figcaption className="text-xs uppercase tracking-[0.3em] text-stone-500 bg-white/80 px-4 py-3">
            Summer light at Fish Creek Falls
          </figcaption>
        </figure>

        <h3 className="text-xl font-serif mb-4">🚶‍♀️ A Town That Welcomes You In</h3>
        <p className="mb-6">
          What sets Steamboat apart from other destinations? Its people. Friendly, unpretentious, and community-driven, Steamboat feels like a place where everyone is genuinely happy to see you. It’s not just a resort town — it’s a town with a resort.
        </p>

        <h3 className="text-xl font-serif mb-4">🏡 Why Steamboat Fits Bunks</h3>
        <p className="mb-4">Steamboat embodies everything we love:</p>
        <ul className="list-disc pl-6 space-y-2 mb-6 text-stone-600">
          <li>Elevated stays without fuss</li>
          <li>Room to relax after big days outdoors</li>
          <li>High-quality homes that feel personal and warm</li>
          <li>Access to curated, local experiences</li>
          <li>A place guests want to return to every year</li>
        </ul>

        <h3 className="text-xl font-serif mb-4">✨ Planning a Trip?</h3>
        <p>
          Book a stay with Bunks and unlock the best of this mountain town — from hot springs to hidden trails to the comforts of home.
        </p>
      </>
    ),
  },
  {
    id: 3,
    slug: "designing-spaces",
    title: "Designing Spaces That Feel Like Home",
    category: "Design",
    date: "Sep 20, 2025",
    image: "/steamboat-pictures/living-room/living-room-2.jpg",
    excerpt:
      "Inside our approach to bedding, kitchens, and lighting so every Bunks stay feels effortless, familiar, and deeply comfortable.",
    content: (
      <>
        <p className="mb-6">
          At Bunks, we believe great design isn’t about extravagance — it’s about feeling. The feeling of walking into a space and instantly relaxing. The feeling of knowing where everything lives without looking. The feeling of a home that embraces you, even if you’ve never stayed there before.
        </p>
        <p className="mb-6">
          Creating that experience doesn’t happen by accident. Here’s how we curate every detail so our properties feel warm, intuitive, and lived-in — without losing their sense of polish or hospitality.
        </p>

        <h3 className="text-xl font-serif mb-4">🛏️ Bedding That Actually Matters</h3>
        <p className="mb-6">
          We spend a third of our lives sleeping, so bedding is a top priority. Every bedroom follows the same principles:
        </p>
        <ol className="list-decimal pl-6 space-y-3 mb-6 text-stone-600">
          <li>
            <strong>High-quality natural fibers.</strong> Breathable cottons, washed linens, and down-alternative duvets prevent overheating and feel soft from day one.
          </li>
          <li>
            <strong>Layering for comfort.</strong> Blanket stacks, extra throws, and optional firmness pillows let every guest tailor their sleep experience.
          </li>
          <li>
            <strong>Consistency across homes.</strong> Whether you’re in Summerland or Steamboat, the “Bunks bed” always feels familiar.
          </li>
        </ol>
        <p className="mb-6">The result? Sleep that hits the reset button every single night.</p>

        <figure className="mb-8 rounded-3xl overflow-hidden shadow-lg">
          <Image
            src="/steamboat-pictures/bedroom-1/bedroom-1.jpg"
            alt="Neutral layered bedding inside a Bunks primary suite"
            width={1600}
            height={1000}
            className="w-full h-auto object-cover"
          />
          <figcaption className="text-xs uppercase tracking-[0.3em] text-stone-500 bg-white/80 px-4 py-3">
            Layered textures in Steamboat
          </figcaption>
        </figure>

        <h3 className="text-xl font-serif mb-4">🍳 Kitchens Designed for Real Cooking</h3>
        <p className="mb-6">
          You should never arrive somewhere beautiful and learn the kitchen can’t handle breakfast-for-two or dinner-for-six. So we obsess over:
        </p>
        <ul className="list-disc pl-6 space-y-2 mb-6 text-stone-600">
          <li>Sharp knives (actually sharp)</li>
          <li>Multiple cutting boards</li>
          <li>At least one coffee grinder plus multiple brew methods</li>
          <li>Full cookware sets — not the mismatched short-term rental grab bag</li>
          <li>Oils, spices, and pantry basics for spontaneous cooking</li>
          <li>Real glassware and table settings for hosting</li>
        </ul>
        <p className="mb-6">
          Whether you’re whipping up pancakes or hosting a slow, wine-filled evening, our kitchens are built for real life — not just photos.
        </p>

        <figure className="mb-8 rounded-3xl overflow-hidden shadow-lg">
          <Image
            src="/steamboat-pictures/kitchen/kitchen-2.jpg"
            alt="Bright kitchen with open shelving and curated cookware"
            width={1600}
            height={1000}
            className="w-full h-auto object-cover"
          />
          <figcaption className="text-xs uppercase tracking-[0.3em] text-stone-500 bg-white/80 px-4 py-3">
            Kitchens ready for real meals
          </figcaption>
        </figure>

        <h3 className="text-xl font-serif mb-4">💡 Lighting That Feels Like a Mood</h3>
        <p className="mb-6">
          Lighting is one of the most overlooked parts of a rental — and one of the most important. Our rule is simple: no overhead glare. Ever. Every Bunks home includes:
        </p>
        <ul className="list-disc pl-6 space-y-2 mb-6 text-stone-600">
          <li>Dimmable soft lighting</li>
          <li>Warm-toned bulbs (never harsh daylight LEDs)</li>
          <li>Layered light sources: sconces, bedside lamps, accent lights</li>
          <li>Thoughtful pathways for nighttime movement</li>
        </ul>
        <p className="mb-6">It’s subtle, but it transforms the way a space feels — calm mornings, cozy evenings, effortless transitions.</p>

        <figure className="mb-8 rounded-3xl overflow-hidden shadow-lg">
          <Image
            src="/steamboat-pictures/living-room/living-room-4.jpg"
            alt="Living room vignette with layered lighting"
            width={1600}
            height={1000}
            className="w-full h-auto object-cover"
          />
          <figcaption className="text-xs uppercase tracking-[0.3em] text-stone-500 bg-white/80 px-4 py-3">
            Layered lighting, layered comfort
          </figcaption>
        </figure>

        <h3 className="text-xl font-serif mb-4">🧩 Why It All Matters</h3>
        <p>
          A well-designed space doesn’t call attention to itself. It simply works. It lets you breathe, makes your stay smoother, and sends you home feeling restored. That’s what “feels like home” means to us — and why design is a core part of the Bunks experience, not a decorative extra.
        </p>
      </>
    ),
  },
  {
    id: 4,
    slug: "booking-direct",
    title: "Booking Direct: Why It's Better",
    category: "Travel Tips",
    date: "Aug 15, 2025",
    image: "/steamboat-pictures/exterior/exterior-2.jpg",
    excerpt:
      "Skip the platform fees, unlock better communication, and get VIP treatment when you reserve your stay directly with Bunks.",
    content: (
      <>
        <p className="mb-6">
          The short-term rental world can be confusing. Every platform claims to offer the best prices and the best experience, but here’s the truth: direct booking is almost always better — for both guests and hosts. Bunks was built around this principle. Here’s why.
        </p>

        <h3 className="text-xl font-serif mb-4">💸 1. Lower Prices for Guests</h3>
        <p className="mb-6">
          When you book through big platforms, you’re often paying 12–20% service fees, hidden marketplace charges, and elevated nightly rates to offset host fees. Book directly and skip all of it: you pay less, hosts earn more, everyone wins.
        </p>

        <h3 className="text-xl font-serif mb-4">🏡 2. Better Stays Through Direct Communication</h3>
        <p className="mb-6">
          Direct booking means no middleman, no delayed messages, and no automated service robots. Need an early check-in? Want local advice? You’ll reach someone who actually knows the home.
        </p>

        <h3 className="text-xl font-serif mb-4">⭐ 3. Returning Guests Get Priority</h3>
        <p className="mb-6">
          Direct bookers are our VIPs. Think early access to peak dates, returning-guest discounts, complimentary upgrades when available, priority support, and first dibs on new properties — perks platforms can’t offer.
        </p>

        <h3 className="text-xl font-serif mb-4">🔍 4. Transparent Pricing</h3>
        <p className="mb-6">
          No hidden add-ons. No surprise fees. What you see is what you pay — ideal for longer stays, peak trips, family getaways, or group travel that needs clarity upfront.
        </p>

        <h3 className="text-xl font-serif mb-4">🤝 5. Direct Booking Supports Hosts</h3>
        <p className="mb-6">
          When hosts receive a fair payout, they invest more in the homes, amp up amenities, and offer real loyalty perks. Direct booking strengthens the entire ecosystem and lets us focus on hospitality, not algorithms.
        </p>

        <h3 className="text-xl font-serif mb-4">✨ The Bunks Promise</h3>
        <p>
          We believe in a better, more human booking experience — direct, transparent, secure, and personal. It’s why we reward every guest who books with us directly, and why the best version of Bunks will always live right here, not on a third-party platform.
        </p>
      </>
    ),
  },
  {
    id: 5,
    slug: "spring-santa-barbara",
    title: "Spring in Santa Barbara",
    category: "Local Guide",
    date: "Mar 10, 2025",
    image: "/2211-lillie-ave/hero.jpg",
    excerpt:
      "Gardens in bloom, coastal bluffs glowing, wineries waking up — spring is the locals’ favorite time on the American Riviera.",
    content: (
      <>
        <p className="mb-6">
          Most people picture Santa Barbara in summer — golden beaches, warm evenings, endless sunshine. But locals know the truth: spring is the secret season. From March through May, wildflowers burst across the hillsides, vineyards wake from winter, and the air warms just enough for long coastal walks without the crowds.
        </p>
        <p className="mb-6">If you’ve never experienced Santa Barbara in spring, here’s why it should be your next getaway.</p>

        <h3 className="text-xl font-serif mb-4">🌺 The Gardens Come Alive</h3>
        <p className="mb-4">Spring is when the region’s gardens reach their peak:</p>
        <ul className="space-y-3 mb-6 text-stone-600">
          <li>
            <strong>Santa Barbara Botanic Garden</strong> — Native wildflowers lining oak-shaded trails. Lupine, poppies, ceanothus — California at its purest.
          </li>
          <li>
            <strong>Lotusland</strong> — A world-class garden in Montecito (reservations only). Succulents glow in soft light, cycads wake up, roses open for the season.
          </li>
          <li>
            <strong>Mission Rose Garden</strong> — A carpet of color in front of the Old Mission. Bring a blanket and soak up the views.
          </li>
        </ul>

        <figure className="mb-8 rounded-3xl overflow-hidden shadow-lg">
          <Image
            src="/blog/spring/sb-garden-terrace.jpg"
            alt="Mediterranean-style terrace garden overlooking the Santa Barbara hills"
            width={1600}
            height={1000}
            className="w-full h-auto object-cover"
          />
          <figcaption className="text-xs uppercase tracking-[0.3em] text-stone-500 bg-white/80 px-4 py-3">
            Spring light over Santa Barbara gardens
          </figcaption>
        </figure>

        <h3 className="text-xl font-serif mb-4">🍷 Spring Is Wine Country at Its Best</h3>
        <p className="mb-6">
          Cool breezes, mild temps, budding vines. The Santa Ynez Valley and Summerland tasting rooms feel fresh and unhurried. We love Summerland Winery, Folded Hills, Sunstone, Sanford, and Bridlewood for spring rosés and patio tastings without the peak-season crunch.
        </p>

        <h3 className="text-xl font-serif mb-4">🌤️ Perfect Weather for Bluff Walks</h3>
        <p className="mb-4">
          Spring mornings on the Santa Barbara bluffs feel magical: soft coastal light, crisp ocean air, bright green hills after winter rains, and wildflowers along the path. Try these favorites:
        </p>
        <ul className="list-disc pl-6 space-y-2 mb-6 text-stone-600">
          <li>Douglas Family Preserve</li>
          <li>Ellwood Bluffs</li>
          <li>Butterfly Beach walkway</li>
          <li>Summerland Beach + Lookout Park loop</li>
        </ul>
        <p className="mb-6">Stay alert — spring is prime dolphin migration season.</p>

        <figure className="mb-8 rounded-3xl overflow-hidden shadow-lg">
          <Image
            src="/blog/summerland/summerland-ramp.jpg"
            alt="Stair path down to Summerland Beach"
            width={1600}
            height={1000}
            className="w-full h-auto object-cover"
          />
          <figcaption className="text-xs uppercase tracking-[0.3em] text-stone-500 bg-white/80 px-4 py-3">
            Lookout Park trail to the sand
          </figcaption>
        </figure>

        <h3 className="text-xl font-serif mb-4">🍽️ Farmers Markets & Fresh Local Fare</h3>
        <p className="mb-6">
          Spring produce is unreal: strawberries, citrus, avocados, greens, snap peas, herbs, early stone fruit. You’ll taste it everywhere — Montecito brunch spots, Summerland beach picnics, fresh pasta downtown, wine country lunches on sunny patios.
        </p>

        <h3 className="text-xl font-serif mb-4">🌿 Why Spring Pairs Perfectly With a Bunks Stay</h3>
        <p className="mb-4">Spring is everything Bunks stands for:</p>
        <ul className="list-disc pl-6 space-y-2 mb-6 text-stone-600">
          <li>Calm, restorative mornings</li>
          <li>Long, unhurried afternoons outdoors</li>
          <li>Evening wine under soft coastal light</li>
          <li>Fresh, design-forward spaces to return to</li>
        </ul>
        <p>
          Whether you’re planning a romantic weekend, a family trip, or a solo reset, Santa Barbara in spring is the perfect escape.
        </p>
      </>
    ),
  },
];
