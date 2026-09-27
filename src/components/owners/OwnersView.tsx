import Image from "next/image";
import {
  BookOpen,
  CalendarCheck,
  MapPin,
  Repeat,
  Sparkles,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import { HomeHubRequestForm } from "./HomeHubRequestForm";

type GuestFeature = {
  icon: LucideIcon;
  title: string;
  body: string;
  status: "live" | "soon";
};

// "live" means guests can use it today; "soon" is on the roadmap in the Bunks thesis.
const GUEST_FEATURES: GuestFeature[] = [
  {
    icon: Wifi,
    title: "Wi-Fi",
    body: "The network and password in one tap, with copy buttons. No more fridge notes.",
    status: "live",
  },
  {
    icon: BookOpen,
    title: "House guide",
    body: "Your guide for appliances, TVs, hot tub, heating, parking and house rules, always the latest version.",
    status: "live",
  },
  {
    icon: MapPin,
    title: "Local guide",
    body: "Your own picks for restaurants, coffee, beaches and things to do.",
    status: "live",
  },
  {
    icon: Repeat,
    title: "Book again",
    body: "Guests save your home and come back direct, at 10% less than the marketplace price.",
    status: "live",
  },
  {
    icon: Sparkles,
    title: "Ask Bunks",
    body: "An AI property manager that knows your home and the reservation, answers questions, handles routine requests and brings you in when a person is needed.",
    status: "soon",
  },
  {
    icon: CalendarCheck,
    title: "Your stay",
    body: "Reservation-aware help: early check-in, late checkout, extending the stay and reporting an issue.",
    status: "soon",
  },
];

const LOOP = ["Free Home Hub", "Help through the stay", "A better stay", "Direct repeat booking"];

const STEPS = [
  { title: "Request your Home Hub", body: "Tell us about your property. The device is free and we ship it to you." },
  { title: "Claim your property", body: "Add the Wi-Fi, house guide and your local recommendations." },
  { title: "Connect your calendar", body: "Link your Airbnb or Vrbo calendar so direct bookings never overlap." },
  { title: "Place it and go live", body: "Set it by the entry, kitchen or bedside. Guests tap or scan; no app needed." },
];

const FAQ = [
  {
    q: "Is the Home Hub really free?",
    a: "Yes. There's nothing to buy. Bunks earns a 5% service fee only when a guest books a stay with you directly, and the guest pays it at checkout.",
  },
  {
    q: "Do I have to leave Airbnb or Vrbo?",
    a: "No. Keep using them to find new guests. Bunks helps the guests you already have come back direct, and syncs calendars so nothing double-books.",
  },
  {
    q: "What do guests need?",
    a: "Just a phone. They tap (NFC) or scan the QR code; there's no app to download.",
  },
  {
    q: "Who talks to my guests?",
    a: "You stay in control. Guests reach you through Bunks by email today; the AI property manager will answer routine questions and hand anything important to you.",
  },
];

const money = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

// Illustrative $5,000 repeat stay: Airbnb's single host fee (~15.5%) vs Bunks' 5%.
const STAY_VALUE = 5000;
const AIRBNB_FEE_RATE = 0.155;
const BUNKS_FEE_RATE = 0.05;

export function OwnersView() {
  const airbnbCost = STAY_VALUE * AIRBNB_FEE_RATE;
  const bunksCost = STAY_VALUE * BUNKS_FEE_RATE;

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="marketing-container grid items-center gap-10 pb-14 pt-10 sm:pt-16 lg:grid-cols-2 lg:gap-16 lg:pb-20">
        <div>
          <p className="eyebrow mb-5 text-gray-600">For owners and hosts</p>
          <h1 className="marketing-title text-4xl sm:text-6xl">
            A free Home Hub.
            <br />
            Guests who come back direct.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray-600">
            Put Bunks inside your rental. Guests tap or scan for the Wi-Fi, your house guide and local picks, and
            when they&apos;re ready to return, they book with you directly for 5% instead of paying marketplace fees.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#request" className="marketing-button">
              Request your free Home Hub
            </a>
            <a
              href="#how-it-works"
              className="inline-flex min-h-12 items-center rounded-full border border-gray-300 px-6 font-semibold text-gray-900 hover:bg-gray-50"
            >
              How it works
            </a>
          </div>
          <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-gray-200 pt-6">
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500">Device</dt>
              <dd className="mt-1 text-2xl font-semibold text-gray-900">$0</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500">App for guests</dt>
              <dd className="mt-1 text-2xl font-semibold text-gray-900">None</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500">Direct fee</dt>
              <dd className="mt-1 text-2xl font-semibold text-gray-900">5%</dd>
            </div>
          </dl>
        </div>
        <div className="relative aspect-[3/2] overflow-hidden rounded-lg">
          <Image
            src="/owners/home-hub-bedside.webp"
            alt="The Bunks Home Hub, a small wooden house-shaped stand with a tap and QR code, on a bedside table"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
      </section>

      {/* The loop */}
      <section className="bg-[#eeece8]">
        <div className="marketing-container py-10">
          <ol className="grid gap-4 sm:grid-cols-4">
            {LOOP.map((step, index) => (
              <li key={step} className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <span className="font-semibold text-gray-900">{step}</span>
              </li>
            ))}
          </ol>
          <p className="mt-6 max-w-3xl text-gray-700">
            Airbnb and Vrbo can bring you the first stay. Bunks starts inside the home, looks after the guest through
            the stay, and makes the next booking a direct one.
          </p>
        </div>
      </section>

      {/* What guests get */}
      <section id="how-it-works" className="marketing-section scroll-mt-24">
        <div className="marketing-container">
          <p className="eyebrow mb-4 text-gray-600">Tap or scan</p>
          <h2 className="marketing-title max-w-3xl text-4xl sm:text-5xl">
            No binder. No app. No digging through old messages.
          </h2>
          <p className="mt-5 max-w-2xl text-lg text-gray-600">
            Guests reach a page built for your home, with everything they need during the stay.
          </p>
          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {GUEST_FEATURES.map(({ icon: Icon, title, body, status }) => (
              <li key={title} className="soft-panel flex flex-col gap-3 p-6">
                <div className="flex items-center justify-between">
                  <Icon className="h-6 w-6 text-gray-900" aria-hidden="true" />
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      status === "live" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {status === "live" ? "Available now" : "Coming soon"}
                  </span>
                </div>
                <h3 className="section-heading text-gray-900">{title}</h3>
                <p className="text-gray-600">{body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Placement photos */}
      <section className="marketing-container grid gap-5 pb-16 md:grid-cols-2">
        {[
          { src: "/owners/home-hub-entry.webp", alt: "The Home Hub on an entryway table beside a key dish", label: "By the door" },
          { src: "/owners/home-hub-kitchen.webp", alt: "The Home Hub on a kitchen counter next to a coffee machine", label: "In the kitchen" },
        ].map((photo) => (
          <figure key={photo.src}>
            <div className="relative aspect-[3/2] overflow-hidden rounded-lg">
              <Image src={photo.src} alt={photo.alt} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
            </div>
            <figcaption className="mt-3 text-sm text-gray-600">{photo.label}</figcaption>
          </figure>
        ))}
      </section>

      {/* Economics */}
      <section className="bg-[#eeece8]">
        <div className="marketing-container marketing-section grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="eyebrow mb-4 text-gray-600">The economics</p>
            <h2 className="marketing-title text-4xl sm:text-5xl">
              The marketplace finds the first stay. The next one can be yours.
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-gray-700">
              You&apos;ve already paid to acquire the guest once. When they come back direct, you keep far more of
              the booking, and they pay less than they would on the marketplace.
            </p>
          </div>
          <div className="rounded-lg bg-white p-6 sm:p-8">
            <p className="font-semibold text-gray-900">A {money(STAY_VALUE)} repeat stay</p>
            <table className="mt-5 w-full text-left">
              <caption className="sr-only">Platform fee on a repeat stay: Airbnb compared with Bunks direct</caption>
              <thead>
                <tr className="text-xs uppercase tracking-wide text-gray-500">
                  <th scope="col" className="pb-3 font-semibold"></th>
                  <th scope="col" className="pb-3 font-semibold">Airbnb</th>
                  <th scope="col" className="pb-3 font-semibold">Bunks direct</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <th scope="row" className="py-3 font-medium text-gray-700">Platform fee</th>
                  <td className="py-3">~{Math.round(AIRBNB_FEE_RATE * 1000) / 10}%</td>
                  <td className="py-3 font-semibold">{BUNKS_FEE_RATE * 100}%</td>
                </tr>
                <tr>
                  <th scope="row" className="py-3 font-medium text-gray-700">Fee on this stay</th>
                  <td className="py-3">~{money(airbnbCost)}</td>
                  <td className="py-3 font-semibold">{money(bunksCost)}</td>
                </tr>
                <tr>
                  <th scope="row" className="py-3 font-medium text-gray-700">Home Hub</th>
                  <td className="py-3">—</td>
                  <td className="py-3 font-semibold">Free</td>
                </tr>
              </tbody>
            </table>
            <p className="mt-5 text-sm text-gray-500">
              Airbnb figure based on its single-fee structure. Card processing on direct bookings is separate.
              Illustrative only.
            </p>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="marketing-section">
        <div className="marketing-container">
          <p className="eyebrow mb-4 text-gray-600">Getting started</p>
          <h2 className="marketing-title max-w-2xl text-4xl sm:text-5xl">Live in an afternoon.</h2>
          <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <li key={step.title}>
                <p className="text-sm font-semibold text-gray-500">Step {index + 1}</p>
                <h3 className="section-heading mt-2 text-gray-900">{step.title}</h3>
                <p className="mt-2 text-gray-600">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Request form + FAQ */}
      <section id="request" className="scroll-mt-24 bg-[#eeece8]">
        <div className="marketing-container marketing-section grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="marketing-title text-4xl sm:text-5xl">Request your free Home Hub.</h2>
            <p className="mt-5 text-lg text-gray-700">
              We&apos;re onboarding our first properties now. Tell us about yours and we&apos;ll be in touch.
            </p>
            <dl className="mt-10 space-y-6">
              {FAQ.map((item) => (
                <div key={item.q}>
                  <dt className="font-semibold text-gray-900">{item.q}</dt>
                  <dd className="mt-1 text-gray-700">{item.a}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="rounded-lg bg-white p-6 sm:p-8">
            <HomeHubRequestForm />
          </div>
        </div>
      </section>
    </div>
  );
}
