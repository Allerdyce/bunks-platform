"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, MessageSquare, Send, ShieldAlert } from "lucide-react";
import type { ConversationMessage } from "@/types";
import { api } from "@/lib/api";
import { Button } from "@/components/shared/Button";

const timestampFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const formatTimestamp = (value: string) => {
  try {
    return timestampFormatter.format(new Date(value));
  } catch {
    return value;
  }
};

interface BookingMessagesProps {
  bookingId: number;
  bookingReference?: string | null;
  guestEmail?: string | null;
  guestName?: string | null;
  propertyName?: string | null;
  hostSupportEmail?: string | null;
  viewerRole?: "guest" | "host";
  variant?: "card" | "panel" | "clean";
  onConversationSummaryChange?: (summary: { lastMessageSnippet: string | null; lastMessageAt?: string | null }) => void;
}

export function BookingMessages({
  bookingId,
  bookingReference,
  guestEmail,
  guestName,
  propertyName,
  hostSupportEmail,
  viewerRole = "guest",
  variant = "card",
  onConversationSummaryChange,
}: BookingMessagesProps) {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const isHostView = viewerRole === "host";
  const credentials = useMemo(
    () => (isHostView || !guestEmail || !bookingReference ? undefined : { guestEmail, bookingReference }),
    [isHostView, guestEmail, bookingReference],
  );

  const canSend = isHostView || Boolean(credentials);
  const friendlyGuestName = useMemo(
    () => guestName?.split(" ")[0] ?? (isHostView ? "this guest" : "there"),
    [guestName, isHostView],
  );

  const fetchMessages = useCallback(
    async (options?: { silently?: boolean }) => {
      try {
        if (!options?.silently) {
          setIsLoading(true);
        }
        setError(null);
        const response = await api.fetchBookingConversation(bookingId, credentials);
        setMessages(response.messages);
      } catch (err) {
        console.error("Failed to load conversation", err);
        const message = err instanceof Error ? err.message : "Unable to load conversation";
        setError(message);
      } finally {
        if (!options?.silently) {
          setIsLoading(false);
        }
      }
    },
    [bookingId, credentials],
  );

  useEffect(() => {
    void fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    const id = setInterval(() => {
      void fetchMessages({ silently: true });
    }, 15000);
    return () => clearInterval(id);
  }, [fetchMessages]);

  useEffect(() => {
    if (!scrollRef.current) {
      return;
    }
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (!onConversationSummaryChange) {
      return;
    }
    if (!messages.length) {
      onConversationSummaryChange({ lastMessageSnippet: null, lastMessageAt: null });
      return;
    }
    const last = messages[messages.length - 1];
    onConversationSummaryChange({ lastMessageSnippet: last.body, lastMessageAt: last.sentAt });
  }, [messages, onConversationSummaryChange]);

  const handleSend = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || !canSend) {
      return;
    }
    setIsSending(true);
    setError(null);
    try {
      const sentMessage = await api.sendBookingMessage(bookingId, {
        body: trimmed,
        guestEmail: credentials?.guestEmail,
        bookingReference: credentials?.bookingReference,
      });
      setMessages((current) => [...current, sentMessage]);
      setInputValue("");
    } catch (err) {
      console.error("Failed to send message", err);
      const message = err instanceof Error ? err.message : "Unable to send message";
      setError(message);
    } finally {
      setIsSending(false);
    }
  };

  const containerClasses = {
    card: "rounded-3xl border border-slate-100 bg-white p-6 shadow-sm",
    panel: "flex h-full flex-col rounded-3xl border border-slate-200 bg-white shadow-sm",
    clean: "flex h-full flex-col bg-white",
  }[variant];

  const innerPaddingClass = variant === "panel" || variant === "clean" ? "flex h-full flex-col p-6" : "";
  const messagesContainerClass =
    variant === "panel" || variant === "clean" ? "mt-4 flex-1 overflow-y-auto pr-1" : "mt-4 max-h-[360px] overflow-y-auto pr-1";

  return (
    <div className={containerClasses}>
      <div className={innerPaddingClass}>
        <div className="flex items-center gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900/5 text-slate-900">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Messages</p>
            <h3 className="text-xl font-serif text-slate-900">
              {isHostView ? "Guest conversation" : "Chat with your host"}
            </h3>
            <p className="text-sm text-slate-500">
              {isHostView
                ? "Respond to guest questions and keep everything tied to this booking."
                : "Ask arrival questions, confirm add-ons, or flag issues. Replies come back to this thread and your email."}
            </p>
            {isHostView && (
              <div className="mt-3 space-y-1 text-xs text-slate-500">
                {propertyName && <p>Property: {propertyName}</p>}
                {guestEmail && (
                  <p>
                    Guest email: <a href={`mailto:${guestEmail}`} className="underline">{guestEmail}</a>
                  </p>
                )}
                {bookingReference && <p>Reference code: {bookingReference}</p>}
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <ShieldAlert className="h-4 w-4" /> {error}
          </div>
        )}

        <div className={messagesContainerClass} ref={scrollRef}>
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading messages...
            </div>
          ) : messages.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
              {isHostView
                ? "No messages yet. Send a welcome note to kick off the conversation."
                : `Hey ${friendlyGuestName}, you're the first to message. Say hello to your host to start the thread.`}
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => (
                <div key={message.id} className={`flex flex-col ${message.isMine ? "items-end" : "items-start"}`}>
                  <span className="mb-1 block text-[11px] text-slate-400">
                    {formatTimestamp(message.sentAt)}
                  </span>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ${message.isMine ? "bg-[#3F3F3F] text-white" : "bg-[#F7F7F7] text-black"
                      }`}
                  >
                    <p className="whitespace-pre-line">{message.body}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 space-y-3">
          <textarea
            rows={3}
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
            placeholder={isHostView ? "Type a message to your guest" : "Type a message to your host"}
            disabled={!canSend || isSending}
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            {isHostView ? (
              guestEmail ? (
                <p className="text-xs text-slate-500">
                  Need to reach them directly? Email <a href={`mailto:${guestEmail}`} className="underline">{guestEmail}</a>.
                </p>
              ) : null
            ) : (
              hostSupportEmail && (
                <p className="text-xs text-slate-500">
                  Prefer email? Contact <a href={`mailto:${hostSupportEmail}`} className="underline">{hostSupportEmail}</a>.
                </p>
              )
            )}
            <Button
              type="button"
              onClick={handleSend}
              disabled={!canSend || isSending || inputValue.trim().length === 0}
              className="inline-flex items-center justify-center gap-2"
            >
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send
            </Button>
          </div>
          {!isHostView && !canSend && (
            <p className="text-xs text-slate-500">
              Messaging unlocks once you look up your booking with the reference code and email on file.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
