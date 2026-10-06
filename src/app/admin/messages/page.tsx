"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, LogOut, Plus } from "lucide-react";
import Link from "next/link";
import { AdminTopNav } from "@/components/admin/AdminTopNav";
import { AdminCheckingShell } from "@/components/admin/AdminCheckingShell";
import { Button } from "@/components/shared/Button";
import { PROPERTIES } from "@/data/properties";
import { PrivateBookingForm } from "@/components/admin/PrivateBookingForm";
import { BookingList } from "@/components/admin/bookings/BookingList";
import { BookingDetail } from "@/components/admin/bookings/BookingDetail";
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
  const [activeId, setActiveId] = useState<number | null>(null);
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
    setActiveId(null);
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
      setActiveId((current) => (current !== null && results.some((b) => b.id === current) ? current : (results[0]?.id ?? null)));
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

  const activeBooking = useMemo(
    () => bookings.find((booking) => booking.id === activeId) ?? null,
    [bookings, activeId],
  );

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
    <div className="flex h-screen flex-col bg-white">
      <AdminTopNav
        active="messages"
        actions={
          <Button onClick={handleLogout} className="inline-flex items-center gap-2">
            <LogOut className="w-4 h-4" /> Logout
          </Button>
        }
      />

      <main className="flex min-h-0 flex-1 flex-col">
        <div className="z-10 flex w-full flex-wrap items-end justify-between gap-4 border-b border-gray-100 bg-white px-6 py-6 lg:px-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Bunks Ops</p>
            <h1 className="page-title   text-gray-900 mt-1">Bookings & guests</h1>
            <p className="text-sm text-gray-500">Stays, payment links and cancellations, with each guest&apos;s details and emails.</p>
          </div>
          <Button type="button" onClick={() => setCreatingLink(true)} className="gap-2 whitespace-nowrap">
            <Plus className="h-4 w-4" /> New private booking
          </Button>
        </div>

        {loadError && (
          <div className="m-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="mr-2 inline h-4 w-4" /> {loadError}
          </div>
        )}
        <div className="flex min-h-0 flex-1 flex-col bg-white lg:flex-row lg:divide-x lg:divide-gray-200">
          <aside className="flex min-h-[50vh] flex-col lg:min-h-0 lg:w-[420px] lg:flex-shrink-0">
            <BookingList
              view={view}
              counts={counts}
              homes={HOMES}
              home={home}
              searchActive={search}
              loading={loading}
              bookings={bookings}
              activeId={activeBooking?.id ?? null}
              onViewChange={(next) => {
                setSearch("");
                setCreatingLink(false);
                setView(next);
              }}
              onHomeChange={setHome}
              onSearch={setSearch}
              onRefresh={() => void fetchBookings()}
              onSelect={(id) => {
                setCreatingLink(false);
                setActiveId(id);
              }}
              onChanged={() => void fetchBookings()}
            />
          </aside>
          <section className="min-w-0 flex-1 lg:overflow-y-auto">
            {creatingLink ? (
              <PrivateBookingForm
                onClose={() => setCreatingLink(false)}
                onCreated={(bookingId) => {
                  setView("links");
                  setSearch("");
                  setActiveId(bookingId);
                }}
              />
            ) : activeBooking ? (
              <BookingDetail key={activeBooking.id} booking={activeBooking} onChanged={() => void fetchBookings()} />
            ) : (
              <div className="flex h-full items-center justify-center p-10 text-sm text-gray-500">
                {loading ? "Loading…" : "Choose a booking to see its details."}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
