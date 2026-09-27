import type { Metadata } from "next";
import { StandaloneLayout } from "@/components/layout/StandaloneLayout";
import { OwnersView } from "@/components/owners/OwnersView";

export const metadata: Metadata = {
  title: "For owners · Free Bunks Home Hub",
  description:
    "A free Home Hub for your rental. Guests tap for Wi-Fi, house details and local favorites, and book directly when they're ready to come back.",
  openGraph: {
    title: "A better stay. A reason to return.",
    description: "A free Home Hub for your rental, and an easy way for guests to book again.",
    images: [{ url: "/owners/home-hub-entry.webp", width: 1536, height: 1024, alt: "The Bunks Home Hub on an entry table" }],
  },
};

export default function OwnersPage() {
  return (
    <StandaloneLayout>
      <OwnersView />
    </StandaloneLayout>
  );
}
