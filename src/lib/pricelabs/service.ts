import { prisma } from "@/lib/prisma";
import { postPricelabs } from "./client";
import { Property, Booking } from "@prisma/client";

/**
 * Orchestrates sending data to PriceLabs.
 */
export class PriceLabsService {

    /**
     * Pushes all eligible listings to PriceLabs.
     * Should be called when a property is created or updated.
     */
    static async syncAllListings() {
        // Fetch all properties
        const properties = await prisma.property.findMany({
            where: {
                // Add any filters if needed, e.g. only active properties
            }
        });

        const results = [];
        for (const property of properties) {
            try {
                await this.syncListing(property);
                results.push({ id: property.id, status: 'success' });
            } catch (error) {
                console.error(`Failed to sync listing ${property.id}`, error);
                results.push({ id: property.id, status: 'error', error });
            }
        }
        return results;
    }

    /**
     * Pushes a single listing to PriceLabs [/listings]
     */
    static async syncListing(property: Property) {
        // We need a user token (email) for PriceLabs. 
        // Assuming there's a way to get the owner's email. 
        // For now, using a fallback or fetching strictly if related to a User.
        // The current schema doesn't explicitly link Property -> Owner User directly in a simple way 
        // tailored for this without more context, so we might need to look at `hostSupportEmail` or similar.
        // The guide says: "include the user’s email (the email associated with the property owner’s PriceLabs account)"

        // Use hostSupportEmail as a fallback or a specific env var if single-owner system.
        // If your system is multi-tenant, you strictly need the owner's email.
        const userEmail = property.hostSupportEmail || process.env.PRICELABS_DEFAULT_USER_EMAIL || "ops@bunks.com";

        const payload = {
            listing_id: property.pricelabsListingId || String(property.id),
            user_token: userEmail,
            pms_name: "bunks",
            name: property.name,
            address: {
                // If you have address fields, map them here. 
                // Using lat/long is often enough or partial address.
                latitude: property.latitude,
                longitude: property.longitude
            },
            listing_type: "vacation_rental",
            // Add other attributes if available: bedrooms, bathrooms, etc.
        };

        // We use a custom endpoint path if strict restful or just /listings
        await postPricelabs("listings", payload);
    }

    /**
     * Pushes calendar availability/rates for a property [/calendar]
     * Should push at least 1-2 years of data.
     */
    static async syncCalendar(propertyId: number) {
        const property = await prisma.property.findUnique({ where: { id: propertyId } });
        if (!property) throw new Error(`Property ${propertyId} not found`);

        // Generate calendar data for next 730 days (2 years)
        // This is a heavy operation, so we might want to optimize.
        // For 'initial sync', we build from base rates + existing blocks.

        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 730);

        const blockedDates = await prisma.blockedDate.findMany({
            where: {
                propertyId: property.id,
                date: {
                    gte: startDate,
                    lte: endDate
                }
            }
        });

        // Also fetch bookings to mark as blocked? 
        // The guide says "Include all types of blocks on the calendar as reservations too... 
        // but also "keep availability updated... mark dates as unavailable".
        // PriceLabs prefers simple "is_blocked" in calendar, and detailed info in /reservations.

        const bookings = await prisma.booking.findMany({
            where: {
                propertyId: property.id,
                checkInDate: { lte: endDate },
                checkOutDate: { gte: startDate },
                status: { not: 'CANCELLED' }
            }
        });

        // We need to map this to an array of dates
        const calendarData = [];
        let currentDate = new Date(startDate);

        // Helper to check if date is blocked
        const isBlocked = (d: Date) => {
            const time = d.getTime();
            // Check manual blocks
            if (blockedDates.some(b => b.date.getTime() === time)) return true;
            // Check bookings (inclusive start, exclusive end usually, but check logic)
            // Usually check-in is blocked, check-out is free (for next guest).
            return bookings.some(b =>
                d >= b.checkInDate && d < b.checkOutDate
            );
        };

        while (currentDate <= endDate) {
            // Price: Use existing PropertyPricing if available? 
            // Or use baseNightlyRate as fallback?
            // The guide says "send ... base rate or current rate set in PMS".
            // If we have dynamic pricing from PL already, we might simply send it back or 
            // sending the 'base' underlying rate is safer if we want PL to recalculate.
            // However, usually we send the "manager set price".

            calendarData.push({
                date: currentDate.toISOString().split('T')[0],
                rate: property.baseNightlyRate / 100, // Convert cents to dollars/float
                is_blocked: isBlocked(currentDate),
                min_stay: 2, // Default or fetch from property settings
            });

            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Batching might be needed if payload is too large, but 730 items is small JSON.
        await postPricelabs("calendar", {
            listing_id: property.pricelabsListingId || String(property.id),
            data: calendarData
        });
    }

    /**
     * Pushes a reservation to PriceLabs [/reservations]
     */
    static async syncReservation(booking: Booking) {
        const property = await prisma.property.findUnique({ where: { id: booking.propertyId } });
        if (!property) return;

        const payload = {
            listing_id: property.pricelabsListingId || String(property.id),
            reservation_id: String(booking.id),
            check_in: booking.checkInDate.toISOString().split('T')[0],
            check_out: booking.checkOutDate.toISOString().split('T')[0],
            total_amount: booking.totalPriceCents / 100,
            currency: "USD", // Assuming USD
            status: booking.status === 'CANCELLED' ? 'canceled' : 'reserved',
            // Add created_at if possible
            booked_at: booking.createdAt.toISOString()
        };

        await postPricelabs("reservations", payload);
    }
}
