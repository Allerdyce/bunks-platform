import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/adminAuth';
import { isSampleTemplateSlug } from '@/lib/email/sampleSenderConfig';
import { sendSampleEmail } from '@/lib/email/sampleSenders';

export async function POST(request: NextRequest) {
  const session = withAdminAuth(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const { slug, to } = (payload ?? {}) as { slug?: string; to?: string };

  if (!slug || !isSampleTemplateSlug(slug)) {
    return NextResponse.json({ error: 'Unsupported or missing template slug' }, { status: 400 });
  }

  const recipient = typeof to === 'string' && to.includes('@') ? to : undefined;

  const result = await sendSampleEmail(slug, { to: recipient });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
