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
    const previewText = 'Save 10% on your next stay when you book direct.';

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
                Until Next Time
            </Heading>

            <Text className="text-[#475467] text-base mb-4">
                Hi {guestName},
            </Text>
            <Text className="text-[#475467] text-base mb-4">
                Thanks for staying with Bunks! We hope you made some great memories.
            </Text>
            <Text className="text-[#475467] text-base mb-6">
                Next time, skip the third-party fees and book with us directly for our best rate.
            </Text>

            {/* Value Props Card */}
            <Section className="bg-[#F8F9FC] rounded-xl p-5 mb-6 border border-[#EAECF0]">
                <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-4 text-center">
                    The Direct Advantage
                </Heading>

                <div className="space-y-3">
                    <Text className="text-sm text-[#475467] m-0 flex flex-row items-center gap-2">
                        <span style={{ fontSize: '18px' }}>💰</span>
                        <span><strong>Save 10%</strong> versus Airbnb and VRBO</span>
                    </Text>
                    <Text className="text-sm text-[#475467] m-0 flex flex-row items-center gap-2">
                        <span style={{ fontSize: '18px' }}>🏡</span>
                        <span><strong>Same home, same hosts</strong> you already know</span>
                    </Text>
                    <Text className="text-sm text-[#475467] m-0 flex flex-row items-center gap-2">
                        <span style={{ fontSize: '18px' }}>✉️</span>
                        <span><strong>Talk to us directly</strong> before and during your stay</span>
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
                    Steamboat Springs, CO & Summerland, CA
                </Text>
            </Section>

            <Text className="text-[#475467] text-sm text-center">
                We&apos;d love to host you again.<br />
                <Link href={ctaUrl} className="text-[#7F56D9]">Visit Bunks.com</Link>
            </Text>

            {/* Postmark broadcast streams replace this placeholder with the recipient's unsubscribe URL. */}
            <Text className="text-[#98A2B3] text-xs text-center mt-6">
                Don&apos;t want these emails?{' '}
                <Link href="{{{ pm:unsubscribe }}}" className="text-[#98A2B3] underline">Unsubscribe</Link>
            </Text>

        </EmailLayout>
    );
};

export default BookDirectCampaignEmail;
