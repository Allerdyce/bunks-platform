import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

interface AdminTopNavProps {
  active:
    | "details"
    | "setup"
    | "pricing"
    | "emails"
    | "resources"
    | "messages"
    | "marketing";
  actions?: ReactNode;
}

const NAV_ITEMS = [
  { id: "details" as const, label: "Details", href: "/admin/details" },
  { id: "setup" as const, label: "Setup", href: "/admin/setup" },
  { id: "pricing" as const, label: "Pricing", href: "/admin/pricing" },
  { id: "emails" as const, label: "Emails", href: "/admin/emails" },
  { id: "resources" as const, label: "Resources", href: "/admin/resources" },
  { id: "messages" as const, label: "Messages", href: "/admin/messages" },
  { id: "marketing" as const, label: "Guests", href: "/admin/marketing" },
];

export function AdminTopNav({ active, actions }: AdminTopNavProps) {
  return (
    <nav
      aria-label="Administration"
      className="sticky top-0 z-50 border-b bg-[var(--color-surface)]"
    >
      <div className="grid grid-cols-[1fr_auto] items-center gap-4 px-5 py-5 xl:grid-cols-[1fr_auto_1fr] lg:px-10">
        <Link href="/" aria-label="Bunks home" className="justify-self-start">
          <Image
            src="/bunks-logo.svg"
            alt="Bunks"
            width={120}
            height={36}
            priority
            className="h-8 w-auto grayscale"
          />
        </Link>
        <div className="col-span-2 row-start-2 flex max-w-full gap-1 overflow-x-auto pb-1 xl:col-span-1 xl:row-start-1 xl:col-start-2 xl:pb-0">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              aria-current={item.id === active ? "page" : undefined}
              className={`shrink-0 rounded-full px-4 py-3 text-sm font-semibold transition ${item.id === active ? "bg-gray-900 text-white" : "text-gray-900 hover:bg-gray-100"}`}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="col-start-2 row-start-1 flex flex-wrap justify-end gap-2 xl:col-start-3">
          {actions}
        </div>
      </div>
    </nav>
  );
}
