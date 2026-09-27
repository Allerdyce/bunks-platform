import type { OpsDetailsInput } from "@/lib/opsDetails/config";
import { STEAMBOAT_GUIDE } from "@/data/steamboatGuide";
import { PROPERTIES } from "@/data/properties";

export type OpsPreset = {
  slug: string;
  label: string;
  description?: string;
  defaults: Partial<OpsDetailsInput>;
  essentials: Array<{ label: string; value: string; helper?: string }>;
  quickLinks: Array<{ label: string; href: string; description?: string }>;
};

// Guests reach codes and the guide from their trip page; the full guide is the PDF.
const STEAMBOAT_GUIDE_BASE_URL = "/my-trips";
const STEAMBOAT_GUIDE_PDF = "/Steamboat Welcome Guide.pdf";

const propertyLabel = (slug: string, fallback: string) =>
  PROPERTIES.find((property) => property.slug === slug)?.name ?? fallback;

const STEAMBOAT_LABEL = propertyLabel("steamboat-downtown-townhome", "Downtown Steamboat Luxury Townhome");
const SUMMERLAND_LABEL = propertyLabel("summerland-ocean-view-beach-bungalow", "Summerland Ocean-View Beach Bungalow");

export const OPS_PRESETS: OpsPreset[] = [
  {
    slug: "steamboat-downtown-townhome",
    label: STEAMBOAT_LABEL,
    description: "Uses the structured Steamboat guest guide for links, hosts, and key codes.",
    defaults: {
      doorCodesDocUrl: `${STEAMBOAT_GUIDE_BASE_URL}`,
      arrivalNotesUrl: `${STEAMBOAT_GUIDE_BASE_URL}`,
      liveInstructionsUrl: `${STEAMBOAT_GUIDE_BASE_URL}`,
      recommendationsUrl: `${STEAMBOAT_GUIDE_BASE_URL}`,
      guestBookUrl: STEAMBOAT_GUIDE_PDF,
      checkInWindow: `Check-in after ${STEAMBOAT_GUIDE.propertyBasics.checkInTime}`,
      checkOutTime: `Checkout by ${STEAMBOAT_GUIDE.propertyBasics.checkOutTime}`,
    },
    essentials: [
      {
        label: "Wi-Fi",
        value: `${STEAMBOAT_GUIDE.propertyBasics.wifi.ssid} / ${STEAMBOAT_GUIDE.propertyBasics.wifi.password}`,
      },
      {
        label: "Door & lock codes",
        value: "Stored on the property record",
        helper: "Released to paid guests on their trip page 24h before check-in.",
      },
      {
        label: "Hosts",
        value: `${STEAMBOAT_GUIDE.propertyBasics.hosts[0].name} · ${STEAMBOAT_GUIDE.propertyBasics.hosts[0].phone}`,
        helper: `${STEAMBOAT_GUIDE.propertyBasics.hosts[1].name} · ${STEAMBOAT_GUIDE.propertyBasics.hosts[1].phone}`,
      },
    ],
    quickLinks: [
      { label: "Essential info", href: `${STEAMBOAT_GUIDE_BASE_URL}`, description: "Codes, Wi-Fi, and parking." },
      { label: "Check-in & checkout", href: `${STEAMBOAT_GUIDE_BASE_URL}`, description: "Arrival flow + checkout steps." },
      { label: "Dining & drinks", href: `${STEAMBOAT_GUIDE_BASE_URL}`, description: "Local favorites to surface in emails." },
      { label: "Guest guide", href: STEAMBOAT_GUIDE_PDF, description: "Full Steamboat guest experience." },
    ],
  },
  {
    slug: "summerland-ocean-view-beach-bungalow",
    label: SUMMERLAND_LABEL,
    description: "Use this preset when configuring ops links for the Summerland ocean-view bungalow.",
    defaults: {
      guestBookUrl: "/?property=summerland-ocean-view-beach-bungalow",
      recommendationsUrl: "/?property=summerland-ocean-view-beach-bungalow",
      checkInWindow: "Check-in after 3:00 p.m.",
      checkOutTime: "Checkout by 10:00 a.m.",
    },
    essentials: [
      {
        label: "Beach access",
        value: "3-minute walk via the lower gate to Summerland Beach.",
      },
      {
        label: "Parking",
        value: "On-site parking for up to 4 vehicles plus nearby street parking.",
      },
      {
        label: "Heads up",
        value: "Hillside home with four stair runs; guests should be comfortable with stairs.",
      },
    ],
    quickLinks: [
      {
        label: "Property overview",
        href: "/?property=summerland-ocean-view-beach-bungalow",
        description: "Photos, amenities, and booking details.",
      },
      {
        label: "Neighborhood map",
        href: "https://maps.google.com/?q=Summerland+CA",
        description: "Locate Field + Fort, boutiques, and the beach gate.",
      },
    ],
  },
];
