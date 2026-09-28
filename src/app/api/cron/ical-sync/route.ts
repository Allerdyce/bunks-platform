import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthorizedCronRequest } from '@/lib/cronAuth';
import { IcalSyncError, syncAirbnbCalendar } from '@/lib/icalSync';
import { sendEmail } from '@/lib/email/sendEmail';
import { OPS_ALERT_EMAIL } from '@/lib/contact';
import { escapeHtml } from '@/lib/html';
import { alertIfPriceCheckStale } from '@/lib/priceCheck';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Backstop for the on-demand sync that runs before checkout and calendar loads.
export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const properties = await prisma.property.findMany({ select: { id: true, slug: true, airbnbIcalUrl: true } });
  const results = [];
  const failures: string[] = [];
  for (const property of properties) {
    try {
      results.push({ slug: property.slug, ...(await syncAirbnbCalendar(property)) });
    } catch (error) {
      console.error(`[cron][ical-sync] ${property.slug} failed`, error);
      const reason = error instanceof IcalSyncError ? error.reason : 'FETCH_FAILED';
      results.push({ slug: property.slug, ok: false, reason });
      failures.push(`<li><strong>${escapeHtml(property.slug)}</strong>: ${escapeHtml((error as Error).message)}</li>`);
    }
  }

  // While the Airbnb import is broken, direct checkout for that home pauses (it can't confirm
  // availability), so someone needs to know today.
  if (failures.length) {
    await sendEmail({
      to: OPS_ALERT_EMAIL,
      subject: `Action needed: Airbnb calendar import failed (${failures.length})`,
      html:
        `<p>The daily Airbnb calendar import failed:</p><ul>${failures.join('')}</ul>` +
        `<p>Until it works again, direct bookings for these homes can't be confirmed. Check the Airbnb ` +
        `calendar link in Admin → Setup and press "Sync now".</p>`,
    }).catch((error) => console.error('[cron][ical-sync] failed to send alert', error));
  }
  // The Airbnb price runner reports twice a day; say so if it has gone quiet.
  const priceCheckStale = await alertIfPriceCheckStale().catch((error) => {
    console.error('[cron][ical-sync] price check staleness check failed', error);
    return false;
  });
  return NextResponse.json({ results, priceCheckStale });
}
