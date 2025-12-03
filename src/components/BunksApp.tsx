"use client";

/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { BookingLookupPayload, DateRange, JournalPost, Property, ViewState } from "@/types";
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

export function BunksApp() {
  const [view, setView] = useState<ViewState>("home");
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [selectedPost, setSelectedPost] = useState<JournalPost | null>(null);
  const [bookingDates, setBookingDates] = useState<DateRange>(initialRange);
  const [guestCount, setGuestCount] = useState(1);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [recentBookingLookup, setRecentBookingLookup] = useState<BookingLookupPayload | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const propertyIndex = useMemo(() => new Map(PROPERTIES.map((property) => [property.slug, property])), []);
  const rawPathPropertySlug = useMemo(() => {
    if (!pathname) return null;
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length >= 2 && segments[0] === "property") {
      return segments[1];
    }
    return null;
  }, [pathname]);
  const pathPropertySlug = useMemo(() => {
    if (!rawPathPropertySlug) return null;
    return getCanonicalSlugFromPath(rawPathPropertySlug);
  }, [rawPathPropertySlug]);
  const queryPropertySlugRaw = searchParams?.get("property") ?? null;
  const queryPropertySlug = useMemo(() => {
    if (!queryPropertySlugRaw) return null;
    return getCanonicalSlugFromPath(queryPropertySlugRaw);
  }, [queryPropertySlugRaw]);
  const activePropertySlug = pathPropertySlug ?? queryPropertySlug ?? null;

  useEffect(() => {
    if (!queryPropertySlug || pathPropertySlug) {
      return;
    }
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.delete("property");
    const queryString = params.toString();
    const pathSlug = getPathSlugFromCanonical(queryPropertySlug);
    const url = pathSlug
      ? queryString
        ? `/property/${pathSlug}?${queryString}`
        : `/property/${pathSlug}`
      : queryString
        ? `/?${queryString}`
        : "/";
    router.replace(url, { scroll: false });
  }, [pathPropertySlug, queryPropertySlug, router, searchParams]);

  useEffect(() => {
    if (!pathPropertySlug || !rawPathPropertySlug) return;
    const prettySlug = getPathSlugFromCanonical(pathPropertySlug);
    if (!prettySlug || prettySlug === rawPathPropertySlug) return;
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.delete("property");
    const queryString = params.toString();
    const url = queryString ? `/property/${prettySlug}?${queryString}` : `/property/${prettySlug}`;
    router.replace(url, { scroll: false });
  }, [pathPropertySlug, rawPathPropertySlug, router, searchParams]);

  useEffect(() => {
    const initAuth = async () => {
      if (auth && signInAnonymously) {
        try {
          await signInAnonymously(auth);
        } catch (error) {
          console.warn("Anonymous auth failed", error);
        }
      }
      setLoadingAuth(false);
    };
    initAuth();

    if (auth) {
      const { onAuthStateChanged } = require("firebase/auth");
      const unsubscribe = onAuthStateChanged(auth, () => null);
      return () => unsubscribe();
    }

    return undefined;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.sessionStorage.getItem(BOOKING_LOOKUP_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as BookingLookupPayload;
        if (parsed?.guestEmail) {
          if (parsed.bookingReference) {
            setRecentBookingLookup({
              bookingReference: parsed.bookingReference,
              guestEmail: parsed.guestEmail,
            });
          } else if (parsed.bookingId) {
            setRecentBookingLookup({
              bookingReference: String(parsed.bookingId),
              guestEmail: parsed.guestEmail,
            });
          }
        }
      }
    } catch (error) {
      console.warn("Failed to read stored booking lookup", error);
    }
  }, []);

  const persistBookingLookup = useCallback((lookup: BookingLookupPayload | null) => {
    const normalizedLookup = lookup
      ? {
          bookingReference: lookup.bookingReference.trim().toUpperCase(),
          guestEmail: lookup.guestEmail.trim(),
        }
      : null;
    setRecentBookingLookup(normalizedLookup);
    if (typeof window === "undefined") return;
    try {
      if (normalizedLookup) {
        window.sessionStorage.setItem(BOOKING_LOOKUP_STORAGE_KEY, JSON.stringify(normalizedLookup));
      } else {
        window.sessionStorage.removeItem(BOOKING_LOOKUP_STORAGE_KEY);
      }
    } catch (error) {
      console.warn("Failed to persist booking lookup", error);
    }
  }, []);

  useEffect(() => {
    if (!searchParams) return;
    const lookupReference = searchParams.get("lookup");
    const lookupEmail = searchParams.get("email");
    if (!lookupReference || !lookupEmail) return;
    const normalizedReference = lookupReference.trim().toUpperCase();
    const normalizedEmail = lookupEmail.trim();
    if (!normalizedReference || !normalizedEmail) return;
    if (
      recentBookingLookup &&
      recentBookingLookup.bookingReference === normalizedReference &&
      recentBookingLookup.guestEmail === normalizedEmail
    ) {
      return;
    }
    persistBookingLookup({ bookingReference: normalizedReference, guestEmail: normalizedEmail });
  }, [searchParams, persistBookingLookup, recentBookingLookup]);

  const resetBookingState = useCallback(() => {
    setBookingDates(initialRange);
    setGuestCount(1);
  }, []);

  const updateUrlState = useCallback(
    (
      next: { slug?: string | null; view?: ViewState | null; post?: string | null } = {},
      method: "push" | "replace" = "push",
      { scroll }: { scroll?: boolean } = {},
    ) => {
      if (!router) return;
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      params.delete("property");

      if (Object.prototype.hasOwnProperty.call(next, "view")) {
        if (next.view) {
          params.set("view", next.view);
        } else {
          params.delete("view");
        }
      }

      if (Object.prototype.hasOwnProperty.call(next, "post")) {
        if (next.post) {
          params.set("post", next.post);
        } else {
          params.delete("post");
        }
      }

      let slugForPath = activePropertySlug;
      if (Object.prototype.hasOwnProperty.call(next, "slug")) {
        slugForPath = next.slug ?? null;
      }

      const pathSlug = getPathSlugFromCanonical(slugForPath);
      const basePath = pathSlug ? `/property/${pathSlug}` : "/";
      const queryString = params.toString();
      const url = queryString ? `${basePath}?${queryString}` : basePath;
      router[method](url, { scroll: scroll ?? false });
    },
    [activePropertySlug, router, searchParams],
  );

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
    if (postSlug) {
      const post = JOURNAL_POSTS.find((entry) => entry.slug === postSlug);
      if (post) {
        if (!selectedPost || selectedPost.slug !== post.slug) {
          setSelectedPost(post);
        }
        if (view !== "blog-post") {
          setView("blog-post");
        }
      } else {
        updateUrlState({ post: null }, "replace");
      }
      return;
    }

    if (selectedPost) {
      setSelectedPost(null);
    }
    if (view === "blog-post") {
      setView("journal");
    }
  }, [searchParams, selectedPost, view, updateUrlState]);

  useEffect(() => {
    if (!searchParams) return;
    if (view === "blog-post") return;
    if (activePropertySlug) return;
    const viewParam = searchParams.get("view") as ViewState | null;
    const allowedViews: ViewState[] = ["home", "about", "journal", "booking-details"];
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
  }, [activePropertySlug, searchParams, view, selectedProperty, selectedPost, resetBookingState]);

  const handleNavigate = (target: ViewState, payload?: unknown) => {
    if (["home", "listings", "about", "journal", "booking-details"].includes(target)) {
      setSelectedProperty(null);
      setSelectedPost(null);
      resetBookingState();
    }

    if (target === "property" && payload && typeof payload === "object") {
      const propertyPayload = payload as Property;
      setSelectedProperty(propertyPayload);
      resetBookingState();
      updateUrlState({ slug: propertyPayload.slug, view: null, post: null }, "push", { scroll: true });
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

    if (target === "booking-details") {
      updateUrlState({ slug: null, view: "booking-details", post: null }, "replace", { scroll: false });
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
    if (typeof window !== "undefined" && target !== "booking") {
      window.scrollTo(0, 0);
    }
  };

  if (loadingAuth) {
    return <LoaderScreen />;
  }

  return (
    <Layout onNavigate={handleNavigate}>
      {view === "home" && (
        <>
          <HomeView properties={PROPERTIES} onSelectProperty={(property) => handleNavigate("property", property)} />
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

      {view === "booking-details" && (
        <BookingDetailsView
          onNavigate={handleNavigate}
          initialLookup={recentBookingLookup}
          onPersistLookup={persistBookingLookup}
        />
      )}
    </Layout>
  );
}

export default BunksApp;
