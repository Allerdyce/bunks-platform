export interface PropertyReview {
  id: string;
  propertySlug: string;
  guestName: string;
  stayDate: string;
  nights: number;
  rating: number;
  body: string;
}

export const PROPERTY_REVIEWS: Record<string, PropertyReview[]> = {
  "summerland-ocean-view-beach-bungalow": [
    {
      id: "sum-1",
      propertySlug: "summerland-ocean-view-beach-bungalow",
      guestName: "Melissa",
      stayDate: "September 2024",
      nights: 4,
      rating: 5,
      body:
        "The bungalow is even more magical than the photos. Morning coffee on the wrap-around deck with ocean breezes was perfection, and the private spa made our evenings feel like a boutique retreat.",
    },
    {
      id: "sum-2",
      propertySlug: "summerland-ocean-view-beach-bungalow",
      guestName: "Arjun",
      stayDate: "July 2024",
      nights: 5,
      rating: 5,
      body:
        "Impeccably clean, beautifully styled, and walkable to Summerland's cafes and beach. The detached studio gave me a quiet space to work while the kids loved the gardens.",
    },
    {
      id: "sum-3",
      propertySlug: "summerland-ocean-view-beach-bungalow",
      guestName: "Laura",
      stayDate: "May 2024",
      nights: 3,
      rating: 5,
      body:
        "Booked direct with Bunks and saved compared to the booking platforms. Communication was seamless and the team had a chilled bottle of wine waiting for us—thoughtful touches throughout!",
    },
  ],
  "steamboat-downtown-townhome": [
    {
      id: "steamboat-1",
      propertySlug: "steamboat-downtown-townhome",
      guestName: "James",
      stayDate: "February 2025",
      nights: 6,
      rating: 5,
      body:
        "Location, location, location! We walked to dinner every night and the shuttle to the ski locker was clutch. The heated garage was a bonus in the snow.",
    },
    {
      id: "steamboat-2",
      propertySlug: "steamboat-downtown-townhome",
      guestName: "Kim",
      stayDate: "October 2024",
      nights: 4,
      rating: 5,
      body:
        "Spacious, spotless, and perfectly stocked. Kids loved the bunk room and we loved the balcony views. Already planning a return trip.",
    },
  ],
};
