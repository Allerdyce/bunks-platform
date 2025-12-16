import * as React from 'react';
import {
    Button,
    Heading,
    Img,
    Link,
    Section,
    Text,
    Hr
} from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';

interface BookDirectCampaignEmailProps {
    guestName?: string;
    ctaUrl?: string;
    baseUrl?: string;
}

export const BookDirectCampaignEmail = ({
    guestName = 'Guest',
    ctaUrl = 'https://bunks.com',
    baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://bunks.com',
}: BookDirectCampaignEmailProps & { baseUrl?: string }) => {
    const previewText = 'Save 10-20% on your next stay by booking direct.';

    return (
        <EmailLayout previewText={previewText} footerText="Sent with 🧡 from Bunks hospitality.">

            {/* Hero Image */}
            <Section className="w-full mb-6 rounded-lg overflow-hidden">
                <Img
                    src="https://images.unsplash.com/photo-1510798831971-661eb04b3739?q=80&w=1000&auto=format&fit=crop"
                    width="100%"
                    alt="Cozy Mountain Cabin"
                    className="w-full object-cover"
                    style={{ width: '100%', maxWidth: '100%' }}
                />
            </Section>

            <Heading className="text-[#101828] text-2xl font-semibold text-center mb-4">
                Until Next Time 🏔️
            </Heading>

            <Text className="text-[#475467] text-base mb-4">
                Hi {guestName},
            </Text>
            <Text className="text-[#475467] text-base mb-4">
                Thanks for choosing to stay with Bunks! We hope you made some amazing mountain memories.
            </Text>
            <Text className="text-[#475467] text-base mb-6">
                When the mountains call you back, skip the third-party fees and book with us directly to unlock VIP perks.
            </Text>

            {/* Value Props Card */}
            <Section className="bg-[#F8F9FC] rounded-xl p-5 mb-6 border border-[#EAECF0]">
                <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-4 text-center">
                    The Direct Advantage
                </Heading>

                <div className="space-y-3">
                    <Text className="text-sm text-[#475467] m-0 flex flex-row items-center gap-2">
                        <span style={{ fontSize: '18px' }}>💰</span>
                        <span><strong>Save 15% instantly</strong> (no service fees)</span>
                    </Text>
                    <Text className="text-sm text-[#475467] m-0 flex flex-row items-center gap-2">
                        <span style={{ fontSize: '18px' }}>📅</span>
                        <span><strong>Priority Access</strong> to peak dates</span>
                    </Text>
                    <Text className="text-sm text-[#475467] m-0 flex flex-row items-center gap-2">
                        <span style={{ fontSize: '18px' }}>⏰</span>
                        <span><strong>Early Check-in</strong> priority</span>
                    </Text>
                </div>
            </Section>

            {/* CTA */}
            <Section className="text-center mb-6">
                <Button
                    className="bg-[#111827] rounded-lg text-white text-sm font-semibold no-underline text-center px-6 py-3"
                    href={ctaUrl}
                >
                    Book Your Next Stay
                </Button>
                <Text className="text-[#98A2B3] text-xs mt-3">
                    Check availability for Steamboat & Summerland
                </Text>
            </Section>

            <Text className="text-[#475467] text-sm text-center">
                We&apos;d love to host you again whenever the mountains call.<br />
                <Link href={ctaUrl} className="text-[#7F56D9]">Visit Bunks.com</Link>
            </Text>

        </EmailLayout>
    );
};

export default BookDirectCampaignEmail;
