"use client";

import { useMemo, useState } from "react";
import type { EmailTemplateSpec } from "@/lib/email/catalog";
import { getEmailSubject } from "@/lib/email/subjects";
import type { TemplatePreview } from "./types";
import { EmailPreviewModal } from "./EmailPreviewModal";
import type { EmailDeliveryState } from "@/lib/email/deliverySettings";

const AUDIENCE_ORDER: EmailTemplateSpec["audience"][] = [
  "guest",
  "host",
];
const AUDIENCE_META: Record<
  EmailTemplateSpec["audience"],
  { label: string; description: string; accent: string }
> = {
  guest: {
    label: "Guest journey",
    description: "Booking flow, pre-stay, onsite, and post-stay comms.",
    accent: "#7F56D9",
  },
  host: {
    label: "Host + Ops",
    description: "Operational alerts that keep partners in sync.",
    accent: "#F63D68",
  },
};
type ToggleTab = "all" | EmailTemplateSpec["audience"];

export type TemplateControl = Pick<
  EmailTemplateSpec,
  "slug" | "name" | "audience" | "status" | "trigger" | "category"
> & { delivery: EmailDeliveryState };

interface TemplateControlsProps {
  templates: TemplateControl[];
  previewMap: Record<string, TemplatePreview | undefined>;
}

export function TemplateControls({
  templates,
  previewMap,
}: TemplateControlsProps) {
  const [activeTab, setActiveTab] = useState<ToggleTab>("guest");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  const sendingCount = templates.filter((template) => template.delivery === "sending").length;
  const pausedCount = templates.length - sendingCount;

  const tabMap = useMemo(() => {
    const base: Record<ToggleTab, TemplateControl[]> = {
      all: [],
      guest: [],
      host: [],
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
        <section className="rounded-xl border border-gray-200 bg-white p-6 ">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-600">
            Email System
          </p>
          <h2 className="mt-3 text-xl font-semibold text-gray-900">
            Messages for every stay
          </h2>
          <p className="mt-2 text-sm text-gray-600 leading-relaxed">
            The {templates.length} emails the app sends automatically. Click a
            name to preview it. Paused emails are switched off in code; ask
            your developer to turn one back on.
          </p>
        </section>

        {/* Filters & Toggles Card */}
        <section className="rounded-xl border border-gray-200 bg-white p-6  space-y-6">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">
              Delivery
            </h2>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <span className="flex h-2 w-2 rounded-full bg-gray-900"></span>
                <span className="font-medium text-gray-900">
                  {sendingCount}
                </span>
                <span className="text-gray-500">sending</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="flex h-2 w-2 rounded-full bg-gray-200"></span>
                <span className="font-medium text-gray-900">
                  {pausedCount}
                </span>
                <span className="text-gray-500">paused</span>
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
                  className={`group flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-gray-900 text-white shadow-md"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
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
      <div className="rounded-xl border border-gray-200 bg-white  overflow-hidden lg:col-span-8">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                <th className="px-6 py-4">Template</th>
                {activeTab === "all" && <th className="px-6 py-4">Audience</th>}
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Trigger</th>
                <th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {visibleTemplates.map((template) => {
                const preview = previewMap[template.slug];
                const canPreview = Boolean(preview?.html);

                return (
                  <tr
                    key={template.slug}
                    className="group hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() =>
                          canPreview && handlePreview(template.slug)
                        }
                        disabled={!canPreview}
                        className={`text-left text-sm font-semibold transition ${
                          canPreview
                            ? "text-gray-900 hover:text-gray-600"
                            : "cursor-not-allowed text-gray-500"
                        }`}
                      >
                        {template.name}
                      </button>
                      <div className="mt-0.5 text-xs font-mono text-gray-500">
                        {template.slug}
                      </div>
                    </td>
                    {activeTab === "all" && (
                      <td className="px-6 py-4 text-sm text-gray-600 capitalize">
                        {template.audience}
                      </td>
                    )}
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {template.category}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {template.trigger}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            template.delivery === "sending"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {template.delivery === "sending" ? "Sending" : "Paused"}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedPreview ? (
        <EmailPreviewModal preview={selectedPreview} onClose={closePreview} />
      ) : null}
    </div>
  );
}
