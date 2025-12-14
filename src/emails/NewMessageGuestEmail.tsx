import * as React from "react";
import { Button, Heading, Hr, Text } from "@react-email/components";
import { EmailLayout } from "./components/EmailLayout";

export interface NewMessageGuestEmailProps {
  guestName: string;
  propertyName: string;
  hostLabel?: string;
  messageBody: string;
  conversationUrl?: string;
  supportEmail?: string | null;
}

export function NewMessageGuestEmail({
  guestName,
  propertyName,
  hostLabel = "your host",
  messageBody,
  conversationUrl,
  supportEmail,
}: NewMessageGuestEmailProps) {
  const previewText = `New note from ${hostLabel}`;
  const safeMessage = messageBody?.trim() ?? "";

  return (
    <EmailLayout previewText={previewText}>
      <Text className="text-xs font-semibold uppercase tracking-[0.3em] text-[#7F56D9]">Host update</Text>
      <Heading className="mt-2 text-2xl font-semibold text-[#101828]">
        {hostLabel} shared a new message for {propertyName}
      </Heading>
      <Text className="mt-2 text-sm text-[#475467]">Hi {guestName || "there"}, here&rsquo;s the latest:</Text>
      <div className="mt-5 rounded-2xl border border-[#EAECF0] bg-[#FFFFFF] p-4">
        <Text className="text-xs uppercase tracking-widest text-[#98A2B3] mb-2">Message</Text>
        <Text className="text-base text-[#101828] whitespace-pre-line">{safeMessage}</Text>
      </div>
      {conversationUrl && (
        <Button
          href={conversationUrl}
          className="mt-6 inline-flex items-center justify-center rounded-2xl bg-[#101828] px-5 py-3 text-sm font-semibold text-white"
        >
          Reply to your host
        </Button>
      )}
      <Hr className="my-6 border-[#EAECF0]" />
      <Text className="text-xs text-[#98A2B3]">
        Need help? {supportEmail ? (
          <>
            Email <a href={`mailto:${supportEmail}`} className="text-[#7F56D9]">{supportEmail}</a> for urgent arrivals.
          </>
        ) : (
          <>Our concierge team is on standby 24/7.</>
        )}
      </Text>
    </EmailLayout>
  );
}

export default NewMessageGuestEmail;
