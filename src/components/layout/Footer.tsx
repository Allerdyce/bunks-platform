"use client";

import Image from "next/image";
import Link from "next/link";
import type { NavigateHandler } from "@/types";

interface FooterProps {
  onNavigate: NavigateHandler;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)]/90 py-12">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 md:grid-cols-4 lg:px-8">
        <div className="col-span-1 md:col-span-2 space-y-4">
          <Link href="/" className="flex items-center" aria-label="Bunks home" onClick={() => onNavigate("home")}>
            <Image src="/bunks-logo.svg" alt="Bunks" width={140} height={40} className="h-10 w-auto" />
          </Link>
          <p className="text-sm text-[var(--color-text-secondary)] max-w-sm">
            Boutique bunkhouses and host-led experiences inspired by the warmth of the mountains.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">Company</h4>
          <ul className="mt-4 space-y-2 text-sm text-[var(--color-text-secondary)]">
            <li>
              <Link
                href="/?view=about"
                onClick={() => onNavigate("about")}
                className="transition hover:text-[var(--color-text-primary)]"
              >
                About
              </Link>
            </li>
            <li>
              <Link
                href="/?view=journal"
                onClick={() => onNavigate("journal")}
                className="transition hover:text-[var(--color-text-primary)]"
              >
                Journal
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">Support</h4>
          <ul className="mt-4 space-y-2 text-sm text-[var(--color-text-secondary)]">
            <li>Help Center</li>
            <li>Safety</li>
            <li>
              <Link
                href="/messages"
                onClick={() => onNavigate("booking-details")}
                className="transition hover:text-[var(--color-text-primary)]"
              >
                Trips & messages
              </Link>
            </li>
            <li>
              <Link href="/admin" className="transition hover:text-[var(--color-text-primary)]">
                Admin Login
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="transition hover:text-[var(--color-text-primary)]">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/cleaner/login" className="transition hover:text-[var(--color-text-primary)]">
                Cleaner Portal
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-10 max-w-7xl border-t border-[var(--color-border)] px-4 pt-6 text-center text-xs text-[var(--color-text-secondary)] sm:px-6 lg:px-8">
        © {new Date().getFullYear()} Bunks Platform. All rights reserved.
      </div>
    </footer>
  );
}
