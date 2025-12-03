"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut, RefreshCw } from "lucide-react";

export function EmailPageActions() {
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleRefresh = () => {
    startRefresh(() => {
      router.refresh();
    });
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
      router.push("/admin");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <>
      <button
        onClick={handleRefresh}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-70"
        disabled={refreshing || loggingOut}
        type="button"
      >
        <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
        Refresh
      </button>
      <button
        onClick={handleLogout}
        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
        disabled={loggingOut}
        type="button"
      >
        <LogOut className="w-4 h-4" />
        {loggingOut ? "Logging out" : "Logout"}
      </button>
    </>
  );
}
