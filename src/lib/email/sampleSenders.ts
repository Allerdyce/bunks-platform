import { sendEmail } from '@/lib/email';
import { TEMPLATE_RENDERERS } from '@/lib/email/templateRenderers';
import { isSampleTemplateSlug } from '@/lib/email/sampleSenderConfig';
import { buildSampleSubject } from '@/lib/email/subjectHelpers';

const DEFAULT_TEST_RECIPIENT = process.env.ADMIN_EMAIL ?? 'ali@bunks.com';

type SampleSendOptions = {
  to?: string;
};

export async function sendSampleEmail(
  slug: string,
  options?: SampleSendOptions,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSampleTemplateSlug(slug)) {
    return { ok: false, error: `Unsupported sample template slug: ${slug}` };
  }

  try {
    const renderer = TEMPLATE_RENDERERS[slug];
    if (!renderer) {
      return { ok: false, error: `No template renderer registered for slug: ${slug}` };
    }

    const sampleProps = renderer.getSampleProps();
    const html = await renderer.render();
    const subject = buildSampleSubject(slug, sampleProps);
    const to = options?.to ?? DEFAULT_TEST_RECIPIENT;

    await sendEmail({
      to,
      subject,
      html,
    });
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: message };
  }
}
