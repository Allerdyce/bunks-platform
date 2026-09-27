import "server-only";

// Details that locate a home or let someone onto its network. They must never reach public
// pages or the client bundle: they're returned only to verified guests with a paid booking
// (the trip lookup API), used in guest emails, and shown in admin.
//
// Wi-Fi and parking saved in Admin → Setup take precedence over the fallbacks here.

export type ArrivalDirection = { label: string; detail: string };

export interface PrivatePropertyDetails {
  /** Name of the building or complex, when it identifies the home. */
  buildingName?: string;
  address: string;
  wifiSsid?: string;
  wifiPassword?: string;
  parkingNotes?: string;
  directions?: ArrivalDirection[];
  skiLockerNotes?: string;
}

const DETAILS: Record<string, PrivatePropertyDetails> = {
  "summerland-ocean-view-beach-bungalow": {
    address: "2211 Lillie Ave, Summerland, CA 93067",
    wifiSsid: "Lillie Ave Guest",
    wifiPassword: "Welcome!",
  },
  "steamboat-downtown-townhome": {
    buildingName: "Alpen Glow Townhomes #2",
    address: "45 6th Street, Townhouse #2, Steamboat Springs, CO 80487",
    wifiSsid: "Townhouse2",
    wifiPassword: "Steamboat",
    parkingNotes:
      "You have a dedicated single-car garage spot plus first-come street parking along 6th Street. Keep vehicles clear of the shared drive and follow posted winter plow rules.",
    directions: [
      {
        label: "From Denver",
        detail:
          "Take I-70 W to CO-9 N/CO-40 W toward Silverthorne. Follow US-40 into Steamboat Springs (Lincoln Ave), then turn left on 6th Street. Take the immediate right between the Alpen Glow condos and townhomes—#2 is on the left.",
      },
      {
        label: "From Hayden",
        detail:
          "From Yampa Valley Regional Airport, head east on US-40 (Lincoln Ave). Turn right on 6th Street, then the immediate right between the Alpen Glow condos and townhomes. Townhome #2 is on the left.",
      },
    ],
    skiLockerNotes:
      "Across from the gondola entrance in Steamboat Square—look for the Alpen Glow door beside the candy store and chairlift swing.",
  },
};

export function privateDetailsFor(slug: string): PrivatePropertyDetails | null {
  return DETAILS[slug] ?? null;
}

/** Wi-Fi for a property: Admin → Setup wins, then the fallback above. */
export function wifiFor(
  slug: string,
  saved?: { wifiSsid?: string | null; wifiPassword?: string | null } | null,
) {
  const fallback = DETAILS[slug];
  const ssid = saved?.wifiSsid?.trim() || fallback?.wifiSsid;
  const password = saved?.wifiPassword?.trim() || fallback?.wifiPassword;
  return ssid && password ? { ssid, password } : null;
}

export function mapsUrlFor(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}
