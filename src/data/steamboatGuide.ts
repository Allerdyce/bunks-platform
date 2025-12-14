export interface SteamboatGuide {
  propertyBasics: {
    name: string;
    address: string;
    checkInTime: string;
    checkOutTime: string;
    wifi: { ssid: string; password: string };
    garageCode: string;
    lockboxCode: string;
    skiLocker: {
      doorCode: string;
      lockerNumber: string;
      lockerCode: string;
      locationNotes: string;
    };
    hosts: { name: string; phone: string }[];
  };
  checkinCheckout: {
    directions: { fromDenver: string; fromHayden: string };
    checkinNotes: string;
    checkoutSteps: string[];
    houseRules: string[];
    quietHours: string;
    parking: string;
  };
  amenities: {
    bath: string[];
    coffeeBar: string;
    laundry: string;
    extras: string[];
    specialTreat: string;
    skiLockerOverview: string;
  };
  groceryAndEssentials: { name: string; description?: string; address: string }[];
  dining: {
    romanticDinner: string;
    familyDinner: string;
    breakfast: string;
    casualSpot: string;
    brewery: string;
    otherRestaurants: { name: string; address: string; description?: string }[];
    coffeeShops: { name: string; address: string; description?: string }[];
    barsBreweries: { name: string; description: string; address: string }[];
  };
  activities: {
    scenic: string[];
    hotSprings: { name: string; description: string; notes: string }[];
    outdoor: string[];
  };
  transportation: {
    busSystem: string;
    nearestStop: string;
    rideshare: string;
    taxis: { name: string; phone: string; notes?: string }[];
  };
  winterTravelTips: string[];
  packingLists: { season: "summer" | "winter"; items: string[] }[];
  emergency: {
    hospital: { name: string; address: string; phone: string };
    urgentCare: { name: string; address: string; phone: string };
    policeNonEmergency: string;
    fireNonEmergency: string;
    emergencyVet: { name: string; address: string; phone: string };
  };
  qrLinks: { label: string; description: string }[];
}

export const STEAMBOAT_GUIDE: SteamboatGuide = {
  propertyBasics: {
    name: "Alpen Glow Townhomes #2",
    address: "45 6th Street, Townhouse #2, Steamboat Springs, CO 80487",
    checkInTime: "3:00 p.m.",
    checkOutTime: "10:00 a.m.",
    wifi: { ssid: "Townhouse2", password: "Steamboat" },
    garageCode: "0409",
    lockboxCode: "1009",
    skiLocker: {
      doorCode: "47754",
      lockerNumber: "36",
      lockerCode: "2482",
      locationNotes:
        "Across from the gondola entrance in Steamboat Square—look for the Alpen Glow door beside the candy store and chairlift swing.",
    },
    hosts: [
      { name: "Alissa", phone: "(310) 994-2387" },
      { name: "Matt", phone: "(310) 902-2899" },
    ],
  },
  checkinCheckout: {
    directions: {
      fromDenver:
        "Take I-70 W to CO-9 N/CO-40 W toward Silverthorne. Follow US-40 into Steamboat Springs (Lincoln Ave), then turn left on 6th Street. Take the immediate right between the Alpen Glow condos and townhomes—#2 is on the left.",
      fromHayden:
        "From Yampa Valley Regional Airport, head east on US-40 (Lincoln Ave). Turn right on 6th Street, then the immediate right between the Alpen Glow condos and townhomes. Townhome #2 is on the left.",
    },
    checkinNotes:
      "Self check-in via the keypad beside the garage. Text us if you arrive before 3 p.m.—we'll expedite cleaning when possible. Late arrivals are totally fine; codes stay active.",
    checkoutSteps: [
      "Strip any beds that were used.",
      "Load and run the dishwasher before you go.",
      "Place used towels in the tub or next to the washer (mocha towels are for paws, striped towels are for hot springs).",
      "Take all trash and recycling to the garage bin.",
      "Lock the garage, interior doors, and sliders on your way out.",
      "Return the lockbox key to the hooks/lockbox if you used it.",
    ],
    houseRules: [
      "Absolutely no smoking anywhere on the property.",
      "Dogs are welcome with prior approval—wipe paws with mocha towels, keep barking to a minimum, and crate pets when they’re alone.",
      "Store skis and snowboards in the Steamboat Square locker, not inside the townhome.",
      "No parties or large events.",
      "Maximum occupancy is 6 overnight guests.",
    ],
    quietHours: "7:00 p.m. – 7:00 a.m.",
    parking:
      "You have a dedicated single-car garage spot plus first-come street parking along 6th Street. Keep vehicles clear of the shared drive and follow posted winter plow rules.",
  },
  amenities: {
    bath: [
      "Full-size bath soaps, shampoo, conditioner, and body lotion.",
      "Extra spa towels plus striped towels dedicated to hot-springs runs.",
    ],
    coffeeBar:
      "Locally roasted beans with grinder, Nespresso machine, French press, teas, creamers, and sweeteners waiting on the kitchen counter.",
    laundry:
      "In-unit washer/dryer with detergent and dryer sheets so you can refresh gear mid-stay.",
    extras: [
      "Soft linens, plush throws, and layered bedding in every room.",
      "Gas fireplace, board games, and smart TV for cozy nights in.",
      "Mocha dog towels and boot trays at the entry for easy cleanup.",
    ],
    specialTreat:
      "Complimentary gift certificate to Strawberry Park Hot Springs—ask us to help reserve your soak.",
    skiLockerOverview:
      "Private locker at Steamboat Square keeps skis, poles, and boards at the base so you never haul gear through town.",
  },
  groceryAndEssentials: [
    {
      name: "City Market (Kroger)",
      description: "Closest full-service grocery for full stock-ups.",
      address: "1825 Central Park Dr",
    },
    {
      name: "Safeway",
      description: "Downtown option for staples and pharmacy needs.",
      address: "37500 E US Hwy 40",
    },
    {
      name: "Natural Grocers",
      description: "Organic produce, supplements, and specialty items.",
      address: "335 Lincoln Ave",
    },
    {
      name: "Ski Haus",
      description: "Gear, rentals, and mountain apparel.",
      address: "1457 Pine Grove Rd",
    },
    {
      name: "Yampa Valley Sandwich Co.",
      description: "Grab-and-go sandwiches for river or ski days.",
      address: "635 Lincoln Ave",
    },
  ],
  dining: {
    romanticDinner: "Aurum Food & Wine · 811 Yampa St — Riverside tasting menu, craft cocktails, and sunset views over the Yampa.",
    familyDinner: "Mambo Italiano · 521 Lincoln Ave — Handmade pastas, wood-fired pizzas, and a lively dining room perfect for groups.",
    breakfast: "Winona’s · 617 Lincoln Ave — Iconic cinnamon rolls and hearty breakfasts. Expect a wait (worth it).",
    casualSpot: "Old Town Pub · 600 Lincoln Ave — Historic tavern energy, killer burgers, and live music nights.",
    brewery: "Mountain Tap Brewery · 910 Yampa St — Wood-fired pizzas and beer flights with communal tables.",
    otherRestaurants: [
      { name: "Taco Cabo", address: "729 Yampa St", description: "Tacos + margaritas right on the river." },
      { name: "Laundry", address: "127 11th St", description: "Shareable plates and inventive cocktails." },
      { name: "Creekside Café", address: "131 11th St", description: "Breakfast and brunch beside Soda Creek." },
      { name: "Salt & Lime", address: "628 Lincoln Ave", description: "Rooftop Mexican with bright tacos." },
      { name: "Back Door Grill", address: "825 Oak St", description: "Creative burgers, shakes, and late-night bites." },
    ],
    coffeeShops: [
      { name: "Emerald Coffee Co.", address: "700 Yampa St Unit A-105", description: "Steps away for morning espresso." },
      { name: "Big Iron Coffee", address: "635 Lincoln Ave", description: "Cozy basement café with great pours." },
    ],
    barsBreweries: [
      {
        name: "Mountain Tap Brewery",
        description: "Wood-fired pizza + craft beer with family seating.",
        address: "910 Yampa St #103",
      },
      {
        name: "Storm Peak Brewing Co.",
        description: "Warehouse taproom pouring hazy IPAs and seasonals.",
        address: "1885 Elk River Rd",
      },
      {
        name: "The Barley Tap & Tavern",
        description: "Downtown live music bar with rotating taps.",
        address: "635 Lincoln Ave",
      },
    ],
  },
  activities: {
    scenic: [
      "Hot air balloon ride at sunrise over the Yampa Valley.",
      "Float the Yampa River for a mellow summer afternoon.",
      "Guided fly fishing on the Yampa—great for all experience levels.",
      "Favorite in-town walk: river bridge behind the townhomes → sports complex path → Lincoln Ave loop.",
    ],
    hotSprings: [
      {
        name: "Old Town Hot Springs",
        description:
          "Historic downtown pools fueled by Heart Spring with lap lanes, two seasonal slides, and a full fitness center.",
        notes: "Walkable from the townhouse. Towels for rent onsite and no reservations required.",
      },
      {
        name: "Strawberry Park Hot Springs",
        description:
          "Stone-lined soaking pools nestled in the forest 15 minutes from town—rustic, quiet, and unforgettable at night.",
        notes: "Cash only, no alcohol or glass, 4WD/traction required Nov–May. Shuttles available if you’d rather not drive.",
      },
    ],
    outdoor: [
      "Ski or snowboard at Steamboat Resort, then stash gear in your locker at the base.",
      "Hike Fish Creek Falls or Emerald Mountain for big views minutes from downtown.",
      "Snowshoe or Nordic ski at Howelsen Hill and Rabbit Ears Pass.",
      "Summer tubing or rafting on the Yampa River (rentals start downtown).",
      "Bike endless trail systems on- and off-mountain—rentals available nearby.",
      "Stroll the Yampa River Botanic Park for a peaceful break between adventures.",
    ],
  },
  transportation: {
    busSystem:
      "Free Steamboat Springs Transit runs year-round between downtown and the mountain. During winter, buses arrive every ~15 minutes.",
    nearestStop: "Lincoln Avenue & 7th Street—one block from the townhome.",
    rideshare:
      "Uber/Lyft operate locally but with limited drivers. Expect longer waits during storms or peak après windows.",
    taxis: [
      { name: "Go Alpine", phone: "(970) 879-8294", notes: "Local taxis plus private/shared Denver airport shuttles." },
      { name: "Storm Mountain Express", phone: "(970) 879-1963", notes: "Shared shuttle from Yampa Valley Regional (HDN)." },
    ],
  },
  winterTravelTips: [
    "AWD/4WD + snow tires make life easier—icy mornings are common.",
    "Downtown parking fills early on powder days; walk or bus when you can.",
    "Best sledding hills: Lincoln Park and Howelsen Hill.",
    "Road to Strawberry Park Hot Springs requires 4WD Nov–May—Routt County enforces it, so consider a shuttle.",
  ],
  packingLists: [
    {
      season: "summer",
      items: [
        "Hiking shoes for everything from riverside strolls to ridge climbs.",
        "High-SPF sunscreen + sunglasses—the alpine sun is strong.",
        "Wide-brim hat for hikes and river floats.",
        "Swimsuits for hot springs, rivers, and the Old Town pools.",
        "Reusable water bottle to stay hydrated at elevation.",
      ],
    },
    {
      season: "winter",
      items: [
        "Layering system: base layer, warm mid-layer, and waterproof shell.",
        "Insulated hat, gloves, and neck gaiter for windy lifts.",
        "Swimsuit—hot springs are magical with snow falling.",
        "Waterproof boots with grippy soles for icy downtown sidewalks.",
        "Cozy indoor layers (sweaters, joggers, wool socks) for fireside lounging.",
      ],
    },
  ],
  emergency: {
    hospital: {
      name: "UCHealth Yampa Valley Medical Center",
      address: "1024 Central Park Dr, Steamboat Springs, CO 80487",
      phone: "(970) 879-1322",
    },
    urgentCare: {
      name: "UCHealth Urgent Care – Steamboat Springs",
      address: "1600 Mid Valley Dr, Steamboat Springs, CO 80487",
      phone: "(970) 457-8840",
    },
    policeNonEmergency: "Steamboat Springs Police · (970) 879-1144",
    fireNonEmergency: "Steamboat Springs Fire Rescue · (970) 879-7170",
    emergencyVet: {
      name: "Steamboat Veterinary Hospital",
      address: "41 Maple St, Steamboat Springs, CO 80487",
      phone: "(970) 879-1041",
    },
  },
  qrLinks: [
    {
      label: "Download full brochure",
      description: "QR in the entry console links to the PDF version of this guide for offline access.",
    },
    {
      label: "Wi-Fi + smart home",
      description: "Scan in the living room to pull up Wi-Fi info, Roku profiles, and Sonos pairing tips.",
    },
  ],
};

