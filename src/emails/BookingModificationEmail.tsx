import * as React from 'react';
import { Column, Heading, Row, Section, Text } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';

export interface ModificationChangeItem {
  label: string;
  previous: string;
  updated: string;
  note?: string;
}

export interface ChargeAdjustmentItem {
  label: string;
  amount: string;
  type: 'credit' | 'charge';
  note?: string;
}

export interface ModificationTaskItem {
  label: string;
  detail: string;
  due?: string;
  status?: 'new' | 'in-progress' | 'done';
}

export interface BookingModificationEmailProps {
  guestName: string;
  propertyName: string;
  bookingId: number | string;
  updatedAt: string;
  previousDates: string;
  newDates: string;
  nightsSummary?: string;
  headcount?: string;
  changeReason?: string;
  checkInWindow?: string;
  manageBookingUrl?: string;
  changeItems?: ModificationChangeItem[];
  chargeAdjustments?: ChargeAdjustmentItem[];
  financialSummary?: {
    label: string;
    amount: string;
    note?: string;
  };
  tasks?: ModificationTaskItem[];
  nextSteps?: string[];
  support: {
    email: string;
    phone?: string;
    concierge?: string;
    note?: string;
  };
}

const cardStyle: React.CSSProperties = {
  border: '1px solid #EAECF0',
  borderRadius: 18,
  padding: '20px 22px',
  background: '#FFFFFF',
};

const pillStyle: React.CSSProperties = {
  borderRadius: 999,
  border: '1px solid #E4E7EC',
  background: '#F8F9FC',
  padding: '6px 14px',
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: 0.35,
  textTransform: 'uppercase',
};

const taskStatusColors: Record<NonNullable<ModificationTaskItem['status']>, string> = {
  new: '#7F56D9',
  'in-progress': '#B54708',
  done: '#027A48',
};

const taskStatusLabels: Record<NonNullable<ModificationTaskItem['status']>, string> = {
  new: 'New',
  'in-progress': 'In Progress',
  done: 'Done',
};

export function BookingModificationEmail(props: BookingModificationEmailProps) {
  const {
    guestName,
    propertyName,
    bookingId,
    updatedAt,
    previousDates,
    newDates,
    nightsSummary,
    headcount,
    changeReason,
    checkInWindow,
    manageBookingUrl,
    changeItems,
    chargeAdjustments,
    financialSummary,
    tasks,
    nextSteps,
    support,
  } = props;

  const effectiveChangeItems =
    changeItems?.length
      ? changeItems
      : [
          {
            label: 'Stay dates',
            previous: previousDates,
            updated: newDates,
          },
          {
            label: 'Guests',
            previous: headcount ?? 'Original headcount',
            updated: headcount ?? 'Updated headcount',
            note: 'Let us know if this changes again so we can restock amenities.',
          },
        ];

  return (
    <EmailLayout previewText={`Updates confirmed for your ${propertyName} stay`}>
      <Section className="mb-6">
        <Text className="text-sm uppercase tracking-[0.35em] text-[#7F56D9]">Booking updated</Text>
        <Heading as="h1" className="mt-2 text-3xl font-semibold text-[#101828]">
          Changes confirmed, {guestName}
        </Heading>
        <Text className="mt-3 text-sm text-[#475467]">
          We saved the updates to your {propertyName} reservation. Review what changed below—no need to lift a finger unless
          something looks off.
        </Text>
        {changeReason ? (
          <Text className="mt-2 text-sm text-[#475467]">
            Reason noted: <strong>{changeReason}</strong>
          </Text>
        ) : null}
        <div style={{ marginTop: 18, display: 'inline-flex', gap: 12, flexWrap: 'wrap' }}>
          <span style={pillStyle}>Booking #{bookingId}</span>
          <span style={pillStyle}>Updated {updatedAt}</span>
        </div>
        {manageBookingUrl ? (
          <a
            href={manageBookingUrl}
            style={{
              display: 'inline-flex',
              marginTop: 16,
              background: '#7F56D9',
              color: '#fff',
              padding: '10px 18px',
              borderRadius: 999,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            View booking details →
          </a>
        ) : null}
      </Section>

      <Section className="mb-6" style={cardStyle}>
        <Heading as="h2" className="text-xl font-semibold text-[#101828] mb-3">
          Stay snapshot
        </Heading>
        <Row>
          <Column style={{ width: '50%', minWidth: 240, paddingRight: 10 }}>
            <Text className="text-xs uppercase tracking-[0.35em] text-[#98A2B3]">Previous</Text>
            <Text className="text-base font-semibold text-[#101828] mt-1">{previousDates}</Text>
          </Column>
          <Column style={{ width: '50%', minWidth: 240, paddingLeft: 10 }}>
            <Text className="text-xs uppercase tracking-[0.35em] text-[#98A2B3]">New schedule</Text>
            <Text className="text-base font-semibold text-[#101828] mt-1">{newDates}</Text>
          </Column>
        </Row>
        <Row className="mt-4">
          {nightsSummary ? (
            <Column style={{ width: '50%', minWidth: 240, paddingRight: 10 }}>
              <Text className="text-xs uppercase tracking-[0.35em] text-[#98A2B3]">Nights</Text>
              <Text className="text-base text-[#101828] mt-1">{nightsSummary}</Text>
            </Column>
          ) : null}
          {headcount ? (
            <Column style={{ width: '50%', minWidth: 240, paddingLeft: 10 }}>
              <Text className="text-xs uppercase tracking-[0.35em] text-[#98A2B3]">Guests</Text>
              <Text className="text-base text-[#101828] mt-1">{headcount}</Text>
            </Column>
          ) : null}
        </Row>
        {checkInWindow ? (
          <Text className="text-sm text-[#475467] mt-4">
            Check-in starts <strong>{checkInWindow}</strong>. Reply if your arrival window shifts so we can coordinate access.
          </Text>
        ) : null}
      </Section>

      <Section className="mb-6" style={cardStyle}>
        <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-3">
          What changed
        </Heading>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {effectiveChangeItems.map((item) => (
            <div key={item.label} style={{ border: '1px solid #EAECF0', borderRadius: 12, padding: '14px 16px' }}>
              <Text className="text-sm uppercase tracking-[0.2em] text-[#98A2B3]">{item.label}</Text>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginTop: 6 }}>
                <div style={{ flex: 1 }}>
                  <Text className="text-xs text-[#98A2B3]">Previous</Text>
                  <Text className="text-base text-[#475467]">{item.previous}</Text>
                </div>
                <div style={{ flex: 1 }}>
                  <Text className="text-xs text-[#98A2B3]">New</Text>
                  <Text className="text-base font-semibold text-[#101828]">{item.updated}</Text>
                </div>
              </div>
              {item.note ? <Text className="text-sm text-[#475467] mt-2">{item.note}</Text> : null}
            </div>
          ))}
        </div>
      </Section>

      {chargeAdjustments?.length ? (
        <Section className="mb-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-3">
            Billing adjustments
          </Heading>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {chargeAdjustments.map((charge) => (
              <Row key={charge.label} style={{ alignItems: 'center' }}>
                <Column style={{ width: '65%', paddingRight: 8 }}>
                  <Text className="text-base text-[#101828]">{charge.label}</Text>
                  {charge.note ? <Text className="text-xs text-[#98A2B3]">{charge.note}</Text> : null}
                </Column>
                <Column style={{ width: '35%', textAlign: 'right' }}>
                  <Text className={`text-base font-semibold ${charge.type === 'credit' ? 'text-[#027A48]' : 'text-[#B54708]'}`}>
                    {charge.type === 'credit' ? '−' : '+'}{charge.amount}
                  </Text>
                </Column>
              </Row>
            ))}
          </div>
          {financialSummary ? (
            <div style={{ borderTop: '1px solid #EAECF0', marginTop: 16, paddingTop: 16 }}>
              <Row style={{ alignItems: 'center' }}>
                <Column style={{ width: '60%' }}>
                  <Text className="text-base font-semibold text-[#101828]">{financialSummary.label}</Text>
                </Column>
                <Column style={{ width: '40%', textAlign: 'right' }}>
                  <Text className="text-2xl font-semibold text-[#101828]">{financialSummary.amount}</Text>
                </Column>
              </Row>
              {financialSummary.note ? (
                <Text className="text-sm text-[#475467] mt-2">{financialSummary.note}</Text>
              ) : null}
            </div>
          ) : null}
        </Section>
      ) : null}

      {tasks?.length ? (
        <Section className="mb-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-2">
            Quick reminders
          </Heading>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {tasks.map((task) => (
              <div key={task.label} style={{ border: '1px solid #EAECF0', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <Text className="text-base font-semibold text-[#101828]">{task.label}</Text>
                  {task.status ? (
                    <span
                      style={{
                        ...pillStyle,
                        background: '#F5F3FF',
                        borderColor: taskStatusColors[task.status],
                        color: taskStatusColors[task.status],
                      }}
                    >
                      {taskStatusLabels[task.status]}
                    </span>
                  ) : null}
                </div>
                <Text className="text-sm text-[#475467] mt-1">{task.detail}</Text>
                {task.due ? <Text className="text-xs text-[#98A2B3]">Due {task.due}</Text> : null}
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {nextSteps?.length ? (
        <Section className="mb-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-2">
            Anything else?
          </Heading>
          <ul className="list-disc pl-5 text-sm text-[#475467]">
            {nextSteps.map((step) => (
              <li key={step} className="mb-1">{step}</li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section className="rounded-3xl border border-[#EAECF0] bg-[#F8F9FC] p-5">
        <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-2">
          Need tweaks? We can help
        </Heading>
        <Text className="text-sm text-[#475467]">
          Email <a href={`mailto:${support.email}`} className="text-[#7F56D9]">{support.email}</a>
          {support.phone ? (
            <>
              {' '}or text <a href={`tel:${support.phone}`} className="text-[#7F56D9]">{support.phone}</a>
            </>
          ) : null}
          {support.concierge ? (
            <>
              {' '}· concierge line <a href={`tel:${support.concierge}`} className="text-[#7F56D9]">{support.concierge}</a>
            </>
          ) : null}
          .
        </Text>
        {support.note ? <Text className="mt-2 text-sm text-[#475467]">{support.note}</Text> : null}
      </Section>
    </EmailLayout>
  );
}

export default BookingModificationEmail;
