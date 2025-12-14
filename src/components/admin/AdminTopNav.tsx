import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

interface AdminTopNavProps {
  active: "details" | "pricing" | "emails" | "resources" | "messages" | "marketing";
  actions?: React.ReactNode;
}

const NAV_ITEMS = [
  { id: "details" as const, label: "Details", href: "/admin/details" },
  { id: "pricing" as const, label: "Pricing", href: "/admin/pricing" },
  { id: "emails" as const, label: "Emails", href: "/admin/emails" },
  { id: "resources" as const, label: "Resources", href: "/admin/resources" },
  { id: "messages" as const, label: "Messages", href: "/admin/messages" },
  { id: "marketing" as const, label: "Campaigns", href: "/admin/marketing" },
];

export function AdminTopNav({ active, actions }: AdminTopNavProps) {
  const navContainerClass = "sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md";

  return (
    <nav className={navContainerClass}>
      <div className="w-full px-6 lg:px-12">
        <div className="flex h-20 items-center justify-between gap-8">
          <div className="flex items-center gap-8">
            <Link href="/admin" className="flex-shrink-0">
              <Image
                src="/bunks-logo.svg"
                alt="Bunks Ops"
                width={120}
                height={32}
                priority
                className="h-8 w-auto opacity-80 hover:opacity-100 transition-opacity"
              />
            </Link>

            <div className="hidden h-5 w-px bg-slate-200 lg:block" />

            <div className="hidden lg:flex items-center gap-6">
              {NAV_ITEMS.map((item) => {
                const isActive = item.id === active;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition ${isActive ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-800"
                      }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {actions}
          </div>
        </div>
      </div>
    </nav>
  );
}
