import Image from "next/image";
import { BookOpen, MapPin, Repeat, Wifi, type LucideIcon } from "lucide-react";
import { HomeHubRequestForm } from "./HomeHubRequestForm";

const BENEFITS: Array<{ icon: LucideIcon; title: string; body: string }> = [
  { icon: Wifi, title: "Wi-Fi", body: "Connect without hunting for the password." },
  { icon: BookOpen, title: "House guide", body: "The essentials for settling in." },
  { icon: MapPin, title: "Local favorites", body: "Your recommendations, ready to explore." },
  { icon: Repeat, title: "Book again", body: "An easy way back to your home." },
];

const STEPS = [
  { title: "Request your Hub", body: "Tell us about your home. We send the Home Hub to you." },
  { title: "Add your home’s details", body: "Wi-Fi, house guide, local favorites, and your calendar." },
  { title: "Welcome your guests", body: "Set it out. Guests tap or scan with their phone; no app needed." },
];

const FAQ = [
  {
    q: "Is the Home Hub really free?",
    a: "Yes. There’s nothing to buy. Bunks earns its 5% service fee only when a guest books directly, and the guest pays it at checkout.",
  },
  {
    q: "Do I have to stop using other booking sites?",
    a: "No. Keep them for finding new guests. Bunks helps the guests you already have come back directly, and syncs your calendars so dates never double-book.",
  },
  {
    q: "What do guests need?",
    a: "Just a phone. They tap the Hub or scan its QR code; there’s no app to download.",
  },
  {
    q: "Who talks to my guests?",
    a: "You do. Guest questions come to you by email, and you stay in control of every booking.",
  },
];

export function OwnersView() {
  return (
    <div className="bg-white">
      {/* 1. The promise */}
      <section className="marketing-container grid items-center gap-10 pb-16 pt-10 sm:pt-16 lg:grid-cols-2 lg:gap-16 lg:pb-24">
        <div>
          <p className="eyebrow mb-5 text-gray-600">For owners</p>
          <h1 className="marketing-title text-4xl sm:text-6xl">
            A better stay.
            <br />
            A reason to return.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray-600">
            A free Home Hub for your rental. Guests tap for Wi-Fi, house details and local favorites, and book
            directly when they&apos;re ready to come back.
          </p>
          <a href="#request" className="marketing-button mt-8">
            Request your free Home Hub
          </a>
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

      {/* 2. Benefits */}
      <section className="bg-[#eeece8]">
        <div className="marketing-container marketing-section">
          <h2 className="marketing-title max-w-2xl text-4xl sm:text-5xl">Everything guests need, in one place.</h2>
          <ul className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map(({ icon: Icon, title, body }) => (
              <li key={title}>
                <Icon className="h-6 w-6 text-gray-900" aria-hidden="true" />
                <h3 className="section-heading mt-4 text-gray-900">{title}</h3>
                <p className="mt-1 text-gray-600">{body}</p>
              </li>
            ))}
          </ul>
          <p className="mt-10 text-sm text-gray-600">
            <span className="mr-2 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-gray-700">Coming soon</span>
            An assistant that answers guest questions about your home and helps with check-in, checkout and extending a
            stay.
          </p>
        </div>
      </section>

      {/* Photos */}
      <section className="marketing-container grid gap-5 py-16 md:grid-cols-2">
        {[
          { src: "/owners/home-hub-entry.webp", alt: "The Home Hub on an entryway table beside a key dish" },
          { src: "/owners/home-hub-kitchen.webp", alt: "The Home Hub on a kitchen counter next to a coffee machine" },
        ].map((photo) => (
          <div key={photo.src} className="relative aspect-[3/2] overflow-hidden rounded-lg">
            <Image src={photo.src} alt={photo.alt} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
          </div>
        ))}
      </section>

      {/* 3. Pricing */}
      <section className="marketing-container pb-16 sm:pb-24">
        <div className="grid gap-8 rounded-lg border border-gray-200 p-8 sm:p-12 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          <div>
            <p className="eyebrow mb-4 text-gray-600">Pricing</p>
            <h2 className="marketing-title text-4xl">Simple and clear.</h2>
          </div>
          <dl className="grid gap-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-semibold text-gray-900">Home Hub</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">Free</dd>
              <dd className="mt-2 text-gray-600">No hardware to buy.</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-gray-900">Direct bookings</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">5%</dd>
              <dd className="mt-2 text-gray-600">
                A Bunks service fee, paid by the guest at checkout. Guests book at 10% below your nightly rate, and
                the fee applies to that discounted amount.
              </dd>
            </div>
            <p className="text-sm text-gray-500 sm:col-span-2">Card processing fees are separate.</p>
          </dl>
        </div>
      </section>

      {/* 4. Setup */}
      <section className="bg-[#eeece8]">
        <div className="marketing-container marketing-section">
          <h2 className="marketing-title text-4xl sm:text-5xl">Three steps to get started.</h2>
          <ol className="mt-12 grid gap-8 sm:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title}>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <h3 className="section-heading mt-4 text-gray-900">{step.title}</h3>
                <p className="mt-1 text-gray-600">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 5. Invitation */}
      <section id="request" className="scroll-mt-24">
        <div className="marketing-container marketing-section grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="marketing-title text-4xl sm:text-5xl">Let&apos;s welcome your next returning guest.</h2>
            <p className="mt-5 text-lg text-gray-700">We&apos;re welcoming our first host partners. Tell us about your home.</p>
            <div className="mt-10 divide-y divide-gray-200 border-y border-gray-200">
              {FAQ.map((item) => (
                <details key={item.q} className="group py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-gray-900">
                    {item.q}
                    <span aria-hidden="true" className="text-xl text-gray-500 transition group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-2 text-gray-700">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
          <div className="rounded-lg bg-[#eeece8] p-6 sm:p-8">
            <HomeHubRequestForm />
          </div>
        </div>
      </section>
    </div>
  );
}
