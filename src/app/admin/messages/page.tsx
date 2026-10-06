"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Loader2,
  LogOut,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import Link from "next/link";
import { AdminTopNav } from "@/components/admin/AdminTopNav";
import { AdminCheckingShell } from "@/components/admin/AdminCheckingShell";
import { Button } from "@/components/shared/Button";
import {
  MessageThreadList,
  type MessageThreadSummary,
} from "@/components/messaging/MessagesWorkspace";
import { getPropertyBySlug } from "@/data/properties";
import { SUPPORT_EMAIL } from "@/lib/contact";
import { CancelBookingControl, type AdminBookingStatus } from "@/components/admin/CancelBookingControl";
import { PaymentLinkDetails, type AdminPaymentLink } from "@/components/admin/PaymentLinkDetails";
import { PrivateBookingForm } from "@/components/admin/PrivateBookingForm";

type AuthState = "checking" | "unauthenticated" | "authenticated";

type AdminThreadSummary = {
  id: number;
  referenceCode: string | null;
  guestName: string;
  guestEmail: string;
  checkInDate: string;
  checkOutDate: string;
  status: AdminBookingStatus;
  totalPriceCents: number;
  holdExpired: boolean;
  guestCount: number | null;
  paymentLink: AdminPaymentLink | null;
  property: {
    id: number;
    name: string;
    slug: string;
    hostSupportEmail?: string | null;
  };
  lastMessage: {
    body: string;
    sentAt: string;
    senderRole: string | null;
  } | null;
};

// Stay dates are calendar dates stored as UTC midnight.
const stayDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

const formatStayRange = (checkIn: string, checkOut: string) => {
  try {
    const start = stayDateFormatter.format(new Date(checkIn));
    const end = stayDateFormatter.format(new Date(checkOut));
    return `${start} → ${end}`;
  } catch {
    return `${checkIn} → ${checkOut}`;
  }
};

const formatMoney = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

const nightsBetweenIso = (checkIn: string, checkOut: string) =>
  Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86_400_000);

const statusPillClass = (booking: { status: AdminBookingStatus; holdExpired: boolean }) =>
  booking.status === "PAID"
    ? "bg-emerald-50 text-emerald-700"
    : booking.status === "CANCELLED"
      ? "bg-red-50 text-red-700"
      : booking.holdExpired
        ? "bg-gray-100 text-gray-600"
        : "bg-amber-50 text-amber-700";

const bookingStatusLabel = (booking: { status: AdminBookingStatus; holdExpired: boolean; paymentLink: AdminPaymentLink | null }) =>
  booking.status === "PAID"
    ? "Paid"
    : booking.status === "CANCELLED"
      ? "Cancelled"
      : booking.paymentLink
        ? booking.holdExpired
          ? "Payment link expired"
          : "Awaiting payment (link)"
        : booking.holdExpired
          ? "Abandoned checkout"
          : "Awaiting payment";


export default function AdminMessagesPage() {
  const [authState, setAuthState] = useState<AuthState>("checking");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [threads, setThreads] = useState<AdminThreadSummary[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(false);
  const [threadsError, setThreadsError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeThreadId, setActiveThreadId] = useState<number | null>(null);
  const [creatingLink, setCreatingLink] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const res = await fetch("/api/admin/session", {
          credentials: "include",
        });
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
        throw new Error(
          (payload as { error?: string }).error ?? "Invalid credentials",
        );
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
    await fetch("/api/admin/logout", {
      method: "POST",
      credentials: "include",
    });
    setAuthState("unauthenticated");
    setThreads([]);
    setActiveThreadId(null);
  };

  const fetchThreads = useCallback(
    async (query?: string) => {
      setThreadsLoading(true);
      setThreadsError(null);
      try {
        const params = query ? `?search=${encodeURIComponent(query)}` : "";
        const res = await fetch(`/api/admin/bookings/messages${params}`, {
          credentials: "include",
        });
        const text = await res.text();
        const data = text
          ? (JSON.parse(text) as {
              threads?: AdminThreadSummary[];
              error?: string;
            })
          : null;
        if (!res.ok) {
          throw new Error((data?.error ?? text) || "Failed to load bookings");
        }
        const results = data?.threads ?? [];
        setThreads(results);
        if (!results.length) {
          setActiveThreadId(null);
          return;
        }
        if (!results.some((thread) => thread.id === activeThreadId)) {
          setActiveThreadId(results[0].id);
        }
      } catch (err) {
        console.error("Failed to load booking threads", err);
        setThreadsError((err as Error).message ?? "Failed to load bookings");
        setThreads([]);
        setActiveThreadId(null);
      } finally {
        setThreadsLoading(false);
      }
    },
    [activeThreadId],
  );

  useEffect(() => {
    if (authState === "authenticated") {
      void fetchThreads();
    }
  }, [authState, fetchThreads]);

  const handleSearchThreads = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    await fetchThreads(searchQuery.trim() || undefined);
  };

  const activeThread = useMemo(() => {
    if (!threads.length) return null;
    if (activeThreadId === null) {
      return threads[0];
    }
    return threads.find((thread) => thread.id === activeThreadId) ?? threads[0];
  }, [activeThreadId, threads]);

  const hostThreadSummaries: MessageThreadSummary[] = useMemo(() => {
    return threads.map((thread) => {
      const property = getPropertyBySlug(thread.property.slug);
      return {
        id: thread.id,
        title: thread.guestName,
        subtitle: thread.property.name,
        meta: `${formatStayRange(thread.checkInDate, thread.checkOutDate)} · ${bookingStatusLabel(thread)}`,
        badge: thread.referenceCode,
        mediaUrl: property?.image ?? property?.images?.[0] ?? null,
        // Messaging is email-only, so the list shows bookings without chat previews.
        lastMessageSnippet: null,
        lastMessageAtLabel: null,
      } as MessageThreadSummary;
    });
  }, [threads]);

  const activePropertyDetails = activeThread
    ? (getPropertyBySlug(activeThread.property.slug) ?? null)
    : null;

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

            <h1 className="page-title   text-gray-900">Messaging console</h1>
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
          <Button
            onClick={handleLogout}
            className="inline-flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Logout
          </Button>
        }
      />

      <main className="flex min-h-0 flex-1 flex-col">
        <div className="z-10 flex w-full flex-wrap items-end justify-between gap-4 border-b border-gray-100 bg-white px-6 py-6 lg:px-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
              Bunks Ops
            </p>
            <h1 className="page-title   text-gray-900 mt-1">
              Bookings & guests
            </h1>
            <p className="text-sm text-gray-500">
              Look up any booking, see its details, and email the guest.
            </p>
          </div>
          <Button type="button" onClick={() => setCreatingLink(true)} className="gap-2 whitespace-nowrap">
            <Plus className="h-4 w-4" /> New private booking
          </Button>
        </div>

        {threadsError && (
          <div className="m-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="mr-2 inline h-4 w-4" /> {threadsError}
          </div>
        )}
        <div className="flex flex-col bg-white lg:h-[calc(100vh-80px)] lg:flex-row lg:divide-x lg:divide-gray-200">
          <aside className="flex flex-col lg:w-[400px] lg:flex-shrink-0 lg:overflow-y-auto">
            <div className="flex h-full flex-col bg-white">
              <div className="border-b border-gray-100 p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                      Bookings
                    </p>
                    <h2 className="mt-1 text-2xl font-sans font-semibold text-gray-900">
                      All bookings
                    </h2>
                  </div>
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() => void fetchThreads()}
                    className="gap-1 px-3 py-2 text-sm"
                  >
                    <RefreshCw className="h-4 w-4" /> Refresh
                  </Button>
                </div>
                <form className="mt-4" onSubmit={handleSearchThreads}>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-4 top-3 h-4 w-4 text-gray-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search name, email, or ref"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm focus:border-gray-900 focus:bg-white focus:outline-none"
                    />
                  </div>
                </form>
                {threadsLoading && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                    <Loader2 className="h-3 w-3 animate-spin" /> Loading bookings…
                  </div>
                )}
              </div>
              <div className="flex-1 overflow-y-auto">
                <MessageThreadList
                  threads={hostThreadSummaries}
                  activeThreadId={activeThread?.id ?? null}
                  onSelect={(thread) => {
                    setCreatingLink(false);
                    setActiveThreadId(Number(thread.id));
                  }}
                  emptyState={
                    <div className="p-8 text-center text-sm text-gray-500">
                      No bookings match your search yet.
                    </div>
                  }
                />
              </div>
            </div>
          </aside>
          <section className="min-w-0 flex-1 lg:overflow-y-auto">
            {creatingLink ? (
              <PrivateBookingForm
                onClose={() => setCreatingLink(false)}
                onCreated={(bookingId) => {
                  setActiveThreadId(bookingId);
                  void fetchThreads(searchQuery || undefined);
                }}
              />
            ) : activeThread ? (
            <div className="mx-auto max-w-3xl space-y-8 p-6 sm:p-10">
              <header className="flex items-start justify-between gap-6">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                    {activeThread.property.name}
                  </p>
                  <h2 className="mt-2 font-serif text-3xl text-gray-900">{activeThread.guestName}</h2>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusPillClass(activeThread)}`}>
                      {bookingStatusLabel(activeThread)}
                    </span>
                    <span className="text-gray-500">Ref {activeThread.referenceCode ?? "—"}</span>
                  </div>
                </div>
                {activePropertyDetails?.image && (
                  <div className="relative hidden h-24 w-36 shrink-0 overflow-hidden rounded-xl sm:block">
                    <Image
                      src={activePropertyDetails.image}
                      alt={activeThread.property.name}
                      fill
                      className="object-cover"
                      sizes="144px"
                    />
                  </div>
                )}
              </header>

              <dl className="grid grid-cols-2 gap-4 rounded-2xl bg-gray-50 p-5 sm:grid-cols-4">
                {[
                  ["Check-in", stayDateFormatter.format(new Date(activeThread.checkInDate))],
                  ["Check-out", stayDateFormatter.format(new Date(activeThread.checkOutDate))],
                  ["Nights", String(nightsBetweenIso(activeThread.checkInDate, activeThread.checkOutDate))],
                  ...(activeThread.guestCount ? [["Guests", String(activeThread.guestCount)]] : []),
                  ["Total", formatMoney(activeThread.totalPriceCents)],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs uppercase tracking-[0.2em] text-gray-500">{label}</dt>
                    <dd className="mt-1 font-semibold text-gray-900">{value}</dd>
                  </div>
                ))}
              </dl>

              <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Guest</h3>
                <p className="text-gray-900">
                  {activeThread.guestName} ·{" "}
                  <a href={`mailto:${activeThread.guestEmail}`} className="underline">
                    {activeThread.guestEmail}
                  </a>
                </p>
                <div className="flex flex-wrap gap-3">
                  <a
                    href={`mailto:${activeThread.guestEmail}?subject=${encodeURIComponent(`Your stay at ${activeThread.property.name} (${activeThread.referenceCode ?? activeThread.id})`)}`}
                    className="inline-flex items-center rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
                  >
                    Email guest
                  </a>
                  {activeThread.referenceCode && activeThread.status === "PAID" && (
                    <a
                      href={`/my-trips/${activeThread.referenceCode}/essential`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center rounded-full border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50"
                    >
                      Guest&apos;s trip page
                    </a>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  Guest replies to booking emails go to{" "}
                  {activeThread.property.hostSupportEmail ?? SUPPORT_EMAIL}.
                </p>
              </section>

              {activeThread.paymentLink && (
                <PaymentLinkDetails key={activeThread.id} bookingId={activeThread.id} link={activeThread.paymentLink} />
              )}

              <section className="space-y-3 border-t border-gray-100 pt-6">
                <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Cancellation</h3>
                <CancelBookingControl
                  key={activeThread.id}
                  bookingId={activeThread.id}
                  status={activeThread.status}
                  totalPriceCents={activeThread.totalPriceCents}
                  checkInDate={activeThread.checkInDate}
                  paymentLink={Boolean(activeThread.paymentLink)}
                  onCancelled={() => void fetchThreads(searchQuery || undefined)}
                />
              </section>
            </div>
            ) : (
              <div className="flex h-full items-center justify-center p-10 text-sm text-gray-500">
                Choose a booking to see its details.
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
