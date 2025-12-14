import * as React from "react";
import { Button, Heading, Hr, Text } from "@react-email/components";
import { EmailLayout } from "./components/EmailLayout";

export interface NewMessageHostEmailProps {
  guestName: string;
  propertyName: string;
  messageBody: string;
  bookingReference?: string | null;
  conversationUrl?: string;
}

export function NewMessageHostEmail({
  guestName,
  propertyName,
  messageBody,
  bookingReference,
  conversationUrl,
}: NewMessageHostEmailProps) {
  const previewText = `New message from ${guestName || "your guest"}`;
  const safeMessage = messageBody?.trim() ?? "";

  return (
    <EmailLayout previewText={previewText}>
      <Text className="text-xs font-semibold uppercase tracking-[0.3em] text-[#7F56D9]">Guest message</Text>
      <Heading className="mt-2 text-2xl font-semibold text-[#101828]">
        {guestName || "Your guest"} sent a note for {propertyName}
      </Heading>
      {bookingReference && (
        <Text className="mt-2 text-sm text-[#475467]">
          Booking reference <span className="font-mono">{bookingReference}</span>
        </Text>
      )}
      <div className="mt-5 rounded-2xl border border-[#EAECF0] bg-[#F8FAFC] p-4">
        <Text className="text-xs uppercase tracking-widest text-[#98A2B3] mb-2">Message</Text>
        <Text className="text-base text-[#101828] whitespace-pre-line">{safeMessage}</Text>
      </div>
      {conversationUrl && (
        <Button
          href={conversationUrl}
          className="mt-6 inline-flex items-center justify-center rounded-2xl bg-[#101828] px-5 py-3 text-sm font-semibold text-white"
        >
          Reply in Bunks
        </Button>
      )}
      <Hr className="my-6 border-[#EAECF0]" />
      <Text className="text-xs text-[#98A2B3]">
        Replying from the console keeps the full history tied to this booking.
      </Text>
    </EmailLayout>
  );
}

export default NewMessageHostEmail;
