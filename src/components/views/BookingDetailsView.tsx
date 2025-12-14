"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, MapPin, RefreshCw, X } from "lucide-react";
import type { BookingDetailsData, BookingLookupPayload, BookingPortalSection, NavigateHandler } from "@/types";
import { Button } from "@/components/shared/Button";
import { SteamboatGuestGuide } from "@/components/guides/SteamboatGuestGuide";
import { BookingMessages } from "@/components/messaging/BookingMessages";
import { api } from "@/lib/api";
import { MessageThreadList, type MessageThreadSummary, MessagesLayout } from "@/components/messaging/MessagesWorkspace";
import { getPropertyBySlug } from "@/data/properties";

interface BookingDetailsViewProps {
  onNavigate: NavigateHandler;
  initialLookup?: BookingLookupPayload | null;
  onPersistLookup?: (payload: BookingLookupPayload | null) => void;
  section?: BookingPortalSection;
}

type PendingLookupState = BookingLookupPayload;

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "short",
  day: "numeric",
});

function formatStayDates(checkIn: string, checkOut: string) {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const startLabel = dateFormatter.format(start);
  const endLabel = dateFormatter.format(end);
  return `${startLabel} → ${endLabel}`;
}

const threadTimestampFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const formatThreadTimestamp = (value?: string | null) => {
  if (!value) return null;
  try {
    return threadTimestampFormatter.format(new Date(value));
  } catch {
    return value;
  }
};

import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import { fromLonLat } from "ol/proj";
import { Feature } from "ol";
import { Point } from "ol/geom";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Icon, Style } from "ol/style";

type EssentialMapProps = {
  propertyName: string;
  location?: string | null;
  address?: string | null;
  className?: string;
};

// Simple mock geocoding for demo purposes
const MOCK_COORDS: Record<string, [number, number]> = {
  "steamboat": [-106.8317, 40.4850],
  "summerland": [-119.5965, 34.4208],
};

function EssentialMap({ propertyName, location, address, className = "h-[520px] w-full" }: EssentialMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Detect location based on string content for demo
    let center = fromLonLat([-106.8317, 40.4850]); // Default Steamboat
    const locLower = (location || "").toLowerCase();
    const addrLower = (address || "").toLowerCase();

    if (locLower.includes("summerland") || addrLower.includes("summerland")) {
      center = fromLonLat(MOCK_COORDS["summerland"]);
    } else if (locLower.includes("steamboat") || addrLower.includes("steamboat")) {
      center = fromLonLat(MOCK_COORDS["steamboat"]);
    }

    const vectorSource = new VectorSource();
    const iconFeature = new Feature({
      geometry: new Point(center),
    });

    const iconStyle = new Style({
      image: new Icon({
        anchor: [0.5, 1],
        src: "https://upload.wikimedia.org/wikipedia/commons/e/ec/RedDot.svg", // Simple pin
        scale: 1.5,
      }),
    });

    iconFeature.setStyle(iconStyle);
    vectorSource.addFeature(iconFeature);

    const vectorLayer = new VectorLayer({
      source: vectorSource,
    });

    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
        vectorLayer,
      ],
      view: new View({
        center: center,
        zoom: 14,
      }),
    });

    mapInstance.current = map;

    return () => {
      map.setTarget(undefined);
    };
  }, [location, address]);

  return (
    <div className={className}>
      <div ref={mapRef} className="h-full w-full" />
    </div>
  );
}

const supportFallback = "hello@bunks.com";
const BOOKING_REFERENCE_PATTERN = /^[A-Z0-9]{5}$/;

function normalizeBookingReferenceInput(raw: string) {
  if (!raw) return null;
  const alphanumeric = raw.replace(/[^A-Z0-9]/gi, "").toUpperCase();
  if (BOOKING_REFERENCE_PATTERN.test(alphanumeric)) {
    return alphanumeric;
  }
  return null;
}

export function BookingDetailsView({ onNavigate: _onNavigate, initialLookup, onPersistLookup, section = "essential" }: BookingDetailsViewProps) {
  void _onNavigate;
  const [lookupReference, setLookupReference] = useState(initialLookup?.bookingReference ?? "");
  const [lookupEmail, setLookupEmail] = useState(initialLookup?.guestEmail ?? "");
  const [isLookupModalOpen, setIsLookupModalOpen] = useState(!initialLookup);
  const [booking, setBooking] = useState<BookingDetailsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastLookup, setLastLookup] = useState<PendingLookupState | null>(initialLookup ?? null);
  const autoLookupKey = useRef<string | null>(null);
  const [conversationSummary, setConversationSummary] = useState<{ snippet: string | null; timestamp: string | null }>(
    { snippet: null, timestamp: null },
  );

  const handleLookup = useCallback(async (lookup: PendingLookupState) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.fetchBookingDetails(lookup.bookingReference, lookup.guestEmail);
      setBooking(response.booking);
      setLastLookup(lookup);
      setLookupReference(lookup.bookingReference);
      setLookupEmail(lookup.guestEmail);
      onPersistLookup?.(lookup);
      return true;
    } catch (lookupError) {
      console.error("Failed to load booking details", lookupError);
      const message =
        lookupError instanceof Error
          ? lookupError.message
          : "We couldn't find that booking. Double-check the details and try again.";
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [onPersistLookup]);

  useEffect(() => {
    if (!initialLookup?.bookingReference || !initialLookup?.guestEmail) {
      return;
    }
    const nextKey = `${initialLookup.bookingReference}:${initialLookup.guestEmail}`;
    if (autoLookupKey.current === nextKey) {
      return;
    }
    autoLookupKey.current = nextKey;
    setLookupReference(initialLookup.bookingReference);
    setLookupEmail(initialLookup.guestEmail);
    void handleLookup({ bookingReference: initialLookup.bookingReference, guestEmail: initialLookup.guestEmail });
  }, [initialLookup, handleLookup]);

  useEffect(() => {
    if (!booking) {
      setConversationSummary({ snippet: null, timestamp: null });
    }
  }, [booking]);

  const submitLookup = async (event?: React.FormEvent) => {
    event?.preventDefault();
    const normalizedReference = normalizeBookingReferenceInput(lookupReference);
    const normalizedEmail = lookupEmail.trim();

    if (!normalizedReference || !normalizedEmail) {
      setError("Enter your booking reference (e.g., R57KF) and the email on file.");
      return;
    }

    const success = await handleLookup({ bookingReference: normalizedReference, guestEmail: normalizedEmail });
    if (success) {
      setIsLookupModalOpen(false);
    }
  };

  const handleConversationSummaryChange = useCallback(
    (summary: { lastMessageSnippet: string | null; lastMessageAt?: string | null }) => {
      setConversationSummary({ snippet: summary.lastMessageSnippet, timestamp: summary.lastMessageAt ?? null });
    },
    [],
  );


  const propertyDetails = useMemo(() => {
    if (!booking) return null;
    return getPropertyBySlug(booking.property.slug) ?? null;
  }, [booking]);

  const heroImage = propertyDetails?.image ?? propertyDetails?.images?.[0] ?? null;
  const referenceCode = booking?.referenceCode ?? lastLookup?.bookingReference ?? null;

  const messageThreads: MessageThreadSummary[] = useMemo(() => {
    if (!booking) return [];
    return [
      {
        id: booking.id,
        title: booking.property.name,
        subtitle: formatStayDates(booking.checkInDate, booking.checkOutDate),
        meta: propertyDetails?.location ?? booking.property.slug,
        badge: referenceCode,
        mediaUrl: heroImage ?? null,
        lastMessageSnippet: conversationSummary.snippet,
        lastMessageAtLabel: formatThreadTimestamp(conversationSummary.timestamp),
      },
    ];
  }, [booking, propertyDetails, heroImage, referenceCode, conversationSummary]);

  const stayRangeLabel = useMemo(() => {
    if (!booking) return null;
    return formatStayDates(booking.checkInDate, booking.checkOutDate);
  }, [booking]);

  const hostContacts = useMemo(() => {
    if (!propertyDetails?.emergencyContacts?.length) {
      return [];
    }
    return propertyDetails.emergencyContacts.filter((contact) => {
      if (!contact.role) return true;
      return contact.role.toLowerCase().includes("host");
    });
  }, [propertyDetails]);

  const essentialItems = useMemo(() => {
    if (!booking) return [];
    const securePlaceholder = "Shared in your confirmation email";
    const items: { label: string; value: string; helper?: string }[] = [
      {
        label: "Address",
        value: propertyDetails?.address ?? booking.property.name,
        helper: propertyDetails?.location ?? booking.property.slug.replace(/-/g, " "),
      },
      {
        label: "Check-in",
        value: booking.property.checkInTime ?? "3:00 PM",
        helper: "Self check-in via keypad by garage",
      },
      {
        label: "Check-out",
        value: booking.property.checkOutTime ?? "11:00 AM",
        helper: "Cleaners arrive shortly after",
      },
    ];

    const wifiValue =
      propertyDetails?.wifiSsid || propertyDetails?.wifiPassword
        ? [propertyDetails?.wifiSsid, propertyDetails?.wifiPassword].filter(Boolean).join(" / ")
        : null;
    items.push({
      label: "Wi-Fi",
      value: wifiValue ?? securePlaceholder,
      helper: wifiValue ? "Townhouse network & password" : "Full details emailed before arrival",
    });

    items.push({
      label: "Garage",
      value: propertyDetails?.garageCode ?? securePlaceholder,
      helper: propertyDetails?.garageCode ? "Code + press enter" : "Code released 24h before check-in",
    });

    items.push({
      label: "Lockbox",
      value: propertyDetails?.lockboxCode ?? securePlaceholder,
      helper: propertyDetails?.lockboxCode ? "Backup key by garage entry" : undefined,
    });

    if (propertyDetails?.skiLockerDoorCode || propertyDetails?.skiLockerNumber || propertyDetails?.skiLockerCode) {
      items.push({
        label: "Ski locker",
        value: [
          propertyDetails?.skiLockerDoorCode ? `Door ${propertyDetails.skiLockerDoorCode}` : null,
          propertyDetails?.skiLockerNumber ? `Locker #${propertyDetails.skiLockerNumber}` : null,
        ]
          .filter(Boolean)
          .join(" · ") || securePlaceholder,
        helper: propertyDetails?.skiLockerCode ? `Locker code ${propertyDetails.skiLockerCode}` : undefined,
      });
    }

    if (hostContacts.length) {
      const hostNames = hostContacts.map((contact) => contact.name).filter(Boolean).join(" · ");
      const hostPhones = hostContacts.map((contact) => contact.phone).filter(Boolean).join(" • ");
      items.push({
        label: "Hosts",
        value: hostNames || "Your Bunks team",
        helper: hostPhones || booking.property.hostSupportEmail || supportFallback,
      });
    } else if (booking.property.hostSupportEmail) {
      items.push({
        label: "Hosts",
        value: "Bunks support",
        helper: booking.property.hostSupportEmail,
      });
    }

    return items;
  }, [booking, propertyDetails, hostContacts]);

  const guideUrl =
    booking?.property.checkInGuideUrl ??
    booking?.property.guestBookUrl ??
    (booking?.property.slug === "steamboat-downtown-townhome" ? "/Steamboat%20Brochure.pdf" : null);

  const sectionCopy: Record<BookingPortalSection, { eyebrow: string; title: string; description: string }> = {
    essential: {
      eyebrow: "Essential info",
      title: "Manage your stay and arrival codes",
      description: "Door codes, Wi-Fi, and support contacts live here once you verify your booking.",
    },
    guide: {
      eyebrow: "Guide book",
      title: "Plan the experience before wheels down",
      description: "Download the latest house manual, browse itineraries, and see what we love around town.",
    },
    messages: {
      eyebrow: "Messages",
      title: "Chat with your host in real time",
      description: "Every stay keeps a tidy inbox for confirmations and last-minute questions.",
    },
  };

  const canDismissLookupModal = Boolean(booking || lastLookup);

  const handleSwitchBooking = () => {
    setError(null);
    setIsLookupModalOpen(true);
  };

  const handleClearLookup = () => {
    setBooking(null);
    setLastLookup(null);
    setConversationSummary({ snippet: null, timestamp: null });
    setLookupReference("");
    setLookupEmail("");
    setError(null);
    autoLookupKey.current = null;
    onPersistLookup?.(null);
    setIsLookupModalOpen(true);
  };

  const renderLookupModal = () => {
    if (!isLookupModalOpen) {
      return null;
    }
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-8 backdrop-blur">
        <div className="relative w-full max-w-lg rounded-[32px] border border-slate-100 bg-white p-8 shadow-[0_45px_140px_rgba(15,23,42,0.45)]">
          {canDismissLookupModal && (
            <button
              type="button"
              onClick={() => setIsLookupModalOpen(false)}
              className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 hover:text-slate-900"
              aria-label="Close booking lookup"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Booking lookup</p>
          <h2 className="mt-2 font-serif text-3xl text-slate-900">Enter your reference + email</h2>
          <p className="mt-2 text-sm text-slate-500">
            We&apos;ll fetch your stay in a few seconds. Saved details will stay on this device until you clear them.
          </p>
          <form onSubmit={submitLookup} className="mt-6 space-y-4">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-600">Booking reference</span>
              <input
                type="text"
                value={lookupReference}
                onChange={(event) =>
                  setLookupReference(event.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 5))}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-lg font-semibold uppercase tracking-[0.3em] outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                placeholder="e.g. R57KF"
                inputMode="text"
                autoComplete="off"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-600">Email used on booking</span>
              <input
                type="email"
                value={lookupEmail}
                onChange={(event) => setLookupEmail(event.target.value)}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-base outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </label>
            <Button type="submit" isLoading={isLoading} className="w-full">
              View booking
            </Button>
            {lastLookup && !isLoading && (
              <Button
                type="button"
                variant="secondary"
                disabled={isLoading}
                onClick={() =>
                  void handleLookup({
                    bookingReference: lastLookup.bookingReference,
                    guestEmail: lastLookup.guestEmail,
                  })
                }
                className="w-full gap-2"
              >
                <RefreshCw className="h-4 w-4" /> Refresh with saved booking
              </Button>
            )}
          </form>
          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
              <AlertTriangle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
          {(booking || lastLookup) && (
            <button
              type="button"
              onClick={handleClearLookup}
              className="mt-4 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 underline"
            >
              Clear saved booking
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderNoBookingState = () => (
    <div className="rounded-[32px] border border-dashed border-slate-300 bg-white/70 px-6 py-10 text-center text-slate-500">
      <p className="text-base font-semibold text-slate-700">Look up your stay to see {sectionCopy[section].eyebrow.toLowerCase()}.</p>
      <p className="mt-2 text-sm">
        Your booking reference is in the confirmation email. We keep it on this device only.
      </p>
      <div className="mt-5 flex justify-center">
        <Button onClick={handleSwitchBooking}>Open lookup</Button>
      </div>
    </div>
  );

  const renderEssentialSection = () => {
    if (!booking) return renderNoBookingState();
    const mapProps = {
      propertyName: booking.property.name,
      location: propertyDetails?.location ?? booking.property.slug,
      address: propertyDetails?.address ?? booking.property.address,
    } satisfies EssentialMapProps;

    return (
      <section className="flex flex-col bg-white lg:min-h-screen lg:flex-row">
        <div className="order-1 flex w-full flex-col gap-8 px-6 py-8 lg:order-1 lg:h-screen lg:w-[34%] lg:max-w-[520px] lg:flex-shrink-0 lg:overflow-y-auto lg:px-12 lg:py-14">
          {!isLookupModalOpen && error && (
            <div className="flex items-start gap-2 rounded-3xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Essential info</p>
              <h2 className="mt-2 font-serif text-4xl text-slate-900">{booking.property.name}</h2>
              {stayRangeLabel && <p className="text-sm text-slate-500">{stayRangeLabel}</p>}
            </div>
            <div className="flex flex-wrap gap-3">
              {lastLookup && (
                <Button
                  type="button"
                  variant="secondary"
                  disabled={isLoading}
                  onClick={() =>
                    void handleLookup({
                      bookingReference: lastLookup.bookingReference,
                      guestEmail: lastLookup.guestEmail,
                    })
                  }
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" /> Refresh stay
                </Button>
              )}
              <Button variant="ghost" type="button" onClick={handleSwitchBooking} className="gap-2">
                Switch booking
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            {heroImage && (
              <div className="relative w-full overflow-hidden rounded-3xl">
                <div className="relative h-56 w-full">
                  <Image src={heroImage} alt={booking.property.name} fill className="object-cover" sizes="420px" />
                </div>
              </div>
            )}
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Booking #{referenceCode ?? booking.id}</p>
              <p className="text-2xl font-semibold text-slate-900">{booking.property.name}</p>
              <p className="text-sm text-slate-500">{propertyDetails?.location ?? booking.property.slug}</p>
            </div>
            <div className="flex flex-wrap gap-10 text-sm text-slate-600">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Stay</p>
                <p className="text-base font-semibold text-slate-900">{stayRangeLabel}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Guest</p>
                <p className="text-base font-semibold text-slate-900">{booking.guestName}</p>
              </div>
            </div>
            <div className="border-t border-[var(--color-border)] pt-4 text-sm text-slate-600">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Total</p>
              <p className="text-2xl font-semibold text-slate-900">
                {currencyFormatter.format(booking.totalPriceCents / 100)}
              </p>

            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Arrival tips</p>
              <div className="mt-3 space-y-5">
                {essentialItems.map((item) => (
                  <div key={item.label} className="border-t border-[var(--color-border)] pt-4 first:border-0 first:pt-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{item.label}</p>
                    <p className="text-lg font-semibold text-slate-900">{item.value}</p>
                    {item.helper && <p className="text-sm text-slate-500">{item.helper}</p>}
                  </div>
                ))}
              </div>
            </div>
            {guideUrl && (
              <a
                href={guideUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center text-sm font-semibold text-slate-900 underline"
              >
                Download your guidebook
              </a>
            )}
          </div>
        </div>

        <div className="order-2 w-full lg:hidden">
          <EssentialMap {...mapProps} className="h-[320px] w-full" />
        </div>

        <div className="order-3 hidden w-full lg:block lg:basis-[66%] lg:flex-shrink-0">
          <div className="lg:fixed lg:inset-y-0 lg:right-0 lg:h-screen lg:w-2/3">
            <EssentialMap {...mapProps} className="h-full w-full" />
          </div>
        </div>
      </section>
    );
  };

  const renderGuideSection = () => {
    if (!booking) return renderNoBookingState();
    return (
      <section className="max-w-7xl mx-auto w-full space-y-8">
        <div className="px-6 pt-8 lg:px-12">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Guide book</p>
          <h3 className="mt-2 font-serif text-4xl text-slate-900">Plan every moment in town</h3>
          <p className="text-sm text-slate-500">Hand-curated recommendations, arrival notes, and concierge contacts.</p>
          {guideUrl && (
            <a
              href={guideUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-900 underline"
            >
              Download the PDF guidebook
            </a>
          )}
        </div>
        {booking.property.slug === "steamboat-downtown-townhome" ? (
          <div className="px-6 lg:px-12 pb-12">
            <SteamboatGuestGuide showSecureDetails />
          </div>
        ) : (
          <div className="mx-6 lg:mx-12 rounded-[32px] border border-slate-200 bg-white/90 p-8 text-slate-600">
            <p>
              We&apos;re finalizing the digital guidebook for this property. In the meantime, the PDF linked above covers
              check-in instructions, our favorite restaurants, and concierge contacts.
            </p>
            <p className="mt-4 font-semibold text-slate-900">
              Need help? Text or email us anytime.
            </p>
          </div>
        )}
      </section>
    );
  };

  const renderMessagesSection = () => {
    if (!booking) return renderNoBookingState();
    return (
      <section className="flex flex-col bg-white lg:min-h-screen">
        <MessagesLayout
          variant="full-bleed"
          sidebar={(
            <div className="flex h-full flex-col">
              <div className="flex flex-col gap-4 border-b border-slate-100 p-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Inbox</p>
                  <h3 className="mt-2 font-serif text-2xl text-slate-900">Your stays</h3>
                </div>
                {!isLookupModalOpen && error && (
                  <div className="flex items-start gap-2 rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={() =>
                      void handleLookup(
                        lastLookup ?? {
                          bookingReference: referenceCode ?? booking.referenceCode,
                          guestEmail: booking.guestEmail,
                        },
                      )
                    }
                    disabled={isLoading}
                    className="flex-1 gap-2 text-xs"
                  >
                    <RefreshCw className="h-3 w-3" /> Refresh
                  </Button>
                  <Button variant="ghost" type="button" onClick={handleSwitchBooking} className="flex-1 gap-2 text-xs">
                    Switch
                  </Button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <MessageThreadList threads={messageThreads} activeThreadId={booking.id} />
              </div>
            </div>
          )}
          conversation={(
            <BookingMessages
              variant="clean"
              bookingId={booking.id}
              bookingReference={referenceCode}
              guestEmail={lastLookup?.guestEmail ?? booking.guestEmail}
              guestName={booking.guestName}
              propertyName={booking.property.name}
              hostSupportEmail={booking.property.hostSupportEmail ?? supportFallback}
              onConversationSummaryChange={handleConversationSummaryChange}
            />
          )}
          reservation={(
            <div className="flex h-full flex-col overflow-y-auto">
              {heroImage && (
                <div className="relative h-64 w-full shrink-0">
                  <Image src={heroImage} alt={booking.property.name} fill className="object-cover" sizes="400px" />
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 to-transparent p-6 flex items-end">
                    <h4 className="font-serif text-2xl text-white">{booking.property.name}</h4>
                  </div>
                </div>
              )}
              <div className="p-8 space-y-8">
                <div>
                  <p className="flex items-center gap-2 text-sm text-slate-500">
                    <MapPin className="h-4 w-4" /> {propertyDetails?.location ?? booking.property.slug}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-6 text-sm text-slate-600">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Check-in</p>
                      <p className="text-base font-semibold text-slate-900">{dateFormatter.format(new Date(booking.checkInDate))}</p>
                      <p className="text-xs text-slate-500">After {booking.property.checkInTime ?? "3:00 PM"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Check-out</p>
                      <p className="text-base font-semibold text-slate-900">{dateFormatter.format(new Date(booking.checkOutDate))}</p>
                      <p className="text-xs text-slate-500">By {booking.property.checkOutTime ?? "11:00 AM"}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Need help?</p>
                  <p className="text-sm text-slate-600">
                    Your host team is available via this chat or email.
                  </p>
                  <a href={`mailto:${booking.property.hostSupportEmail ?? supportFallback}`} className="block text-sm font-medium text-slate-900 underline">
                    {booking.property.hostSupportEmail ?? supportFallback}
                  </a>
                  {referenceCode && <p className="text-xs text-slate-400">Ref: {referenceCode}</p>}
                </div>
              </div>
            </div>
          )}
        />
      </section>
    );
  };

  const loadingBanner = isLoading ? (
    <div className="pointer-events-none fixed right-4 top-4 z-40 rounded-2xl border border-slate-200 bg-white/90 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500 shadow-xl">
      Updating stay…
    </div>
  ) : null;

  return (
    <div className={`relative ${booking ? "bg-white" : "bg-slate-50 pb-16"}`}>
      {renderLookupModal()}
      {loadingBanner}
      {booking ? (
        <div className="flex min-h-screen flex-col">
          {section === "essential" && renderEssentialSection()}
          {section === "guide" && renderGuideSection()}
          {section === "messages" && renderMessagesSection()}
        </div>
      ) : (
        <div className="mx-auto flex w-full max-w-[960px] flex-col gap-6 px-4 pb-12 pt-16 sm:px-6 lg:px-8">
          {!isLookupModalOpen && error && (
            <div className="flex items-start gap-2 rounded-3xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <AlertTriangle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
          {isLoading ? (
            <div className="rounded-[32px] border border-slate-200 bg-white px-6 py-8 text-center text-slate-500">
              Fetching your booking details...
            </div>
          ) : (
            !isLookupModalOpen && renderNoBookingState()
          )}
        </div>
      )}
    </div>
  );
}
