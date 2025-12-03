"use client";

import Image from "next/image";
import Link from "next/link";
import type { NavigateHandler } from "@/types";

interface FooterProps {
  onNavigate: NavigateHandler;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="bg-gray-50 py-12 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-4 gap-8">
        <div className="col-span-1 md:col-span-2">
          <Link href="/" className="flex items-center mb-4" aria-label="Bunks home" onClick={() => onNavigate("home")}>
            <Image src="/bunks-logo.svg" alt="Bunks" width={120} height={36} className="h-9 w-auto" />
          </Link>
          <p className="text-gray-500 text-sm max-w-xs">Redefining the short-term return rental experience.</p>
        </div>
        <div>
          <h4 className="font-medium text-gray-900 mb-4">Company</h4>
          <ul className="space-y-2 text-sm text-gray-500">
            <li>
              <Link href="/?view=about" onClick={() => onNavigate("about")} className="hover:text-gray-900">
                About
              </Link>
            </li>
            <li>
              <Link href="/?view=journal" onClick={() => onNavigate("journal")} className="hover:text-gray-900">
                Journal
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-medium text-gray-900 mb-4">Support</h4>
          <ul className="space-y-2 text-sm text-gray-500">
            <li>Help</li>
            <li>Safety</li>
            <li>
              <Link href="/?view=booking-details" onClick={() => onNavigate("booking-details")} className="hover:text-gray-900">
                My stay
              </Link>
            </li>
            <li>
              <Link href="/admin" className="hover:text-gray-900">
                Admin Login
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-gray-900">
                Privacy Policy
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-gray-200 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} Bunks Platform. All rights reserved.
      </div>
    </footer>
  );
}
