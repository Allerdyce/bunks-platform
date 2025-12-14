import { EMAIL_TEMPLATES, type EmailTemplateSpec } from '@/lib/email/catalog';
import { TEMPLATE_RENDERERS } from '@/lib/email/templateRenderers';
import { renderSubjectWithSample, buildSampleSubject } from '@/lib/email/subjectHelpers';
import { getEmailSubject } from '@/lib/email/subjects';
import { TemplateControls } from './TemplateControls';

import type { TemplatePreview } from './types';
import { AdminTopNav } from '@/components/admin/AdminTopNav';
import { EmailPageActions } from './EmailPageActions';

const STATUS_ORDER: EmailTemplateSpec['status'][] = ['shipped', 'in-progress', 'planned', 'parked'];

async function buildPreviews(): Promise<TemplatePreview[]> {
  return Promise.all(
    EMAIL_TEMPLATES.map(async (spec) => {
      const renderer = TEMPLATE_RENDERERS[spec.slug];
      const sampleProps = renderer?.getSampleProps();
      const subject = sampleProps
        ? renderSubjectWithSample(spec.slug, sampleProps)
        : getEmailSubject(spec.slug) ?? null;
      const sampleSubject = sampleProps ? buildSampleSubject(spec.slug, sampleProps) : null;
      return {
        spec,
        html: renderer ? await renderer.render() : null,
        subject,
        sampleSubject,
      };
    }),
  );
}

export default async function EmailPreviewGallery() {
  if (process.env.NODE_ENV === 'production') {
    return (
      <main style={{ padding: 48 }}>
        <h1 style={{ fontSize: 28, marginBottom: 12 }}>Email previews disabled</h1>
        <p style={{ color: '#475467', maxWidth: 560 }}>
          This preview surface is only available in development to prevent exposing test data.
        </p>
      </main>
    );
  }

  const previews = await buildPreviews();
  const templateControls = EMAIL_TEMPLATES.map(({ slug, name, audience, status, trigger, category }) => ({
    slug,
    name,
    audience,
    status,
    trigger,
    category,
  }));
  const previewMap = previews.reduce<Record<string, TemplatePreview>>((acc, preview) => {
    acc[preview.spec.slug] = preview;
    return acc;
  }, {});
  const totalTemplates = previews.length;

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <AdminTopNav active="emails" actions={<EmailPageActions />} />

      <main className="w-full px-6 lg:px-12 mt-8 space-y-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Bunks Ops</p>
          <h1 className="text-2xl font-serif text-slate-900 mt-1">Email System</h1>
          <p className="text-sm text-slate-500">Manage automated guest and host communications.</p>
        </div>

        <TemplateControls templates={templateControls} previewMap={previewMap} />
      </main>
    </div>
  );
}
