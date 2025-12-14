"use client";

import Image from "next/image";
import { FileDown, MapPin, ShieldCheck } from "lucide-react";
import { STEAMBOAT_GUIDE } from "@/data/steamboatGuide";

interface SteamboatGuestGuideProps {
  /**
   * When true, sensitive codes (Wi-Fi, garage, lockbox, etc.) render inline.
   * Keep this enabled only in authenticated or booking-specific contexts.
   */
  showSecureDetails?: boolean;
  className?: string;
}

export function SteamboatGuestGuide({ showSecureDetails = false, className }: SteamboatGuestGuideProps) {
  const guide = STEAMBOAT_GUIDE;
  const pdfHref = "/Steamboat%20Brochure.pdf";

  const secureValue = (value: string) => (showSecureDetails ? value : "Shared in your confirmed booking portal.");
  const secureHelper = (helper?: string) => (showSecureDetails ? helper : undefined);
  const bestOfSteamboat = [
    {
      label: "Romantic dinner",
      value: guide.dining.romanticDinner,
      image: "https://lh3.googleusercontent.com/p/AF1QipPFD0_q8p-gfnV7t8VIDFPHX4JvihLuT8amScR0=s1360-w1360-h1020-rw",
      alt: "Intimate restaurant table for two",
    },
    {
      label: "Family dinner",
      value: guide.dining.familyDinner,
      image:
        "https://lh3.googleusercontent.com/gps-cs-s/AG0ilSzjE7Q2wA7MJL1PfL8S2mGf8irphOS3c8q-nDRy4_dMnpH0F4Aj2cKhHKYRSKMFhFoNRdyqvhvITqiQXfRG_KApCtBK4OaGIV0rWQj3x9PDzNywsCZB2hx0zXLj6yU27pnt1Sgk=w243-h203-n-k-no-nu",
      alt: "Family-style Italian meal",
    },
    {
      label: "Breakfast",
      value: guide.dining.breakfast,
      image: "https://static1.cafe-encore.com/394-albums-3.jpg",
      alt: "Winona’s breakfast spread",
    },
    {
      label: "Casual night",
      value: guide.dining.casualSpot,
      image:
        "https://lh3.googleusercontent.com/gps-cs-s/AG0ilSxLKmADJR_PYWd4WOsCdwtTn7faGq4ZSekwGuNxMzQ3buHwqdvW1SpplTAXKyQtbrVILrmwWKaQMtZoNQ0wM5dPQVGqyjeuV4hqs6XzP-ZzyI-im4o7q75tVLHE2sngnSOUDd5veK879ZSM=s1360-w1360-h1020-rw",
      alt: "Friends enjoying a casual pub dinner",
    },
    {
      label: "Local brewery",
      value: guide.dining.brewery,
      image:
        "https://lh3.googleusercontent.com/gps-cs-s/AG0ilSywuyA4u8GGpw828FBxuEfbQUm0WsBzIdcdq-_5sxVsg6Syqucskk8dOe4L0QYLb_mF74BOUeLv_qpx7JgLhPUruXz_hcdr3zZUitY7pfbbKtCERevd-keOffutrQcsdyymhVYTEQ=s1360-w1360-h1020-rw",
      alt: "Craft beer flight on a wooden table",
    },
  ];
  const containerClass = [
    "max-w-7xl mx-auto space-y-16",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  const bodyTextClass = "text-base leading-relaxed text-slate-600";
  const subtleLabelClass = "text-xs uppercase tracking-[0.25em]";
  const cardClass = "rounded-3xl border border-slate-100 bg-white p-6 sm:p-7 shadow-[0_20px_50px_rgba(15,23,42,0.05)]";
  const softCardClass = "rounded-3xl border border-slate-100 bg-slate-50/70 p-6 sm:p-7";

  return (
    <div className={containerClass}>
      <header className="bg-slate-900 text-white rounded-3xl p-8 shadow-[0_30px_80px_rgba(15,23,42,0.35)]">
        <p className={`${subtleLabelClass} text-slate-300`}>Guest Guide</p>
        <h1 className="font-serif text-3xl sm:text-4xl mt-4 text-white">Welcome to {guide.propertyBasics.name}</h1>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-200">
          Steps from the Yampa River and downtown Steamboat, this three-level townhome pairs boutique design with
          lock-and-leave convenience. Bookmark this guide for arrival notes, local favorites, and emergency contacts.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={pdfHref}
            className="inline-flex items-center gap-2 rounded-full border border-white/40 px-5 py-2 text-sm font-semibold text-white hover:bg-white/10"
          >
            <FileDown className="w-4 h-4" /> Download full PDF
          </a>
          {!showSecureDetails && (
            <div className="inline-flex items-center gap-2 rounded-full border border-white/30 px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-200">
              <ShieldCheck className="w-4 h-4" /> Codes released after booking
            </div>
          )}
        </div>
      </header>

      <section id="essential-info" className="space-y-6">
        <div className="flex items-center gap-3">
          <MapPin className="w-5 h-5 text-slate-500" />
          <span className={`${subtleLabelClass} text-slate-500 text-sm font-semibold`}>Essential Info</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            {
              label: "Address",
              value: guide.propertyBasics.address,
              helper: "Downtown Steamboat Springs",
              secure: false,
            },
            {
              label: "Check-in",
              value: `${guide.propertyBasics.checkInTime}`,
              helper: "Self check-in via keypad by garage",
              secure: false,
            },
            {
              label: "Check-out",
              value: guide.propertyBasics.checkOutTime,
              helper: "Cleaners arrive shortly after",
              secure: false,
            },
            {
              label: "Wi-Fi",
              value: `${guide.propertyBasics.wifi.ssid} / ${guide.propertyBasics.wifi.password}`,
              helper: "Townhouse network & password",
              secure: true,
            },
            {
              label: "Garage",
              value: guide.propertyBasics.garageCode,
              helper: "Code + press enter",
              secure: true,
            },
            {
              label: "Lockbox",
              value: guide.propertyBasics.lockboxCode,
              helper: "Backup key by garage entry",
              secure: true,
            },
            {
              label: "Ski locker",
              value: `Door ${guide.propertyBasics.skiLocker.doorCode} · Locker #${guide.propertyBasics.skiLocker.lockerNumber}`,
              helper: `Locker code ${guide.propertyBasics.skiLocker.lockerCode}`,
              secure: true,
            },
            {
              label: "Hosts",
              value: `${guide.propertyBasics.hosts[0].name}${showSecureDetails ? ` · ${guide.propertyBasics.hosts[0].phone}` : ""}`,
              helper: showSecureDetails ? `${guide.propertyBasics.hosts[1].name} · ${guide.propertyBasics.hosts[1].phone}` : "Contact info shared once reserved",
              secure: false,
            },
          ].map((item) => (
            <div key={item.label} className={cardClass}>
              <p className={`${subtleLabelClass} text-slate-400`}>{item.label}</p>
              <p className="mt-2 font-serif text-xl text-slate-900">
                {item.secure ? secureValue(item.value) : item.value}
              </p>
              {(() => {
                const helperText = item.secure
                  ? secureHelper(item.helper ?? undefined) ?? (showSecureDetails ? undefined : "Secured for confirmed guests")
                  : item.helper;
                return helperText ? <p className="mt-2 text-sm leading-relaxed text-slate-500">{helperText}</p> : null;
              })()}
            </div>
          ))}
        </div>
      </section>

      <section
        id="checkin"
        className="rounded-3xl border border-slate-100 bg-white p-8 lg:p-10 shadow-[0_25px_50px_rgba(15,23,42,0.05)] space-y-8"
      >
        <div>
          <p className={`${subtleLabelClass} text-slate-400`}>Check-In & Checkout</p>
          <h2 className="font-serif text-2xl text-slate-900 mt-2">Arrivals, departures, and house rhythm</h2>
        </div>
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-[0.2em]">Directions</h3>
            <ul className={`mt-3 space-y-3 ${bodyTextClass}`}>
              <li><strong>From Denver:</strong> {guide.checkinCheckout.directions.fromDenver}</li>
              <li><strong>From Hayden:</strong> {guide.checkinCheckout.directions.fromHayden}</li>
            </ul>
            <p className={`mt-4 ${bodyTextClass}`}>{guide.checkinCheckout.checkinNotes}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-[0.2em]">Checkout steps</h3>
            <ol className={`mt-3 list-decimal space-y-2 pl-5 ${bodyTextClass}`}>
              {guide.checkinCheckout.checkoutSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl bg-slate-50 p-6">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">House rules</p>
            <ul className={`mt-3 list-disc pl-5 space-y-2 ${bodyTextClass}`}>
              {guide.checkinCheckout.houseRules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl bg-slate-50 p-6">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Quiet hours & parking</p>
            <p className={`mt-3 ${bodyTextClass}`}>
              Quiet hours: {guide.checkinCheckout.quietHours}
            </p>
            <p className={`mt-2 ${bodyTextClass}`}>{guide.checkinCheckout.parking}</p>
          </div>
        </div>
      </section>

      <section id="amenities" className="space-y-6">
        <div>
          <p className={`${subtleLabelClass} text-slate-500`}>Amenities</p>
          <h2 className="font-serif text-2xl text-slate-900">Everything stocked for effortless stays</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className={cardClass}>
            <h3 className="font-semibold text-slate-900">Bath & spa</h3>
            <ul className={`mt-3 list-disc pl-5 space-y-2 ${bodyTextClass}`}>
              {guide.amenities.bath.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className={cardClass}>
            <h3 className="font-semibold text-slate-900">Coffee & laundry</h3>
            <p className={`mt-3 ${bodyTextClass}`}>{guide.amenities.coffeeBar}</p>
            <p className={`mt-3 ${bodyTextClass}`}>{guide.amenities.laundry}</p>
          </div>
        </div>
        <div className={`${cardClass} space-y-4`}>
          <h3 className="font-semibold text-slate-900">Extra comforts</h3>
          <ul className={`mt-3 list-disc pl-5 space-y-2 ${bodyTextClass}`}>
            {guide.amenities.extras.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className={`font-medium ${bodyTextClass}`}>Special treat: {guide.amenities.specialTreat}</p>
          <p className={`${bodyTextClass}`}>{guide.amenities.skiLockerOverview}</p>
          <p className="mt-4 text-sm font-medium text-slate-500">
            {guide.propertyBasics.skiLocker.locationNotes}
          </p>
        </div>
      </section>

      <section id="groceries" className="rounded-3xl border border-slate-100 bg-white p-6 space-y-4">
        <div>
          <p className={`${subtleLabelClass} text-slate-500`}>Groceries & Essentials</p>
          <h2 className="font-serif text-2xl text-slate-900">Stock up within minutes</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {guide.groceryAndEssentials.map((spot) => (
            <div key={spot.name} className={softCardClass}>
              <p className="font-semibold text-slate-900">{spot.name}</p>
              {spot.description && <p className={`mt-1 ${bodyTextClass}`}>{spot.description}</p>}
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500 mt-3">{spot.address}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="dining" className="space-y-8">
        <div>
          <p className={`${subtleLabelClass} text-slate-500`}>Dining & Drinks</p>
          <h2 className="font-serif text-2xl text-slate-900">Matt & Alissa’s “Best of Steamboat”</h2>
          <p className={`mt-3 max-w-3xl ${bodyTextClass}`}>
            A handful of tried-and-true spots for every occasion, complete with a visual vibe check so you know exactly
            where to book next.
          </p>
        </div>
        <div
          className="rounded-[40px] border border-rose-100/70 bg-gradient-to-r from-rose-50 via-amber-50/70 to-orange-50/60 p-1"
          suppressHydrationWarning
        >
          <div className="rounded-[36px] bg-white/90 p-6 sm:p-8">
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {bestOfSteamboat.map((item) => (
                <div
                  key={item.label}
                  className="flex flex-col overflow-hidden rounded-3xl border border-white/70 bg-white shadow-[0_20px_50px_rgba(248,113,113,0.18)]"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden">
                    <Image
                      src={item.image}
                      alt={item.alt}
                      fill
                      sizes="(min-width: 1280px) 25vw, (min-width: 768px) 40vw, 100vw"
                      className="object-cover transition duration-500 hover:scale-105"
                      priority={false}
                    />
                    <span className="absolute left-4 top-4 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-rose-500">
                      {item.label}
                    </span>
                  </div>
                  <div className="p-6">
                    <p className={`${bodyTextClass} text-slate-800`}>{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {guide.dining.otherRestaurants.map((spot) => (
            <div key={spot.name} className="rounded-2xl border border-slate-100 bg-white p-4">
              <p className="font-semibold text-slate-900">{spot.name}</p>
              {spot.description && <p className={`mt-1 ${bodyTextClass}`}>{spot.description}</p>}
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500 mt-3">{spot.address}</p>
            </div>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className={cardClass}>
            <h3 className="font-semibold text-slate-900">Coffee + espresso</h3>
            <ul className={`mt-3 list-disc pl-5 space-y-2 ${bodyTextClass}`}>
              {guide.dining.coffeeShops.map((shop) => (
                <li key={shop.name}>
                  <span className="font-medium text-slate-900">{shop.name}</span> — {shop.description ?? "Great coffee"}
                </li>
              ))}
            </ul>
          </div>
          <div className={cardClass}>
            <h3 className="font-semibold text-slate-900">Breweries & bars</h3>
            <ul className={`mt-3 list-disc pl-5 space-y-2 ${bodyTextClass}`}>
              {guide.dining.barsBreweries.map((bar) => (
                <li key={bar.name}>
                  <span className="font-medium text-slate-900">{bar.name}</span> — {bar.description}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="activities" className="rounded-3xl border border-slate-100 bg-white p-6 space-y-6">
        <div>
          <p className={`${subtleLabelClass} text-slate-500`}>Hot Springs & Activities</p>
          <h2 className="font-serif text-2xl text-slate-900">Soak, hike, float, repeat</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-[0.2em]">Scenic moments</h3>
            <ul className={`mt-3 list-disc pl-5 space-y-2 ${bodyTextClass}`}>
              {guide.activities.scenic.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-[0.2em]">Outdoor staples</h3>
            <ul className={`mt-3 list-disc pl-5 space-y-2 ${bodyTextClass}`}>
              {guide.activities.outdoor.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="rounded-3xl bg-slate-50/70 border border-slate-100 p-7 sm:p-9">
          <h3 className="font-semibold text-slate-900">Hot springs cheat sheet</h3>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {guide.activities.hotSprings.map((spring) => (
              <div key={spring.name} className="rounded-3xl border border-slate-100 bg-white p-6">
                <p className="font-medium text-slate-900">{spring.name}</p>
                <p className={`mt-2 ${bodyTextClass}`}>{spring.description}</p>
                <p className="mt-4 text-sm font-medium text-slate-500">{spring.notes}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="transport" className="space-y-6">
        <div>
          <p className={`${subtleLabelClass} text-slate-500`}>Transportation & Winter Tips</p>
          <h2 className="font-serif text-2xl text-slate-900">Getting around Steamboat</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className={cardClass}>
            <h3 className="font-semibold text-slate-900">Transit + rideshare</h3>
            <p className={`mt-2 ${bodyTextClass}`}>{guide.transportation.busSystem}</p>
            <p className={`mt-2 ${bodyTextClass}`}>Nearest stop: {guide.transportation.nearestStop}</p>
            <p className={`mt-2 ${bodyTextClass}`}>{guide.transportation.rideshare}</p>
          </div>
          <div className={cardClass}>
            <h3 className="font-semibold text-slate-900">Taxi & shuttle partners</h3>
            <ul className="mt-3 space-y-3">
              {guide.transportation.taxis.map((service) => (
                <li key={service.name} className={bodyTextClass}>
                  <span className="font-medium text-slate-900">{service.name}</span> — {service.phone}
                  {service.notes ? ` · ${service.notes}` : ""}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className={softCardClass}>
          <h3 className="font-semibold text-slate-900">Winter travel notes</h3>
          <ul className={`mt-3 list-disc pl-5 space-y-2 ${bodyTextClass}`}>
            {guide.winterTravelTips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </div>
      </section>

      <section id="packing" className="rounded-3xl border border-slate-100 bg-white p-6 space-y-4">
        <div>
          <p className={`${subtleLabelClass} text-slate-500`}>Packing Lists</p>
          <h2 className="font-serif text-2xl text-slate-900">Seasonal cheat sheets</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {guide.packingLists.map((list) => (
            <div key={list.season} className={softCardClass}>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{list.season} essentials</p>
              <ul className={`mt-3 list-disc pl-5 space-y-2 ${bodyTextClass}`}>
                {list.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section id="emergency" className="rounded-3xl border border-slate-900 bg-slate-900 text-white p-6 space-y-4">
        <div>
          <p className={`${subtleLabelClass} text-slate-300`}>In case of emergency</p>
          <h2 className="font-serif text-2xl text-white">Important contacts</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-300">Medical</p>
            <p className="mt-2 font-semibold text-white">{guide.emergency.hospital.name}</p>
            <p className="text-sm text-slate-200">{guide.emergency.hospital.address}</p>
            <p className="text-sm text-slate-200 mt-1">{guide.emergency.hospital.phone}</p>
            <hr className="border-white/10 my-3" />
            <p className="font-semibold text-white">{guide.emergency.urgentCare.name}</p>
            <p className="text-sm text-slate-200">{guide.emergency.urgentCare.address}</p>
            <p className="text-sm text-slate-200 mt-1">{guide.emergency.urgentCare.phone}</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-300">Support</p>
            <p className="text-sm text-slate-200 mt-2">{guide.emergency.policeNonEmergency}</p>
            <p className="text-sm text-slate-200 mt-2">{guide.emergency.fireNonEmergency}</p>
            <p className="text-sm text-slate-200 mt-2">
              {guide.emergency.emergencyVet.name} · {guide.emergency.emergencyVet.phone}
            </p>
            <p className="text-xs text-slate-400 mt-1">{guide.emergency.emergencyVet.address}</p>
          </div>
        </div>
        <a
          href={pdfHref}
          className="inline-flex items-center gap-2 rounded-full border border-white/40 px-5 py-2 text-sm font-semibold text-white hover:bg-white/10"
        >
          <FileDown className="w-4 h-4" /> Download the full brochure
        </a>
      </section>
    </div>
  );
}
