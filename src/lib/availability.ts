
import { startOfDay, isBefore } from 'date-fns';
import type { DateRange } from '@/types';

/**
 * Formats a local calendar date as YYYY-MM-DD. Stay dates are calendar dates, so never
 * use toISOString() for them: it converts to UTC and shifts the day for many timezones.
 */
export const formatStayDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Checks if a specific night is blocked. blockedDates are YYYY-MM-DD strings from the API.
 */
export const isDateBlocked = (date: Date, blockedDates: string[]): boolean => {
    const key = formatStayDate(date);
    return blockedDates.some((blocked) => blocked.slice(0, 10) === key);
};

/**
 * Checks if a date is selectable (not blocked, not in past).
 */
export const isDateSelectable = (date: Date, blockedDates: string[]): boolean => {
    const today = startOfDay(new Date());

    // Rule 1: Cannot select past dates
    if (isBefore(date, today)) {
        return false;
    }

    // Rule 2: Cannot select blocked dates
    if (isDateBlocked(date, blockedDates)) {
        return false;
    }

    return true;
};

/**
 * Validates if a selected range is valid (no blocked dates inside).
 */
export const isRangeValid = (range: DateRange, blockedDates: string[]): boolean => {
    if (!range.start || !range.end) return true;

    // Check if any date inside the range is blocked
    // Simple iteration for now (can be optimized if ranges are huge)
    const cursor = new Date(range.start);
    const end = new Date(range.end);

    while (cursor < end) {
        if (isDateBlocked(cursor, blockedDates)) {
            return false;
        }
        cursor.setDate(cursor.getDate() + 1);
    }

    return true;
};
