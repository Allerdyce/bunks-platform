"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Menu, X } from "lucide-react";
import type { BookingPortalSection, NavigateHandler, ViewState } from "@/types";

interface NavbarProps {
  onNavigate: NavigateHandler;
  bookingSection?: BookingPortalSection | null;
  bookingRef?: string | null;
  currentView?: ViewState;
  immersive?: boolean;
}

type RouteLink = {
  label: string;
  type: "route";
  target: ViewState;
  href: string;
};

type AnchorLink = {
  label: string;
  type: "anchor";
  href: string;
};

type BookingLink = {
  label: string;
  type: "booking";
  target: ViewState;
  href: string;
  section: BookingPortalSection;
};

type NavbarLink = RouteLink | AnchorLink | BookingLink;

export function Navbar({
  immersive = false,
  currentView = "home",
  bookingSection = null,
  bookingRef = null,
}: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 40);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  const overHero = immersive && !scrolled && !isOpen;
  const isBookingView =
    currentView?.startsWith?.("booking-") ?? currentView === "booking-details";

  const navLinks: NavbarLink[] = useMemo(() => {
    if (isBookingView) {
      const base = bookingRef ? `/my-trips/${bookingRef}` : "/my-trips";
      // If we have a bookingRef, link directly to sections. Otherwise link to the base lookup/essential placeholder.
      return [
        {
          label: "Essential Info",
          type: "booking",
          href: `${base}/essential`,
          target: "booking-essential",
          section: "essential",
        },
        {
          label: "Guide Book",
          type: "booking",
          href: `${base}/guide`,
          target: "booking-guide",
          section: "guide",
        },
        {
          label: "Messages",
          type: "booking",
          href: `${base}/inbox`,
          target: "booking-messages",
          section: "messages",
        },
        { label: "Exit", type: "route", href: "/", target: "home" },
      ];
    }

    return [
      {
        label: "Explore homes",
        type: "route",
        target: "listings",
        href: "/#listings",
      },
      { label: "About", type: "route", target: "about", href: "/?view=about" },
      {
        label: "Journal",
        type: "route",
        target: "journal",
        href: "/?view=journal",
      },
      // { label: "SB Tax Tool", type: "route", target: "about", href: "/tools/sb-tot" }, // Moved to Footer
      {
        label: "My trips",
        type: "route",
        target: "booking-details",
        href: "/my-trips",
      },
    ];
    // If we have a bookingRef, the 'Trips' link could go to that specific trip.
    // But typically 'Trips' implies a list or lookup if not currently in a trip view.
    // We'll keep it as the generic lookup page for now, or the specific trip if known?
    // Let's stick to generic lookup entry point.
  }, [isBookingView, bookingRef]);

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  const ctaClasses =
    "inline-flex items-center justify-center rounded-full bg-[var(--color-brand-primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-brand)] transition hover:bg-[var(--color-brand-hover)]";

  const navContainerClass = overHero
    ? "sticky top-0 z-50 bg-transparent text-white"
    : isBookingView
      ? "sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur"
      : "sticky top-0 z-50 bg-[var(--color-overlay)] backdrop-blur-lg";

  return (
    <nav
      aria-label="Main navigation"
      className={navContainerClass}
      style={
        overHero
          ? ({ "--color-text-primary": "#ffffff" } as React.CSSProperties)
          : undefined
      }
    >
      <div className="w-full px-4 sm:px-6 lg:px-10">
        <div className="flex justify-between h-20 lg:h-24 items-center gap-6 lg:grid lg:grid-cols-[1fr_auto_1fr]">
          <Link
            href="/"
            className="justify-self-start flex-shrink-0 cursor-pointer flex items-center"
            aria-label="Bunks home"
            onClick={handleLinkClick}
          >
            <Image
              src="/bunks-logo.svg"
              alt="Bunks"
              width={140}
              height={40}
              priority
              className={`h-8 w-auto ${overHero ? "brightness-0 invert" : "grayscale"}`}
            />
          </Link>

          <div className="hidden lg:flex items-center gap-8 xl:gap-10">
            {navLinks.map((link) => {
              if (link.type === "anchor") {
                return (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="text-base font-semibold text-[var(--color-text-primary)] transition-colors hover:text-[var(--color-text-primary)]"
                  >
                    {link.label}
                  </a>
                );
              }
              if (link.type === "booking") {
                const isActive = bookingSection === link.section;
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={handleLinkClick}
                    className={`text-base font-semibold transition-colors ${
                      isActive
                        ? "rounded-full bg-[var(--color-surface-alt)] px-4 py-2 text-[var(--color-text-primary)]"
                        : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              }
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={handleLinkClick}
                  className="text-base font-semibold text-[var(--color-text-primary)] transition-colors hover:text-[var(--color-text-primary)]"
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
          <div className="hidden lg:flex justify-self-end">
            {!isBookingView && (
              <Link
                href="/#listings"
                onClick={handleLinkClick}
                className={
                  overHero
                    ? "inline-flex min-h-12 items-center rounded-full bg-white px-6 text-base font-semibold text-gray-950 hover:bg-gray-100"
                    : ctaClasses
                }
              >
                Find a stay
              </Link>
            )}
          </div>

          <div className="lg:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="rounded-full border border-[var(--color-border)] p-2 text-[var(--color-text-primary)] shadow-sm"
              aria-label={isOpen ? "Close menu" : "Open menu"}
              aria-expanded={isOpen}
              aria-controls="mobile-navigation"
            >
              {isOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div
          id="mobile-navigation"
          className="lg:hidden absolute w-full border-b border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl"
        >
          <div className="px-4 pt-2 pb-6 space-y-1">
            {navLinks.map((link) => {
              if (link.type === "anchor") {
                return (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-4 text-base font-semibold text-[var(--color-text-primary)] border-b border-[var(--color-border)]/40"
                  >
                    {link.label}
                  </a>
                );
              }
              if (link.type === "booking") {
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={handleLinkClick}
                    className="block px-3 py-4 text-base font-semibold text-[var(--color-text-primary)] border-b border-[var(--color-border)]/40"
                  >
                    {link.label}
                  </Link>
                );
              }
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={handleLinkClick}
                  className="block px-3 py-4 text-base font-semibold text-[var(--color-text-primary)] border-b border-[var(--color-border)]/40"
                >
                  {link.label}
                </Link>
              );
            })}
            {!isBookingView && (
              <Link
                href="/#listings"
                onClick={handleLinkClick}
                className="mt-4 block rounded-full bg-[var(--color-brand-primary)] px-3 py-4 text-center text-base font-semibold text-white shadow-[var(--shadow-brand)]"
              >
                Find a stay
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
