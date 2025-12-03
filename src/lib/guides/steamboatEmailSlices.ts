import { STEAMBOAT_GUIDE } from "@/data/steamboatGuide";

export interface GuideListItem {
  label: string;
  detail: string;
  helper?: string;
}

export interface SteamboatConfirmationSlice {
  arrivalNotes: string;
  directions: GuideListItem[];
  essentials: GuideListItem[];
}

export interface SteamboatPreStaySlice {
  essentials: GuideListItem[];
  parkingNote: string;
  quietHours: string;
  emergencyContacts: GuideListItem[];
}

export interface SteamboatCheckoutSlice {
  checkoutSteps: { label: string; detail: string }[];
  lockupSteps: string[];
  trashNote: string;
}

export function getSteamboatBookingConfirmationSlice(): SteamboatConfirmationSlice {
  const { propertyBasics, checkinCheckout } = STEAMBOAT_GUIDE;
  return {
    arrivalNotes: checkinCheckout.checkinNotes,
    directions: [
      { label: "From Denver", detail: checkinCheckout.directions.fromDenver },
      { label: "From Hayden (HDN)", detail: checkinCheckout.directions.fromHayden },
    ],
    essentials: [
      { label: "Check-in", detail: propertyBasics.checkInTime, helper: "Keypad beside garage" },
      { label: "Check-out", detail: propertyBasics.checkOutTime },
      { label: "Wi-Fi", detail: `${propertyBasics.wifi.ssid} / ${propertyBasics.wifi.password}` },
      { label: "Garage", detail: propertyBasics.garageCode },
      { label: "Lockbox", detail: propertyBasics.lockboxCode, helper: "Behind garage entry" },
    ],
  };
}

export function getSteamboatPreStaySlice(): SteamboatPreStaySlice {
  const { propertyBasics, checkinCheckout, emergency } = STEAMBOAT_GUIDE;
  return {
    essentials: [
      { label: "Wi-Fi", detail: `${propertyBasics.wifi.ssid} / ${propertyBasics.wifi.password}` },
      { label: "Garage Code", detail: propertyBasics.garageCode },
      { label: "Lockbox Code", detail: propertyBasics.lockboxCode },
      {
        label: "Ski Locker",
        detail: `Door ${propertyBasics.skiLocker.doorCode} · Locker #${propertyBasics.skiLocker.lockerNumber}`,
        helper: `Locker code ${propertyBasics.skiLocker.lockerCode}`,
      },
      { label: "Hosts", detail: `${propertyBasics.hosts[0].name} ${propertyBasics.hosts[0].phone}`, helper: `${propertyBasics.hosts[1].name} ${propertyBasics.hosts[1].phone}` },
    ],
    parkingNote: checkinCheckout.parking,
    quietHours: checkinCheckout.quietHours,
    emergencyContacts: [
      { label: emergency.hospital.name, detail: emergency.hospital.phone, helper: emergency.hospital.address },
      { label: "Urgent care", detail: emergency.urgentCare.phone, helper: emergency.urgentCare.address },
      { label: "Police (non-emergency)", detail: emergency.policeNonEmergency },
      { label: "Fire (non-emergency)", detail: emergency.fireNonEmergency },
      { label: emergency.emergencyVet.name, detail: emergency.emergencyVet.phone, helper: emergency.emergencyVet.address },
    ],
  };
}

export function getSteamboatCheckoutSlice(): SteamboatCheckoutSlice {
  const { checkinCheckout } = STEAMBOAT_GUIDE;
  return {
    checkoutSteps: checkinCheckout.checkoutSteps.map((step, index) => ({
      label: `Step ${index + 1}`,
      detail: step,
    })),
    lockupSteps: [
      "Lock every door including sliders and garage entry.",
      "Return the lockbox key to the hooks once you secure the home.",
    ],
    trashNote: "All trash and recycling go into the labeled garage bins before you depart.",
  };
}
