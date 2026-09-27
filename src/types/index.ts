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
  address?: string;
  price: number;
  guests: number;
  bedrooms: number;
  beds?: number;
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
  quietHours?: string;
  parkingNotes?: string;
  houseRules?: string[];
  emergencyContacts?: { name: string; phone: string; role?: string }[];
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





export interface BookingRequest {
  propertySlug: string;
  checkIn: string;
  checkOut: string;
  guestName: string;
  guestEmail: string;
  guests: number;

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
    hostSupportEmail?: string | null;
    checkInTime?: string | null;
    checkOutTime?: string | null;
  };
  /** Only present for paid bookings. */
  secure?: BookingPrivateDetails | null;
}

/** What locates the home or unlocks its network: returned only to verified guests with a paid booking. */
export interface BookingPrivateDetails {
  address: string | null;
  buildingName: string | null;
  mapsUrl: string | null;
  wifiSsid: string | null;
  wifiPassword: string | null;
  parkingNotes: string | null;
  directions: { label: string; detail: string }[];
  skiLockerNotes: string | null;
  guideUrl: string | null;
  brochureUrl: string | null;
}

export interface BookingDetailsResponse {
  booking: BookingDetailsData;
}

/** Door/lock codes, only ever returned by /api/trip-access/[ref] to verified, paid guests. */
export interface TripAccessCodes {
  garageCode: string | null;
  lockboxCode: string | null;
  skiLockerDoorCode: string | null;
  skiLockerNumber: string | null;
  skiLockerCode: string | null;
}

export type TripAccessResponse =
  | { available: true; codes: TripAccessCodes }
  | { available: false; releasesAt?: string };

export interface ConversationMessage {
  id: number;
  body: string;
  senderId: number;
  senderName?: string | null;
  senderRole: 'GUEST' | 'HOST' | 'ADMIN';
  sentAt: string;
  readAt?: string | null;
  isMine: boolean;
}

export interface BookingConversationResponse {
  conversationId: number | null;
  messages: ConversationMessage[];
}

export interface BookingLookupPayload {
  bookingReference: string;
  guestEmail: string;
}

export interface BookingBreakdown {
  nightlySubtotalCents: number;
  cleaningFeeCents: number;
  serviceFeeCents: number;
  taxCents: number;
  undiscountedNightlySubtotalCents?: number;
  nightlyLineItems: NightlyLineItem[];
}

export interface PricingQuote {
  totalPriceCents: number;
  nightlySubtotalCents: number;
  cleaningFeeCents: number;
  serviceFeeCents: number;
  taxCents: number;
  undiscountedNightlySubtotalCents: number;
  nightlyLineItems: NightlyLineItem[];
  averageNightlyRateCents: number;
  nights: number;
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
  | "booking-essential"
  | "booking-guide"
  | "booking-messages"
  | "about"
  | "listings";

export type BookingPortalSection = "essential" | "guide" | "messages";

export type NavigateHandler = (view: ViewState, payload?: unknown) => void;

export interface BlockedDate {
  id: number;
  date: string; // ISO string
  propertyId: number;
}

export interface AdminSpecialRate {
  id: number;
  date: string; // YYYY-MM-DD
  price: number;
  note?: string | null;
  isBlocked: boolean;
}

export interface AdminProperty {
  id: number;
  name: string;
  slug: string;
  weekdayRate: number;
  weekendRate: number;
  cleaningFee: number;
  serviceFee: number;
  currency: string;
  specialRates: AdminSpecialRate[];
}

export interface AdminFeatureToggle {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
}
