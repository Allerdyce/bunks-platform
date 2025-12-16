
import { ChecklistProfile } from "@/types/cleaning";

export const CLEANING_PROFILES: ChecklistProfile[] = [
    {
        slug: "steamboat",
        locationLabel: "Steamboat Springs",
        heroImage: "/steamboat-pictures/steamboat-cleaning.png",
        heroAlt: "Steamboat cleaning setup",
        title: "Steamboat Cleaning Checklist",
        summary:
            "Alpen Glow Townhomes #2 — walkable downtown Steamboat lodging. Share this runbook with any cleaner or field partner and require photo confirmation for each section.",
        chips: ["3 bedrooms / 2.5 baths", "Downtown Steamboat"],
        sections: [
            {
                title: "Timing requirements",
                badge: "⏰",
                items: ["Check-IN is 3:00 PM", "Check-OUT is 10:00 AM"],
                footer: "Do NOT approve early check-in or late check-out without owner confirmation.",
            },
            {
                title: "Coffee bar + welcome basket",
                badge: "☕",
                subsections: [
                    {
                        title: "Kitchen coffee station",
                        items: [
                            "Coffee pods filled",
                            "Tea assortment stocked",
                            "Sugar / Stevia / Honey available",
                            "Disposable cups + lids refilled",
                            "Creamer available",
                        ],
                    },
                    {
                        title: "Kitchen welcome basket",
                        items: ["2–4 granola bars", "2–4 hand warmers (winter only)", "Welcome note included"],
                    },
                    {
                        title: "Bathroom welcome box",
                        items: ["Hair, body lotion, and soap stocked", "Basket must look full, neat, and intentional"],
                    },
                ],
            },
            {
                title: "Whole home",
                badge: "🔹",
                items: [
                    "Dust surfaces, ledges, shelves",
                    "Wipe baseboards, trim, switches, handles",
                    "Vacuum carpets + stairs",
                    "Mop hardwood/tile floors",
                    "Clean interior glass/mirrors",
                    "Remove cobwebs",
                    "Reset furniture to original layout",
                    "Check blinds/curtains functioning",
                    "Thermostat reset to (__ °F)",
                    "Fireplace OFF + area clean",
                ],
                subsections: [
                    {
                        title: "Damage to report",
                        items: [
                            "Wall/floor scratches",
                            "Carpet/sofa stains",
                            "Broken décor/lamps/blinds",
                            "Smoke or excessive pet odor",
                        ],
                    },
                ],
            },
            {
                title: "Bedrooms (x3)",
                badge: "🛏",
                items: [
                    "Strip beds — wash sheets + duvet covers",
                    "Vacuum floors + under beds",
                    "Dust tables/lamps/headboard",
                    "Check for left items",
                    "Make beds tightly + styled",
                    "4 pillows + throw arranged neatly",
                    "Trash emptied + liner replaced",
                ],
                subsections: [
                    {
                        title: "Report if present",
                        items: ["Mattress stains", "Damaged bedding", "Broken bedframes or furniture"],
                    },
                ],
            },
            {
                title: "Bathrooms (2 full + 1 half)",
                badge: "🚿",
                subsections: [
                    {
                        title: "Cleaning",
                        items: [
                            "Scrub toilet — including base + behind",
                            "Sink & counters cleaned + shined",
                            "Shower/tub walls + glass cleaned",
                            "Polish mirrors",
                            "Remove ALL hair",
                            "Sweep & mop floor",
                        ],
                    },
                    {
                        title: "Full bathroom restock",
                        items: [
                            "2 bath towels",
                            "1 hand towel",
                            "1 washcloth per guest",
                            "1 bath mat",
                            "Toiletry kit placed",
                            "2 fresh toilet paper rolls stocked",
                        ],
                    },
                    {
                        title: "Half bath",
                        items: ["1 hand towel", "1 TP on holder + 1 backup visible"],
                    },
                    {
                        title: "Report",
                        items: ["Mold/mildew present", "Leak or plumbing issue", "Towels ruined/stained"],
                    },
                ],
            },
            {
                title: "Kitchen",
                badge: "🍽",
                subsections: [
                    {
                        title: "Cleaning",
                        items: [
                            "Empty dishwasher + put away items",
                            "Wipe counters + backsplash",
                            "Microwave interior clean",
                            "Sink scrubbed + dried",
                            "Fridge handles + shelves wiped",
                            "Floor swept + mopped",
                            "Cabinets organized (no crumbs)",
                        ],
                    },
                    {
                        title: "Restock",
                        items: [
                            "Dish soap + new sponge",
                            "Dishwasher pods — min. 5 visible",
                            "Paper towels (1 on roll + 2 backup)",
                            "Spices filled (salt/pepper/basic seasonings)",
                            "Trash emptied + clean liner installed",
                        ],
                    },
                    {
                        title: "Report",
                        items: ["Broken dishes/glass", "Counter burns/cuts/stains"],
                    },
                ],
            },
            {
                title: "Laundry",
                badge: "🧺",
                items: [
                    "Wash linens + towels HOT",
                    "Dry completely",
                    "Fold backups + store organized",
                    "Clean lint trap",
                    "Wipe washer/gasket",
                ],
                subsections: [
                    {
                        title: "Inventory minimums",
                        items: [
                            "2 spare sheet sets per bedroom",
                            "2 extra blankets per level",
                            "1 extra comforter sealed",
                        ],
                    },
                ],
            },
            {
                title: "Final walkthrough",
                badge: "🚮",
                items: [
                    "All trash → garage bin",
                    "Check closets/drawers/under beds",
                    "Remove all food from fridge",
                    "Windows + doors locked",
                    "Fireplace OFF",
                    "Lights OFF",
                    "Home staged to arrival layout/photos",
                ],
            },
            {
                title: "Damage escalation",
                badge: "🚨",
                description: "Send photos same day.",
                items: ["Stains", "Breakage", "Missing linens/towels", "Pet issues", "Leak/Mold/Electrical"],
                footer: "No repair or replacement without approval unless emergency.",
            },
        ],
    },
    {
        slug: "summerland",
        locationLabel: "Summerland, CA",
        heroImage: "/2211-lillie-ave/exterior/exterior-1.webp",
        heroAlt: "Summerland coastal home",
        title: "Summerland Cleaning Checklist",
        summary:
            "2211 Lillie Ave — four king suites and a detached casita above Summerland Beach. Use this runbook for every turnover and escalate damage the same day.",
        chips: ["4 king suites + casita", "Ocean-view bungalow"],
        sections: [
            {
                title: "Timing requirements",
                badge: "⏰",
                items: ["Check-IN is 3:00 PM", "Check-OUT is 10:00 AM"],
                footer: "Do NOT approve early arrivals or late checkouts unless the owners confirm.",
            },
            {
                title: "Whole home — every turnover",
                badge: "🔹",
                items: [
                    "Dust all surfaces, ledges, art, shelves",
                    "Wipe baseboards, trim, switches, handles",
                    "Vacuum rugs + carpeted areas",
                    "Sweep + mop hardwood/tile floors",
                    "Clean interior windows + mirrors",
                    "Remove cobwebs",
                    "Reset furniture to layout reference photos",
                    "Check blinds/curtains aligned + working",
                    "Thermostat reset to (__°F cool / __°F heat)",
                    "All fireplaces, candles, space heaters OFF",
                ],
                subsections: [
                    {
                        title: "Damage / issues to report",
                        items: [
                            "Wall scratches or dents",
                            "Stains on sofa or rugs",
                            "Broken lamps, décor, blinds",
                            "Smoke smell or heavy pet odor",
                        ],
                    },
                ],
            },
            {
                title: "Bedrooms (primary · 2 downstairs · casita)",
                badge: "🛏",
                items: [
                    "Strip beds — wash sheets, pillowcases, duvet covers",
                    "Vacuum floors + under beds + corners",
                    "Dust bedside tables, lamps, headboards",
                    "Check closets + drawers for left items",
                    "Make beds hotel-tight + style throws/blankets",
                    "4 pillows minimum per bed (unless instructed)",
                    "Trash emptied + liner replaced",
                ],
                subsections: [
                    {
                        title: "Report if",
                        items: ["Mattress stain/odor", "Torn or ruined sheets", "Broken bedframes, drawers, lamps"],
                    },
                ],
            },
            {
                title: "Bathrooms — by location",
                badge: "🚿",
                subsections: [
                    {
                        title: "Primary suite",
                        items: [
                            "Scrub tub + polish fixtures",
                            "Clean shower walls, floor, glass, niches",
                            "Wipe counters, sinks, faucet",
                            "Polish mirrors (no streaks)",
                            "Clean toilet (bowl, seat, base, behind)",
                            "Sweep + mop floor",
                            "Remove ALL hair",
                            "Restock: 2 bath towels per guest, 1–2 hand towels, 1 washcloth per guest, bath mat",
                            "Premium amenity box reset",
                            "2 wrapped TP rolls visible",
                        ],
                    },
                    {
                        title: "Laundry hall · half bath",
                        items: [
                            "Sink + counter cleaned + dried",
                            "Mirror polished",
                            "Toilet fully cleaned",
                            "Floor swept + mopped",
                            "1 hand towel",
                            "1 TP on holder + 1 spare visible",
                            "Soap pump full",
                        ],
                    },
                    {
                        title: "Downstairs bedroom baths",
                        items: [
                            "Shower scrubbed + glass cleaned",
                            "Sink + counter wiped",
                            "Toilet cleaned (confirm each bath)",
                            "Floor cleaned",
                            "Remove ALL hair",
                            "Restock: 2 bath towels + 1 hand towel + washcloth per guest",
                            "Bath mat staged",
                            "2 toilet paper rolls visible",
                        ],
                    },
                    {
                        title: "Casita bath",
                        items: [
                            "Shower/tile/glass scrubbed",
                            "Sink + counter wiped",
                            "Mirror cleaned",
                            "Toilet cleaned",
                            "Floor swept/mopped",
                            "Restock: 2 bath towels, 1 hand towel, 1 washcloth per guest",
                            "2 TP rolls stocked",
                            "Amenity set placed neatly",
                        ],
                    },
                ],
            },
            {
                title: "Kitchen",
                badge: "🍽",
                subsections: [
                    {
                        title: "Cleaning",
                        items: [
                            "Empty dishwasher + put away dishes",
                            "Wipe counters, backsplash, island",
                            "Clean stovetop + oven exterior",
                            "Microwave interior spotless",
                            "Sink scrubbed + faucet polished",
                            "Fridge handles & seals wiped",
                            "Sweep + mop floor",
                            "Check cabinets — no crumbs, organized",
                        ],
                    },
                    {
                        title: "Restock",
                        items: [
                            "Dish soap + NEW sponge",
                            "Dishwasher pods — minimum 5 visible",
                            "Paper towels — 1 on roll + 2 backup",
                            "Salt, pepper, oil, basic spices stocked",
                            "Trash emptied + liner replaced",
                        ],
                    },
                    {
                        title: "Report",
                        items: ["Broken dishes or mugs", "Counter burn/cut marks"],
                    },
                ],
            },
            {
                title: "Premium coffee bar + welcome baskets",
                badge: "☕",
                subsections: [
                    {
                        title: "Coffee station",
                        items: [
                            "Espresso/pods refilled",
                            "Tea assortment stocked",
                            "Sweeteners: sugar, stevia, honey",
                            "Milk alternative + cream option",
                            "Mugs or to-go cups clean + staged",
                        ],
                    },
                    {
                        title: "Welcome basket (kitchen)",
                        items: [
                            "Local snacks or chocolates",
                            "2+ sparkling or still waters",
                            "Wine/Prosecco if provided",
                            "Welcome card visible + centered",
                            "Basket looks full + intentional",
                        ],
                    },
                    {
                        title: "Bath amenity boxes",
                        items: [
                            "Refilled with hair + body products",
                            "Lotion, soap, extras restaged",
                            "Replace near-empty bottles",
                        ],
                    },
                ],
            },
            {
                title: "Laundry",
                badge: "🧺",
                items: [
                    "Wash sheets + towels",
                    "Dry fully (no damp storage)",
                    "Fold backups neatly in closet",
                    "Lint trap cleaned",
                    "Washer gasket wiped clean",
                ],
                subsections: [
                    {
                        title: "Inventory minimums",
                        items: [
                            "2 spare sheet sets per bedroom",
                            "2 extra blankets per level",
                            "1 spare comforter set sealed",
                        ],
                    },
                ],
            },
            {
                title: "Final walkthrough",
                badge: "🚮",
                items: [
                    "Trash from all rooms → outdoor bins",
                    "Check under beds + drawers + closets",
                    "Remove any food from fridge/pantry",
                    "Windows & doors locked",
                    "Outdoor lights/fans/grill OFF",
                    "Indoor lights OFF",
                    "Home staged to arrival layout/photos",
                ],
            },
            {
                title: "Damage escalation",
                badge: "🚨",
                description: "Send photos SAME DAY if found.",
                items: [
                    "Stained rugs/sofa/bedding",
                    "Broken furniture or outdoor seating",
                    "Missing linens/towels",
                    "Pet odor or accidents",
                    "Leaks, mold, electrical issues",
                ],
                footer: "No repairs without owner approval unless emergency.",
            },
        ],
    },
];
