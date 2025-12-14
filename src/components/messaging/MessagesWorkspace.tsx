"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { Clock, MessageCircle } from "lucide-react";

export interface MessageThreadSummary {
  id: string | number;
  title: string;
  subtitle: string;
  meta?: string | null;
  badge?: string | null;
  statusLabel?: string | null;
  mediaUrl?: string | null;
  lastMessageSnippet?: string | null;
  lastMessageAtLabel?: string | null;
  unreadCount?: number;
}

interface MessageThreadListProps {
  threads: MessageThreadSummary[];
  activeThreadId?: string | number | null;
  onSelect?: (thread: MessageThreadSummary) => void;
  emptyState?: ReactNode;
}

export function MessageThreadList({ threads, activeThreadId, onSelect, emptyState }: MessageThreadListProps) {
  if (!threads.length && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div className="flex flex-col">
      {threads.map((thread) => {
        const isActive = String(thread.id) === String(activeThreadId ?? "");
        return (
          <button
            key={thread.id}
            type="button"
            onClick={() => onSelect?.(thread)}
            className={`group flex w-full items-start gap-3 border-b border-slate-100 px-4 py-4 text-left transition hover:bg-slate-50 last:border-0 ${isActive ? "bg-slate-50" : "bg-white"
              }`}
          >
            <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-slate-100">
              {thread.mediaUrl ? (
                <Image src={thread.mediaUrl} alt={thread.title} fill className="object-cover" sizes="48px" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-400">
                  <MessageCircle className="h-5 w-5" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className={`truncate text-sm font-semibold ${isActive ? "text-slate-900" : "text-slate-700"}`}>{thread.title}</p>
                  <p className="truncate text-xs uppercase tracking-[0.2em] text-slate-400">{thread.subtitle}</p>
                </div>
                {thread.badge && (
                  <span className="rounded-full bg-slate-900/5 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                    {thread.badge}
                  </span>
                )}
              </div>
              {thread.meta && <p className="mt-1 truncate text-xs text-slate-500">{thread.meta}</p>}
              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                {thread.lastMessageSnippet ? (
                  <p className="truncate pr-2 text-slate-500">{thread.lastMessageSnippet}</p>
                ) : (
                  <p className="truncate pr-2 text-slate-400">No messages yet</p>
                )}
                {thread.lastMessageAtLabel && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {thread.lastMessageAtLabel}
                  </span>
                )}
              </div>
              {typeof thread.unreadCount === "number" && thread.unreadCount > 0 && (
                <span className="mt-2 inline-flex items-center rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                  {thread.unreadCount} new
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

interface MessagesLayoutProps {
  sidebar: ReactNode;
  conversation: ReactNode;
  reservation?: ReactNode;
  variant?: "default" | "full-bleed";
}

export function MessagesLayout({ sidebar, conversation, reservation, variant = "default" }: MessagesLayoutProps) {
  if (variant === "full-bleed") {
    return (
      <div className="flex flex-col bg-white lg:h-[calc(100vh-80px)] lg:flex-row lg:divide-x lg:divide-slate-200">
        <div className="flex flex-col lg:w-[400px] lg:flex-shrink-0 lg:overflow-y-auto bg-white/50">
          {sidebar}
        </div>
        <div className="flex-1 flex flex-col min-w-0 lg:overflow-hidden bg-white">
          {conversation}
        </div>
        <div className="hidden lg:flex lg:w-[400px] lg:flex-shrink-0 lg:flex-col lg:overflow-y-auto bg-slate-50/50">
          {reservation}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:grid lg:h-[calc(100vh-180px)] lg:grid-cols-[minmax(260px,320px)_minmax(0,1fr)_minmax(260px,340px)] lg:items-stretch lg:gap-8 lg:space-y-0">
      <div className="space-y-6 lg:h-full lg:overflow-y-auto lg:pr-4">{sidebar}</div>
      <div className="min-h-[560px] lg:h-full lg:overflow-hidden">{conversation}</div>
      <div className="space-y-6 lg:h-full lg:overflow-y-auto lg:pl-4">{reservation}</div>
    </div>
  );
}
