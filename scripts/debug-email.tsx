import React from 'react';
import { renderEmail } from '../src/lib/email/renderEmail';
import { EmailLayout } from '../src/emails/components/EmailLayout';
import { Text } from '@react-email/components';

async function main() {
  const html = await renderEmail(
    <EmailLayout previewText="Test preview">
      <Text>Hello email world</Text>
    </EmailLayout>
  );

  console.log(html.slice(0, 120));
}

void main();
