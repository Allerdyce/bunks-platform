"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Loader2, Lock, LogOut, MapPin, RefreshCw, Search } from "lucide-react";
import { AdminTopNav } from "@/components/admin/AdminTopNav";
import { BookingMessages } from "@/components/messaging/BookingMessages";
import { Button } from "@/components/shared/Button";
import { MessageThreadList, type MessageThreadSummary, MessagesLayout } from "@/components/messaging/MessagesWorkspace";
import { getPropertyBySlug } from "@/data/properties";

type AuthState = "checking" | "unauthenticated" | "authenticated";

type AdminThreadSummary = {
  id: number;
  referenceCode: string | null;
  guestName: string;
  guestEmail: string;
  checkInDate: string;
  checkOutDate: string;
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

const stayDateFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
const threadTimestampFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
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

const formatThreadTimestamp = (value?: string | null) => {
  if (!value) return null;
  try {
    return threadTimestampFormatter.format(new Date(value));
  } catch {
    return value;
  }
};

export default function AdminMessagesPage() {
  const [authState, setAuthState] = useState<AuthState>("checking");
  const [email, setEmail] = useState("ali@bunks.com");
  const [password, setPassword] = useState("PMbunks101!");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [threads, setThreads] = useState<AdminThreadSummary[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(false);
  const [threadsError, setThreadsError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeThreadId, setActiveThreadId] = useState<number | null>(null);
  const [conversationSnapshots, setConversationSnapshots] = useState<Record<number, { snippet: string | null; timestamp: string | null }>>({});

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
        const data = text ? (JSON.parse(text) as { threads?: AdminThreadSummary[]; error?: string }) : null;
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

  const handleSearchThreads = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await fetchThreads(searchQuery.trim() || undefined);
  };

  const handleThreadSummaryUpdate = useCallback(
    (threadId: number, summary: { lastMessageSnippet: string | null; lastMessageAt?: string | null }) => {
      setConversationSnapshots((prev) => ({
        ...prev,
        [threadId]: { snippet: summary.lastMessageSnippet, timestamp: summary.lastMessageAt ?? null },
      }));
    },
    [],
  );

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
      const snapshot = conversationSnapshots[thread.id];
      const snippet = snapshot?.snippet ?? thread.lastMessage?.body ?? null;
      const timestamp = snapshot?.timestamp ?? thread.lastMessage?.sentAt ?? null;
      return {
        id: thread.id,
        title: thread.guestName,
        subtitle: thread.property.name,
        meta: formatStayRange(thread.checkInDate, thread.checkOutDate),
        badge: thread.referenceCode,
        mediaUrl: property?.image ?? property?.images?.[0] ?? null,
        lastMessageSnippet: snippet,
        lastMessageAtLabel: formatThreadTimestamp(timestamp),
      } as MessageThreadSummary;
    });
  }, [threads, conversationSnapshots]);

  const activePropertyDetails = activeThread ? getPropertyBySlug(activeThread.property.slug) ?? null : null;

  const handleActiveThreadSummaryChange = useCallback(
    (summary: { lastMessageSnippet: string | null; lastMessageAt?: string | null }) => {
      if (activeThread) {
        handleThreadSummaryUpdate(activeThread.id, summary);
      }
    },
    [activeThread, handleThreadSummaryUpdate],
  );

  const conversationPanel = activeThread ? (
    <BookingMessages
      variant="panel"
      viewerRole="host"
      bookingId={activeThread.id}
      bookingReference={activeThread.referenceCode}
      guestEmail={activeThread.guestEmail}
      guestName={activeThread.guestName}
      propertyName={activeThread.property.name}
      hostSupportEmail={activeThread.property.hostSupportEmail ?? "ops@bunks.com"}
      onConversationSummaryChange={handleActiveThreadSummaryChange}
    />
  ) : (
    <div className="rounded-[32px] border border-dashed border-slate-200 bg-white/90 p-6 text-sm text-slate-500">
      Select a booking on the left to open the message thread.
    </div>
  );

  const reservationPanel = activeThread ? (
    <div className="flex h-full flex-col gap-6">
      <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
        {activePropertyDetails?.image && (
          <div className="relative h-44 w-full">
            <Image src={activePropertyDetails.image} alt={activeThread.property.name} fill className="object-cover" sizes="320px" />
          </div>
        )}
        <div className="p-6 space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Reservation</p>
            <h3 className="font-serif text-2xl text-slate-900">{activeThread.property.name}</h3>
            <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
              <MapPin className="h-4 w-4" /> {activePropertyDetails?.location ?? activeThread.property.slug}
            </p>
          </div>
          <div className="grid gap-4 text-sm text-slate-600">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Guest</p>
              <p className="font-semibold text-slate-900">{activeThread.guestName}</p>
              <a href={`mailto:${activeThread.guestEmail}`} className="text-xs text-slate-500 underline">
                {activeThread.guestEmail}
              </a>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Check-in</p>
                <p className="font-semibold text-slate-900">{stayDateFormatter.format(new Date(activeThread.checkInDate))}</p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Check-out</p>
                <p className="font-semibold text-slate-900">{stayDateFormatter.format(new Date(activeThread.checkOutDate))}</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400">
              <span>Reference</span>
              <span className="font-semibold text-slate-900">{activeThread.referenceCode ?? "Pending"}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="rounded-[32px] border border-slate-200 bg-white/95 p-6 text-sm text-slate-600">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Property support</p>
        <p className="mt-2 font-semibold text-slate-900">{activeThread.property.hostSupportEmail ?? "ops@bunks.com"}</p>
        <p className="text-xs text-slate-500">Use this escalation channel if messaging doesn&apos;t get a reply within 5 minutes.</p>
      </div>
    </div>
  ) : (
    <div className="rounded-[32px] border border-dashed border-slate-200 bg-white/90 p-6 text-sm text-slate-500">
      Choose a booking to see reservation context.
    </div>
  );

  if (authState !== "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-700">
              <Lock className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-serif text-slate-900">Messaging console</h1>
            <p className="text-sm text-slate-500">Hosts only. Use your admin credentials to continue.</p>
          </div>
          {authError && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4" /> {authError}
            </div>
          )}
          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 focus:border-slate-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 focus:border-slate-500 focus:outline-none"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-slate-900 text-white py-3 font-medium hover:bg-slate-800 transition"
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
        <div className="w-full px-6 py-6 lg:px-12 border-b border-slate-100 bg-white z-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Bunks Ops</p>
          <h1 className="text-2xl font-serif text-slate-900 mt-1">Guest messaging console</h1>
          <p className="text-sm text-slate-500">Look up any booking and reply without leaving the ops console.</p>
        </div>

        {threadsError && (
          <div className="m-4 rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="mr-2 inline h-4 w-4" /> {threadsError}
          </div>
        )}
        <MessagesLayout
          variant="full-bleed"
          sidebar={(
            <div className="flex h-full flex-col bg-white">
              <div className="border-b border-slate-100 p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Messages</p>
                    <h2 className="mt-1 text-2xl font-serif text-slate-900">All bookings</h2>
                  </div>
                  <Button variant="ghost" type="button" onClick={() => void fetchThreads()} className="gap-1 px-3 py-2 text-sm">
                    <RefreshCw className="h-4 w-4" /> Sync
                  </Button>
                </div>
                <form className="mt-4" onSubmit={handleSearchThreads}>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-4 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search name, email, or ref"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm focus:border-slate-900 focus:bg-white focus:outline-none"
                    />
                  </div>
                </form>
                {threadsLoading && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                    <Loader2 className="h-3 w-3 animate-spin" /> Syncing latest threads...
                  </div>
                )}
              </div>
              <div className="flex-1 overflow-y-auto">
                <MessageThreadList
                  threads={hostThreadSummaries}
                  activeThreadId={activeThread?.id ?? null}
                  onSelect={(thread) => setActiveThreadId(Number(thread.id))}
                  emptyState={(
                    <div className="p-8 text-center text-sm text-slate-500">
                      No bookings match your search yet.
                    </div>
                  )}
                />
              </div>
            </div>
          )}
          conversation={activeThread ? (
            <BookingMessages
              variant="clean"
              viewerRole="host"
              bookingId={activeThread.id}
              bookingReference={activeThread.referenceCode}
              guestEmail={activeThread.guestEmail}
              guestName={activeThread.guestName}
              propertyName={activeThread.property.name}
              hostSupportEmail={activeThread.property.hostSupportEmail ?? "ops@bunks.com"}
              onConversationSummaryChange={handleActiveThreadSummaryChange}
            />
          ) : (
            <div className="flex h-full items-center justify-center p-6 text-sm text-slate-500">
              Select a booking on the left to open the message thread.
            </div>
          )}
          reservation={activeThread ? (
            <div className="flex h-full flex-col overflow-y-auto bg-white">
              {activePropertyDetails?.image && (
                <div className="relative h-64 w-full shrink-0">
                  <Image src={activePropertyDetails.image} alt={activeThread.property.name} fill className="object-cover" sizes="320px" />
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 to-transparent p-6 flex items-end">
                    <h3 className="font-serif text-2xl text-white shadow-sm">{activeThread.property.name}</h3>
                  </div>
                </div>
              )}
              <div className="p-8 space-y-8">
                <div>
                  <p className="flex items-center gap-2 text-sm text-slate-500">
                    <MapPin className="h-4 w-4" /> {activePropertyDetails?.location ?? activeThread.property.slug}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-6 text-sm text-slate-600">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Check-in</p>
                      <p className="font-semibold text-slate-900">{stayDateFormatter.format(new Date(activeThread.checkInDate))}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Check-out</p>
                      <p className="font-semibold text-slate-900">{stayDateFormatter.format(new Date(activeThread.checkOutDate))}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Guest details</p>
                  <div>
                    <p className="font-semibold text-slate-900">{activeThread.guestName}</p>
                    <a href={`mailto:${activeThread.guestEmail}`} className="text-sm text-slate-500 underline">
                      {activeThread.guestEmail}
                    </a>
                  </div>
                  <div className="border-t border-slate-100 pt-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Reference</p>
                    <p className="font-semibold text-slate-900">{activeThread.referenceCode ?? "Pending"}</p>
                  </div>
                </div>
                <div className="space-y-2 border-t border-slate-100 pt-6">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Internal support</p>
                  <p className="font-semibold text-slate-900 text-sm">{activeThread.property.hostSupportEmail ?? "ops@bunks.com"}</p>
                  <p className="text-xs text-slate-500">Use this for escalations.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center p-6 text-sm text-slate-500">
              Choose a booking to see reservation context.
            </div>
          )}
        />
      </main>
    </div>
  );
}
