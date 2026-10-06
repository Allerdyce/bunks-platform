import { Prisma } from '@prisma/client';
import { randomInt } from 'crypto';
import { prisma } from '@/lib/prisma';

// Short public booking references (e.g. "K7Q2M"), shared by checkout and admin payment links.
const BOOKING_REFERENCE_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const BOOKING_REFERENCE_LENGTH = 5;
export const BOOKING_REFERENCE_INSERT_ATTEMPTS = 5;

function generateBookingReference() {
  let value = '';
  while (value.length < BOOKING_REFERENCE_LENGTH) {
    const index = randomInt(BOOKING_REFERENCE_CHARSET.length);
    value += BOOKING_REFERENCE_CHARSET[index];
  }
  return value;
}

export async function generateUniqueBookingReference() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = generateBookingReference();
    const existing = await prisma.booking.findUnique({
      where: { publicReference: candidate },
      select: { id: true },
    });
    if (!existing) {
      return candidate;
    }
  }
  throw new Error('Unable to generate unique booking reference');
}

export function isBookingReferenceCollision(error: unknown) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return false;
  }

  if (error.code !== 'P2002') {
    return false;
  }

  const target = error.meta?.target;

  if (typeof target === 'string') {
    return target.includes('publicReference');
  }

  if (Array.isArray(target)) {
    return target.some((value) => typeof value === 'string' && value.includes('publicReference'));
  }

  return false;
}
