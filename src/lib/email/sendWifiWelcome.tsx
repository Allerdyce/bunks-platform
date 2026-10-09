import 'server-only';

import * as React from 'react';
import { WifiWelcomeEmail } from '@/emails/WifiWelcomeEmail';
import { renderEmail } from '@/lib/email';
import { sendEmail } from '@/lib/email/sendEmail';
import { templateDeliveryState } from '@/lib/email/deliverySettings';
import { getEmailSubject } from '@/lib/email/subjects';
import { signedWifiGuidePath } from '@/lib/guideLinks';
import { wifiFor } from '@/lib/privatePropertyDetails';
import { PROPERTIES } from '@/data/properties';
import { SUPPORT_EMAIL } from '@/lib/contact';
import { prisma } from '@/lib/prisma';
import { toAbsoluteUrl } from '@/lib/url';

// Email-safe (JPG) hero photos: the site's WebP/AVIF images don't show in Outlook.
const EMAIL_IMAGES: Record<string, string> = {
  'summerland-ocean-view-beach-bungalow': '/summerland/hero.jpg',
  'steamboat-downtown-townhome': '/steamboat-pictures/exterior/exterior-5.jpg',
};

function emailImageFor(slug: string) {
  if (EMAIL_IMAGES[slug]) return EMAIL_IMAGES[slug];
  const listing = PROPERTIES.find((entry) => entry.slug === slug);
  return [listing?.image, ...(listing?.images ?? [])].find((src) => src && /\.(jpe?g|png)$/i.test(src)) ?? null;
}

export type WifiWelcomeResult = 'sent' | 'paused' | 'no-property' | 'no-wifi';

/**
 * Welcome email for a guest who just unlocked the Wi-Fi on a home's in-home QR page. Paused
 * while 'wifi-welcome' is in PAUSED_TEMPLATE_SLUGS (unless EMAIL_UNPAUSED_TEMPLATES lists it).
 */
export async function sendWifiWelcomeEmail({
  email,
  name,
  propertySlug,
}: {
  email: string;
  name?: string | null;
  propertySlug: string;
}): Promise<WifiWelcomeResult> {
  if (templateDeliveryState('wifi-welcome') === 'paused') return 'paused';

  const property = await prisma.property.findUnique({
    where: { slug: propertySlug },
    select: { slug: true, name: true, wifiSsid: true, wifiPassword: true, hostSupportEmail: true },
  });
  if (!property) return 'no-property';
  const wifi = wifiFor(property.slug, property);
  if (!wifi) return 'no-wifi';

  const wifiGuide = signedWifiGuidePath(property.slug, email);
  const guideUrl = toAbsoluteUrl(wifiGuide ?? '/my-trips') ?? 'https://bunks.com/my-trips';
  const html = await renderEmail(
    <WifiWelcomeEmail
      guestName={name}
      propertyName={property.name}
      imageUrl={toAbsoluteUrl(emailImageFor(property.slug)) ?? null}
      wifi={{ network: wifi.ssid, password: wifi.password }}
      guideUrl={guideUrl}
      guideIsTripPage={!wifiGuide}
      bookDirectUrl={toAbsoluteUrl(`/property/${property.slug}`) ?? 'https://bunks.com'}
      supportEmail={property.hostSupportEmail ?? SUPPORT_EMAIL}
    />,
  );
  const subject = (getEmailSubject('wifi-welcome') ?? 'Welcome to {{propertyName}}').replace(
    /{{\s*propertyName\s*}}/g,
    property.name,
  );
  await sendEmail({ to: email, subject, html, replyTo: property.hostSupportEmail ?? SUPPORT_EMAIL });
  return 'sent';
}
