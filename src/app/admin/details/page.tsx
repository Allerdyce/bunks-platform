"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Lock, LogOut, RefreshCw } from "lucide-react";
import { AdminTopNav } from "@/components/admin/AdminTopNav";
import type { OpsDetails, OpsDetailsInput } from "@/lib/opsDetails/config";
import { DEFAULT_OPS_DETAILS } from "@/lib/opsDetails/config";
import { OPS_PRESETS } from "@/data/opsPresets";

const FIELD_GROUPS: {
  title: string;
  description?: string;
  fields: Array<{
    name: keyof OpsDetailsInput;
    label: string;
    type?: "text" | "email" | "tel" | "url";
    placeholder?: string;
    rows?: number;
    helper?: string;
  }>;
}[] = [
  {
    title: "Guest support",
    description: "Primary contact details that surface in guest-facing templates.",
    fields: [
      { name: "supportEmail", label: "Primary support email", type: "email", placeholder: "ali@bunks.com" },
      { name: "supportSmsNumber", label: "SMS / WhatsApp line", type: "tel", placeholder: "+1 (970) 555-0119" },
    ],
  },
  {
    title: "Ops desk & concierge",
    description: "Contacts that appear in ops escalations and admin references.",
    fields: [
      { name: "opsEmail", label: "Ops desk email", type: "email", placeholder: "ops@bunks.com" },
      { name: "opsPhone", label: "Ops desk phone", type: "tel", placeholder: "+1 (970) 555-0124" },
      { name: "opsDeskPhone", label: "Dispatch line", type: "tel", placeholder: "+1 (970) 555-0101" },
      { name: "opsDeskHours", label: "Ops desk hours", type: "text", placeholder: "07:00–22:00 MT" },
      { name: "conciergeName", label: "Concierge contact", type: "text", placeholder: "Priya" },
      { name: "conciergeContact", label: "Concierge channel", type: "text", placeholder: "Slack #host-support" },
      {
        name: "conciergeNotes",
        label: "Concierge notes",
        type: "text",
        placeholder: "VIP guest escalations",
        rows: 2,
      },
    ],
  },
  {
    title: "Emergency",
    description: "Displayed in every guest journey email footer.",
    fields: [
      { name: "emergencyContact", label: "Emergency contact", type: "text", placeholder: "911" },
      { name: "emergencyDetails", label: "Emergency instructions", type: "text", placeholder: "Share property code 8821" },
    ],
  },
  {
    title: "Standard timing",
    description: "Defaults for check-in/out copy everywhere.",
    fields: [
      { name: "checkInWindow", label: "Check-in window", type: "text", placeholder: "Check-in after 16:00" },
      { name: "checkOutTime", label: "Checkout timing", type: "text", placeholder: "Checkout by 10:00" },
    ],
  },
  {
    title: "Reference links",
    description: "Surface these across welcome + reminder emails.",
    fields: [
      { name: "doorCodesDocUrl", label: "Door codes & arrival notes", type: "url", placeholder: "https://" },
      { name: "arrivalNotesUrl", label: "Arrival overview doc", type: "url", placeholder: "https://" },
      { name: "liveInstructionsUrl", label: "Live instructions", type: "url", placeholder: "https://" },
      { name: "recommendationsUrl", label: "Recommendations guide", type: "url", placeholder: "https://" },
      { name: "guestBookUrl", label: "Global guest book", type: "url", placeholder: "https://" },
    ],
  },
];

const toFormState = (details?: OpsDetails | null): OpsDetailsInput => ({
  ...DEFAULT_OPS_DETAILS,
  ...details,
});

export default function AdminOpsDetailsPage() {
  const [authState, setAuthState] = useState<"checking" | "unauthenticated" | "authenticated">("checking");
  const [email, setEmail] = useState("ali@bunks.com");
  const [password, setPassword] = useState("PMbunks101!");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [form, setForm] = useState<OpsDetailsInput>(DEFAULT_OPS_DETAILS);
  const [initialForm, setInitialForm] = useState<OpsDetailsInput>(DEFAULT_OPS_DETAILS);
  const [metadata, setMetadata] = useState<{ updatedAt?: string | null }>({});
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPresetSlug, setSelectedPresetSlug] = useState(() => OPS_PRESETS[0]?.slug ?? "");
  const selectedPreset = useMemo(
    () => OPS_PRESETS.find((preset) => preset.slug === selectedPresetSlug) ?? OPS_PRESETS[0],
    [selectedPresetSlug],
  );

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const res = await fetch("/api/admin/session", { credentials: "include" });
        if (!res.ok) {
          setAuthState("unauthenticated");
          return;
        }
        setAuthState("authenticated");
        await loadDetails();
      } catch (err) {
        console.error("Failed to bootstrap admin session", err);
        setAuthState("unauthenticated");
      }
    };

    bootstrap();
  }, []);

  const loadDetails = async () => {
    setFetching(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/ops-details", { credentials: "include" });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error((payload as { error?: string }).error ?? "Failed to load ops details");
      }
      const data = (await res.json()) as { details: OpsDetails };
      const nextForm = toFormState(data.details);
      setForm(nextForm);
      setInitialForm(nextForm);
      setMetadata({ updatedAt: data.details.updatedAt });
    } catch (err) {
      console.error(err);
      setError((err as Error)?.message ?? "Failed to load ops details");
    } finally {
      setFetching(false);
    }
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error((payload as { error?: string }).error ?? "Invalid credentials");
      }
      setAuthState("authenticated");
      await loadDetails();
    } catch (err) {
      setAuthState("unauthenticated");
      setError((err as Error)?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    setAuthState("unauthenticated");
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDetails();
    setRefreshing(false);
  };

  const handlePresetChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPresetSlug(event.target.value);
  };

  const applyPreset = (mode: "missing" | "all") => {
    if (!selectedPreset) {
      return;
    }

    setForm((current) => {
      const next = { ...current } as OpsDetailsInput;
      (Object.entries(selectedPreset.defaults) as Array<[
        keyof OpsDetailsInput,
        OpsDetailsInput[keyof OpsDetailsInput] | null | undefined,
      ]>).forEach(([field, value]) => {
        if (typeof value === "undefined" || value === null) {
          return;
        }

        const existing = next[field];
        if (mode === "missing" && typeof existing === "string" && existing.trim().length > 0) {
          return;
        }

        next[field] = value as OpsDetailsInput[keyof OpsDetailsInput];
      });
      return next;
    });
    setStatus(null);
  };

  const handleFieldChange = (name: keyof OpsDetailsInput, value: string) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleReset = () => {
    setForm({ ...initialForm });
    setStatus(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setStatus(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/ops-details", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error((payload as { error?: string }).error ?? "Failed to save details");
      }
      const data = (await res.json()) as { details: OpsDetails };
      const nextForm = toFormState(data.details);
      setForm(nextForm);
      setInitialForm(nextForm);
      setMetadata({ updatedAt: data.details.updatedAt });
      setStatus({ type: "success", text: "Ops details updated" });
    } catch (err) {
      console.error(err);
      setStatus({ type: "error", text: (err as Error)?.message ?? "Failed to save details" });
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = useMemo(() => JSON.stringify(form) !== JSON.stringify(initialForm), [form, initialForm]);

  if (authState !== "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-700">
              <Lock className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-serif text-slate-900">Ops details console</h1>
            <p className="text-sm text-slate-500">Manage the contact info reused across every email.</p>
          </div>
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}
          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 focus:border-slate-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 focus:border-slate-500 focus:outline-none"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-slate-900 text-white py-3 font-medium hover:bg-slate-800 transition"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <AdminTopNav
        active="details"
        title="Ops reference data"
        subtitle="Centralize guest support contacts, concierge info, and reference links once."
        actions={
          <>
            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:border-slate-400"
              disabled={fetching || refreshing}
            >
              {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Refresh
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </>
        }
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        {OPS_PRESETS.length > 0 && (
          <section className="rounded-3xl border border-slate-200 bg-white shadow-sm p-6 space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Property presets</p>
                <h2 className="mt-2 text-2xl font-serif text-slate-900">Apply property-specific links & codes</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Select a property to surface the operational data we already store (guest guide URLs, host contacts,
                  Wi-Fi, and door codes). You can drop these directly into the global ops fields below.
                </p>
              </div>
              <div className="flex w-full flex-col gap-2 md:w-72">
                <label className="text-sm font-medium text-slate-700">Property</label>
                <select
                  value={selectedPresetSlug ?? ""}
                  onChange={handlePresetChange}
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-violet-500 focus:outline-none"
                >
                  {OPS_PRESETS.map((preset) => (
                    <option key={preset.slug} value={preset.slug}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedPreset && (
              <div className="space-y-5">
                {selectedPreset.description && (
                  <p className="text-sm text-slate-500">{selectedPreset.description}</p>
                )}
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => applyPreset("missing")}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400"
                  >
                    Fill empty fields with this preset
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset("all")}
                    className="inline-flex items-center gap-2 rounded-2xl border border-violet-200 px-4 py-2 text-sm font-semibold text-violet-700 hover:border-violet-400"
                  >
                    Overwrite with preset values
                  </button>
                </div>

                {selectedPreset.essentials.length > 0 && (
                  <div className="grid gap-4 md:grid-cols-2">
                    {selectedPreset.essentials.map((item) => (
                      <div key={item.label} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{item.label}</p>
                        <p className="mt-2 font-serif text-xl text-slate-900">{item.value}</p>
                        {item.helper && <p className="mt-1 text-sm text-slate-500">{item.helper}</p>}
                      </div>
                    ))}
                  </div>
                )}

                {selectedPreset.quickLinks.length > 0 && (
                  <div className="flex flex-wrap gap-3">
                    {selectedPreset.quickLinks.map((link) => (
                      <a
                        key={link.href}
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:border-slate-400"
                      >
                        <div className="flex flex-col text-left">
                          <span className="font-semibold text-slate-900">{link.label}</span>
                          {link.description && <span className="text-xs text-slate-500">{link.description}</span>}
                        </div>
                        <span className="text-slate-400">↗</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Global system data</p>
            <h2 className="mt-2 text-2xl font-serif text-slate-900">Keep every email in sync</h2>
            <p className="mt-1 text-sm text-slate-500">
              Update once and these values flow into booking confirmations, reminders, and host notifications.
            </p>
            {metadata.updatedAt && (
              <p className="mt-2 text-xs text-slate-400">Last updated {new Date(metadata.updatedAt).toLocaleString()}</p>
            )}
          </div>

          <form className="p-6 space-y-8" onSubmit={handleSubmit}>
            {FIELD_GROUPS.map((group) => (
              <div key={group.title} className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{group.title}</h3>
                  {group.description && <p className="text-sm text-slate-500">{group.description}</p>}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {group.fields.map((field) => {
                    const value = form[field.name] ?? "";
                    const isTextArea = (field.rows ?? 0) > 1;
                    const presetValue = (selectedPreset?.defaults?.[field.name] ?? null) as string | null;
                    return (
                      <label key={field.name as string} className="flex flex-col gap-1 text-sm text-slate-600">
                        <span className="font-medium text-slate-800">{field.label}</span>
                        {isTextArea ? (
                          <textarea
                            rows={field.rows}
                            value={value}
                            placeholder={field.placeholder}
                            onChange={(event) => handleFieldChange(field.name, event.target.value)}
                            className="rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 shadow-sm focus:border-violet-500 focus:outline-none"
                          />
                        ) : (
                          <input
                            type={field.type ?? "text"}
                            value={value}
                            placeholder={field.placeholder}
                            onChange={(event) => handleFieldChange(field.name, event.target.value)}
                            className="rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 shadow-sm focus:border-violet-500 focus:outline-none"
                          />
                        )}
                        {field.helper && <span className="text-xs text-slate-400">{field.helper}</span>}
                        {presetValue && presetValue !== value && (
                          <div className="mt-1 flex items-center justify-between gap-2 text-xs text-slate-400">
                            <span className="truncate">Preset: {presetValue}</span>
                            <button
                              type="button"
                              className="shrink-0 text-violet-600 hover:text-violet-500"
                              onClick={() => handleFieldChange(field.name, presetValue)}
                            >
                              Use preset
                            </button>
                          </div>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={saving || !hasChanges}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Save changes
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:border-slate-400 disabled:opacity-60"
                  disabled={!hasChanges || saving}
                >
                  Reset
                </button>
              </div>
              {status && (
                <div
                  className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium ${
                    status.type === "success"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {status.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {status.text}
                </div>
              )}
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
