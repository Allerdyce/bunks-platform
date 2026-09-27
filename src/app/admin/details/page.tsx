"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Loader2,
  LogOut,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { AdminTopNav } from "@/components/admin/AdminTopNav";
import type { OpsDetails, OpsDetailsInput } from "@/lib/opsDetails/config";
import { DEFAULT_OPS_DETAILS } from "@/lib/opsDetails/config";

type AdminProperty = {
  id: number;
  name: string;
  slug: string;
};

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
    description:
      "Primary contact details that surface in guest-facing templates.",
    fields: [
      {
        name: "supportEmail",
        label: "Primary support email",
        type: "email",
        placeholder: "alissa@bunks.com",
      },
      {
        name: "supportSmsNumber",
        label: "SMS / WhatsApp line",
        type: "tel",
        placeholder: "+1 (970) 555-0119",
      },
    ],
  },
  {
    title: "Ops desk & concierge",
    description:
      "Contacts that appear in ops escalations and admin references.",
    fields: [
      {
        name: "opsEmail",
        label: "Ops desk email",
        type: "email",
        placeholder: "alissa@bunks.com",
      },
      {
        name: "opsPhone",
        label: "Ops desk phone",
        type: "tel",
        placeholder: "+1 (970) 555-0124",
      },
      {
        name: "opsDeskPhone",
        label: "Dispatch line",
        type: "tel",
        placeholder: "+1 (970) 555-0101",
      },
      {
        name: "opsDeskHours",
        label: "Ops desk hours",
        type: "text",
        placeholder: "07:00–22:00 MT",
      },
      {
        name: "conciergeName",
        label: "Concierge contact",
        type: "text",
        placeholder: "Priya",
      },
      {
        name: "conciergeContact",
        label: "Concierge channel",
        type: "text",
        placeholder: "Slack #host-support",
      },
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
      {
        name: "emergencyContact",
        label: "Emergency contact",
        type: "text",
        placeholder: "911",
      },
      {
        name: "emergencyDetails",
        label: "Emergency instructions",
        type: "text",
        placeholder: "Share property code 8821",
      },
    ],
  },
  {
    title: "Standard timing",
    description: "Defaults for check-in/out copy everywhere.",
    fields: [
      {
        name: "checkInWindow",
        label: "Check-in window",
        type: "text",
        placeholder: "Check-in after 16:00",
      },
      {
        name: "checkOutTime",
        label: "Checkout timing",
        type: "text",
        placeholder: "Checkout by 10:00",
      },
    ],
  },
  {
    title: "Reference links",
    description: "Surface these across welcome + reminder emails.",
    fields: [
      {
        name: "doorCodesDocUrl",
        label: "Door codes & arrival notes",
        type: "url",
        placeholder: "https://",
        helper:
          "Feeds the 'Door codes & arrival notes' link in guest welcome + reminder emails.",
      },
      {
        name: "arrivalNotesUrl",
        label: "Arrival overview doc",
        type: "url",
        placeholder: "https://",
        helper:
          "Used for the 'Arrival overview' CTA (route tips, parking, contingencies).",
      },
      {
        name: "liveInstructionsUrl",
        label: "Live instructions",
        type: "url",
        placeholder: "https://",
        helper:
          "Primary 'Open live instructions' link with smart lock, parking, and Wi-Fi steps.",
      },
      {
        name: "recommendationsUrl",
        label: "Recommendations guide",
        type: "url",
        placeholder: "https://",
        helper: "Appears as 'Browse recommendations' in guest communications.",
      },
      {
        name: "guestBookUrl",
        label: "Global guest book",
        type: "url",
        placeholder: "https://",
        helper:
          "Supplies the 'Open the guest book' link (FAQs, itineraries, and local intel).",
      },
    ],
  },
];

const toFormState = (details?: OpsDetails | null): OpsDetailsInput => ({
  ...DEFAULT_OPS_DETAILS,
  ...details,
});

export default function AdminOpsDetailsPage() {
  const [authState, setAuthState] = useState<
    "checking" | "unauthenticated" | "authenticated"
  >("checking");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [form, setForm] = useState<OpsDetailsInput>(DEFAULT_OPS_DETAILS);
  const [initialForm, setInitialForm] =
    useState<OpsDetailsInput>(DEFAULT_OPS_DETAILS);
  const [metadata, setMetadata] = useState<{ updatedAt?: string | null }>({});
  const [refreshing, setRefreshing] = useState(false);

  const [properties, setProperties] = useState<AdminProperty[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<
    number | "global"
  >("global");

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const res = await fetch("/api/admin/session", {
          credentials: "include",
        });
        if (!res.ok) {
          setAuthState("unauthenticated");
          return;
        }
        setAuthState("authenticated");

        // Load properties in parallel
        void fetchProperties();
        await loadDetails("global");
      } catch (err) {
        console.error("Failed to bootstrap admin session", err);
        setAuthState("unauthenticated");
      }
    };

    bootstrap();
  }, []);

  const fetchProperties = async () => {
    try {
      const res = await fetch("/api/admin/properties", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setProperties(data.properties ?? []);
      }
    } catch (err) {
      console.error("Failed to load properties", err);
    }
  };

  const loadDetails = async (propertyId: number | "global") => {
    setFetching(true);
    setError(null);
    setStatus(null);
    try {
      const queryString =
        propertyId === "global" ? "" : `?propertyId=${propertyId}`;
      const res = await fetch(`/api/admin/ops-details${queryString}`, {
        credentials: "include",
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(
          (payload as { error?: string }).error ?? "Failed to load ops details",
        );
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

  const handlePropertyChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const value = event.target.value;
    const nextId = value === "global" ? "global" : parseInt(value, 10);
    setSelectedPropertyId(nextId);
    void loadDetails(nextId);
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
        throw new Error(
          (payload as { error?: string }).error ?? "Invalid credentials",
        );
      }
      setAuthState("authenticated");
      void fetchProperties();
      await loadDetails(selectedPropertyId);
    } catch (err) {
      setAuthState("unauthenticated");
      setError((err as Error)?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", {
      method: "POST",
      credentials: "include",
    });
    setAuthState("unauthenticated");
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDetails(selectedPropertyId);
    setRefreshing(false);
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
      const payload = {
        ...form,
        propertyId:
          selectedPropertyId === "global" ? undefined : selectedPropertyId,
      };

      const res = await fetch("/api/admin/ops-details", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(
          (payload as { error?: string }).error ?? "Failed to save details",
        );
      }
      const data = (await res.json()) as { details: OpsDetails };
      const nextForm = toFormState(data.details);
      setForm(nextForm);
      setInitialForm(nextForm);
      setMetadata({ updatedAt: data.details.updatedAt });
      setStatus({ type: "success", text: "Ops details updated" });
    } catch (err) {
      console.error(err);
      setStatus({
        type: "error",
        text: (err as Error)?.message ?? "Failed to save details",
      });
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(initialForm),
    [form, initialForm],
  );

  if (authState !== "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-xl border border-gray-200 p-8 sm:p-10 space-y-6">
          <div className="text-center space-y-4">
            <Link
              href="/"
              className="inline-flex mb-4 grayscale"
              aria-label="Bunks home"
            >
              <Image
                src="/bunks-logo.svg"
                alt="Bunks"
                width={120}
                height={36}
              />
            </Link>

            <h1 className="page-title   text-gray-900">Welcome back.</h1>
            <p className="text-sm text-gray-500">
              Manage the contact info reused across every email.
            </p>
          </div>
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}
          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                aria-label="Email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-gray-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                aria-label="Password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-gray-500 focus:outline-none"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-full bg-gray-900 text-white py-3 font-medium hover:bg-gray-800 transition"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const DetailsPageActions = () => (
    <>
      <button
        onClick={handleRefresh}
        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:border-gray-400"
        disabled={fetching || refreshing}
      >
        {refreshing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <RefreshCw className="w-4 h-4" />
        )}
        Refresh
      </button>
      <button
        onClick={handleLogout}
        className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
      >
        <LogOut className="w-4 h-4" /> Logout
      </button>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <AdminTopNav active="details" actions={<DetailsPageActions />} />

      <main className="w-full px-6 lg:px-12 mt-8">
        {error && (
          <div className="mb-8 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          {/* LEFT COL: Header & Context */}
          <div className="space-y-6 lg:col-span-4 lg:sticky lg:top-24">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                Bunks Ops
              </p>
              <h1 className="page-title   text-gray-900 mt-1">
                Details that make a stay.
              </h1>
              <p className="text-sm text-gray-500">
                Centralize guest support contacts, concierge info, and reference
                links once.
              </p>
            </div>

            {/* Property Selector */}
            <div className="pt-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                Scope
              </label>
              <div className="mt-2 relative">
                <select
                  value={selectedPropertyId}
                  onChange={handlePropertyChange}
                  className="w-full appearance-none rounded-xl border border-gray-300 bg-white py-3 pl-4 pr-10 text-sm font-medium text-gray-900  focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
                >
                  <option value="global">Global (Default)</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.slug})
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                  <ChevronDown className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                {selectedPropertyId === "global"
                  ? "Editing default values for all properties."
                  : "Editing overrides for this specific property."}
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white border border-gray-200  space-y-4">
              <div>
                <h3 className="font-sans font-semibold text-lg text-gray-900">
                  Keep every email in sync
                </h3>
                <p className="mt-1 text-sm text-gray-500 leading-relaxed">
                  Update once and these values flow into booking confirmations,
                  reminders, and host notifications.
                </p>
              </div>
              {metadata.updatedAt && (
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Last updated {new Date(metadata.updatedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COL: Form */}
          <div className="lg:col-span-8">
            <form
              className="space-y-8 bg-white rounded-xl border border-gray-200  p-6 sm:p-8"
              onSubmit={handleSubmit}
            >
              {FIELD_GROUPS.map((group) => (
                <div key={group.title} className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {group.title}
                    </h3>
                    {group.description && (
                      <p className="text-sm text-gray-500">
                        {group.description}
                      </p>
                    )}
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {group.fields.map((field) => {
                      const value = form[field.name] ?? "";
                      const isTextArea = (field.rows ?? 0) > 1;
                      return (
                        <label
                          key={field.name as string}
                          className="flex flex-col gap-1 text-sm text-gray-600"
                        >
                          <span className="font-medium text-gray-800">
                            {field.label}
                          </span>
                          {isTextArea ? (
                            <textarea
                              rows={field.rows}
                              value={value}
                              placeholder={field.placeholder}
                              onChange={(event) =>
                                handleFieldChange(
                                  field.name,
                                  event.target.value,
                                )
                              }
                              className="rounded-xl border border-gray-200 px-4 py-3 text-gray-900  focus:border-gray-500 focus:outline-none"
                            />
                          ) : (
                            <input
                              type={field.type ?? "text"}
                              value={value}
                              placeholder={field.placeholder}
                              onChange={(event) =>
                                handleFieldChange(
                                  field.name,
                                  event.target.value,
                                )
                              }
                              className="rounded-xl border border-gray-200 px-4 py-3 text-gray-900  focus:border-gray-500 focus:outline-none"
                            />
                          )}
                          {field.helper && (
                            <span className="text-xs text-gray-500">
                              {field.helper}
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="flex flex-col gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white  hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={saving || !hasChanges}
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    Save changes
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 hover:border-gray-400 disabled:opacity-60"
                    disabled={!hasChanges || saving}
                  >
                    Reset
                  </button>
                </div>
                {status && (
                  <div
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium ${
                      status.type === "success"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-red-50 text-red-600"
                    }`}
                  >
                    {status.type === "success" ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                    {status.text}
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
