// Door codes, and the house guide that contains them, are available from 24 hours before
// check-in until the end of the check-out day. Stay dates are calendar dates stored as UTC
// midnight, so the window opens at midnight UTC the day before check-in and closes at midnight
// UTC the day after check-out.
const DAY_MS = 24 * 60 * 60 * 1000;

export function tripAccessWindow(stay: { checkInDate: Date; checkOutDate: Date }) {
  return {
    opensAt: new Date(stay.checkInDate.getTime() - DAY_MS),
    closesAt: new Date(stay.checkOutDate.getTime() + DAY_MS),
  };
}

export function isTripAccessOpen(stay: { checkInDate: Date; checkOutDate: Date }, now = new Date()) {
  const { opensAt, closesAt } = tripAccessWindow(stay);
  return now >= opensAt && now <= closesAt;
}
