import Link from "next/link";
import type { ReactNode } from "react";

interface AdminTopNavProps {
  title: string;
  subtitle: string;
  active: "details" | "pricing" | "emails" | "resources";
  actions?: ReactNode;
}

const NAV_ITEMS = [
  { id: "details" as const, label: "Details", href: "/admin/details" },
  { id: "pricing" as const, label: "Pricing", href: "/admin" },
  { id: "emails" as const, label: "Emails", href: "/admin/emails" },
  { id: "resources" as const, label: "Resources", href: "/admin/resources" },
];

export function AdminTopNav({ title, subtitle, active, actions }: AdminTopNavProps) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Bunks Ops</p>
          <h1 className="text-2xl font-serif text-slate-900 mt-1">{title}</h1>
          <p className="text-sm text-slate-500">{subtitle}</p>
          <nav className="mt-4 flex flex-wrap gap-4 text-sm font-medium text-slate-500">
            {NAV_ITEMS.map((item) => {
              const isActive = item.id === active;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`pb-1 border-b-2 transition-colors ${
                    isActive ? "border-violet-600 text-violet-700" : "border-transparent hover:text-slate-700"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
      </div>
    </header>
  );
}
