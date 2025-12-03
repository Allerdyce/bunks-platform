export type OpsDetailsInput = {
  supportEmail: string;
  supportSmsNumber: string;
  opsEmail: string;
  opsPhone: string;
  opsDeskPhone?: string | null;
  opsDeskHours?: string | null;
  conciergeName?: string | null;
  conciergeContact?: string | null;
  conciergeNotes?: string | null;
  emergencyContact?: string | null;
  emergencyDetails?: string | null;
  doorCodesDocUrl?: string | null;
  arrivalNotesUrl?: string | null;
  liveInstructionsUrl?: string | null;
  recommendationsUrl?: string | null;
  guestBookUrl?: string | null;
  checkInWindow?: string | null;
  checkOutTime?: string | null;
};

export type OpsDetails = OpsDetailsInput & {
  id?: number;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type OpsSupportContact = {
  label: string;
  value: string;
  helper?: string | null;
};

export type OpsReferenceLink = {
  label: string;
  href: string;
  description?: string;
};

export const DEFAULT_OPS_DETAILS: OpsDetailsInput = {
  supportEmail: 'ali@bunks.com',
  supportSmsNumber: '+1 (970) 555-0119',
  opsEmail: 'ops@bunks.com',
  opsPhone: '+1 (970) 555-0124',
  opsDeskPhone: '+1 (970) 555-0101',
  opsDeskHours: '07:00–22:00 MT',
  conciergeName: 'Priya',
  conciergeContact: 'Slack #host-support',
  conciergeNotes: 'VIP guest escalations',
  emergencyContact: '911',
  emergencyDetails: 'Share property code 8821',
  doorCodesDocUrl: '/guide/steamboat-alpenglow-2#essential-info',
  arrivalNotesUrl: '/guide/steamboat-alpenglow-2#checkin',
  liveInstructionsUrl: '/guide/steamboat-alpenglow-2#checkin',
  recommendationsUrl: '/guide/steamboat-alpenglow-2#dining',
  guestBookUrl: '/guide/steamboat-alpenglow-2',
  checkInWindow: 'Check-in after 3:00 p.m.',
  checkOutTime: 'Checkout by 10:00 a.m.',
};

export const REQUIRED_OPS_FIELDS: Array<keyof OpsDetailsInput> = [
  'supportEmail',
  'supportSmsNumber',
  'opsEmail',
  'opsPhone',
];

export const OPTIONAL_OPS_FIELDS: Array<keyof OpsDetailsInput> = [
  'opsDeskPhone',
  'opsDeskHours',
  'conciergeName',
  'conciergeContact',
  'conciergeNotes',
  'emergencyContact',
  'emergencyDetails',
  'doorCodesDocUrl',
  'arrivalNotesUrl',
  'liveInstructionsUrl',
  'recommendationsUrl',
  'guestBookUrl',
  'checkInWindow',
  'checkOutTime',
];
