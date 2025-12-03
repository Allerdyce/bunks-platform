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

const STEAMBOAT_GUIDE_BASE_URL = "/guide/steamboat-alpenglow-2";

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
      doorCodesDocUrl: `${STEAMBOAT_GUIDE_BASE_URL}#essential-info`,
      arrivalNotesUrl: `${STEAMBOAT_GUIDE_BASE_URL}#checkin`,
      liveInstructionsUrl: `${STEAMBOAT_GUIDE_BASE_URL}#checkin`,
      recommendationsUrl: `${STEAMBOAT_GUIDE_BASE_URL}#dining`,
      guestBookUrl: STEAMBOAT_GUIDE_BASE_URL,
      checkInWindow: `Check-in after ${STEAMBOAT_GUIDE.propertyBasics.checkInTime}`,
      checkOutTime: `Checkout by ${STEAMBOAT_GUIDE.propertyBasics.checkOutTime}`,
    },
    essentials: [
      {
        label: "Wi-Fi",
        value: `${STEAMBOAT_GUIDE.propertyBasics.wifi.ssid} / ${STEAMBOAT_GUIDE.propertyBasics.wifi.password}`,
      },
      {
        label: "Garage code",
        value: STEAMBOAT_GUIDE.propertyBasics.garageCode,
      },
      {
        label: "Lockbox",
        value: STEAMBOAT_GUIDE.propertyBasics.lockboxCode,
      },
      {
        label: "Ski locker",
        value: `Door ${STEAMBOAT_GUIDE.propertyBasics.skiLocker.doorCode} · Locker #${STEAMBOAT_GUIDE.propertyBasics.skiLocker.lockerNumber}`,
        helper: `Locker code ${STEAMBOAT_GUIDE.propertyBasics.skiLocker.lockerCode}`,
      },
      {
        label: "Hosts",
        value: `${STEAMBOAT_GUIDE.propertyBasics.hosts[0].name} · ${STEAMBOAT_GUIDE.propertyBasics.hosts[0].phone}`,
        helper: `${STEAMBOAT_GUIDE.propertyBasics.hosts[1].name} · ${STEAMBOAT_GUIDE.propertyBasics.hosts[1].phone}`,
      },
    ],
    quickLinks: [
      { label: "Essential info", href: `${STEAMBOAT_GUIDE_BASE_URL}#essential-info`, description: "Codes, Wi-Fi, and parking." },
      { label: "Check-in & checkout", href: `${STEAMBOAT_GUIDE_BASE_URL}#checkin`, description: "Arrival flow + checkout steps." },
      { label: "Dining & drinks", href: `${STEAMBOAT_GUIDE_BASE_URL}#dining`, description: "Local favorites to surface in emails." },
      { label: "Guest guide", href: STEAMBOAT_GUIDE_BASE_URL, description: "Full Steamboat guest experience." },
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
