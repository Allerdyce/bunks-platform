import type { EmailTemplateSpec } from '@/lib/email/catalog';

export interface TemplatePreview {
  spec: EmailTemplateSpec;
  html: string | null;
  subject: string | null;
  sampleSubject: string | null;
}
