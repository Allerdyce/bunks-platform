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

  const resetBookingState = useCallback(() => {
    setBookingDates(initialRange);
    setGuestCount(1);
  }, []);

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

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(BOOKING_LOOKUP_STORAGE_KEY);
      if (stored) {
        try {
          setRecentBookingLookup(JSON.parse(stored));
        } catch { }
      }
    }
    setLoadingAuth(false);
  }, []);

  const pathBookingRef = useMemo(() => {
    if (!pathname) return null;
    const match = pathname.match(/\/my-trips\/([A-Z0-9-]+)/i);
    if (!match) return null;
    const candidate = match[1].toLowerCase();
    if (["essential", "guide", "inbox"].includes(candidate)) {
      return null;
    }
    return match[1].toUpperCase();
  }, [pathname]);

  const updateUrlState = useCallback(
    (
      newState: { slug?: string | null; view?: ViewState | null; post?: string | null },
      method: "push" | "replace" = "push",
      { scroll }: { scroll?: boolean } = {},
    ) => {
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      if (newState.slug !== undefined) {
        if (newState.slug) params.set("slug", newState.slug);
        else params.delete("slug");
      }
      if (newState.view !== undefined) {
        if (newState.view && newState.view !== "home") params.set("view", newState.view);
        else params.delete("view");
      }
      if (newState.post !== undefined) {
        if (newState.post) params.set("post", newState.post);
        else params.delete("post");
      }

      const targetView = newState.view !== undefined ? newState.view : view;
      const slugForPath = newState.slug !== undefined ? newState.slug : (activePropertySlug ?? null);

      const pathSlug = slugForPath ? getPathSlugFromCanonical(slugForPath) : null;
      let basePath = "/";

      const prefix = pathBookingRef ? `/my-trips/${pathBookingRef}` : "/my-trips";

      if (targetView?.startsWith("booking-")) {
        if (targetView === "booking-guide") {
          basePath = `${prefix}/guide`;
        } else if (targetView === "booking-messages") {
          basePath = `${prefix}/inbox`;
        } else {
          basePath = `${prefix}/essential`;
        }
      } else if (pathSlug) {
        basePath = `/property/${pathSlug}`;
      }

      const queryString = params.toString();
      const url = queryString ? `${basePath}?${queryString}` : basePath;
      router[method](url, { scroll: scroll ?? false });
    },
    [activePropertySlug, router, searchParams, view, pathBookingRef],
  );

  useEffect(() => {
    if (!pathBookingRef) return;
    // If the path contains a booking ref, treat it as the "selected" booking.
    // We update the recentLookup so the view shows it.
    if (recentBookingLookup?.bookingReference !== pathBookingRef) {
      // We don't have the email from the path, but if we are on this path, 
      // presumably we might have it stored or the view will handle it.
      // For now, let's just update the reference if it differs, but we can't invent an email.
      // Actually, BookingDetailsView handles the lookup. 
      // If we navigated here, maybe we should just rely on the stored lookup matching, or 
      // if it's a deep link, the user might need to verify email. 
      // For now, let's just make sure the Navbar knows.
    }
  }, [pathBookingRef, recentBookingLookup]);

  useEffect(() => {
    if (!activePropertySlug) {
      if (selectedProperty) {
        setSelectedProperty(null);
        if (view === "property") {
          setView("home");
        }
      }
      return;
    }

    const property = propertyIndex.get(activePropertySlug);
    if (property && property.slug !== selectedProperty?.slug) {
      setSelectedProperty(property);
      setView("property");
      resetBookingState();
      return;
    }

    if (!property) {
      updateUrlState({ slug: null }, "replace");
    }
  }, [activePropertySlug, propertyIndex, resetBookingState, selectedProperty, updateUrlState, view]);

  useEffect(() => {
    if (!searchParams) return;
    const postSlug = searchParams.get("post");
    if (postSlug === lastPostSlugRef.current) {
      return;
    }
    lastPostSlugRef.current = postSlug;

    if (postSlug) {
      if (activePropertySlug) {
        updateUrlState({ slug: null }, "replace");
        return;
      }
      const post = JOURNAL_POSTS.find((entry) => entry.slug === postSlug);
      if (post) {
        setSelectedPost(post);
        setView("blog-post");
      } else {
        updateUrlState({ post: null }, "replace");
      }
      return;
    }

    setSelectedPost(null);
    setView("journal");
  }, [activePropertySlug, searchParams, updateUrlState]);

  useEffect(() => {
    if (isMessagesRoute) {
      if (selectedProperty) {
        setSelectedProperty(null);
        resetBookingState();
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
    if (activePropertySlug) return;
    const viewParam = searchParams.get("view") as ViewState | null;
    const allowedViews: ViewState[] = ["home", "about", "journal", "booking-details", "booking-essential", "booking-guide", "booking-messages"];
    if (viewParam && allowedViews.includes(viewParam)) {
      if (viewParam !== view) {
        if (viewParam === "home" || viewParam === "about" || viewParam === "journal" || viewParam === "booking-details") {
          if (selectedProperty) {
            setSelectedProperty(null);
            resetBookingState();
          }
          if (viewParam !== "journal" && selectedPost) {
            setSelectedPost(null);
          }
        }
        setView(viewParam);
      }
      return;
    }

    if (!viewParam && allowedViews.includes(view)) {
      if (selectedProperty) {
        setSelectedProperty(null);
        resetBookingState();
      }
      if (selectedPost) {
        setSelectedPost(null);
      }
      setView("home");
    }
  }, [activePropertySlug, isMessagesRoute, searchParams, view, selectedProperty, selectedPost, resetBookingState, bookingSection]);

  useEffect(() => {
    if (view === "booking") return;
    // For listings target, we handle scroll in the specific handler
    // But listings also sets view='home' which triggers this.
    // However, the listings handler has a setTimeout which will override this immediate scroll (or happen after).
    // Standard navigation should scroll to top.
    window.scrollTo(0, 0);
  }, [view, selectedProperty, selectedPost]);

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
      setView("property");
      updateUrlState({ slug: propertyPayload.slug, view: null, post: null }, "push", { scroll: false });
    }

    if (target === "booking" && selectedProperty) {
      updateUrlState({ slug: selectedProperty.slug, post: null }, "replace", { scroll: false });
    }

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
