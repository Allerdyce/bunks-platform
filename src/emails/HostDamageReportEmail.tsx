import * as React from 'react';
import { Column, Heading, Hr, Row, Section, Text } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';

export type IncidentSeverity = 'low' | 'medium' | 'high';
export type StepStatus = 'pending' | 'in-progress' | 'done';

export interface IncidentActionStep {
  owner: string;
  action: string;
  due: string;
  status: StepStatus;
  note?: string;
}

export interface AffectedAreaItem {
  area: string;
  detail: string;
  photos?: { label: string; url: string }[];
}

export interface EstimateItem {
  label: string;
  amount: string;
  note?: string;
}

export interface ContactItem {
  label: string;
  value: string;
  note?: string;
}

export interface HostDamageReportEmailProps {
  hostName?: string;
  propertyName: string;
  propertyLocation?: string;
  guestName: string;
  incidentDate: string;
  reportedBy: string;
  severity: IncidentSeverity;
  summary: string;
  actionsTaken?: string[];
  nextSteps?: IncidentActionStep[];
  affectedAreas?: AffectedAreaItem[];
  estimates?: EstimateItem[];
  insurance?: {
    claimId?: string;
    hotline?: string;
    note?: string;
  };
  contacts?: ContactItem[];
  attachments?: { label: string; href: string; description?: string }[];
  escalationNote?: string;
}

const cardStyle: React.CSSProperties = {
  border: '1px solid #EAECF0',
  borderRadius: 18,
  padding: '20px 22px',
  backgroundColor: '#FFFFFF',
};

const chipStyle: React.CSSProperties = {
  borderRadius: 999,
  border: '1px solid #D0D5DD',
  padding: '6px 14px',
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: 0.5,
  textTransform: 'uppercase',
};

const severityStyles: Record<IncidentSeverity, { label: string; color: string; border: string; bg: string }> = {
  low: { label: 'Low', color: '#027A48', border: '#ABEFC6', bg: '#ECFDF3' },
  medium: { label: 'Medium', color: '#B54708', border: '#FEDF89', bg: '#FEF0C7' },
  high: { label: 'High', color: '#B42318', border: '#FEC6C6', bg: '#FEF3F2' },
};

const stepStyles: Record<StepStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: '#B54708' },
  'in-progress': { label: 'In progress', color: '#7F56D9' },
  done: { label: 'Done', color: '#027A48' },
};

export function HostDamageReportEmail(props: HostDamageReportEmailProps) {
  const {
    hostName,
    propertyName,
    propertyLocation,
    guestName,
    incidentDate,
    reportedBy,
    severity,
    summary,
    actionsTaken,
    nextSteps,
    affectedAreas,
    estimates,
    insurance,
    contacts,
    attachments,
    escalationNote,
  } = props;

  const previewText = `${propertyName}: incident reported by ${reportedBy}`;
  const severityStyle = severityStyles[severity];

  return (
    <EmailLayout previewText={previewText} footerText="Bunks incident desk · reply for live help or tag #host-support.">
      <Section>
        <Text className="text-xs uppercase tracking-[0.35em] text-[#7F56D9]">Damage / incident report</Text>
        <Heading as="h1" className="mt-2 text-3xl font-semibold text-[#101828]">
          {hostName ? `${hostName}, ` : ''}issue reported at {propertyName}
        </Heading>
        <Text className="mt-3 text-sm text-[#475467]">
          {guestName} reported an incident on {incidentDate}. Review the details below and flag any blockers so ops can
          mitigate quickly.
        </Text>
        <div style={{ marginTop: 18, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ ...chipStyle, borderColor: severityStyle.border, background: severityStyle.bg, color: severityStyle.color }}>
            Severity · {severityStyle.label}
          </span>
          <span style={chipStyle}>Reported by {reportedBy}</span>
          {propertyLocation ? <span style={chipStyle}>{propertyLocation}</span> : null}
        </div>
      </Section>

      <Section className="mt-6" style={cardStyle}>
        <Heading as="h2" className="text-xl font-semibold text-[#101828]">Summary</Heading>
        <Text className="mt-2 text-sm text-[#475467]">{summary}</Text>
        {actionsTaken?.length ? (
          <div className="mt-4">
            <Text className="text-sm font-semibold text-[#101828]">Actions already taken</Text>
            <ul className="mt-2 list-disc pl-5 text-sm text-[#475467]">
              {actionsTaken.map((action) => (
                <li key={action}>{action}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </Section>

      {nextSteps?.length ? (
        <Section className="mt-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828]">Next steps & owners</Heading>
          <div className="mt-3 space-y-2">
            {nextSteps.map((step, index) => (
              <Row key={`${step.owner}-${index}`} style={{ borderBottom: '1px solid #F2F4F7', padding: '10px 0', alignItems: 'baseline' }}>
                <Column style={{ width: '55%' }}>
                  <Text className="text-base font-semibold text-[#101828]">{step.action}</Text>
                  <Text className="text-sm text-[#475467]">Owner: {step.owner}</Text>
                </Column>
                <Column style={{ width: '45%' }}>
                  <Text className="text-sm font-semibold" style={{ color: stepStyles[step.status].color }}>
                    {stepStyles[step.status].label}
                  </Text>
                  <Text className="text-sm text-[#475467]">Due {step.due}</Text>
                  {step.note ? <Text className="text-sm text-[#475467]">{step.note}</Text> : null}
                </Column>
              </Row>
            ))}
          </div>
        </Section>
      ) : null}

      {affectedAreas?.length ? (
        <Section className="mt-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828]">Impacted areas</Heading>
          <div className="mt-3 space-y-3">
            {affectedAreas.map((area) => (
              <div key={area.area} style={{ borderBottom: '1px solid #F2F4F7', paddingBottom: 12 }}>
                <Text className="text-base font-semibold text-[#101828]">{area.area}</Text>
                <Text className="text-sm text-[#475467]">{area.detail}</Text>
                {area.photos?.length ? (
                  <div className="mt-2 flex flex-col gap-1 text-sm">
                    {area.photos.map((photo) => (
                      <a key={photo.url} href={photo.url} style={{ color: '#7F56D9' }}>
                        {photo.label}
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {estimates?.length ? (
        <Section className="mt-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828]">Cost estimates</Heading>
          <div className="mt-3 space-y-2">
            {estimates.map((estimate) => (
              <Row key={estimate.label} style={{ borderBottom: '1px solid #F2F4F7', padding: '8px 0', alignItems: 'baseline' }}>
                <Column style={{ width: '60%' }}>
                  <Text className="text-base font-semibold text-[#101828]">{estimate.label}</Text>
                </Column>
                <Column style={{ width: '40%' }}>
                  <Text className="text-base font-semibold text-[#101828]">{estimate.amount}</Text>
                  {estimate.note ? <Text className="text-sm text-[#475467]">{estimate.note}</Text> : null}
                </Column>
              </Row>
            ))}
          </div>
        </Section>
      ) : null}

      {insurance ? (
        <Section className="mt-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828]">Insurance / protection</Heading>
          {insurance.claimId ? (
            <Text className="text-sm text-[#475467]">Claim ID: {insurance.claimId}</Text>
          ) : null}
          {insurance.hotline ? (
            <Text className="text-sm text-[#475467]">Carrier hotline: {insurance.hotline}</Text>
          ) : null}
          {insurance.note ? <Text className="text-sm text-[#475467]">{insurance.note}</Text> : null}
        </Section>
      ) : null}

      {contacts?.length ? (
        <Section className="mt-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828]">Rapid-response contacts</Heading>
          <div className="mt-3 space-y-2">
            {contacts.map((contact) => (
              <Row key={contact.label} style={{ borderBottom: '1px solid #F2F4F7', padding: '8px 0', alignItems: 'baseline' }}>
                <Column style={{ width: '40%' }}>
                  <Text className="text-sm uppercase tracking-[0.2em] text-[#98A2B3]">{contact.label}</Text>
                </Column>
                <Column style={{ width: '60%' }}>
                  <Text className="text-base text-[#101828]">{contact.value}</Text>
                  {contact.note ? <Text className="text-xs text-[#475467]">{contact.note}</Text> : null}
                </Column>
              </Row>
            ))}
          </div>
        </Section>
      ) : null}

      {(attachments?.length ?? 0) > 0 || escalationNote ? (
        <Section className="mt-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828]">Reference links</Heading>
          {attachments?.length ? (
            <div className="mt-3 flex flex-col gap-2">
              {attachments.map((attachment) => (
                <a key={attachment.href} href={attachment.href} className="text-sm text-[#7F56D9]">
                  {attachment.label}
                  {attachment.description ? (
                    <span style={{ display: 'block', color: '#475467' }}>{attachment.description}</span>
                  ) : null}
                </a>
              ))}
            </div>
          ) : null}
          {escalationNote ? <Text className="mt-3 text-sm text-[#475467]">{escalationNote}</Text> : null}
        </Section>
      ) : null}

      <Hr className="my-6 border-[#EAECF0]" />
      <Text className="text-xs text-[#98A2B3]">
        Generated automatically from the damage-report workflow. Reply-all to loop ops + concierge on the same thread.
      </Text>
    </EmailLayout>
  );
}

export default HostDamageReportEmail;
