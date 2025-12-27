
import { startOfDay, isBefore, isSameDay } from 'date-fns';
import type { DateRange } from '@/types';

/**
 * Checks if a specific date is blocked by iCal or other external sources.
 */
export const isDateBlocked = (date: Date, blockedDates: string[]): boolean => {
    return blockedDates.some((blocked) => {
        // Parse blocked string (YYYY-MM-DD or ISO) to local date comparison
        // We assume blockedDates are YYYY-MM-DD strings from the API
        const blockedDate = new Date(blocked);
        // Adjust logic if blockedDate is ISO with time
        return isSameDay(date, blockedDate);
    });
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
