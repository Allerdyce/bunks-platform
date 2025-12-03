"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertCircle, ClipboardList, ExternalLink, Loader2, Lock, LogOut, RefreshCw } from "lucide-react";
import { AdminTopNav } from "@/components/admin/AdminTopNav";

interface ChecklistSubsection {
  title: string;
  items: string[];
}

interface ChecklistSection {
  title: string;
  badge?: string;
  description?: string;
  items?: string[];
  subsections?: ChecklistSubsection[];
  footer?: string;
}

const CHECKLIST_SECTIONS: ChecklistSection[] = [
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
    items: [
      "Stains",
      "Breakage",
      "Missing linens/towels",
      "Pet issues",
      "Leak/Mold/Electrical",
    ],
    footer: "No repair or replacement without approval unless emergency.",
  },
];

const SUPPLY_LINKS = [
  {
    label: "Mountain Escape Toiletries",
    description: "Rental-ready amenity kit (shampoo, conditioner, body wash, lotion, soaps)",
    href: "https://www.amazon.com/Mountain-Escape-Toiletries-Conditioner-Amenities/dp/B0DVC7MRSD",
  },
];

export default function AdminResourcesPage() {
  const [authState, setAuthState] = useState<"checking" | "unauthenticated" | "authenticated">("checking");
  const [email, setEmail] = useState("ali@bunks.com");
  const [password, setPassword] = useState("PMbunks101!");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const res = await fetch("/api/admin/session", { credentials: "include" });
        if (!res.ok) {
          setAuthState("unauthenticated");
          return;
        }
        setAuthState("authenticated");
      } catch (err) {
        console.error("Failed to bootstrap admin session", err);
        setAuthState("unauthenticated");
      }
    };

    bootstrap();
  }, []);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error((payload as { error?: string }).error ?? "Invalid credentials");
      }
      setAuthState("authenticated");
    } catch (err) {
      setAuthState("unauthenticated");
      setError((err as Error)?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    setAuthState("unauthenticated");
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/admin/session", { credentials: "include" });
      if (!res.ok) {
        setAuthState("unauthenticated");
      }
    } catch (err) {
      console.error("Failed to refresh session", err);
      setAuthState("unauthenticated");
    } finally {
      setRefreshing(false);
    }
  };

  if (authState !== "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-700">
              <Lock className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-serif text-slate-900">Admin Console</h1>
            <p className="text-sm text-slate-500">Restricted ops content.</p>
          </div>
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}
          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 focus:border-slate-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 focus:border-slate-500 focus:outline-none"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-slate-900 text-white py-3 font-medium hover:bg-slate-800 transition"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <AdminTopNav
        active="resources"
        title="Ops resource library"
        subtitle="Printable checklists, supply links, and quick references for on-the-ground teams."
        actions={
          <>
            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:border-slate-400"
              disabled={refreshing}
            >
              {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Refresh session
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </>
        }
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 space-y-8">
        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="grid gap-0 md:grid-cols-2">
            <div className="relative aspect-[4/3] md:aspect-auto md:h-full">
              <Image
                src="/steamboat-pictures/steamboat-cleaning.png"
                alt="Steamboat cleaning setup"
                fill
                className="object-cover"
                priority
              />
            </div>
            <div className="p-8 space-y-4">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Steamboat Springs</p>
              <h2 className="text-3xl font-serif text-slate-900">Steamboat Cleaning Checklist</h2>
              <p className="text-slate-600">
                Alpen Glow Townhomes #2 — walkable downtown Steamboat lodging. Share this runbook with any cleaner or
                field partner and require photo confirmation for each section.
              </p>
              <div className="flex flex-wrap gap-3 text-sm text-slate-500">
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1">
                  <ClipboardList className="w-4 h-4" /> 3 bedrooms / 2.5 baths
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1">
                  <ClipboardList className="w-4 h-4" /> Downtown Steamboat
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          {CHECKLIST_SECTIONS.map((section) => (
            <article key={section.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                {section.badge && (
                  <span className="text-2xl" aria-hidden="true">
                    {section.badge}
                  </span>
                )}
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">{section.title}</h3>
                  {section.description && <p className="text-sm text-slate-500">{section.description}</p>}
                </div>
              </div>
              {section.items && (
                <ul className="mt-4 space-y-2 text-slate-700">
                  {section.items.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-1 block h-2 w-2 rounded-full bg-violet-500" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
              {section.subsections && (
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {section.subsections.map((subsection) => (
                    <div key={`${section.title}-${subsection.title}`} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{subsection.title}</p>
                      <ul className="mt-3 space-y-2 text-sm text-slate-700">
                        {subsection.items.map((item) => (
                          <li key={item} className="flex items-start gap-2">
                            <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-slate-400" aria-hidden="true" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
              {section.footer && <p className="mt-4 text-sm font-semibold text-slate-600">{section.footer}</p>}
            </article>
          ))}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Supply list</p>
              <h3 className="text-2xl font-serif text-slate-900">Restock-ready links</h3>
              <p className="text-sm text-slate-500">
                Share these direct-order kits with local teams to keep baskets full week after week.
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {SUPPLY_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="group rounded-2xl border border-slate-100 bg-slate-50 p-4 hover:border-violet-200"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{link.label}</p>
                    <p className="text-sm text-slate-600">{link.description}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-violet-500" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
