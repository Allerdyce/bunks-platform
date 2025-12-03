'use client';

import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import type { EmailAudience } from '@/lib/email/catalog';
import { getEmailSubject } from '@/lib/email/subjects';
import type { TemplatePreview } from './types';
import { STATUS_STYLES } from './statusStyles';

const cardStyle: CSSProperties = {
  border: '1px solid #EAECF0',
  borderRadius: 16,
  padding: 24,
  background: '#fff',
  boxShadow: '0 1px 2px rgba(16, 24, 40, 0.06)',
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
};

type TabId = 'all' | EmailAudience;

const TAB_COPY: Record<Exclude<TabId, 'all'>, { label: string }> = {
  guest: {
    label: 'Guest Journey',
  },
  host: {
    label: 'Host & Ops',
  },
  system: {
    label: 'System Alerts',
  },
};

interface PreviewTabsProps {
  previews: TemplatePreview[];
}

export function PreviewTabs({ previews }: PreviewTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('all');

  const audienceCounts = useMemo(() => {
    return previews.reduce<Record<EmailAudience, number>>(
      (acc, preview) => {
        acc[preview.spec.audience] += 1;
        return acc;
      },
      { guest: 0, host: 0, system: 0 },
    );
  }, [previews]);

  const tabs = useMemo(() => {
    const list = [
      {
        id: 'all' as const,
        label: 'All templates',
        count: previews.length,
      },
      ...(['guest', 'host', 'system'] as EmailAudience[]).map((audience) => ({
        id: audience,
        label: TAB_COPY[audience].label,
        count: audienceCounts[audience],
      })),
    ];
    return list as { id: TabId; label: string; count: number }[];
  }, [audienceCounts, previews.length]);

  const filteredPreviews = useMemo(() => {
    return activeTab === 'all'
      ? previews
      : previews.filter((preview) => preview.spec.audience === activeTab);
  }, [activeTab, previews]);

  const groupedCategories = useMemo(() => {
    const order: string[] = [];
    const map = new Map<string, TemplatePreview[]>();

    filteredPreviews.forEach((preview) => {
      const category = preview.spec.category;
      if (!map.has(category)) {
        map.set(category, []);
        order.push(category);
      }
      map.get(category)!.push(preview);
    });

    return order.map((key) => [key, map.get(key)!] as [string, TemplatePreview[]]);
  }, [filteredPreviews]);

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, borderBottom: '1px solid #E4E7EC' }}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                border: 'none',
                background: 'transparent',
                color: isActive ? '#7F56D9' : '#667085',
                padding: '12px 16px',
                fontWeight: 600,
                fontSize: 14,
                position: 'relative',
                cursor: 'pointer',
                borderBottom: isActive ? '3px solid #7F56D9' : '3px solid transparent',
              }}
            >
              {tab.label}
              <span style={{ marginLeft: 6, fontSize: 12, color: isActive ? '#7F56D9' : '#98A2B3', fontWeight: 500 }}>
                ({tab.count})
              </span>
            </button>
          );
        })}
      </div>

      {!groupedCategories.length ? (
        <div style={{ border: '1px dashed #D0D5DD', borderRadius: 16, padding: 24, background: '#FFF' }}>
          <p style={{ margin: 0, fontWeight: 600, color: '#101828' }}>No templates for this audience yet</p>
          <p style={{ margin: '4px 0 0 0', color: '#667085', fontSize: 14 }}>
            Add entries to <code style={{ background: '#EEF2FF', padding: '1px 4px', borderRadius: 4 }}>EMAIL_TEMPLATES</code> to surface
            previews here.
          </p>
        </div>
      ) : (
        groupedCategories.map(([category, categoryPreviews]) => (
          <section key={category} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <div>
                <p style={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: 12, color: '#7F56D9', margin: 0 }}>{category}</p>
                <h2 style={{ margin: 0, fontSize: 24, color: '#101828' }}>{category}</h2>
              </div>
              <span style={{ fontSize: 13, color: '#667085' }}>
                {categoryPreviews.length} template{categoryPreviews.length === 1 ? '' : 's'}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {categoryPreviews.map(({ spec, html }) => {
                const statusStyle = STATUS_STYLES[spec.status];
                const hasPreview = Boolean(html);
                const subject = getEmailSubject(spec.slug);
                return (
                  <article id={`template-${spec.slug}`} key={spec.slug} style={cardStyle}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: 22, margin: 0, color: '#101828' }}>{spec.name}</h3>
                        <span
                          style={{
                            border: `1px solid ${statusStyle.border}`,
                            background: statusStyle.background,
                            color: statusStyle.color,
                            borderRadius: 999,
                            padding: '2px 10px',
                            fontSize: 12,
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                          }}
                        >
                          {statusStyle.label}
                        </span>
                      </div>
                      <p style={{ color: '#475467', margin: 0 }}>{spec.description}</p>
                      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: '#475467' }}>
                        <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <strong style={{ color: '#101828' }}>Audience:</strong> {spec.audience}
                        </span>
                        <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <strong style={{ color: '#101828' }}>Trigger:</strong> {spec.trigger}
                        </span>
                        <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <strong style={{ color: '#101828' }}>Subject:</strong>{' '}
                          <code style={{ background: '#F4EBFF', padding: '1px 6px', borderRadius: 4 }}>{subject ?? 'Subject TBD'}</code>
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#98A2B3' }}>
                        <span>
                          Template:{' '}
                          {spec.templatePath ? (
                            <code style={{ background: '#EEF2FF', padding: '1px 6px', borderRadius: 4 }}>{spec.templatePath}</code>
                          ) : (
                            '—'
                          )}
                        </span>
                        <span>
                          Service:{' '}
                          {spec.serviceFunction ? (
                            <code style={{ background: '#EEF2FF', padding: '1px 6px', borderRadius: 4 }}>{spec.serviceFunction}</code>
                          ) : (
                            '—'
                          )}
                        </span>
                      </div>
                    </div>
                    {hasPreview ? (
                      <div style={{ border: '1px solid #EAECF0', borderRadius: 12, overflow: 'hidden' }}>
                        <iframe
                          title={`${spec.name} preview`}
                          srcDoc={html ?? undefined}
                          style={{ width: '100%', height: 740, border: 'none', background: 'white' }}
                        />
                      </div>
                    ) : (
                      <div
                        style={{
                          border: '1px dashed #D0D5DD',
                          borderRadius: 12,
                          padding: 24,
                          background: '#FCFCFD',
                          color: '#475467',
                        }}
                      >
                        <p style={{ margin: 0, fontWeight: 600 }}>Preview coming soon</p>
                        <p style={{ margin: '4px 0 0 0', fontSize: 14 }}>
                          Hook up <code style={{ background: '#EEF2FF', padding: '1px 4px', borderRadius: 4 }}>{spec.slug}</code> to a React
                          Email template and sample data to surface the rendered output here.
                        </p>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        ))
      )}
    </section>
  );
}
