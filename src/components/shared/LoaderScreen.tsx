"use client";

import { Loader } from "lucide-react";

export function LoaderScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Loader className="w-8 h-8 animate-spin text-gray-900" />
    </div>
  );
}
