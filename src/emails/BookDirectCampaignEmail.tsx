
import * as React from 'react';
import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Html,
    Img,
    Link,
    Preview,
    Section,
    Text,
    Hr,
    Tailwind,
} from '@react-email/components';

interface BookDirectCampaignEmailProps {
    guestName?: string;
    ctaUrl?: string;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://bunks.com';

export const BookDirectCampaignEmail = ({
    guestName = 'Guest',
    ctaUrl = 'https://bunks.com',
}: BookDirectCampaignEmailProps) => {
    const previewText = 'Save 10-20% on your next stay by booking direct.';

    return (
        <Html>
            <Head />
            <Preview>{previewText}</Preview>
            <Tailwind
                config={{
                    theme: {
                        extend: {
                            colors: {
                                brand: '#fe5000',
                                offwhite: '#fafafa',
                            },
                        },
                    },
                }}
            >
                <Body className="bg-white my-auto mx-auto font-sans">
                    <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
                        {/* Header / Logo */}
                        <Section className="mt-[20px]">
                            <Img
                                src={`${baseUrl}/static/logo.png`}
                                width="120"
                                height="40"
                                alt="Bunks"
                                className="my-0 mx-auto"
                            />
                        </Section>

                        {/* Hero Heading */}
                        <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
                            Why book direct next time?
                        </Heading>

                        {/* Personal Note */}
                        <Text className="text-black text-[14px] leading-[24px]">
                            Hi {guestName},
                        </Text>
                        <Text className="text-black text-[14px] leading-[24px]">
                            We hope you enjoyed your stay! While you likely booked via Airbnb or VRBO this time, we wanted to
                            invite you to join our <strong>Bunks Direct</strong> program for your next mountain getaway.
                        </Text>

                        {/* Value Props */}
                        <Section className="bg-offwhite rounded-lg p-6 my-6">
                            <Heading as="h3" className="text-[18px] font-medium mt-0 mb-4">
                                The Direct Advantage
                            </Heading>

                            <div className="flex flex-col gap-3">
                                <Text className="text-[14px] leading-[24px] m-0">
                                    ⭐ <strong>No booking platform fees</strong> (save ~15% instantly)
                                </Text>
                                <Text className="text-[14px] leading-[24px] m-0">
                                    💰 <strong>Save 10–20%</strong> on nightly rates
                                </Text>
                                <Text className="text-[14px] leading-[24px] m-0">
                                    🤝 <strong>Extra 10% off</strong> when you refer a friend
                                </Text>
                                <Text className="text-[14px] leading-[24px] m-0">
                                    📅 <strong>First access</strong> to peak dates (Xmas, 4th of July)
                                </Text>
                                <Text className="text-[14px] leading-[24px] m-0">
                                    ⏰ <strong>Early check-in</strong> / late check-out priority
                                </Text>
                            </div>
                        </Section>

                        {/* CTA */}
                        <Section className="text-center mt-[32px] mb-[32px]">
                            <Button
                                className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                                href={ctaUrl}
                            >
                                Book Your Next Stay
                            </Button>
                        </Section>

                        <Text className="text-black text-[14px] leading-[24px]">
                            We'd love to host you again whenever the mountains call.
                        </Text>

                        <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />

                        <Text className="text-[#666666] text-[12px] leading-[24px]">
                            Bunks Hospitality · Steamboat Springs & Summerland CA
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default BookDirectCampaignEmail;
