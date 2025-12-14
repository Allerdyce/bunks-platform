"use client";

import type { PropsWithChildren } from "react";
import { useRouter } from "next/navigation";
import type { NavigateHandler, Property } from "@/types";
import { Layout } from "./Layout";

export function StandaloneLayout({ children }: PropsWithChildren) {
  const router = useRouter();

  const handleNavigate: NavigateHandler = (target, payload) => {
    switch (target) {
      case "home": {
        router.push("/");
        return;
      }
      case "about": {
        router.push("/?view=about");
        return;
      }
      case "journal": {
        router.push("/?view=journal");
        return;
      }
      case "listings": {
        router.push("/#listings");
        return;
      }
      case "property": {
        if (payload && typeof payload === "object") {
          const property = payload as Property;
          router.push(`/?property=${property.slug}`);
          return;
        }
        break;
      }
      default:
        router.push("/");
    }
  };

  return (
    <Layout onNavigate={handleNavigate} currentView="home">
      {children}
    </Layout>
  );
}
