import type { Metadata } from "next";
import { StandaloneLayout } from "@/components/layout/StandaloneLayout";
import { OwnersView } from "@/components/owners/OwnersView";

export const metadata: Metadata = {
  title: "For owners · Free Bunks Home Hub",
  description:
    "A free tap-or-scan Home Hub for your vacation rental. Guests get Wi-Fi, your house guide and local picks in one tap, and an easy way to book their next stay direct.",
  openGraph: {
    title: "A free Home Hub for your rental",
    description: "Help guests through the stay, and bring them back direct for 5%, not 15%.",
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
