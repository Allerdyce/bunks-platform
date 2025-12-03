import * as React from 'react';
import { Button, Heading, Section, Text } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';

export interface PreStay24hChecklistItem {
  label: string;
  detail?: string;
}

export interface PreStay24hEmailProps {
  guestName: string;
  propertyName: string;
  arrivalWindow: string;
  weatherCallout?: string;
  roadStatus?: string;
  checkInGuideUrl?: string;
  checkInChecklist: PreStay24hChecklistItem[];
  outstandingTasks?: string[];
  hostSupportEmail: string;
  hostSupportPhone?: string;
  supportNote?: string;
  referenceLinks?: { label: string; href: string; description?: string }[];
  supportDirectory?: { label: string; value: string; helper?: string | null }[];
}

const cardStyle: React.CSSProperties = {
  border: '1px solid #EAECF0',
  borderRadius: 16,
  padding: '20px 24px',
  background: '#FFFFFF',
};

const checklistTableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
};

const checklistStepCellStyle: React.CSSProperties = {
  width: 72,
  padding: '14px 12px 14px 0',
  verticalAlign: 'top',
};

const checklistContentCellStyle: React.CSSProperties = {
  padding: '14px 0',
  verticalAlign: 'top',
};

const referenceLinkStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  padding: '16px 18px',
  border: '1px solid #EAECF0',
  borderRadius: 16,
  textDecoration: 'none',
  color: '#101828',
  background: '#FFFFFF',
};

export function PreStay24hEmail(props: PreStay24hEmailProps) {
  const {
    guestName,
    propertyName,
    arrivalWindow,
    weatherCallout,
    roadStatus,
    checkInGuideUrl,
    checkInChecklist,
    outstandingTasks,
    hostSupportEmail,
    hostSupportPhone,
    supportNote,
    referenceLinks,
    supportDirectory,
  } = props;

  return (
    <EmailLayout previewText={`Final arrival checklist for ${propertyName}`}>
      <Section className="mb-6 rounded-2xl bg-[#F4EBFF] p-5">
        <Text className="text-sm font-semibold uppercase tracking-widest text-[#7F56D9]">24 hours to go</Text>
        <Heading className="mt-1 text-2xl font-semibold text-[#42307D]">Tomorrow&apos;s arrival checklist</Heading>
        <Text className="text-base text-[#6941C6]">{arrivalWindow}</Text>
      </Section>

      <Text className="mb-4 text-base text-[#475467]">
        Hey {guestName}, here&apos;s the final rundown so check-in at {propertyName} tomorrow stays effortless.
      </Text>

      {weatherCallout || roadStatus ? (
        <Section className="mb-6 rounded-2xl bg-[#ECFDF3] p-5 border border-[#A6F4C5]">
          <Heading as="h2" className="text-lg font-semibold text-[#027A48] mb-2">Conditions + travel notes</Heading>
          {weatherCallout && <Text className="text-sm text-[#05603A] mb-2">{weatherCallout}</Text>}
          {roadStatus && <Text className="text-sm text-[#05603A]">{roadStatus}</Text>}
        </Section>
      ) : null}

      <Section className="mb-6" style={cardStyle}>
        <Heading as="h2" className="text-xl font-semibold text-[#101828] mb-3">Final check-in steps</Heading>
        <table role="presentation" cellPadding={0} cellSpacing={0} style={checklistTableStyle}>
          <tbody>
            {checkInChecklist.map((item, index) => {
              const isLast = index === checkInChecklist.length - 1;
              return (
                <tr key={item.label} style={{ borderBottom: isLast ? 'none' : '1px solid #F2F4F7' }}>
                  <td style={checklistStepCellStyle}>
                    <span className="text-xs font-semibold uppercase tracking-wide text-[#667085]">
                      Step {index + 1}
                    </span>
                  </td>
                  <td style={checklistContentCellStyle}>
                    <Text className="text-sm font-semibold text-[#111827] mb-1">{item.label}</Text>
                    {item.detail && <Text className="text-sm text-[#475467]">{item.detail}</Text>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {checkInGuideUrl && (
          <Button
            className="mt-4 inline-flex rounded-lg bg-[#111827] px-4 py-2 text-sm font-semibold text-white"
            href={checkInGuideUrl}
          >
            Open live instructions
          </Button>
        )}
      </Section>

      {outstandingTasks?.length ? (
        <Section className="mb-6" style={cardStyle}>
          <Heading as="h2" className="text-xl font-semibold text-[#101828] mb-3">Before you depart</Heading>
          <ul className="list-disc pl-5 text-sm text-[#475467]">
            {outstandingTasks.map((task) => (
              <li key={task} className="mb-1">{task}</li>
            ))}
          </ul>
        </Section>
      ) : null}

      {referenceLinks?.length ? (
        <Section className="mb-6" style={cardStyle}>
          <Heading as="h2" className="text-xl font-semibold text-[#101828] mb-3">Reference links</Heading>
          <div className="grid gap-3 md:grid-cols-2">
            {referenceLinks.map((link) => (
              <a key={link.href} href={link.href} style={referenceLinkStyle}>
                <span style={{ fontWeight: 600 }}>{link.label}</span>
                {link.description && <span style={{ color: '#475467', fontSize: 14 }}>{link.description}</span>}
                <span style={{ fontSize: 12, color: '#7F56D9' }}>Open →</span>
              </a>
            ))}
          </div>
        </Section>
      ) : null}

      <Section className="rounded-2xl bg-[#F8F9FC] p-5 border border-[#EAECF0]">
        <Heading as="h2" className="text-lg font-semibold text-[#101828] mb-1">Need anything last-minute?</Heading>
        <Text className="text-sm text-[#475467] mb-2">
          Email <a href={`mailto:${hostSupportEmail}`} className="text-[#7F56D9]">{hostSupportEmail}</a>
          {hostSupportPhone ? (
            <>
              {' '}or text <a href={`tel:${hostSupportPhone}`} className="text-[#7F56D9]">{hostSupportPhone}</a>
            </>
          ) : null}
          .
        </Text>
        {supportNote && <Text className="text-sm text-[#475467]">{supportNote}</Text>}
        {supportDirectory?.length ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {supportDirectory.map((entry) => (
              <div key={`${entry.label}-${entry.value}`} className="rounded-2xl border border-[#EAECF0] bg-white p-3">
                <Text className="text-xs font-semibold uppercase tracking-wide text-[#667085]">{entry.label}</Text>
                <Text className="text-sm font-semibold text-[#101828]">{entry.value}</Text>
                {entry.helper && <Text className="text-xs text-[#475467] mt-1">{entry.helper}</Text>}
              </div>
            ))}
          </div>
        ) : null}
      </Section>
    </EmailLayout>
  );
}

export default PreStay24hEmail;
