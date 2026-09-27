"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AdminTopNav } from "@/components/admin/AdminTopNav";
import { AdminCheckingShell } from "@/components/admin/AdminCheckingShell";
import { Button } from "@/components/shared/Button";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Loader2,
  Lock,
  LogOut,
  RefreshCw,
  Send,
} from "lucide-react";
import type { GuestListResponse, GuestRow, GuestSource } from "@/types/guests";

type AuthState = "checking" | "unauthenticated" | "authenticated";

const SOURCE_LABELS: Record<GuestSource, string> = {
  wifi: "Wi-Fi",
  direct_booking: "Direct booking",
};

const SOURCE_STYLES: Record<GuestSource, string> = {
  wifi: "bg-sky-50 text-sky-700 border-sky-100",
  direct_booking: "bg-gray-50 text-gray-700 border-gray-100",
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const formatDate = (value: string) => {
  try {
    return dateFormatter.format(new Date(value));
  } catch {
    return value;
  }
};

export default function AdminMarketingPage() {
  const [authState, setAuthState] = useState<AuthState>("checking");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const [guestData, setGuestData] = useState<GuestListResponse | null>(null);
  const [guestsLoading, setGuestsLoading] = useState(false);
  const [guestsError, setGuestsError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const sendFormRef = useRef<HTMLDivElement>(null);

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

  const fetchGuests = useCallback(async () => {
    setGuestsLoading(true);
    setGuestsError(null);
    try {
      const res = await fetch("/api/admin/guests", { credentials: "include" });
      const data = (await res.json()) as GuestListResponse & { error?: string };
      if (res.status === 401) {
        setAuthState("unauthenticated");
        return;
      }
      if (!res.ok) throw new Error(data.error || "Failed to load guests");
      setGuestData(data);
    } catch (err) {
      setGuestsError((err as Error).message);
    } finally {
      setGuestsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authState === "authenticated") {
      void fetchGuests();
    }
  }, [authState, fetchGuests]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(
          (payload as { error?: string }).error ?? "Invalid credentials",
        );
      }
      setAuthState("authenticated");
    } catch (err) {
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
    setGuestData(null);
  };

  const handleSelectGuest = (guest: GuestRow) => {
    setEmail(guest.email);
    setName(guest.name ?? "");
    setStatus(null);
    sendFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch("/api/admin/marketing/send", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to send");

      setStatus({ type: "success", text: `Sent to ${email}!` });
      setEmail("");
      setName("");
    } catch (err: unknown) {
      setStatus({ type: "error", text: (err as Error).message });
    } finally {
      setLoading(false);
    }
  };

  if (authState === "checking") {
    return <AdminCheckingShell active="marketing" />;
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
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-700">
              <Lock className="w-5 h-5" />
            </div>
            <h1 className="page-title   text-gray-900">Guests & campaigns</h1>
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
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
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
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
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

  const summary = guestData?.summary;
  const guests = guestData?.guests ?? [];

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <AdminTopNav
        active="marketing"
        actions={
          <Button
            onClick={handleLogout}
            className="inline-flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Logout
          </Button>
        }
      />

      <main className="w-full px-6 lg:px-12 mt-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="page-title   text-gray-900">
              Guests & return visits
            </h1>
            <p className="text-sm text-gray-500">
              Every guest email we&apos;ve captured — from the Wi-Fi page and
              direct bookings — in one place.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total guests", value: summary?.total },
              { label: "Wi-Fi captures", value: summary?.wifi },
              { label: "Direct bookers", value: summary?.directBookers },
              {
                label: "Wi-Fi → booked direct",
                value: summary?.returnedDirect,
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white rounded-xl border border-gray-200  p-5"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {stat.label}
                </p>
                <p className="mt-2 text-3xl font-semibold text-gray-900">
                  {stat.value ?? "–"}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 ">
            <div className="flex flex-wrap items-center justify-between gap-3 p-6 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Guest list
                </h2>
                <p className="text-sm text-gray-500">
                  Click a guest to prefill the Book Direct invitation below.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => void fetchGuests()}
                  className="gap-1 px-3 py-2 text-sm"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${guestsLoading ? "animate-spin" : ""}`}
                  />{" "}
                  Refresh
                </Button>
                <a
                  href="/api/admin/guests?format=csv"
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Download className="h-4 w-4" /> Export CSV
                </a>
              </div>
            </div>

            {guestsError && (
              <div className="m-6 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                <AlertCircle className="w-4 h-4" /> {guestsError}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-gray-500">
                    <th className="px-6 py-3 font-semibold">Guest</th>
                    <th className="px-6 py-3 font-semibold">Source</th>
                    <th className="px-6 py-3 font-semibold">Property</th>
                    <th className="px-6 py-3 font-semibold">First seen</th>
                    <th className="px-6 py-3 font-semibold">Last seen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {guests.map((guest) => (
                    <tr
                      key={guest.email}
                      onClick={() => handleSelectGuest(guest)}
                      className="cursor-pointer hover:bg-gray-50"
                    >
                      <td className="px-6 py-3">
                        <p className="font-medium text-gray-900">
                          {guest.email}
                        </p>
                        {guest.name && (
                          <p className="text-xs text-gray-500">{guest.name}</p>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex flex-wrap gap-1">
                          {guest.sources.map((source) => (
                            <span
                              key={source}
                              className={`rounded-full border px-2 py-0.5 text-xs font-medium ${SOURCE_STYLES[source]}`}
                            >
                              {SOURCE_LABELS[source]}
                              {source === "direct_booking" &&
                              guest.directBookings > 1
                                ? ` ×${guest.directBookings}`
                                : ""}
                            </span>
                          ))}
                          {guest.returnedDirect && (
                            <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                              Returned direct
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-gray-600">
                        {guest.properties.join(", ") || "—"}
                      </td>
                      <td className="px-6 py-3 text-gray-600 whitespace-nowrap">
                        {formatDate(guest.firstSeen)}
                      </td>
                      <td className="px-6 py-3 text-gray-600 whitespace-nowrap">
                        {formatDate(guest.lastSeen)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!guestsLoading && guestData && guests.length === 0 && (
                <p className="p-8 text-center text-sm text-gray-500">
                  No guests captured yet.
                </p>
              )}
              {guestsLoading && !guestData && (
                <p className="p-8 text-center text-sm text-gray-500">
                  <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />{" "}
                  Loading guests...
                </p>
              )}
            </div>
          </div>

          <div
            ref={sendFormRef}
            className="max-w-2xl mx-auto bg-white rounded-xl border border-gray-200  p-8 scroll-mt-28"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Book Direct Invitation
            </h2>

            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Guest Email
                </label>
                <input
                  type="email"
                  aria-label="Email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@example.com"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900  focus:border-gray-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Guest Name (Optional)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900  focus:border-gray-500 focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white  hover:bg-gray-800 disabled:opacity-60 transition"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Send Invitation
                </button>
              </div>

              {status && (
                <div
                  className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium ${
                    status.type === "success"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                      : "bg-red-50 text-red-600 border border-red-100"
                  }`}
                >
                  {status.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  {status.text}
                </div>
              )}
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
