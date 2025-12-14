'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { TemplatePreview } from './types';
import { isSampleTemplateSlug } from '@/lib/email/sampleSenderConfig';

interface EmailPreviewModalProps {
  preview: TemplatePreview;
  onClose: () => void;
}

export function EmailPreviewModal({ preview, onClose }: EmailPreviewModalProps) {
  const [recipient, setRecipient] = useState('ali@bunks.com');
  const [sendState, setSendState] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    setRecipient('ali@bunks.com');
    setSendState('idle');
    setSendError(null);
  }, [preview.spec.slug]);

  const subject = preview.subject;
  const sampleSubject = preview.sampleSubject;
  const hasHtml = Boolean(preview.html);
  const canSendSample = isSampleTemplateSlug(preview.spec.slug);

  const handleSendSample = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSendSample || sendState === 'sending') return;
    setSendState('sending');
    setSendError(null);
    try {
      const response = await fetch('/api/admin/emails/send-sample', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ slug: preview.spec.slug, to: recipient || undefined }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data?.error ?? 'Failed to send sample email');
      }

      setSendState('success');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setSendState('error');
      setSendError(message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-12">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex w-full max-w-6xl max-h-full overflow-y-auto flex-col gap-4 rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Preview</p>
            <h2 className="text-2xl font-serif text-slate-900">{preview.spec.name}</h2>
            <p className="text-sm text-slate-500">
              <span className="font-medium text-slate-900">Subject:</span> {subject ?? 'Subject TBD'}
            </p>
            {sampleSubject ? (
              <p className="text-xs text-slate-400">
                Sample sends use: <span className="font-semibold text-slate-600">{sampleSubject}</span>
              </p>
            ) : null}
            <p className="text-xs text-slate-400">slug: {preview.spec.slug}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-slate-400"
            aria-label="Close preview"
          >
            <X className="h-4 w-4" />
            Close
          </button>
        </div>
        {hasHtml ? (
          <div className="h-[70vh] w-full overflow-hidden rounded-2xl border border-slate-200">
            <iframe
              title={`${preview.spec.name} preview`}
              srcDoc={preview.html ?? undefined}
              className="h-full w-full"
            />
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-500">
            Preview HTML not available yet.
          </div>
        )}
        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-900">Send sample email</h3>
          <p className="mt-1 text-sm text-slate-500">
            Uses the fixture data above and sends via Postmark. Great for sanity checks without leaving the admin.
          </p>
          {canSendSample ? (
            <form onSubmit={handleSendSample} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="flex-1 text-sm text-slate-600">
                Recipient
                <input
                  type="email"
                  value={recipient}
                  onChange={(event) => setRecipient(event.target.value)}
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-base text-slate-900 focus:border-slate-900 focus:outline-none"
                />
              </label>
              <button
                type="submit"
                disabled={sendState === 'sending'}
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {sendState === 'sending' ? 'Sending…' : 'Send sample'}
              </button>
            </form>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
              Sample sending isn&apos;t wired up for this template yet. Use the CLI helper for now.
            </div>
          )}
          {sendState === 'success' ? (
            <p className="mt-2 text-sm font-medium text-green-600">Sample email sent! Check your inbox.</p>
          ) : null}
          {sendState === 'error' && sendError ? (
            <p className="mt-2 text-sm font-medium text-red-600">{sendError}</p>
          ) : null}
        </section>
      </div>
    </div>
  );
}
