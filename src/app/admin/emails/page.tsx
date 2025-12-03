import { EMAIL_TEMPLATES, type EmailTemplateSpec } from '@/lib/email/catalog';
import { TEMPLATE_RENDERERS } from '@/lib/email/templateRenderers';
import { renderSubjectWithSample, buildSampleSubject } from '@/lib/email/subjectHelpers';
import { getEmailSubject } from '@/lib/email/subjects';
import { TemplateControls } from './TemplateControls';
import { STATUS_STYLES } from './statusStyles';
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
  const statusCounts = previews.reduce<Record<EmailTemplateSpec['status'], number>>(
    (acc, preview) => {
      acc[preview.spec.status] += 1;
      return acc;
    },
    STATUS_ORDER.reduce(
      (acc, status) => {
        acc[status] = 0;
        return acc;
      },
      {} as Record<EmailTemplateSpec['status'], number>,
    ),
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <AdminTopNav
        active="emails"
        title="React Email previews"
        subtitle={`${totalTemplates}-email catalog for Guest, host and system.`}
        actions={<EmailPageActions />}
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">Email System</p>
          <h1 className="mt-3 text-2xl font-serif text-slate-900">React Email previews</h1>
          <p className="mt-2 text-sm text-slate-600 max-w-3xl">
            {totalTemplates}-email catalog. Implemented templates render below.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            {STATUS_ORDER.map((status) => (
              <div
                key={status}
                className="inline-flex items-center rounded-full border px-4 py-1 text-sm font-semibold"
                style={{
                  borderColor: STATUS_STYLES[status].border,
                  background: STATUS_STYLES[status].background,
                  color: STATUS_STYLES[status].color,
                }}
              >
                {STATUS_STYLES[status].label}: {statusCounts[status]}
              </div>
            ))}
          </div>
        </section>

        <div id="template-controls">
          <TemplateControls templates={templateControls} previewMap={previewMap} />
        </div>
      </main>
    </div>
  );
}
