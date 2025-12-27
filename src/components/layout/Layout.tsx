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
  const isBookingView = currentView === "booking";
  const mainClasses = ["pb-20", isBookingPortalView ? "pt-0" : "pt-6"].join(" ");

  return (
    <div className={`min-h-screen bg-white text-[var(--color-text-primary)] font-sans selection:bg-[var(--color-brand-primary)] selection:text-white antialiased`}>
      <Navbar onNavigate={onNavigate} currentView={currentView} bookingSection={bookingSection} bookingRef={bookingRef} />
      <main className={mainClasses}>{children}</main>
      {!hideFooter && <Footer onNavigate={onNavigate} />}
    </div>
  );
}
