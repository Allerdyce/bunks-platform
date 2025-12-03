"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Menu, X } from "lucide-react";
import type { NavigateHandler } from "@/types";

interface NavbarProps {
  onNavigate: NavigateHandler;
}

export function Navbar({ onNavigate }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navLinks = useMemo(
    () => [
      { label: "Properties", target: "listings" as const, href: "/#listings" },
      { label: "About", target: "about" as const, href: "/?view=about" },
      { label: "Journal", target: "journal" as const, href: "/?view=journal" },
      { label: "My stay", target: "booking-details" as const, href: "/?view=booking-details" },
    ],
    [],
  );

  const handleNavigate = (target: Parameters<NavigateHandler>[0]) => {
    onNavigate(target);
    setIsOpen(false);
  };

  const ctaClasses =
    "inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-gray-800";

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <Link
            href="/"
            className="flex-shrink-0 cursor-pointer flex items-center"
            aria-label="Bunks home"
            onClick={() => handleNavigate("home")}
          >
            <Image src="/bunks-logo.svg" alt="Bunks" width={140} height={40} priority className="h-10 w-auto" />
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => handleNavigate(link.target)}
                className="text-gray-500 hover:text-gray-900 transition-colors font-medium"
              >
                {link.label}
              </Link>
            ))}
            <Link href="/#listings" onClick={() => handleNavigate("listings")} className={ctaClasses}>
              Book Now
            </Link>
          </div>

          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="p-2" aria-label="Toggle menu">
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 shadow-lg absolute w-full">
          <div className="px-4 pt-2 pb-6 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => handleNavigate(link.target)}
                className="block px-3 py-4 text-lg font-medium text-gray-900 border-b border-gray-50"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/#listings"
              onClick={() => handleNavigate("listings")}
              className="mt-2 block rounded-lg bg-gray-900 px-3 py-4 text-center text-lg font-semibold text-white"
            >
              Book Now
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
