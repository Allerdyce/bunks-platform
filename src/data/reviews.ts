export interface PropertyReview {
  id: string;
  propertySlug: string;
  guestName: string;
  stayDate: string;
  nights: number;
  rating: number;
  body: string;
}

// Real guest reviews will be added here once sourced. Components render nothing while this is empty.
export const PROPERTY_REVIEWS: Record<string, PropertyReview[]> = {};
