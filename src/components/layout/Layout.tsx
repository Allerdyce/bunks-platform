"use client";

import type { PropsWithChildren } from "react";
import type { NavigateHandler } from "@/types";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

interface LayoutProps extends PropsWithChildren {
  onNavigate: NavigateHandler;
}

export function Layout({ children, onNavigate }: LayoutProps) {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-gray-900 selection:text-white">
      <Navbar onNavigate={onNavigate} />
      <main className="pb-20 pt-6">{children}</main>
      <Footer onNavigate={onNavigate} />
    </div>
  );
}
