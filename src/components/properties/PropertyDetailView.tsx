"use client";

/* eslint-disable react/no-unescaped-entities */

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Bath,
  Bed,
  BedDouble,
  Car,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  DoorOpen,
  Image as ImageIcon,
  Info,
  Layers,
  MapPin,
  Star,
  Tag,
  Users,
  Wifi,
  X,
} from "lucide-react";
import type { DateRange, NavigateHandler, PricingQuote, Property } from "@/types";
import { Calendar } from "@/components/shared/Calendar";
import { Button } from "@/components/shared/Button";
import { ImageLightbox } from "@/components/shared/ImageLightbox";
import { PROPERTY_REVIEWS } from "@/data/reviews";
import { api } from "@/lib/api";

interface PropertyDetailViewProps {
  property: Property;
  bookingDates: DateRange;
  onSelectDates: (range: DateRange) => void;
  guestCount: number;
  onGuestCountChange: (count: number) => void;
  onNavigate: NavigateHandler;
}

interface GalleryItem {
  id: string;
  src: string;
  label: string;
  description?: string;
  globalIndex: number;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

const calculateNights = (range: DateRange) => {
  if (!range.start || !range.end) return 0;
  const diff = range.end.getTime() - range.start.getTime();
  if (diff <= 0) {
    return 0;
  }
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

const formatRangeSummary = (range: DateRange) => {
  if (!range.start || !range.end) return "";
  const sameMonth =
    range.start.getMonth() === range.end.getMonth() && range.start.getFullYear() === range.end.getFullYear();
  const startDay = range.start.toLocaleDateString("en-GB", { day: "numeric" });
  const startMonth = range.start.toLocaleDateString("en-GB", { month: "short" });
  const endDay = range.end.toLocaleDateString("en-GB", { day: "numeric" });
  const endMonth = range.end.toLocaleDateString("en-GB", { month: "short" });

  if (sameMonth) {
    return `${startDay}–${endDay} ${startMonth}`;
  }

  return `${startDay} ${startMonth} – ${endDay} ${endMonth}`;
};

const formatDateField = (date: Date | null) =>
  date ? date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Add date";

const noopSelectDates: (range: DateRange) => void = () => { };

export function PropertyDetailView({
  property,
  bookingDates,
  onSelectDates,
  guestCount,
  onGuestCountChange,
  onNavigate,
}: PropertyDetailViewProps) {
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [pendingRange, setPendingRange] = useState<DateRange>({ start: bookingDates.start, end: bookingDates.end });
  const [isMobile, setIsMobile] = useState(false);
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const propertyReviews = PROPERTY_REVIEWS[property.slug] ?? [];
  const comparableNightlyRate = Math.ceil((property.price * 1.1) / 10) * 10;
  const nightlyRateLabel = formatCurrency(property.price);
  const comparableRateLabel = formatCurrency(comparableNightlyRate);
  const reviewCount = property.reviews;
  const savingsCopy = "Save 10% compared to the same listing on other platforms";
  const modalActive = calendarOpen || reviewsOpen;
  const [quote, setQuote] = useState<PricingQuote | null>(null);
  const [pendingQuote, setPendingQuote] = useState<PricingQuote | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);

  // Fetch quote for confirmed dates (Booking Sidebar)
  useEffect(() => {
    let isMounted = true;
    const fetchQuote = async () => {
      if (!bookingDates.start || !bookingDates.end) {
        if (isMounted) setQuote(null);
        return;
      }
      setIsLoadingQuote(true);
      try {
        const res = await fetch(`/api/properties/${property.slug}/check-availability`, {
          method: 'POST',
          body: JSON.stringify({
            checkIn: bookingDates.start.toISOString(),
            checkOut: bookingDates.end.toISOString(),
            guests: guestCount
          })
        });
        const data = await res.json();
        if (isMounted && data.quote) {
          setQuote(data.quote);
        } else if (isMounted) {
          setQuote(null);
        }
      } catch (e) {
        console.error("Failed to fetch quote", e);
      } finally {
        if (isMounted) setIsLoadingQuote(false);
      }
    };
    fetchQuote();
    return () => { isMounted = false; };
  }, [bookingDates, property.slug, guestCount]);

  // Fetch quote for pending dates (Calendar Overlay)
  useEffect(() => {
    let isMounted = true;
    const fetchPendingQuote = async () => {
      if (!pendingRange.start || !pendingRange.end) {
        if (isMounted) setPendingQuote(null);
        return;
      }
      // Simple debounce could be added here if needed, but for now direct fetch is okay
      try {
        const res = await fetch(`/api/properties/${property.slug}/check-availability`, {
          method: 'POST',
          body: JSON.stringify({
            checkIn: pendingRange.start.toISOString(),
            checkOut: pendingRange.end.toISOString(),
            guests: guestCount
          })
        });
        const data = await res.json();
        if (isMounted && data.quote) {
          setPendingQuote(data.quote);
        } else if (isMounted) {
          setPendingQuote(null);
        }
      } catch (e) {
        // Silently fail or just clear quote
        if (isMounted) setPendingQuote(null);
      }
    };

    // reset pending quote when dates become invalid/incomplete
    if (!pendingRange.start || !pendingRange.end) {
      setPendingQuote(null);
    } else {
      const timer = setTimeout(fetchPendingQuote, 200); // 200ms debounce
      return () => {
        isMounted = false;
        clearTimeout(timer);
      };
    }
  }, [pendingRange, property.slug, guestCount]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const updateMatch = () => setIsMobile(mediaQuery.matches);
    updateMatch();
    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", updateMatch);
      return () => mediaQuery.removeEventListener("change", updateMatch);
    }
    mediaQuery.addListener(updateMatch);
    return () => mediaQuery.removeListener(updateMatch);
  }, []);

  useEffect(() => {
    if (!modalActive || typeof document === "undefined") {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [modalActive]);

  const canBook = Boolean(bookingDates.start && bookingDates.end);
  const confirmedNights = calculateNights(bookingDates);
  const pendingNights = calculateNights(pendingRange);

  // Calculate Display Prices
  // If Quote is available, it's already discounted. Use it directly.
  // If static, apply 0.9 discount manually.

  const displayTotal = quote
    ? (quote.totalPriceCents / 100)
    : (confirmedNights * property.price * 0.9);

  // For the "Original" (strikethrough) price:
  // If Quote: approximate original by using undiscounted nightly rates + current fees (conservative estimate)
  // If Static: standard nightly rate * nights
  const originalTotal = quote
    ? (quote.undiscountedNightlySubtotalCents + quote.cleaningFeeCents + quote.serviceFeeCents + quote.taxCents) / 100
    : (confirmedNights * property.price);

  // Pending total: Use pendingQuote if available, else static
  const pendingDisplayTotal = pendingQuote
    ? (pendingQuote.totalPriceCents / 100)
    : (pendingNights * property.price * 0.9);

  const pendingOriginalTotal = pendingQuote
    ? (pendingQuote.undiscountedNightlySubtotalCents + pendingQuote.cleaningFeeCents + pendingQuote.serviceFeeCents + pendingQuote.taxCents) / 100
    : (pendingNights * property.price);

  const confirmedRangeSummary = formatRangeSummary(bookingDates);
  const dateSummaryLabel = canBook ? `for ${confirmedNights} night${confirmedNights > 1 ? "s" : ""}${confirmedRangeSummary ? ` · ${confirmedRangeSummary}` : ""
    }` : "";

  const openCalendarOverlay = () => {
    setPendingRange({ start: bookingDates.start, end: bookingDates.end });
    setPendingQuote(quote); // Initialize with existing quote if matches
    setCalendarOpen(true);
  };

  const closeCalendarOverlay = () => setCalendarOpen(false);

  const clearPendingRange = () => {
    setPendingRange({ start: null, end: null });
    setPendingQuote(null);
  };

  const handleSavePendingRange = () => {
    if (!pendingRange.start || !pendingRange.end) return;
    onSelectDates(pendingRange);
    setCalendarOpen(false);
  };

  const openReviewsModal = () => setReviewsOpen(true);
  const closeReviewsModal = () => setReviewsOpen(false);

  const hasPendingSelection = Boolean(pendingRange.start && pendingRange.end);
  const pendingSummary = pendingNights
    ? `${formatCurrency(pendingDisplayTotal)} for ${pendingNights} night${pendingNights > 1 ? "s" : ""}`
    : "Add dates for prices";

  const checkInLabel = formatDateField(bookingDates.start);
  const checkOutLabel = formatDateField(bookingDates.end);
  const footerPrimaryText = canBook ? formatCurrency(displayTotal) : "Add dates for prices";
  const footerSecondaryText = canBook && dateSummaryLabel ? dateSummaryLabel : "Select dates to unlock tailored pricing";
  const reviewCountLabel = `${reviewCount} review${reviewCount === 1 ? "" : "s"}`;
  const hasPropertyReviews = propertyReviews.length > 0;

  const galleryFromGroups =
    property.photoGroups?.flatMap((group) =>
      group.images.map((src, index) => ({
        id: `${property.slug}-${group.title}-${index}`,
        src,
        label: group.title,
        description: group.description,
      })),
    ) ?? [];

  const fallbackGallerySources = property.images?.length
    ? property.images
    : property.image
      ? [property.image]
      : [];

  const fallbackGalleryItems = fallbackGallerySources.map((src, index) => ({
    id: `${property.slug}-fallback-${index}`,
    src,
    label: property.name,
  }));

  const galleryBase = galleryFromGroups.length ? galleryFromGroups : fallbackGalleryItems;
  const gallery: GalleryItem[] = galleryBase.map((item, index) => ({
    ...item,
    globalIndex: index,
  }));

  const galleryIndexLookup = new Map(gallery.map((item) => [item.id, item.globalIndex]));

  const openLightboxAt = (index: number) => {
    if (!gallery.length) return;
    setLightboxIndex(index);
  };

  const closeLightbox = () => setLightboxIndex(null);

  const primaryTile = gallery[0];
  const secondaryTile = gallery[1];
  const tertiaryTile = gallery[2];
  const lightboxItems = gallery.map(({ src, label, description }) => ({
    src,
    label,
    description,
  }));

  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in ${isMobile ? "pb-32" : ""}`}>
      <button
        onClick={() => onNavigate("home")}
        className="flex items-center text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Back to collection
      </button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-2xl overflow-hidden h-[500px] mb-12">
        {primaryTile && (
          <div className="md:col-span-2 h-full bg-gray-100">
            <button
              type="button"
              onClick={() => openLightboxAt(primaryTile.globalIndex)}
              className="group w-full h-full block overflow-hidden"
            >
              <div className="relative w-full h-full">
                <Image
                  src={primaryTile.src}
                  alt={`${primaryTile.label} primary photo`}
                  fill
                  sizes="(max-width: 768px) 100vw, 66vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <span className="sr-only">Open {primaryTile.label} photo</span>
            </button>
          </div>
        )}
        {(secondaryTile || tertiaryTile) && (
          <div className="flex flex-col gap-4 h-full">
            {secondaryTile && (
              <div className="h-1/2 bg-gray-100 overflow-hidden">
                <button
                  type="button"
                  onClick={() => openLightboxAt(secondaryTile.globalIndex)}
                  className="group w-full h-full block overflow-hidden"
                >
                  <div className="relative w-full h-full">
                    <Image
                      src={secondaryTile.src}
                      alt={`${secondaryTile.label} secondary photo`}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <span className="sr-only">Open {secondaryTile.label} photo</span>
                </button>
              </div>
            )}
            {tertiaryTile && (
              <div className="h-1/2 bg-gray-100 overflow-hidden relative">
                <button
                  type="button"
                  onClick={() => openLightboxAt(tertiaryTile.globalIndex)}
                  className="group w-full h-full block overflow-hidden"
                >
                  <div className="relative w-full h-full">
                    <Image
                      src={tertiaryTile.src}
                      alt={`${tertiaryTile.label} tertiary photo`}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <span className="sr-only">Open {tertiaryTile.label} photo</span>
                </button>
                <button
                  type="button"
                  onClick={() => openLightboxAt(0)}
                  className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-4 py-2 rounded-lg text-sm font-medium hover:bg-white transition-colors"
                >
                  View All Photos
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl text-gray-900 mb-2">
                {property.name}
              </h1>
              <p className="text-gray-500 flex items-center gap-2">
                <MapPin className="w-4 h-4" /> {property.location}
              </p>
            </div>
            <div className="text-right hidden sm:block shrink-0">
              <div className="flex items-center gap-1 justify-end mb-1">
                <Star className="w-4 h-4 fill-current text-gray-900" />
                <span className="font-medium text-lg">{property.rating}</span>
              </div>
              <button
                type="button"
                onClick={openReviewsModal}
                className="text-sm text-gray-500 underline underline-offset-4 decoration-dotted hover:text-gray-900 whitespace-nowrap"
              >
                {reviewCountLabel}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-6 py-6 border-y border-gray-200 mb-8">
            <span className="flex items-center gap-2 text-gray-600">
              <Users className="w-5 h-5" /> {property.guests} Guests
            </span>
            <span className="flex items-center gap-2 text-gray-600">
              <Bed className="w-5 h-5" /> {property.bedrooms} Bedrooms
            </span>
            {property.beds && (
              <span className="flex items-center gap-2 text-gray-600">
                <BedDouble className="w-5 h-5" /> {property.beds} Beds
              </span>
            )}
            <span className="flex items-center gap-2 text-gray-600">
              <Bath className="w-5 h-5" /> {property.bathrooms} Bathrooms
            </span>
          </div>

          <div className="mb-12">
            <h2 className="font-serif text-2xl text-gray-900 mb-4">About this space</h2>
            <p className="text-gray-600 leading-relaxed text-lg">{property.description}</p>
            {property.heroTagline && (
              <p className="text-gray-500 mt-4 text-base leading-relaxed">{property.heroTagline}</p>
            )}
          </div>

          {property.highlights?.length ? (
            <div className="mb-12">
              <h2 className="font-serif text-2xl text-gray-900 mb-4">Why you'll love it</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {property.highlights.map((highlight) => (
                  <div key={highlight} className="flex items-start gap-3 p-4 bg-white border border-gray-200 rounded-2xl shadow-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <p className="text-gray-600">{highlight}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {property.aboutSections?.length ? (
            <div className="mb-12 space-y-8">
              {property.aboutSections.map((section) => (
                <div key={section.title} className="p-6 bg-gray-50 rounded-2xl border border-gray-200">
                  <h3 className="font-serif text-xl text-gray-900 mb-3">{section.title}</h3>
                  <div className="space-y-3 text-gray-600 leading-relaxed">
                    {section.body.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {property.sleepingArrangements?.length ? (
            <div className="mb-12">
              <h2 className="font-serif text-2xl text-gray-900 mb-6">Sleeping arrangements</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {property.sleepingArrangements.map((arrangement) => (
                  <div key={arrangement.title} className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
                    <div className="flex items-start gap-3 mb-3">
                      <Layers className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-semibold text-gray-900">{arrangement.title}</p>
                        <p className="text-sm text-gray-500">{arrangement.bedDetails}</p>
                      </div>
                    </div>
                    {arrangement.description && (
                      <p className="text-gray-600 text-sm leading-relaxed">{arrangement.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {property.guestAccess?.length || property.otherNotes?.length ? (
            <div className="mb-12 grid lg:grid-cols-2 gap-6">
              {property.guestAccess?.length ? (
                <div className="p-6 bg-gray-50 border border-gray-200 rounded-2xl">
                  <div className="flex items-center gap-3 mb-4">
                    <DoorOpen className="w-5 h-5 text-gray-500" />
                    <h3 className="font-serif text-xl text-gray-900">Guest access</h3>
                  </div>
                  <ul className="space-y-3 text-gray-600">
                    {property.guestAccess.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {property.otherNotes?.length ? (
                <div className="p-6 bg-white border border-gray-200 rounded-2xl">
                  <div className="flex items-center gap-3 mb-4">
                    <Info className="w-5 h-5 text-gray-500" />
                    <h3 className="font-serif text-xl text-gray-900">Good to know</h3>
                  </div>
                  <ul className="space-y-3 text-gray-600">
                    {property.otherNotes.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}

          {property.notices?.length ? (
            <div className="mb-12 space-y-6">
              {property.notices.map((notice) => (
                <div key={notice.title} className="border border-amber-200 rounded-2xl bg-amber-50/70 p-6">
                  <div className="flex items-start gap-3 mb-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    <h3 className="font-serif text-xl text-gray-900">{notice.title}</h3>
                  </div>
                  <div className="space-y-3 text-gray-700">
                    {notice.body.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {property.photoGroups?.length ? (
            <div className="mb-12 space-y-8">
              <h2 className="font-serif text-2xl text-gray-900">Room-by-room gallery</h2>
              {property.photoGroups.map((group) => (
                <div key={group.title} className="border border-gray-200 rounded-2xl p-6">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{group.title}</h3>
                      {group.description && (
                        <p className="text-sm text-gray-500">{group.description}</p>
                      )}
                    </div>
                    <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-gray-400">
                      <ImageIcon className="w-4 h-4" />
                      {group.images.length} photos
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {group.images.map((src, imageIndex) => (
                      <button
                        type="button"
                        key={src}
                        className="group h-32 rounded-xl overflow-hidden bg-gray-100"
                        onClick={() => {
                          const id = `${property.slug}-${group.title}-${imageIndex}`;
                          const targetIndex = galleryIndexLookup.get(id) ?? 0;
                          openLightboxAt(targetIndex);
                        }}
                      >
                        <div className="relative w-full h-full">
                          <Image
                            src={src}
                            alt={`${group.title} ${imageIndex + 1}`}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 12vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <span className="sr-only">Open {group.title} photo {imageIndex + 1}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          <div className="mb-12">
            <h2 className="font-serif text-2xl text-gray-900 mb-6">What this place offers</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {property.features.map((feature, index) => (
                <div key={feature} className="flex items-center gap-3 text-gray-600 p-4 bg-gray-50 rounded-xl">
                  {index % 2 === 0 ? <Wifi className="w-5 h-5" /> : <Car className="w-5 h-5" />}
                  {feature}
                </div>
              ))}
            </div>
          </div>

          <div className="mb-12" id="availability-calendar">
            <h2 className="font-serif text-2xl text-gray-900 mb-2">Availability</h2>
            <p className="text-sm text-gray-500">
              View blocked nights below. Tap anywhere on the calendar to open the interactive picker and lock your stay.
            </p>
            <div className="relative mt-4">
              <Calendar
                selectedRange={bookingDates}
                blockedDates={blockedDates}
                onSelectDates={noopSelectDates}
                variant="vertical"
                monthsToShow={8}
                className="opacity-90"
              />
              <button
                type="button"
                onClick={openCalendarOverlay}
                className="absolute inset-0 z-10 w-full h-full rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
                aria-label="Open date picker"
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xl shadow-gray-100/50 sticky top-24">
            <div className="flex justify-between items-start gap-3 mb-6">
              <div className="flex flex-col gap-1">
                <div className="flex items-baseline gap-3">
                  <span className="text-gray-400 line-through text-lg">{comparableRateLabel}</span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-serif text-2xl font-semibold text-gray-900">{nightlyRateLabel}</span>
                    <span className="text-gray-500">/ night</span>
                  </div>
                </div>
                <p className="text-xs uppercase tracking-widest text-emerald-600 font-semibold">Direct booking rate</p>
              </div>
              <button
                type="button"
                onClick={openReviewsModal}
                className="flex items-center gap-1 text-sm text-gray-500 underline decoration-dotted underline-offset-4 hover:text-gray-900"
              >
                <Star className="w-3 h-3 fill-current" />
                {property.rating}
                <span className="text-gray-400">({reviewCountLabel})</span>
              </button>
            </div>

            <div className="border border-gray-200 rounded-xl mb-6 overflow-hidden">
              <div className="grid grid-cols-2 border-b border-gray-200">
                <button
                  className="p-3 border-r border-gray-200 bg-white hover:bg-gray-50 cursor-pointer transition-colors text-left"
                  onClick={openCalendarOverlay}
                >
                  <label className="block text-xs font-bold text-gray-800 uppercase mb-1">
                    Check-in
                  </label>
                  <div className={`text-sm truncate ${bookingDates.start ? "text-gray-900" : "text-gray-400"}`}>
                    {checkInLabel}
                  </div>
                </button>
                <button
                  className="p-3 bg-white hover:bg-gray-50 cursor-pointer transition-colors text-left"
                  onClick={openCalendarOverlay}
                >
                  <label className="block text-xs font-bold text-gray-800 uppercase mb-1">
                    Check-out
                  </label>
                  <div className={`text-sm truncate ${bookingDates.end ? "text-gray-900" : "text-gray-400"}`}>
                    {checkOutLabel}
                  </div>
                </button>
              </div>
              <div className="p-3 bg-white hover:bg-gray-50 transition-colors">
                <label className="block text-xs font-bold text-gray-800 uppercase mb-1">
                  Guests
                </label>
                <div className="relative">
                  <select
                    className="w-full appearance-none text-sm text-gray-900 bg-transparent border-none outline-none p-0 pr-6 cursor-pointer"
                    value={guestCount}
                    onChange={(event) => onGuestCountChange(Number(event.target.value))}
                  >
                    {[...Array(property.guests)].map((_, idx) => (
                      <option key={idx} value={idx + 1}>
                        {idx + 1} guest{idx > 0 ? "s" : ""}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                </div>
              </div>
            </div>



            <Button
              onClick={() => (canBook ? onNavigate("booking") : openCalendarOverlay())}
              className="w-full mb-4"
            >
              {canBook ? "Reserve" : "Check availability"}
            </Button>
            <div className="mt-4 bg-emerald-50 rounded-2xl p-4 flex items-center justify-center gap-2">
              <Tag className="w-5 h-5 text-emerald-600 fill-emerald-600 rotate-90" />
              <p className="text-emerald-800 font-medium">{savingsCopy}</p>
            </div>
          </div>
        </div>
      </div>
      {calendarOpen && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-gray-900/70 px-0 sm:px-4">
          <div
            className={`bg-white w-full shadow-2xl flex flex-col ${isMobile ? "rounded-t-3xl max-h-[90vh] overflow-hidden" : "max-w-3xl rounded-3xl overflow-hidden"
              }`}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <div>
                <p className="font-semibold text-gray-900">Choose your stay</p>
                <p className="text-sm text-gray-500">Select check-in and check-out dates</p>
              </div>
              <button
                type="button"
                onClick={closeCalendarOverlay}
                className="p-2 rounded-full text-gray-500 hover:bg-gray-100"
                aria-label="Close calendar drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-4 py-4 overflow-y-auto max-h-[60vh] sm:max-h-[70vh]">
              <Calendar
                selectedRange={pendingRange}
                blockedDates={blockedDates}
                onSelectDates={setPendingRange}
                variant="vertical"
                monthsToShow={10}
                className="w-full"
              />
            </div>
            <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                {pendingNights ? (
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-stone-400 line-through decoration-stone-400">
                      {formatCurrency(pendingOriginalTotal)}
                    </p>
                    <p className="text-base font-semibold text-gray-900">
                      {formatCurrency(pendingDisplayTotal)} for {pendingNights} night{pendingNights > 1 ? "s" : ""}
                    </p>
                  </div>
                ) : (
                  <p className="text-base font-semibold text-gray-900">{pendingSummary}</p>
                )}
                {pendingNights ? (
                  <p className="text-sm text-gray-500">{formatRangeSummary(pendingRange)}</p>
                ) : (
                  <p className="text-sm text-gray-500">Tap nights to build your stay.</p>
                )}
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                {(pendingRange.start || pendingRange.end) && (
                  <button
                    type="button"
                    onClick={clearPendingRange}
                    className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:border-gray-400"
                  >
                    Clear
                  </button>
                )}
                <Button onClick={handleSavePendingRange} disabled={!hasPendingSelection} className="flex-1 sm:flex-none">
                  {hasPendingSelection ? "Save" : "Select dates"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {reviewsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/70 px-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <p className="font-serif text-xl text-gray-900">Guest reviews</p>
                <p className="text-sm text-gray-500">{reviewCountLabel} · Rated {property.rating}</p>
              </div>
              <button
                type="button"
                onClick={closeReviewsModal}
                className="p-2 rounded-full text-gray-500 hover:bg-gray-100"
                aria-label="Close reviews"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto divide-y divide-gray-100">
              {hasPropertyReviews ? (
                propertyReviews.map((review) => (
                  <div key={review.id} className="px-6 py-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{review.guestName}</p>
                        <p className="text-xs text-gray-500">Stayed {review.nights} night{review.nights > 1 ? "s" : ""} · {review.stayDate}</p>
                      </div>
                      <div className="flex items-center gap-1 text-amber-500 text-sm">
                        {Array.from({ length: Math.max(1, Math.round(review.rating)) }).map((_, idx) => (
                          <Star key={`${review.id}-star-${idx}`} className="w-4 h-4 fill-current" />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-600 leading-relaxed">{review.body}</p>
                  </div>
                ))
              ) : (
                <div className="px-6 py-8 text-center text-gray-500">No reviews yet for this listing.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {isMobile && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={openCalendarOverlay}
              className="text-left flex-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
              aria-label="Edit stay dates"
            >
              <div className="flex items-center gap-3">
                <div>
                  {canBook ? (
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-stone-400 line-through decoration-stone-400">
                        {formatCurrency(originalTotal)}
                      </p>
                      <p className="text-base font-semibold text-gray-900">
                        {formatCurrency(displayTotal)}
                      </p>
                    </div>
                  ) : (
                    <p className="text-base font-semibold text-gray-900">{footerPrimaryText}</p>
                  )}
                  <p className="text-xs text-gray-500">{footerSecondaryText}</p>
                </div>
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-900 underline">Edit</span>
              </div>
            </button>
            <Button
              onClick={() => (canBook ? onNavigate("booking") : openCalendarOverlay())}
              className="min-w-[140px]"
            >
              {canBook ? "Reserve" : "Check availability"}
            </Button>
          </div>
        </div>
      )}

      {lightboxIndex !== null && gallery.length > 0 && (
        <ImageLightbox
          key={`${property.slug}-lightbox-${lightboxIndex}`}
          items={lightboxItems}
          initialIndex={lightboxIndex ?? 0}
          title={property.name}
          onClose={closeLightbox}
        />
      )}
    </div>
  );
}
