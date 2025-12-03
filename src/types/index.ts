export type BlockedDateSource = "AIRBNB" | "DIRECT" | "SPECIAL";

export interface BlockedDate {
  date: string;
  source: BlockedDateSource;
}

export interface PropertySection {
  title: string;
  body: string[];
}

export interface SleepingArrangement {
  title: string;
  bedDetails: string;
  description?: string;
}

export interface PropertyNotice {
  title: string;
  body: string[];
}

export interface PhotoGroup {
  title: string;
  description?: string;
  images: string[];
}

export interface Property {
  id: number;
  slug: string;
  name: string;
  location: string;
  price: number;
  guests: number;
  bedrooms: number;
  bathrooms: number;
  rating: number;
  reviews: number;
  description: string;
  image: string;
  images: string[];
  features: string[];
  cleaningFee?: number;
  serviceFee?: number;
  weekdayRate?: number;
  weekendRate?: number;
  heroTagline?: string;
  aboutSections?: PropertySection[];
  highlights?: string[];
  sleepingArrangements?: SleepingArrangement[];
  guestAccess?: string[];
  otherNotes?: string[];
  notices?: PropertyNotice[];
  photoGroups?: PhotoGroup[];
  checkInTime?: string;
  checkOutTime?: string;
  wifiSsid?: string;
  wifiPassword?: string;
  garageCode?: string;
  lockboxCode?: string;
  skiLockerDoorCode?: string;
  skiLockerNumber?: string;
  skiLockerCode?: string;
  quietHours?: string;
  parkingNotes?: string;
  houseRules?: string[];
  emergencyContacts?: { name: string; phone: string; role?: string }[];
}

import type { ReactNode } from "react";

export interface JournalPost {
  id: number;
  slug: string;
  title: string;
  category: string;
  date: string;
  image: string;
  excerpt: string;
  content: ReactNode;
}

export interface AvailabilityRequest {
  propertySlug: string;
  checkIn: string;
  checkOut: string;
}

export interface AvailabilityResponse {
  available: boolean;
  reason?: "DATES_BLOCKED" | "EXISTING_BOOKING";
  message?: string;
}

export interface PropertyAddon {
  id: number;
  slug: string;
  title: string;
  description: string;
  category: string;
  provider: string;
  providerProductId?: string | null;
  basePriceCents: number;
  currency: string;
  durationMinutes?: number | null;
  imageUrl?: string | null;
}

export interface AddonSelectionInput {
  id: number;
  activityDate?: string | null;
  activityTimeSlot?: string | null;
}

export interface AddonScheduleValue {
  activityDate: string;
  activityTimeSlot: string;
}

export interface BookingRequest {
  propertySlug: string;
  checkIn: string;
  checkOut: string;
  guestName: string;
  guestEmail: string;
  guests: number;
  addons?: AddonSelectionInput[];
}

export interface BookingResponse {
  ok: boolean;
  bookingId: number;
  bookingReference: string;
  clientSecret: string;
  totalPriceCents: number;
  currency: string;
  nights: number;
  breakdown: BookingBreakdown;
}

export interface BookingAddonDetails {
  id: number;
  title: string;
  provider: string;
  providerStatus: string;
  providerConfirmationCode?: string | null;
  finalPriceCents: number;
  activityDate?: string | null;
  activityTimeSlot?: string | null;
  providerMetadata?: Record<string, unknown> | null;
}

export type BookingStatus = "PENDING" | "PAID" | "CANCELLED";

export interface BookingDetailsData {
  id: number;
  referenceCode: string;
  status: BookingStatus | string;
  checkInDate: string;
  checkOutDate: string;
  guestName: string;
  guestEmail: string;
  totalPriceCents: number;
  property: {
    id: number;
    name: string;
    slug: string;
    timezone?: string | null;
    checkInGuideUrl?: string | null;
    guestBookUrl?: string | null;
    hostSupportEmail?: string | null;
  };
  addons: BookingAddonDetails[];
}

export interface BookingDetailsResponse {
  booking: BookingDetailsData;
}

export interface BookingLookupPayload {
  bookingReference: string;
  guestEmail: string;
}

export interface AddonLineItem {
  id: number;
  title: string;
  priceCents: number;
  provider: string;
  status?: string | null;
  confirmationCode?: string | null;
  activityDate?: string | null;
  activityTimeSlot?: string | null;
}

export interface BookingBreakdown {
  nightlySubtotalCents: number;
  cleaningFeeCents: number;
  serviceFeeCents: number;
  nightlyLineItems: NightlyLineItem[];
  addonsTotalCents: number;
  addonLineItems: AddonLineItem[];
}

export type RateSource = "SPECIAL" | "WEEKEND" | "WEEKDAY";

export interface NightlyLineItem {
  date: string; // YYYY-MM-DD
  amountCents: number;
  source: RateSource;
}

export interface BookingClientState {
  firstName: string;
  lastName: string;
  email: string;
  guests: number;
}

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

export type ViewState =
  | "home"
  | "property"
  | "booking"
  | "success"
  | "booking-details"
  | "about"
  | "journal"
  | "blog-post"
  | "listings";

export type NavigateHandler = (view: ViewState, payload?: unknown) => void;
