"use client";

import type { PropsWithChildren } from "react";
import type { BookingPortalSection, NavigateHandler, ViewState } from "@/types";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

interface LayoutProps extends PropsWithChildren {
  onNavigate: NavigateHandler;
  currentView?: ViewState;
  bookingSection?: BookingPortalSection | null;
  bookingRef?: string | null;
  hideFooter?: boolean;
}

export function Layout({
  children,
  onNavigate,
  currentView = "home",
  bookingSection = null,
  bookingRef = null,
  hideFooter = false,
}: LayoutProps) {
  const isBookingPortalView =
    currentView === "booking-details" || (typeof currentView === "string" && currentView.startsWith("booking-"));
  const mainClasses = ["pb-20", isBookingPortalView ? "pt-0" : "pt-6"].join(" ");

  return (
    <div className={`min-h-screen guest-surface text-[var(--color-text-primary)] font-sans selection:bg-[var(--color-brand-primary)] selection:text-white antialiased`}>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-full focus:bg-white focus:px-5 focus:py-3">Skip to content</a>
      <Navbar onNavigate={onNavigate} currentView={currentView} bookingSection={bookingSection} bookingRef={bookingRef} />
      <main id="main-content" className={mainClasses}>{children}</main>
      {!hideFooter && <Footer onNavigate={onNavigate} />}
    </div>
  );
}
