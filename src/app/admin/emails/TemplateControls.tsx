'use client';

import { useMemo, useState } from 'react';
import type { EmailTemplateSpec } from '@/lib/email/catalog';
import { getEmailSubject } from '@/lib/email/subjects';
import type { TemplatePreview } from './types';
import { EmailPreviewModal } from './EmailPreviewModal';

const STORAGE_KEY = 'bunks-email-template-toggles';
const AUDIENCE_ORDER: EmailTemplateSpec['audience'][] = ['guest', 'host', 'system'];
const AUDIENCE_META: Record<EmailTemplateSpec['audience'], { label: string; description: string; accent: string }> = {
  guest: {
    label: 'Guest journey',
    description: 'Booking flow, pre-stay, onsite, and post-stay comms.',
    accent: '#7F56D9',
  },
  host: {
    label: 'Host + Ops',
    description: 'Operational alerts that keep partners in sync.',
    accent: '#F63D68',
  },
  system: {
    label: 'System alerts',
    description: 'Automated monitoring, cron digests, and failure notices.',
    accent: '#12B76A',
  },
};
type ToggleTab = 'all' | EmailTemplateSpec['audience'];

const STATUS_BADGES: Record<EmailTemplateSpec['status'], { background: string; border: string; color: string }> = {
  shipped: {
    background: '#ECFDF3',
    border: '#BBF7D0',
    color: '#166534',
  },
  'in-progress': {
    background: '#EEF2FF',
    border: '#C7D2FE',
    color: '#4338CA',
  },
  planned: {
    background: '#F8FAFC',
    border: '#E2E8F0',
    color: '#0F172A',
  },
  parked: {
    background: '#F4F3FF',
    border: '#DDD6FE',
    color: '#5B21B6',
  },
};

const readStoredToggles = (): Record<string, boolean> => {
  if (typeof window === 'undefined') {
    return {};
  }
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return {};
  }
  try {
    return JSON.parse(stored) as Record<string, boolean>;
  } catch (error) {
    console.warn('Failed to parse template toggles from storage', error);
    return {};
  }
};

export type TemplateControl = Pick<EmailTemplateSpec, 'slug' | 'name' | 'audience' | 'status' | 'trigger' | 'category'>;

interface TemplateControlsProps {
  templates: TemplateControl[];
  previewMap: Record<string, TemplatePreview | undefined>;
}

export function TemplateControls({ templates, previewMap }: TemplateControlsProps) {
  const [toggles, setToggles] = useState<Record<string, boolean>>(() => readStoredToggles());
  const [activeTab, setActiveTab] = useState<ToggleTab>('guest');
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  const enabledCount = useMemo(() => {
    const values = templates.map((template) => toggles[template.slug]);
    return values.filter((value) => value !== false).length;
  }, [templates, toggles]);

  const disabledCount = templates.length - enabledCount;

  const statusCounts = useMemo(() => {
    const counts = {
      shipped: 0,
      'in-progress': 0,
      planned: 0,
      parked: 0,
    };
    templates.forEach((t) => {
      if (counts[t.status] !== undefined) counts[t.status]++;
    });
    return counts;
  }, [templates]);

  const tabMap = useMemo(() => {
    const base: Record<ToggleTab, TemplateControl[]> = {
      all: [],
      guest: [],
      host: [],
      system: [],
    };

    templates.forEach((template) => {
      base.all.push(template);
      base[template.audience].push(template);
    });
    // Removed sorting to respect catalog lifecycle order
    return base;
  }, [templates]);

  const tabs = useMemo(() => {
    return AUDIENCE_ORDER.map((audience) => ({
      id: audience,
      label: AUDIENCE_META[audience].label,
      count: tabMap[audience].length,
    }));
  }, [tabMap]);

  const visibleTemplates = tabMap[activeTab];

  const handleToggle = (slug: string) => {
    setToggles((current) => {
      const next = { ...current, [slug]: current[slug] === false };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const handlePreview = (slug: string) => {
    setSelectedSlug(slug);
  };

  const closePreview = () => setSelectedSlug(null);
  const selectedPreview = selectedSlug ? previewMap[selectedSlug] : undefined;

  return (
    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
      {/* Left Column: Fixed Info & Filters */}
      <div className="flex flex-col gap-6 lg:col-span-4 lg:sticky lg:top-8">
        {/* Header & Status Card */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">Email System</p>
          <h1 className="mt-3 text-2xl font-serif text-slate-900">React Email previews</h1>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            {templates.length}-email catalog. Implemented templates render in the preview table.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {(Object.keys(STATUS_BADGES) as EmailTemplateSpec['status'][]).map((status) => (
              <div
                key={status}
                className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider"
                style={{
                  borderColor: STATUS_BADGES[status].border,
                  backgroundColor: STATUS_BADGES[status].background,
                  color: STATUS_BADGES[status].color,
                }}
              >
                {status}: {statusCounts[status]}
              </div>
            ))}
          </div>
        </section>

        {/* Filters & Toggles Card */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-slate-900">Filter & Controls</h2>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <span className="flex h-2 w-2 rounded-full bg-slate-900"></span>
                <span className="font-medium text-slate-900">{enabledCount}</span>
                <span className="text-slate-500">enabled</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="flex h-2 w-2 rounded-full bg-slate-200"></span>
                <span className="font-medium text-slate-900">{disabledCount}</span>
                <span className="text-slate-500">paused</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`group flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all ${isActive
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                      }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {/* Right Column: Template Table */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden lg:col-span-8">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-6 py-4">Template</th>
                {activeTab === 'all' && <th className="px-6 py-4">Audience</th>}
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Trigger</th>
                <th className="px-6 py-4 text-right">Enabled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {visibleTemplates.map((template) => {
                const preview = previewMap[template.slug];
                const isEnabled = toggles[template.slug] !== false;
                const canPreview = Boolean(preview?.html);

                return (
                  <tr key={template.slug} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => canPreview && handlePreview(template.slug)}
                        disabled={!canPreview}
                        className={`text-left text-sm font-semibold transition ${canPreview
                            ? 'text-slate-900 hover:text-violet-600'
                            : 'cursor-not-allowed text-slate-400'
                          }`}
                      >
                        {template.name}
                      </button>
                      <div className="mt-0.5 text-xs font-mono text-slate-400">{template.slug}</div>
                    </td>
                    {activeTab === 'all' && (
                      <td className="px-6 py-4 text-sm text-slate-600 capitalize">
                        {template.audience}
                      </td>
                    )}
                    <td className="px-6 py-4 text-sm text-slate-600">{template.category}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{template.trigger}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={isEnabled}
                          onClick={() => handleToggle(template.slug)}
                          className={`relative h-6 w-11 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 ${isEnabled ? 'bg-slate-900' : 'bg-slate-200'
                            }`}
                        >
                          <span
                            className={`pointer-events-none absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform ${isEnabled ? 'translate-x-5' : 'translate-x-0'
                              }`}
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedPreview ? <EmailPreviewModal preview={selectedPreview} onClose={closePreview} /> : null}
    </div>
  );
}
