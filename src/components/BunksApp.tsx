"use client";

/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type {
  BookingLookupPayload,
  BookingPortalSection,
  DateRange,
  JournalPost,
  Property,
  ViewState,
} from "@/types";
import { Layout } from "@/components/layout/Layout";
import { HomeView } from "@/components/home/HomeView";
import { HomeCtaBanner } from "@/components/home/HomeCtaBanner";
import { PropertyDetailView } from "@/components/properties/PropertyDetailView";
import { BookingContainer } from "@/components/booking/BookingContainer";
import { SuccessView } from "@/components/views/SuccessView";
import { AboutView } from "@/components/views/AboutView";
import { JournalView } from "@/components/views/JournalView";
import { BlogPostView } from "@/components/views/BlogPostView";
import { BookingDetailsView } from "@/components/views/BookingDetailsView";
import { LoaderScreen } from "@/components/shared/LoaderScreen";
import { PROPERTIES } from "@/data/properties";
import { JOURNAL_POSTS } from "@/data/journal";

interface BunksAppProps {
  properties?: Property[];
}

const initialRange: DateRange = {
  start: null,
  end: null,
};

const PATH_TO_CANONICAL_SLUG: Record<string, string> = {
  steamboat: "steamboat-downtown-townhome",
  summerland: "summerland-ocean-view-beach-bungalow",
};

const CANONICAL_TO_PATH_SLUG: Record<string, string> = Object.entries(PATH_TO_CANONICAL_SLUG).reduce(
  (acc, [pathSlug, canonicalSlug]) => {
    acc[canonicalSlug] = pathSlug;
    return acc;
  },
  {} as Record<string, string>,
);

const getCanonicalSlugFromPath = (slug: string | null) => {
  if (!slug) return null;
  return PATH_TO_CANONICAL_SLUG[slug] ?? slug;
};

const getPathSlugFromCanonical = (slug: string | null) => {
  if (!slug) return null;
  return CANONICAL_TO_PATH_SLUG[slug] ?? slug;
};

// --- Stripe + Firebase scaffolding ---
// Stripe Elements is wired via `lib/stripePlaceholder`, which now wraps the real @stripe/* packages in sandbox mode.
// Ensure NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY, and STRIPE_WEBHOOK_SECRET are present in env files.
// Firebase remains optional — provide NEXT_PUBLIC_FIREBASE_CONFIG to enable anonymous analytics.

let auth: any;
let signInAnonymously: any;

try {
  const { initializeApp } = require("firebase/app");
  const { getAuth, signInAnonymously: signInAnon } = require("firebase/auth");
  const { getFirestore } = require("firebase/firestore");

  const rawConfig =
    typeof process !== "undefined" && process.env?.NEXT_PUBLIC_FIREBASE_CONFIG
      ? process.env.NEXT_PUBLIC_FIREBASE_CONFIG
      : typeof (globalThis as any).__firebase_config !== "undefined"
        ? (globalThis as any).__firebase_config
        : null;

  if (rawConfig) {
    const config = typeof rawConfig === "string" ? JSON.parse(rawConfig) : rawConfig;
    const app = initializeApp(config);
    auth = getAuth(app);
    getFirestore(app);
    signInAnonymously = signInAnon;
  }
} catch (error) {
  console.warn("Firebase not initialized (preview mode or missing config). Analytics disabled.", error);
}

const BOOKING_LOOKUP_STORAGE_KEY = "bunks:lastBookingLookup";

export function BunksApp({ properties: hydratedProperties }: BunksAppProps) {
  const properties = useMemo(() => (hydratedProperties?.length ? hydratedProperties : PROPERTIES), [hydratedProperties]);
  const [view, setView] = useState<ViewState>("home");
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [selectedPost, setSelectedPost] = useState<JournalPost | null>(null);
  const lastPostSlugRef = useRef<string | null>(null);
  const [bookingDates, setBookingDates] = useState<DateRange>(initialRange);
  const [guestCount, setGuestCount] = useState(1);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [recentBookingLookup, setRecentBookingLookup] = useState<BookingLookupPayload | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isMessagesRoute = pathname?.startsWith("/my-trips") ?? false;
  const bookingSection: BookingPortalSection | null = useMemo(() => {
    if (!isMessagesRoute || !pathname) return null;
    if (pathname === "/my-trips" || pathname === "/my-trips/essential") return "essential";
    if (pathname.startsWith("/my-trips/guide")) return "guide";
    return "messages";
  }, [isMessagesRoute, pathname]);

  const propertyIndex = useMemo(() => new Map(properties.map((p) => [p.slug, p])), [properties]);

  const pathPropertySlug = useMemo(() => {
    if (!pathname) return null;
    const match = pathname.match(/\/property\/([a-z0-9-]+)/);
    return match ? (match[1] as string) : null;
  }, [pathname]);

  const queryPropertySlug = searchParams?.get("slug") ?? null;
  const activePropertySlug = (pathPropertySlug ? getCanonicalSlugFromPath(pathPropertySlug) : null) ?? queryPropertySlug ?? null;

  // Persist booking state
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedDates = localStorage.getItem("bunks:bookingDates");
      const storedGuests = localStorage.getItem("bunks:guestCount");
      if (storedDates) {
        try {
          const parsed = JSON.parse(storedDates);
          if (parsed.start) parsed.start = new Date(parsed.start);
          if (parsed.end) parsed.end = new Date(parsed.end);
          setBookingDates(parsed);
        } catch { }
      }
      if (storedGuests) {
        setGuestCount(parseInt(storedGuests, 10));
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (bookingDates.start && bookingDates.end) {
        localStorage.setItem("bunks:bookingDates", JSON.stringify(bookingDates));
      } else {
        localStorage.removeItem("bunks:bookingDates");
      }
      localStorage.setItem("bunks:guestCount", guestCount.toString());
    }
  }, [bookingDates, guestCount]);

  const resetBookingState = useCallback(() => {
    // Only reset if we truly want to clear (e.g. switching properties)
    // For now, let's keep it to clearing local state, but persistence will handle re-init
    if (typeof window !== "undefined") {
      localStorage.removeItem("bunks:bookingDates");
      localStorage.removeItem("bunks:guestCount");
    }
    setBookingDates(initialRange);
    setGuestCount(1);
  }, []);

  // ... (keep existing persistence logic for booking lookup)

  const persistBookingLookup = useCallback((lookup: BookingLookupPayload | null) => {
    setRecentBookingLookup(lookup);
    if (typeof window !== "undefined") {
      if (lookup) {
        localStorage.setItem(BOOKING_LOOKUP_STORAGE_KEY, JSON.stringify(lookup));
      } else {
        localStorage.removeItem(BOOKING_LOOKUP_STORAGE_KEY);
      }
    }
  }, []);

  // ...

  useEffect(() => {
    if (isMessagesRoute) {
      if (selectedProperty) {
        setSelectedProperty(null);
        // Don't reset booking state here unnecessarily if we want to return? 
        // Actually for messages route we probably don't care about the cart.
      }
      if (selectedPost) {
        setSelectedPost(null);
      }
      const targetView: ViewState = bookingSection ? (`booking-${bookingSection}` as ViewState) : "booking-details";
      if (view !== targetView) {
        setView(targetView);
      }
      return;
    }

    if (!searchParams) return;
    if (view === "blog-post") return;
    if (activePropertySlug && view !== "booking") {
      // Optimization: if we are on a property slug, and view is 'booking', 
      // we normally want to stay there unless params explicitly say otherwise.
      // But the check below handles viewParams.
      // Let's allow the viewParam check to run even if activePropertySlug is present.
    }

    // Explicitly check param
    const viewParam = searchParams.get("view") as ViewState | null;
    const allowedViews: ViewState[] = ["home", "about", "journal", "booking", "booking-details", "booking-essential", "booking-guide", "booking-messages"]; // Added "booking"

    if (viewParam && allowedViews.includes(viewParam)) {
      if (viewParam !== view) {
        // ... (Logic to clear other states)
        if (viewParam === "home" || viewParam === "about" || viewParam === "journal" || viewParam === "booking-details") {
          // ...
        }
        // Special handling for booking: ensure property is selected?
        if (viewParam === "booking" && activePropertySlug) {
          // Ensure property is set.
          const prop = propertyIndex.get(activePropertySlug);
          if (selectedProperty?.slug !== activePropertySlug && prop) {
            setSelectedProperty(prop);
          }
        }
        setView(viewParam);
      }
      return;
    }

    // ... default logic ...
  }, [activePropertySlug, isMessagesRoute, searchParams, view, selectedProperty, selectedPost, resetBookingState, bookingSection, propertyIndex]);

  // ... 

  const handleNavigate = (target: ViewState, payload?: unknown) => {
    if (["home", "listings", "about", "journal", "booking-details", "booking-essential", "booking-guide", "booking-messages"].includes(target)) {
      setSelectedProperty(null);
      setSelectedPost(null);
      resetBookingState();
    }

    if (target === "property" && payload && typeof payload === "object") {
      const propertyPayload = payload as Property;
      setSelectedProperty(propertyPayload);
      resetBookingState();
      setView("property");
      updateUrlState({ slug: propertyPayload.slug, view: null, post: null }, "push", { scroll: false });
    }

    if (target === "booking" && selectedProperty) {
      // Explicitly set view='booking'
      updateUrlState({ slug: selectedProperty.slug, post: null, view: "booking" }, "push", { scroll: false });
      setView("booking");
    }

    // ... (rest of handler)

    if (target === "home") {
      updateUrlState({ slug: null, view: null, post: null }, "replace", { scroll: false });
    }

    if (target === "about") {
      updateUrlState({ slug: null, view: "about", post: null }, "replace", { scroll: false });
    }

    if (target === "journal") {
      updateUrlState({ slug: null, view: "journal", post: null }, "replace", { scroll: false });
    }

    if (
      target === "booking-details" ||
      target === "booking-essential" ||
      target === "booking-guide" ||
      target === "booking-messages"
    ) {
      updateUrlState({ slug: null, view: target, post: null }, "replace", { scroll: false });
    }

    if (target === "blog-post" && payload) {
      setSelectedPost(payload as JournalPost);
      const postPayload = payload as JournalPost;
      updateUrlState({ slug: null, view: null, post: postPayload.slug }, "push", { scroll: false });
    }

    if (target === "listings") {
      updateUrlState({ slug: null, view: null, post: null }, "replace", { scroll: false });
      setView("home");
      setTimeout(() => {
        const el = document.getElementById("listings");
        el?.scrollIntoView({ behavior: "smooth" });
      }, 100);
      return;
    }

    setView(target);
    // Scroll handled by useEffect on view change
  };

  if (loadingAuth) {
    return <LoaderScreen />;
  }

  const isBookingViewState = view === "booking-details" || (typeof view === "string" && view.startsWith("booking-"));

  return (
    <Layout
      onNavigate={handleNavigate}
      currentView={view}
      bookingSection={bookingSection}
      bookingRef={pathBookingRef}
      hideFooter={isBookingViewState}
    >
      {view === "home" && (
        <>
          <HomeView properties={properties} onSelectProperty={(property) => handleNavigate("property", property)} />
          <HomeCtaBanner onNavigate={handleNavigate} />
        </>
      )}

      {view === "about" && <AboutView onNavigate={handleNavigate} />}

      {view === "journal" && (
        <JournalView
          posts={JOURNAL_POSTS}
          onNavigate={handleNavigate}
          onOpenPost={(post) => handleNavigate("blog-post", post)}
        />
      )}

      {view === "blog-post" && selectedPost && (
        <BlogPostView
          post={selectedPost}
          relatedPosts={JOURNAL_POSTS.filter((post) => post.id !== selectedPost.id).slice(0, 2)}
          onBack={() => handleNavigate("journal")}
          onOpenPost={(post) => handleNavigate("blog-post", post)}
        />
      )}

      {view === "property" && selectedProperty && (
        <PropertyDetailView
          property={selectedProperty}
          bookingDates={bookingDates}
          onSelectDates={setBookingDates}
          guestCount={guestCount}
          onGuestCountChange={setGuestCount}
          onNavigate={handleNavigate}
        />
      )}

      {view === "booking" && selectedProperty && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <BookingContainer
            property={selectedProperty}
            dates={bookingDates}
            guestCount={guestCount}
            onBack={() => setView("property")}
            onSuccess={(payload) => {
              persistBookingLookup(payload);
              handleNavigate("booking-details");
            }}
          />
        </div>
      )}

      {view === "success" && <SuccessView onNavigate={handleNavigate} />}

      {isBookingViewState && (
        <BookingDetailsView
          onNavigate={handleNavigate}
          initialLookup={recentBookingLookup}
          onPersistLookup={persistBookingLookup}
          section={bookingSection ?? "essential"}
        />
      )}
    </Layout>
  );
}

export default BunksApp;
