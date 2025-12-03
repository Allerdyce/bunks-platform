import type { EmailTemplateSpec } from '@/lib/email/catalog';

export const STATUS_STYLES: Record<EmailTemplateSpec['status'], {
  label: string;
  color: string;
  background: string;
  border: string;
}> = {
  shipped: {
    label: 'Shipped',
    color: '#027A48',
    background: '#ECFDF3',
    border: '#ABEFC6',
  },
  'in-progress': {
    label: 'In Progress',
    color: '#B54708',
    background: '#FEF0C7',
    border: '#FEDF89',
  },
  planned: {
    label: 'Planned',
    color: '#344054',
    background: '#F2F4F7',
    border: '#D0D5DD',
  },
  parked: {
    label: 'Parked',
    color: '#475467',
    background: '#E0EAFF',
    border: '#B2CCFF',
  },
};
