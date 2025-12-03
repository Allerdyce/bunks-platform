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
  const [activeTab, setActiveTab] = useState<ToggleTab>('all');
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  const enabledCount = useMemo(() => {
    const values = templates.map((template) => toggles[template.slug]);
    return values.filter((value) => value !== false).length;
  }, [templates, toggles]);

  const disabledCount = templates.length - enabledCount;

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

    (Object.keys(base) as ToggleTab[]).forEach((key) => {
      base[key] = base[key].slice().sort((a, b) => a.name.localeCompare(b.name));
    });

    return base;
  }, [templates]);

  const tabs = useMemo(() => {
    return [
      {
        id: 'all' as const,
        label: 'All templates',
        count: tabMap.all.length,
      },
      ...AUDIENCE_ORDER.map((audience) => ({
        id: audience,
        label: AUDIENCE_META[audience].label,
        count: tabMap[audience].length,
      })),
    ];
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
    <section
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 24,
        padding: 32,
        marginBottom: 40,
        boxShadow: '0 24px 40px rgba(15, 23, 42, 0.04)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
        <span style={{ letterSpacing: 1, fontSize: 12, color: '#0F172A', fontWeight: 600, textTransform: 'uppercase' }}>
          Template controls
        </span>
        <h2 style={{ margin: 0, fontSize: 26, color: '#0F172A', fontWeight: 600 }}>Enable or pause individual templates</h2>
        <p style={{ margin: 0, color: '#475467', fontSize: 15 }}>
          Toggles persist locally for now — wire these up to your config service when ready.
        </p>
        <div
          style={{
            display: 'flex',
            gap: 16,
            flexWrap: 'wrap',
            fontSize: 14,
            color: '#0F172A',
            padding: '10px 16px',
            background: '#F8FAFC',
            borderRadius: 999,
            border: '1px solid #E2E8F0',
          }}
        >
          <strong style={{ color: '#0F172A' }}>{enabledCount}</strong> enabled ·{' '}
          <strong style={{ color: '#0F172A' }}>{disabledCount}</strong> paused
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            background: '#E2E8F0',
            borderRadius: 999,
            padding: 6,
          }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  border: 'none',
                  background: isActive ? '#FFFFFF' : 'transparent',
                  color: isActive ? '#0F172A' : '#475467',
                  padding: '10px 18px',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: 14,
                  cursor: 'pointer',
                  borderRadius: 999,
                  boxShadow: isActive ? '0 6px 16px rgba(15, 23, 42, 0.08)' : 'none',
                }}
              >
                {tab.label}
                <span style={{ marginLeft: 6, fontSize: 12, color: isActive ? '#64748B' : '#94A3B8', fontWeight: 500 }}>
                  ({tab.count})
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', fontSize: 13, textTransform: 'none', letterSpacing: 0.2, color: '#7A6F63' }}>
                <th style={{ padding: '0 0 14px 0' }}>Template</th>
                <th style={{ padding: '0 0 14px 0' }}>Subject</th>
                {activeTab === 'all' && <th style={{ padding: '0 0 14px 0' }}>Audience</th>}
                <th style={{ padding: '0 0 14px 0' }}>Category</th>
                <th style={{ padding: '0 0 14px 0' }}>Trigger</th>
                <th style={{ padding: '0 0 14px 0' }}>Status</th>
                <th style={{ padding: '0 0 14px 0', textAlign: 'right' }}>Enabled</th>
              </tr>
            </thead>
            <tbody>
              {visibleTemplates.map((template, index) => {
                const preview = previewMap[template.slug];
                const subject = preview?.subject ?? getEmailSubject(template.slug);
                const isEnabled = toggles[template.slug] !== false;
                const rowShade = index % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
                const statusBadge = STATUS_BADGES[template.status];
                const canPreview = Boolean(preview?.html);
                return (
                  <tr key={template.slug} style={{ borderTop: '1px solid #E2E8F0', background: rowShade }}>
                    <td style={{ padding: '14px 12px 14px 0' }}>
                      <button
                        type="button"
                        onClick={() => canPreview && handlePreview(template.slug)}
                        disabled={!canPreview}
                        style={{
                          padding: 0,
                          margin: 0,
                          border: 'none',
                          background: 'none',
                          fontWeight: 600,
                          fontSize: 15,
                          color: canPreview ? '#0F172A' : '#94A3B8',
                          cursor: canPreview ? 'pointer' : 'not-allowed',
                          textAlign: 'left',
                        }}
                      >
                        {template.name}
                        {canPreview ? (
                          <span style={{ marginLeft: 8, fontSize: 12, color: '#64748B', fontWeight: 500 }}>
                            · View preview
                          </span>
                        ) : null}
                      </button>
                      <div style={{ fontSize: 12, color: '#94A3B8' }}>{template.slug}</div>
                    </td>
                    <td style={{ padding: '14px 12px', fontSize: 14, color: '#475467' }}>{subject ?? 'Subject TBD'}</td>
                    {activeTab === 'all' && (
                      <td style={{ padding: '14px 12px', fontSize: 14, color: '#475467', textTransform: 'capitalize' }}>
                        {template.audience}
                      </td>
                    )}
                    <td style={{ padding: '14px 12px', fontSize: 13, color: '#475467' }}>{template.category}</td>
                    <td style={{ padding: '14px 12px', fontSize: 13, color: '#475467' }}>{template.trigger}</td>
                    <td style={{ padding: '14px 12px' }}>
                      <span
                        style={{
                          borderRadius: 999,
                          border: `1px solid ${statusBadge.border}`,
                          padding: '4px 12px',
                          fontSize: 11,
                          letterSpacing: 0.3,
                          textTransform: 'uppercase',
                          color: statusBadge.color,
                          background: statusBadge.background,
                        }}
                      >
                        {template.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 0' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          aria-pressed={isEnabled}
                          aria-label={`Toggle ${template.name}`}
                          onClick={() => handleToggle(template.slug)}
                          style={{
                            border: '1px solid rgba(15, 23, 42, 0.08)',
                            width: 44,
                            height: 24,
                            borderRadius: 999,
                            background: isEnabled ? '#0F172A' : '#E2E8F0',
                            position: 'relative',
                            cursor: 'pointer',
                            transition: 'background 150ms ease',
                          }}
                        >
                          <span
                            style={{
                              position: 'absolute',
                              top: 2,
                              left: isEnabled ? 22 : 2,
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              background: '#FFFFFF',
                              boxShadow: '0 4px 10px rgba(15, 23, 42, 0.2)',
                              transition: 'left 150ms ease',
                            }}
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
    </section>
  );
}
