export type GuestSource = "wifi" | "direct_booking";

export type GuestRow = {
  email: string;
  name: string | null;
  sources: GuestSource[];
  properties: string[];
  wifiCaptures: number;
  directBookings: number;
  firstSeen: string;
  lastSeen: string;
  // Captured via Wi-Fi, then later booked direct: the conversion Bunks is built for.
  returnedDirect: boolean;
};

export type GuestListResponse = {
  guests: GuestRow[];
  summary: {
    total: number;
    wifi: number;
    directBookers: number;
    returnedDirect: number;
  };
};
