"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type {
  BookingLookupPayload,
  BookingPortalSection,
  DateRange,
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
import { BookingDetailsView } from "@/components/views/BookingDetailsView";
import { LoaderScreen } from "@/components/shared/LoaderScreen";
import { PROPERTIES } from "@/data/properties";
import { getCanonicalSlugFromPath, getPathSlugFromCanonical } from "@/lib/propertySlugs";

interface BunksAppProps {
  properties?: Property[];
}

const initialRange: DateRange = {
  start: null,
  end: null,
};

const BOOKING_LOOKUP_STORAGE_KEY = "bunks:lastBookingLookup";

export function BunksApp({ properties: hydratedProperties }: BunksAppProps) {
  const properties = useMemo(() => (hydratedProperties?.length ? hydratedProperties : PROPERTIES), [hydratedProperties]);
  const [view, setView] = useState<ViewState>("home");
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [bookingDates, setBookingDates] = useState<DateRange>(initialRange);
  const [guestCount, setGuestCount] = useState(1);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [recentBookingLookup, setRecentBookingLookup] = useState<BookingLookupPayload | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isTripsRoute = pathname?.startsWith("/my-trips") ?? false;
  const bookingSection: BookingPortalSection | null = useMemo(() => {
    if (!isTripsRoute || !pathname) return null;
    // /my-trips, /my-trips/<section> and /my-trips/<ref>/<section>
    const section = pathname.split("/").filter(Boolean).pop();
    if (section === "guide") return "guide";
    // Anything else (including old /inbox links, redirected in next.config.ts) lands on Essentials.
    return "essential";
  }, [isTripsRoute, pathname]);

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
    if (["essential", "guide"].includes(candidate)) {
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
      const params = new URLSearchParams(window.location.search);
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
        } else {
          basePath = `${prefix}/essential`;
        }
      } else if (pathSlug) {
        basePath = `/property/${pathSlug}`;
      }

      const queryString = params.toString();
      const url = queryString ? `${basePath}?${queryString}` : basePath;

      if (method === "push") {
        window.history.pushState(null, "", url);
      } else {
        router.replace(url, { scroll: scroll ?? false });
      }
    },
    [activePropertySlug, router, view, pathBookingRef],
  );

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const params = new URLSearchParams(window.location.search);

      // Handle Property Routes
      const propMatch = path.match(/\/property\/([a-z0-9-]+)/);
      if (propMatch) {
        const slug = propMatch[1];
        const canonical = getCanonicalSlugFromPath(slug);
        const prop = propertyIndex.get(canonical || '');
        if (prop) {
          setSelectedProperty(prop);
          setView('property');
          resetBookingState();
          return;
        }
      }

      // Handle Messaging Routes
      if (path.startsWith("/my-trips")) {
        // Let client router handle or simple toggle logic
        // For now assume standard internal routing handles this by mount
        return;
      }

      // Handle Params
      const viewParam = params.get("view") as ViewState | null;
      if (viewParam) {
        setView(viewParam);
        return;
      }

      // Default Home
      setView('home');
      setSelectedProperty(null);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [propertyIndex, resetBookingState]);

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
    if (isTripsRoute) {
      if (selectedProperty) {
        setSelectedProperty(null);
      }
      const targetView: ViewState = bookingSection ? (`booking-${bookingSection}` as ViewState) : "booking-details";
      if (view !== targetView) {
        setView(targetView);
      }
      return;
    }

    if (!searchParams) return;
    // Explicitly check param
    const viewParam = searchParams.get("view") as ViewState | null;

    // If we have a property slug in the URL (activePropertySlug) and the user DID NOT
    // explicitly ask for a specific view (via ?view=...), then we should STOP here.
    // We do NOT want to fall through to the default logic below which resets to 'home'.
    // The property-handling useEffect (above or below) will handle setting view='property'.
    if (activePropertySlug && !viewParam) {
      return;
    }
    const allowedViews: ViewState[] = ["home", "about", "booking", "booking-details", "booking-essential", "booking-guide"];

    if (viewParam && allowedViews.includes(viewParam)) {
      if (viewParam !== view) {
        // ... (Logic to clear other states)
        if (viewParam === "home" || viewParam === "about" || viewParam === "booking-details") {
          if (selectedProperty) {
            setSelectedProperty(null);
            resetBookingState();
          }
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

    // Default Home if no view param
    if (!viewParam && allowedViews.includes(view)) {
      if (selectedProperty) {
        setSelectedProperty(null);
        resetBookingState();
      }
      setView("home");
    }
  }, [activePropertySlug, isTripsRoute, searchParams, view, selectedProperty, resetBookingState, bookingSection, propertyIndex]);

  useEffect(() => {
    if (view === "booking") return;
    // For listings target, we handle scroll in the specific handler
    // But listings also sets view='home' which triggers this.
    // However, the listings handler has a setTimeout which will override this immediate scroll (or happen after).
    // Standard navigation should scroll to top.
    window.scrollTo(0, 0);
  }, [view, selectedProperty]);

  const handleNavigate = (target: ViewState, payload?: unknown) => {
    if (["home", "listings", "about", "booking-details", "booking-essential", "booking-guide"].includes(target)) {
      setSelectedProperty(null);
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

    if (target === "home") {
      updateUrlState({ slug: null, view: null, post: null }, "replace", { scroll: false });
    }

    if (target === "about") {
      updateUrlState({ slug: null, view: "about", post: null }, "replace", { scroll: false });
    }

    if (
      target === "booking-details" ||
      target === "booking-essential" ||
      target === "booking-guide"
    ) {
      updateUrlState({ slug: null, view: target, post: null }, "replace", { scroll: false });
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
      immersiveHeader={view === "home"}
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
