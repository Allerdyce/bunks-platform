import * as React from 'react';
import { renderAsync } from '@react-email/render';

export function renderEmail(component: React.ReactElement) {
  return renderAsync(component, {
    pretty: false,
  });
}
