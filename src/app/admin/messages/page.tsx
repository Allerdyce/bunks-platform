"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { AlertCircle, LogOut, Plus } from "lucide-react";
import Link from "next/link";
import { AdminTopNav } from "@/components/admin/AdminTopNav";
import { AdminCheckingShell } from "@/components/admin/AdminCheckingShell";
import { Button } from "@/components/shared/Button";
import { PROPERTIES } from "@/data/properties";
import { PrivateBookingForm } from "@/components/admin/PrivateBookingForm";
import { BookingSidebar } from "@/components/admin/bookings/BookingSidebar";
import { BookingTable } from "@/components/admin/bookings/BookingTable";
import { BookingDetail } from "@/components/admin/bookings/BookingDetail";
import { BookingDrawer } from "@/components/admin/bookings/BookingDrawer";
import type { AdminBooking, BookingView } from "@/components/admin/bookings/bookingDisplay";

type AuthState = "checking" | "unauthenticated" | "authenticated";

const HOMES = PROPERTIES.map((property) => ({ slug: property.slug, name: property.name }));

export default function AdminBookingsPage() {
  const [authState, setAuthState] = useState<AuthState>("checking");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [counts, setCounts] = useState<Partial<Record<BookingView, number>>>({});
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [view, setView] = useState<BookingView>("upcoming");
  const [home, setHome] = useState("");
  const [search, setSearch] = useState("");
  // The booking open in the side panel. Kept after a refresh even if it leaves the current tab
  // (e.g. just cancelled), so the panel can show what happened.
  const [selected, setSelected] = useState<AdminBooking | null>(null);
  const [creatingLink, setCreatingLink] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const res = await fetch("/api/admin/session", { credentials: "include" });
        setAuthState(res.ok ? "authenticated" : "unauthenticated");
      } catch (err) {
        console.error("Failed to check admin session", err);
        setAuthState("unauthenticated");
      }
    };
    void bootstrap();
  }, []);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error((payload as { error?: string }).error ?? "Invalid credentials");
      }
      setAuthState("authenticated");
    } catch (err) {
      console.error(err);
      setAuthState("unauthenticated");
      setAuthError((err as Error).message ?? "Login failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    setAuthState("unauthenticated");
    setBookings([]);
    setSelected(null);
  };

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const params = new URLSearchParams({ view });
      if (home) params.set("home", home);
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/bookings/messages?${params}`, { credentials: "include" });
      const data = (await res.json().catch(() => null)) as
        | { threads?: AdminBooking[]; counts?: Partial<Record<BookingView, number>>; error?: string }
        | null;
      if (!res.ok) throw new Error(data?.error || "Failed to load bookings");
      const results = data?.threads ?? [];
      setBookings(results);
      setCounts(data?.counts ?? {});
      setSelected((current) => (current ? (results.find((b) => b.id === current.id) ?? current) : null));
    } catch (err) {
      console.error("Failed to load bookings", err);
      setLoadError((err as Error).message ?? "Failed to load bookings");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [view, home, search]);

  useEffect(() => {
    if (authState === "authenticated") void fetchBookings();
  }, [authState, fetchBookings]);

  if (authState === "checking") {
    return <AdminCheckingShell active="messages" />;
  }

  if (authState !== "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-xl border border-gray-200 p-8 sm:p-10 space-y-6">
          <div className="text-center space-y-4">
            <Link
              href="/"
              className="inline-flex mb-4 grayscale"
              aria-label="Bunks home"
            >
              <Image
                src="/bunks-logo.svg"
                alt="Bunks"
                width={120}
                height={36}
              />
            </Link>

            <h1 className="page-title   text-gray-900">Bookings</h1>
            <p className="text-sm text-gray-500">
              Hosts only. Use your admin credentials to continue.
            </p>
          </div>
          {authError && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4" /> {authError}
            </div>
          )}
          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                aria-label="Email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-gray-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                aria-label="Password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-gray-500 focus:outline-none"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-full bg-gray-900 text-white py-3 font-medium hover:bg-gray-800 transition"
              disabled={authLoading}
            >
              {authLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <AdminTopNav
        active="messages"
        actions={
          <Button onClick={handleLogout} className="inline-flex items-center gap-2">
            <LogOut className="w-4 h-4" /> Logout
          </Button>
        }
      />

      <main className="mt-8 w-full space-y-8 px-6 lg:px-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Bunks Ops</p>
            <h1 className="page-title   text-gray-900 mt-1">Bookings & guests</h1>
            <p className="text-sm text-gray-500">Stays, payment links and cancellations.</p>
          </div>
          <Button type="button" onClick={() => setCreatingLink(true)} className="gap-2 whitespace-nowrap">
            <Plus className="h-4 w-4" /> New private booking
          </Button>
        </div>

        {loadError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="mr-2 inline h-4 w-4" /> {loadError}
          </div>
        )}

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <BookingSidebar
              view={view}
              counts={counts}
              searchActive={Boolean(search)}
              homes={HOMES}
              home={home}
              onViewChange={(next) => {
                setSearch("");
                setView(next);
              }}
              onHomeChange={setHome}
            />
          </div>
          <div className="lg:col-span-8">
            <BookingTable
              key={`${view}-${search}`}
              view={view}
              searchActive={search}
              loading={loading}
              bookings={bookings}
              onSearch={setSearch}
              onRefresh={() => void fetchBookings()}
              onSelect={(id) => setSelected(bookings.find((booking) => booking.id === id) ?? null)}
              onChanged={() => void fetchBookings()}
            />
          </div>
        </div>
      </main>

      {creatingLink ? (
        <BookingDrawer label="New private booking" onClose={() => setCreatingLink(false)}>
          <PrivateBookingForm
            onClose={() => setCreatingLink(false)}
            onCreated={() => {
              setSearch("");
              setView("links");
            }}
          />
        </BookingDrawer>
      ) : selected ? (
        <BookingDrawer label={`Booking for ${selected.guestName}`} onClose={() => setSelected(null)}>
          <BookingDetail key={selected.id} booking={selected} onChanged={() => void fetchBookings()} />
        </BookingDrawer>
      ) : null}
    </div>
  );
}
