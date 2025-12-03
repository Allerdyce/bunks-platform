import { config as loadEnv } from "dotenv";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/bookings/route";

async function main() {
  loadEnv();
  loadEnv({ path: ".env.local", override: true });

  const payload = {
    propertySlug: "summerland-ocean-view-beach-bungalow",
    checkIn: "2025-12-20",
    checkOut: "2025-12-24",
    guestName: "Booking Test",
    guestEmail: "booking-test@example.com",
    guests: 4,
  };

  const request = new NextRequest("http://localhost/api/bookings", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const response = await POST(request);
  const result = await response.json();

  console.log("Status:", response.status);
  console.log("Response:", JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error("Booking verification failed:", error);
  process.exit(1);
});
