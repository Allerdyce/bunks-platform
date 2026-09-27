"use client";

import { Loader } from "lucide-react";

export function LoaderScreen() {
  return (
    <div className="min-h-screen flex flex-col gap-4 items-center justify-center bg-[var(--color-surface)]">
      <Loader
        className="w-8 h-8 animate-spin text-gray-900"
        aria-hidden="true"
      />
      <p role="status" className="text-sm text-gray-600">
        Making you feel at home…
      </p>
    </div>
  );
}
