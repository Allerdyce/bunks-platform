"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, MapPin, RefreshCw, X } from "lucide-react";
import type {
  BookingDetailsData,
  BookingLookupPayload,
  BookingPortalSection,
  NavigateHandler,
  TripAccessResponse,
} from "@/types";
import { Button } from "@/components/shared/Button";
import { SteamboatGuestGuide } from "@/components/guides/SteamboatGuestGuide";
import { api } from "@/lib/api";
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
  // Stay dates are calendar dates stored at UTC midnight, not local instants.
  timeZone: "UTC",
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

import { SUPPORT_EMAIL } from "@/lib/contact";

type EssentialMapProps = {
  propertyName: string;
  location?: string | null;
  address?: string | null;
  className?: string;
};

// Opens the address in the guest's maps app instead of shipping an interactive map
// library to every trip page.
function EssentialMap({ propertyName, location, address, className = "" }: EssentialMapProps) {
  const query = address || [propertyName, location].filter(Boolean).join(", ");
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  return (
    <div className={className}>
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
      >
        <MapPin className="h-4 w-4" /> Open in Google Maps
      </a>
    </div>
  );
}

const supportFallback = SUPPORT_EMAIL;
const BOOKING_REFERENCE_PATTERN = /^[A-Z0-9]{5}$/;

function normalizeBookingReferenceInput(raw: string) {
  if (!raw) return null;
  const alphanumeric = raw.replace(/[^A-Z0-9]/gi, "").toUpperCase();
  if (BOOKING_REFERENCE_PATTERN.test(alphanumeric)) {
    return alphanumeric;
  }
  return null;
}

export function BookingDetailsView({
  onNavigate,
  initialLookup,
  onPersistLookup,
  section = "essential",
}: BookingDetailsViewProps) {
  const [lookupReference, setLookupReference] = useState(
    initialLookup?.bookingReference ?? "",
  );
  const [lookupEmail, setLookupEmail] = useState(
    initialLookup?.guestEmail ?? "",
  );
  const [isLookupModalOpen, setIsLookupModalOpen] = useState(!initialLookup);
  const [booking, setBooking] = useState<BookingDetailsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastLookup, setLastLookup] = useState<PendingLookupState | null>(
    initialLookup ?? null,
  );
  const autoLookupKey = useRef<string | null>(null);
  const [conversationSummary, setConversationSummary] = useState<{
    snippet: string | null;
    timestamp: string | null;
  }>({ snippet: null, timestamp: null });

  const handleLookup = useCallback(
    async (lookup: PendingLookupState) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.fetchBookingDetails(
          lookup.bookingReference,
          lookup.guestEmail,
        );
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
    },
    [onPersistLookup],
  );

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
    void handleLookup({
      bookingReference: initialLookup.bookingReference,
      guestEmail: initialLookup.guestEmail,
    });
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
      setError(
        "Enter your booking reference (e.g., R57KF) and the email on file.",
      );
      return;
    }

    const success = await handleLookup({
      bookingReference: normalizedReference,
      guestEmail: normalizedEmail,
    });
    if (success) {
      setIsLookupModalOpen(false);
    }
  };

  // Door/lock codes are fetched per booking from the server (never bundled) and only for PAID stays.
  const [accessCodes, setAccessCodes] = useState<TripAccessResponse | null>(
    null,
  );
  const isPaidBooking = booking?.status === "PAID";
  const accessLookupRef =
    booking?.referenceCode ?? lastLookup?.bookingReference ?? null;
  const accessLookupEmail = lastLookup?.guestEmail ?? null;

  useEffect(() => {
    setAccessCodes(null);
    if (!isPaidBooking || !accessLookupRef || !accessLookupEmail) {
      return;
    }
    let cancelled = false;
    api
      .fetchTripAccessCodes(accessLookupRef, accessLookupEmail)
      .then((result) => {
        if (!cancelled) setAccessCodes(result);
      })
      .catch((accessError) => {
        console.error("Failed to load access codes", accessError);
        if (!cancelled) setAccessCodes({ available: false });
      });
    return () => {
      cancelled = true;
    };
  }, [isPaidBooking, accessLookupRef, accessLookupEmail]);

  const propertyDetails = useMemo(() => {
    if (!booking) return null;
    return getPropertyBySlug(booking.property.slug) ?? null;
  }, [booking]);

  const heroImage =
    propertyDetails?.image ?? propertyDetails?.images?.[0] ?? null;
  const referenceCode =
    booking?.referenceCode ?? lastLookup?.bookingReference ?? null;

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
        value: booking.secure?.address ?? propertyDetails?.location ?? booking.property.name,
        helper: booking.secure?.address
          ? (propertyDetails?.location ?? undefined)
          : "Full address shared once your booking is paid",
      },
      {
        label: "Check-in",
        value: booking.property.checkInTime ?? "3:00 PM",
        helper: "Self check-in",
      },
      {
        label: "Check-out",
        value: booking.property.checkOutTime ?? "11:00 AM",
        helper: "Please check out by this time",
      },
    ];

    const wifiValue =
      booking.secure?.wifiSsid || booking.secure?.wifiPassword
        ? [booking.secure?.wifiSsid, booking.secure?.wifiPassword]
            .filter(Boolean)
            .join(" / ")
        : null;
    items.push({
      label: "Wi-Fi",
      value: wifiValue ?? securePlaceholder,
      helper: wifiValue
        ? "Network / password"
        : "Full details emailed before arrival",
    });

    const codes =
      isPaidBooking && accessCodes?.available ? accessCodes.codes : null;
    if (!codes) {
      items.push({
        label: "Door codes",
        value: isPaidBooking
          ? "Released 24h before check-in"
          : "Available once your booking is confirmed",
        helper: isPaidBooking
          ? "Your access codes appear here 24 hours before check-in."
          : undefined,
      });
    } else {
      if (codes.garageCode) {
        items.push({ label: "Garage", value: codes.garageCode });
      }
      if (codes.lockboxCode) {
        items.push({ label: "Door code", value: codes.lockboxCode });
      }
      if (
        codes.skiLockerDoorCode ||
        codes.skiLockerNumber ||
        codes.skiLockerCode
      ) {
        items.push({
          label: "Ski locker",
          value:
            [
              codes.skiLockerDoorCode
                ? `Door ${codes.skiLockerDoorCode}`
                : null,
              codes.skiLockerNumber ? `Locker #${codes.skiLockerNumber}` : null,
            ]
              .filter(Boolean)
              .join(" · ") || securePlaceholder,
          helper: codes.skiLockerCode
            ? `Locker code ${codes.skiLockerCode}`
            : undefined,
        });
      }
      if (
        !codes.garageCode &&
        !codes.lockboxCode &&
        !codes.skiLockerDoorCode &&
        !codes.skiLockerCode
      ) {
        items.push({
          label: "Door codes",
          value: securePlaceholder,
          helper: "Message your host if you need them",
        });
      }
    }

    if (hostContacts.length) {
      const hostNames = hostContacts
        .map((contact) => contact.name)
        .filter(Boolean)
        .join(" · ");
      const hostPhones = hostContacts
        .map((contact) => contact.phone)
        .filter(Boolean)
        .join(" • ");
      items.push({
        label: "Hosts",
        value: hostNames || "Your Bunks team",
        helper:
          hostPhones || booking.property.hostSupportEmail || supportFallback,
      });
    } else if (booking.property.hostSupportEmail) {
      items.push({
        label: "Hosts",
        value: "Bunks support",
        helper: booking.property.hostSupportEmail,
      });
    }

    return items;
  }, [booking, propertyDetails, hostContacts, isPaidBooking, accessCodes]);

  const guideUrl = booking?.secure?.guideUrl ?? null;

  const sectionCopy: Record<
    BookingPortalSection,
    { eyebrow: string; title: string; description: string }
  > = {
    essential: {
      eyebrow: "Essential info",
      title: "Manage your stay and arrival codes",
      description:
        "Door codes, Wi-Fi, and support contacts live here once you verify your booking.",
    },
    guide: {
      eyebrow: "Guide book",
      title: "Plan the experience before wheels down",
      description:
        "Download the latest house manual, browse itineraries, and see what we love around town.",
    },
    messages: {
      eyebrow: "Messages",
      title: "Chat with your host in real time",
      description:
        "Every stay keeps a tidy inbox for confirmations and last-minute questions.",
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

  // Outside click / Escape: close over a loaded booking, otherwise leave for home.
  const dismissLookupModal = useCallback(() => {
    if (canDismissLookupModal) {
      setIsLookupModalOpen(false);
    } else {
      onNavigate("home");
    }
  }, [canDismissLookupModal, onNavigate]);

  useEffect(() => {
    if (!isLookupModalOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismissLookupModal();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isLookupModalOpen, dismissLookupModal]);

  const renderLookupModal = () => {
    if (!isLookupModalOpen) {
      return null;
    }
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 px-4 py-8 backdrop-blur"
        onClick={(event) => {
          if (event.target === event.currentTarget) dismissLookupModal();
        }}
      >
        <div className="relative w-full max-w-lg rounded-xl border border-gray-200 bg-[var(--color-surface)] p-6 sm:p-10 shadow-[var(--shadow-floating)]">
          {canDismissLookupModal && (
            <button
              type="button"
              onClick={() => setIsLookupModalOpen(false)}
              className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-gray-200 text-gray-500 hover:text-gray-900"
              aria-label="Close booking lookup"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
            Booking lookup
          </p>
          <h2 className="mt-2 font-serif text-3xl text-gray-900">
            Your next stay starts here.
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            We&apos;ll fetch your stay in a few seconds. Saved details will stay
            on this device until you clear them.
          </p>
          <form onSubmit={submitLookup} className="mt-6 space-y-4">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-gray-600">
                Booking reference
              </span>
              <input
                type="text"
                value={lookupReference}
                onChange={(event) =>
                  setLookupReference(
                    event.target.value
                      .toUpperCase()
                      .replace(/[^A-Z0-9-]/g, "")
                      .slice(0, 5),
                  )
                }
                className="rounded-2xl border border-gray-200 px-4 py-3 text-lg font-semibold uppercase tracking-[0.12em] outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-200"
                placeholder="e.g. R57KF"
                inputMode="text"
                autoComplete="off"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-gray-600">
                Email used on booking
              </span>
              <input
                type="email"
                value={lookupEmail}
                onChange={(event) => setLookupEmail(event.target.value)}
                className="rounded-2xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-200"
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
              className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500 underline"
            >
              Clear saved booking
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderNoBookingState = () => (
    <div className="rounded-xl border border-dashed border-gray-300 bg-white/70 px-6 py-10 text-center text-gray-500">
      <p className="text-base font-semibold text-gray-700">
        Look up your stay to see {sectionCopy[section].eyebrow.toLowerCase()}.
      </p>
      <p className="mt-2 text-sm">
        Your booking reference is in the confirmation email. We keep it on this
        device only.
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
      address: booking.secure?.address ?? null,
    } satisfies EssentialMapProps;

    return (
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:py-14">
        <header className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-3xl">
            <p className="mb-3 text-sm font-semibold text-gray-500">
              Your stay · Booking {referenceCode ?? booking.id}
            </p>
            <h1 className="page-title">{booking.property.name}</h1>
            <p className="mt-4 text-base text-gray-600">{stayRangeLabel}</p>
          </div>
          <Button
            variant="secondary"
            type="button"
            onClick={handleSwitchBooking}
          >
            Switch booking
          </Button>
        </header>
        {!isLookupModalOpen && error && (
          <p
            role="alert"
            className="mb-6 rounded-xl bg-rose-50 p-4 text-rose-700"
          >
            {error}
          </p>
        )}
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-14">
          <div>
            {heroImage && (
              <div className="relative mb-8 aspect-[16/10] overflow-hidden rounded-xl">
                <Image
                  src={heroImage}
                  alt={booking.property.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 700px"
                />
              </div>
            )}
            <dl className="mb-10 grid grid-cols-2 gap-6 border-b pb-8">
              <div>
                <dt className="text-sm text-gray-500">Guest</dt>
                <dd className="mt-1 text-lg font-semibold">
                  {booking.guestName}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Booking total</dt>
                <dd className="mt-1 text-lg font-semibold">
                  {currencyFormatter.format(booking.totalPriceCents / 100)}
                </dd>
              </div>
            </dl>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <h2 className="section-heading">Arrive and settle in</h2>
              {lastLookup && (
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => void handleLookup(lastLookup)}
                  className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline underline-offset-4 disabled:opacity-50"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh details
                </button>
              )}
            </div>
            <dl className="grid gap-x-8 sm:grid-cols-2">
              {essentialItems.map((item) => (
                <div key={item.label} className="min-w-0 border-t py-6">
                  <dt className="mb-2 text-sm text-gray-500">{item.label}</dt>
                  <dd className="break-words text-lg font-medium leading-relaxed">
                    {item.value}
                  </dd>
                  {item.helper && (
                    <dd className="mt-2 break-words text-sm leading-relaxed text-gray-500">
                      {item.helper}
                    </dd>
                  )}
                </div>
              ))}
            </dl>
          </div>
          <aside className="space-y-8">
            <div className="overflow-hidden rounded-xl border bg-white">
              <div className="p-6">
                <h2 className="section-heading">Find your way here</h2>
                <p className="mt-2 text-base leading-relaxed text-gray-600">
                  {mapProps.address ?? propertyDetails?.location}
                </p>
              </div>
              <EssentialMap {...mapProps} className="px-6 pb-6" />
            </div>
            <div className="rounded-xl bg-gray-100 p-7 sm:p-8">
              <h2 className="font-serif text-3xl font-normal">
                Make yourself at home.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-gray-600">
                A little local knowledge goes a long way. Your guide brings the
                details together for an easier stay.
              </p>
              {guideUrl && (
                <a
                  href={guideUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="marketing-button mt-6"
                >
                  Open your guidebook
                </a>
              )}
              <a
                href={`mailto:${booking.property.hostSupportEmail ?? supportFallback}`}
                className="mt-5 block break-words text-sm font-semibold underline underline-offset-4"
              >
                Email your host
              </a>
            </div>
          </aside>
        </div>
      </section>
    );
  };

  const renderGuideSection = () => {
    if (!booking) return renderNoBookingState();
    return (
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:py-14">
        <div className="mb-12 grid overflow-hidden rounded-xl bg-gray-100 md:grid-cols-2">
          <div className="flex flex-col items-start justify-center p-7 sm:p-12">
            <p className="mb-4 text-sm font-semibold text-gray-600">
              Your guide to {propertyDetails?.location ?? booking.property.name}
            </p>
            <h1 className="page-title">A little local knowledge.</h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-gray-600">
              Settle in, find your favorites, and make the most of your time
              here.
            </p>
            {guideUrl && (
              <a
                href={guideUrl}
                target="_blank"
                rel="noreferrer"
                className="marketing-button mt-8"
              >
                Open your guidebook
              </a>
            )}
          </div>
          {heroImage && (
            <div className="relative min-h-[260px] md:min-h-[440px]">
              <Image
                src={heroImage}
                alt={booking.property.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 640px"
              />
            </div>
          )}
        </div>
        {booking.property.slug === "steamboat-downtown-townhome" ? (
          <SteamboatGuestGuide secure={booking.secure ?? null} />
        ) : (
          <div className="grid gap-8 border-t py-8 md:grid-cols-2 md:gap-16">
            <div>
              <h2 className="section-heading">The details for your stay</h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-gray-600">
                {guideUrl
                  ? "Your guidebook is ready to open above. We’re still putting the finishing touches on the digital guide here."
                  : "We’re putting the finishing touches on your digital guide. Your host can help with recommendations and questions in the meantime."}
              </p>
            </div>
            <div>
              <h2 className="section-heading">A question for your host?</h2>
              <p className="mt-4 text-base leading-relaxed text-gray-600">
                Use Messages for anything about your stay, or get in touch by
                email.
              </p>
              <a
                href={`mailto:${booking.property.hostSupportEmail ?? supportFallback}`}
                className="mt-5 inline-flex min-h-11 items-center font-semibold underline underline-offset-4"
              >
                Email your host
              </a>
            </div>
          </div>
        )}
      </section>
    );
  };

  const loadingBanner = isLoading ? (
    <div className="pointer-events-none fixed right-4 top-4 z-40 rounded-2xl border border-gray-200 bg-white/90 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 shadow-xl">
      Updating stay…
    </div>
  ) : null;

  return (
    <div className="relative bg-[var(--color-surface)] pb-8">
      {renderLookupModal()}
      {loadingBanner}
      {booking ? (
        <div className="flex min-h-screen flex-col">
          {(section === "essential" || section === "messages") && renderEssentialSection()}
          {section === "guide" && renderGuideSection()}
        </div>
      ) : (
        <div className="mx-auto flex w-full max-w-[960px] flex-col gap-6 px-4 pb-12 pt-16 sm:px-6 lg:px-8">
          {!isLookupModalOpen && error && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <AlertTriangle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
          {isLoading ? (
            <div className="rounded-xl border border-gray-200 bg-white px-6 py-8 text-center text-gray-500">
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
