import type { EmailType } from '@prisma/client';
import { prisma } from '@/lib/prisma';

// A claim is an EmailLog row written (under an advisory lock) *before* sending, so two
// overlapping cron runs can't both send the same email. It is removed if the send fails, so
// the next run retries.
const CLAIM_MARKER = 'claimed';

/** Where-clause fragment for a sender's own "already sent?" check: in-flight claims don't count. */
export const notAClaim = { OR: [{ error: null }, { error: { not: CLAIM_MARKER } }] };

type ClaimTarget = { type: EmailType; to: string; bookingId?: number | null };

const matchesSent = ({ type, to, bookingId }: ClaimTarget) =>
  bookingId
    ? { type, status: 'SENT' as const, bookingId }
    : { type, status: 'SENT' as const, to: { equals: to, mode: 'insensitive' as const } };

/** Returns a claim id if this email hasn't been sent (or claimed) yet, otherwise null. */
export async function claimEmail(target: ClaimTarget): Promise<number | null> {
  const key = target.bookingId ? `booking:${target.bookingId}` : `to:${target.to.toLowerCase()}`;
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${target.type}), hashtext(${key}))`;
    const existing = await tx.emailLog.findFirst({ where: matchesSent(target), select: { id: true } });
    if (existing) return null;
    const claim = await tx.emailLog.create({
      data: { type: target.type, to: target.to, bookingId: target.bookingId ?? null, status: 'SENT', error: CLAIM_MARKER },
      select: { id: true },
    });
    return claim.id;
  });
}

/** After a successful send: keep one SENT record (the sender's own log if it wrote one). */
export async function completeClaim(claimId: number, target: ClaimTarget) {
  try {
    const senderLog = await prisma.emailLog.findFirst({
      where: { ...matchesSent(target), id: { not: claimId }, ...notAClaim },
      select: { id: true },
    });
    if (senderLog) {
      await prisma.emailLog.delete({ where: { id: claimId } });
    } else {
      await prisma.emailLog.update({ where: { id: claimId }, data: { error: null, sentAt: new Date() } });
    }
  } catch (error) {
    // The claim row still counts as SENT, which is the safe outcome (no duplicate tomorrow).
    console.error('[email] Failed to finalise send claim', error);
  }
}

/** After a failed send: drop the claim so the next run retries. */
export async function releaseClaim(claimId: number) {
  await prisma.emailLog.delete({ where: { id: claimId } }).catch((error) => {
    console.error('[email] Failed to release send claim', error);
  });
}
