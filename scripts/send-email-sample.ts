import 'dotenv/config';
import {
  SUPPORTED_SAMPLE_TEMPLATE_SLUGS,
  type SampleTemplateSlug,
  isSampleTemplateSlug,
} from '@/lib/email/sampleSenderConfig';
import { sendSampleEmail } from '@/lib/email/sampleSenders';

async function main() {
  const args = process.argv.slice(2);
  let template: SampleTemplateSlug = SUPPORTED_SAMPLE_TEMPLATE_SLUGS[0];
  let toArg: string | undefined;

  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--template' && args[i + 1]) {
      const value = args[i + 1];
      if (isSampleTemplateSlug(value)) {
        template = value;
      } else {
        throw new Error(
          `Unknown template "${value}". Supported: ${SUPPORTED_SAMPLE_TEMPLATE_SLUGS.join(', ')}`,
        );
      }
      i += 1;
    } else if (args[i] === '--to' && args[i + 1]) {
      toArg = args[i + 1];
      i += 1;
    }
  }

  const to = toArg ?? process.env.TEST_EMAIL_TO;
  const label = template.replace(/-/g, ' ');
  console.log(`📬 Sending ${label} sample to ${to ?? 'default admin recipient'}`);
  const result = await sendSampleEmail(template, { to });
  if (result.ok) {
    console.log(`✅ ${label} test email sent successfully`);
    return;
  }
  throw new Error(result.error);
}

main().catch((error) => {
  console.error('❌ Failed to send test email');
  console.error(error);
  process.exit(1);
});
