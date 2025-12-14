import type { Property } from "@/types";
import { STEAMBOAT_GUIDE } from "@/data/steamboatGuide";

export const PROPERTIES: Property[] = [
  {
    id: 2,
    slug: "summerland-ocean-view-beach-bungalow",
    name: "Summerland Ocean-View Beach Bungalow",
    location: "Summerland, California",
    address: "2211 Lillie Ave, Summerland, CA 93067",
    price: 325,
    guests: 6,
    bedrooms: 4,
    bathrooms: 3.5,
    rating: 4.88,
    reviews: 94,
    description:
      "Enjoy sweeping Pacific views from this sparkling 4-bed, 3.5-bath retreat just two blocks from downtown Summerland and a three-minute walk to the sand. Fresh interiors, sun decks, and furnished patios make it effortless to entertain between beach runs, wine tasting, or mountain adventures.",
    image: "/2211-lillie-ave/exterior/exterior-1.webp",
    images: [
      "/2211-lillie-ave/exterior/exterior-1.webp",
      "/2211-lillie-ave/exterior/exterior-3.webp",
      "/2211-lillie-ave/living-room/living-room-2.webp",
    ],
    features: [
      "Panoramic Ocean + Mountain Views",
      "Four King Suites",
      "Multiple Furnished Decks",
      "Private Hot Tub",
      "Pet Friendly",
      "4-Car Onsite Parking",
    ],
    heroTagline:
      "A multi-level, ocean-facing haven with four king suites, sun decks, and chic indoor/outdoor flow—moments from Summerland Beach.",
    highlights: [
      "Open-concept great room with walls of glass framing Pacific and Channel Island views",
      "Four king bedrooms including a detached cottage suite with private deck",
      "Multiple alfresco lounges, two dining patios, grill station, and propane fire pit",
      "Private hot tub plus 8 beach chairs, umbrellas, and gear for coastal days",
      "Smart lock access, dedicated workspace, and lightning-fast Wi-Fi for extended stays",
      "Walk to Field + Fort, Garde, and Summerland Beach or bike into Montecito",
    ],
    aboutSections: [
      {
        title: "Open-plan coastal living",
        body: [
          "Sunlit living room, dining area, and brand-new kitchen share one seamless level with folding doors that spill onto the main deck.",
          "Cool, clean lines meet beach-chic styling—think layered textures, curated art, and plush seating anchored by endless ocean views.",
        ],
      },
      {
        title: "Four king retreats",
        body: [
          "Primary suite features king bed with hotel linens, dual vanity bath, soaking tub, smart TV, and fire-pit terrace.",
          "Second and third suites each add king beds, ensuite baths, and direct patio access, while the detached cottage houses a fourth king bedroom with its own deck.",
        ],
      },
      {
        title: "Indoor/outdoor entertainment",
        body: [
          "Family room with smart TV and plush sectional anchors movie nights or game days.",
          "Outside you’ll find two alfresco dining tables (seating eight each), three umbrellas, lounges, and sofas plus grill and hot tub.",
        ],
      },
      {
        title: "Steps to Summerland",
        body: [
          "Walk out the lower gate to reach Summerland’s boutiques, coffee shops, and beach town dining in under five minutes.",
          "Bike or rideshare to Montecito, Rosewood Miramar, or the Santa Barbara Funk Zone for more food, wine, and shopping.",
        ],
      },
    ],
    sleepingArrangements: [
      {
        title: "Primary Suite",
        bedDetails: "King bed",
        description:
          "Top-floor retreat with smart TV, vaulted ceilings, ensuite with soaking tub + dual vanity, and private deck with propane fire pit.",
      },
      {
        title: "Second Suite",
        bedDetails: "King bed",
        description: "Spacious ensuite bedroom with patio access for morning coffee and ocean-gazing.",
      },
      {
        title: "Third Suite",
        bedDetails: "King bed",
        description: "Light-filled king bedroom with ensuite bath on the lower level near the family room.",
      },
      {
        title: "Detached Cottage",
        bedDetails: "King bed",
        description: "Separate guest casita with private deck, ocean views, and direct access via the lower garden gate.",
      },
    ],
    guestAccess: [
      "Guests have the entire multi-level home, detached cottage suite, furnished decks, patios, and gardens.",
      "Smart lock entry codes are provided before arrival; eight beach chairs, umbrellas, and gear are staged in the garage.",
      "Private hot tub, grill, fire pit, and multiple alfresco dining setups are exclusive to your group.",
    ],
    otherNotes: [
      "Hillside setting includes four interior/exterior stair runs—guests should be comfortable with stairs.",
      "Parking for up to four cars on-site; lower gate opens directly to Hardinge Ave for quick beach access.",
      "Close proximity to the 101 means you’ll occasionally hear freeway hum—white noise machines are provided.",
    ],
    photoGroups: [
      {
        title: "Exterior & Setting",
        description: "Multi-level hillside perch with layered decks, lush landscaping, and postcard Pacific vistas.",
        images: [
          "/2211-lillie-ave/exterior/exterior-1.webp",
          "/2211-lillie-ave/exterior/exterior-2.webp",
          "/2211-lillie-ave/exterior/exterior-3.webp",
          "/2211-lillie-ave/exterior/exterior-5.webp",
        ],
      },
      {
        title: "Great Room & Den",
        description: "Open great room off the kitchen plus a lower-level family lounge for movie nights.",
        images: [
          "/2211-lillie-ave/living-room/living-room-1.webp",
          "/2211-lillie-ave/living-room/living-room-2.webp",
          "/2211-lillie-ave/living-room/living-room-3.webp",
          "/2211-lillie-ave/living-room/living-room-5.webp",
        ],
      },
      {
        title: "Kitchen & Dining",
        description: "Renovated kitchen with island seating flows to indoor dining and both alfresco tables.",
        images: [
          "/2211-lillie-ave/kitchen/kitchen-1.webp",
          "/2211-lillie-ave/kitchen/kitchen-2.webp",
        ],
      },
      {
        title: "Bedrooms",
        description: "Four king bedrooms including a detached cottage suite and fire-pit terrace.",
        images: [
          "/2211-lillie-ave/bedrooms/bedrooms-1.webp",
          "/2211-lillie-ave/bedrooms/bedrooms-2.webp",
          "/2211-lillie-ave/bedrooms/bedrooms-4.webp",
          "/2211-lillie-ave/bedrooms/bedrooms-6.webp",
        ],
      },
      {
        title: "Baths & Wellness",
        description: "Multiple baths plus the private spa make post-beach resets effortless.",
        images: [
          "/2211-lillie-ave/bathrooms/bathrooms-1.webp",
          "/2211-lillie-ave/bathrooms/bathrooms-2.webp",
          "/2211-lillie-ave/bathrooms/bathrooms-4.webp",
        ],
      },
      {
        title: "Studio & Flex Spaces",
        description: "The detached art studio and flexible corners keep creativity flowing.",
        images: [
          "/2211-lillie-ave/additional/additional-1.webp",
          "/2211-lillie-ave/additional/additional-3webp.webp",
          "/2211-lillie-ave/additional/additional-7.webp",
        ],
      },
    ],
  },
  {
    id: 3,
    slug: "steamboat-downtown-townhome",
    name: "Downtown Steamboat Luxury Townhome",
    location: "Steamboat Springs, Colorado",
    address: STEAMBOAT_GUIDE.propertyBasics.address,
    price: 550,
    guests: 6,
    bedrooms: 3,
    bathrooms: 2.5,
    rating: 5.0,
    reviews: 42,
    description:
      "Best location in Downtown Steamboat—steps from the Yampa River, top restaurants, shops, and the year-round energy of Lincoln Avenue, with effortless access to the mountain via a 15-minute shuttle loop.",
    image: "/steamboat-pictures/exterior/exterior-5.jpg",
    images: [
      "/steamboat-pictures/exterior/exterior-5.jpg",
      "/steamboat-pictures/living-room/living-room-4.jpg",
      "/steamboat-pictures/living-room/living-room-1.jpg",
    ],
    features: [
      "Unbeatable Downtown Location",
      "Private Ski Locker",
      "Attached Garage",
      "Air Conditioning",
      "Pet Friendly",
      "Gas Fireplace",
    ],
    heroTagline:
      "Walk everywhere downtown, then hop the shuttle to your ski locker at the base—luxury living with effortless mountain access.",
    aboutSections: [
      {
        title: "About this space",
        body: [
          "Enjoy luxury downtown living with mountain views in this bright, modern, 3-bedroom, 2.5-bath townhome spread across three spacious levels.",
        ],
      },
      {
        title: "Top Floor – Master Retreat",
        body: [
          "King bed with premium linens, vaulted ceilings, and abundant natural light.",
          "Massive walk-in closet plus a private sitting area with leather lounge chairs and a twin sleeper sofa—perfect for reading or bonus guests.",
          "Spa-worthy ensuite with jacuzzi bath, double vanity, soaking tub, and separate shower.",
        ],
      },
      {
        title: "Main Level – Living, Dining, and Balcony",
        body: [
          "Soaring ceilings, dramatic windows, and a cozy gas fireplace anchor the main gathering space.",
          "Smart TV for movie nights, plus an open dining area for family-style meals and entertaining.",
          "Fully equipped kitchen with granite counters, stainless GE appliances, and a gas stove leads to a balcony with unobstructed Howelsen Hill and Yampa River views.",
        ],
      },
      {
        title: "Lower Level – Walk-out Bedrooms",
        body: [
          "Queen bedroom pairs with a twin-over-twin bunk room that kids love.",
          "Second full bathroom and laundry plus direct walk-out patio access toward the river trail system.",
        ],
      },
    ],
    highlights: [
      "Walk to dining, shops, tubing, fly-fishing, and bike paths",
      "Private ski locker at Mt. Werner Base with shuttle every 15 minutes",
      "Ideal for families, couples, and remote work escapes",
      "AC + attached garage (rare downtown amenities)",
      "Pet friendly and fully outfitted for year-round stays",
    ],
    sleepingArrangements: [
      {
        title: "Master Bedroom",
        bedDetails: "King bed + twin sleeper sofa",
        description:
          "Vaulted retreat on the top floor with lounge seating, walk-in closet, and ensuite jacuzzi bath.",
      },
      {
        title: "Second Bedroom",
        bedDetails: "Queen bed",
        description: "Located on the lower level with quick patio access and close to the second full bath.",
      },
      {
        title: "Third Bedroom",
        bedDetails: "Twin-over-twin bunk beds",
        description: "Bright lower-level bunk room that keeps kids close to the hangout zone.",
      },
      {
        title: "Loft Den",
        bedDetails: "Twin sleeper sofa",
        description: "Adjacent to the master suite for flexible sleeping or a quiet workspace.",
      },
    ],
    guestAccess: [
      "Full access to the entire three-level townhome, including the private attached garage.",
      "Dedicated ski locker at Mt. Werner Base for effortless gear storage between laps.",
      "Walk-out patio, balcony, and all indoor amenities are yours throughout the stay.",
    ],
    otherNotes: [
      "Tankless water heater delivers instant, nearly unlimited hot water for post-ski showers.",
      "Nest thermostat with central AC keeps every level comfortable, even in mid-summer.",
      "Humidifiers and HEPA filters are provided to keep mountain air fresh indoors.",
    ],
    notices: [
      {
        title: "Construction Notice",
        body: [
          "There is active construction taking place on the property directly adjacent to ours. While the home is well-built and insulated, you may hear noise at times and some exterior views are impacted.",
          "Nightly rates are adjusted during this period, and returning guests will receive special discounted rates once construction is complete.",
          "Please reach out with any questions—we want to ensure you still enjoy Steamboat’s walkability, amenities, and year-round charm.",
        ],
      },
    ],
    photoGroups: [
      {
        title: "Exterior & Views",
        description: "See how close you are to the Yampa River, Howelsen Hill, and downtown storefronts.",
        images: [
          "/steamboat-pictures/exterior/exterior-1.jpg",
          "/steamboat-pictures/exterior/exterior-2.jpg",
          "/steamboat-pictures/exterior/exterior-3.jpg",
          "/steamboat-pictures/exterior/exterior-5.jpg",
        ],
      },
      {
        title: "Living & Lounge",
        description: "Double-height ceilings, statement fireplace, and plush seating for the whole group.",
        images: [
          "/steamboat-pictures/living-room/living-room-1.jpg",
          "/steamboat-pictures/living-room/living-room-2.jpg",
          "/steamboat-pictures/living-room/living-room-3.jpg",
          "/steamboat-pictures/living-room/living-room-6.avif",
        ],
      },
      {
        title: "Kitchen & Dining",
        description: "Modern GE appliances, a gas range, and granite counters ready for big family meals.",
        images: [
          "/steamboat-pictures/kitchen/kitchen-1.jpg",
          "/steamboat-pictures/kitchen/kitchen-2.jpg",
          "/steamboat-pictures/kitchen/kitchen-3.jpg",
        ],
      },
      {
        title: "Bedrooms",
        description: "From the vaulted master suite to bunk-ready rooms, everyone gets a cozy space.",
        images: [
          "/steamboat-pictures/bedroom-1/bedroom-1-1.jpg",
          "/steamboat-pictures/bedroom-1/bedroom-1-2.jpg",
          "/steamboat-pictures/bedroom-2/bedroom-2-1.avif",
          "/steamboat-pictures/bedroom-3/bedroom-3-1.jpg",
        ],
      },
      {
        title: "Bath & Wellness",
        description: "Soak sore legs in the jacuzzi tub or reset under the walk-in shower.",
        images: [
          "/steamboat-pictures/bathroom-1/bathroom-1-1.jpg",
          "/steamboat-pictures/bathroom-1/bathroom-1-2.jpg",
          "/steamboat-pictures/wc/wc-1.jpg",
        ],
      },
      {
        title: "Additional Moments",
        description: "Details that make the home feel curated and comfortable for longer stays.",
        images: [
          "/steamboat-pictures/additional/additional-1.jpg",
          "/steamboat-pictures/additional/additional-2.jpg",
          "/steamboat-pictures/additional/additional-6.avif",
          "/steamboat-pictures/additional/additional-7.avif",
        ],
      },
    ],
    checkInTime: STEAMBOAT_GUIDE.propertyBasics.checkInTime,
    checkOutTime: STEAMBOAT_GUIDE.propertyBasics.checkOutTime,
    wifiSsid: STEAMBOAT_GUIDE.propertyBasics.wifi.ssid,
    wifiPassword: STEAMBOAT_GUIDE.propertyBasics.wifi.password,
    garageCode: STEAMBOAT_GUIDE.propertyBasics.garageCode,
    lockboxCode: STEAMBOAT_GUIDE.propertyBasics.lockboxCode,
    skiLockerDoorCode: STEAMBOAT_GUIDE.propertyBasics.skiLocker.doorCode,
    skiLockerNumber: STEAMBOAT_GUIDE.propertyBasics.skiLocker.lockerNumber,
    skiLockerCode: STEAMBOAT_GUIDE.propertyBasics.skiLocker.lockerCode,
    quietHours: STEAMBOAT_GUIDE.checkinCheckout.quietHours,
    parkingNotes: STEAMBOAT_GUIDE.checkinCheckout.parking,
    houseRules: [...STEAMBOAT_GUIDE.checkinCheckout.houseRules],
    emergencyContacts: [
      { name: "Alissa", phone: "(310) 994-2387", role: "Host" },
      { name: "Matt", phone: "(310) 902-2899", role: "Host" },
      { name: STEAMBOAT_GUIDE.emergency.hospital.name, phone: STEAMBOAT_GUIDE.emergency.hospital.phone, role: "Hospital" },
    ],
  },
];

export const getPropertyBySlug = (slug: string) =>
  PROPERTIES.find((property) => property.slug === slug);
