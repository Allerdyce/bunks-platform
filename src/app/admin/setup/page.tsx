"use client";

import { PROPERTY_GUIDE_FILES, type GuideKind } from "@/data/guides";
import { useCallback, useEffect, useState } from "react";
import { CalendarCheck } from "@/components/admin/CalendarCheck";
import { AdminTopNav } from "@/components/admin/AdminTopNav";
import { AdminCheckingShell } from "@/components/admin/AdminCheckingShell";
import { Button } from "@/components/shared/Button";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Lock,
  LogOut,
  RefreshCw,
  Save,
} from "lucide-react";

type AuthState = "checking" | "unauthenticated" | "authenticated";

type TaxRow = {
  name: string;
  ratePercent: number;
  appliesTo: ("nightly" | "cleaning" | "service")[];
};

type PropertySettings = {
  id: number;
  name: string;
  slug: string;
  airbnbIcalUrl: string;
  airbnbImportConfigured: boolean;
  upcomingAirbnbNights: number;
  maxGuests: number;
  timezone: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  hostSupportEmail: string | null;
  wifiSsid: string | null;
  wifiPassword: string | null;
  garageCode: string | null;
  lockboxCode: string | null;
  skiLockerDoorCode: string | null;
  skiLockerNumber: string | null;
  skiLockerCode: string | null;
  taxes: TaxRow[];
};

const TIMEZONES = [
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
];

const TEXT_FIELDS: {
  key: keyof PropertySettings;
  label: string;
  placeholder?: string;
}[] = [
  { key: "checkInTime", label: "Check-in time", placeholder: "3:00 PM (used if left blank)" },
  { key: "checkOutTime", label: "Check-out time", placeholder: "10:00 AM (used if left blank)" },
  {
    key: "hostSupportEmail",
    label: "Guest support email",
    placeholder: "alissa@bunks.com",
  },
  { key: "wifiSsid", label: "Wi-Fi network" },
  { key: "wifiPassword", label: "Wi-Fi password" },
  { key: "lockboxCode", label: "Door / lockbox code" },
  { key: "garageCode", label: "Garage code" },
  { key: "skiLockerDoorCode", label: "Ski locker door code" },
  { key: "skiLockerNumber", label: "Ski locker number" },
  { key: "skiLockerCode", label: "Ski locker code" },
];

const inputClass =
  "mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none";

function PropertySetupCard({
  initial,
  onSaved,
}: {
  initial: PropertySettings;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<PropertySettings>(initial);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const set = <K extends keyof PropertySettings>(
    key: K,
    value: PropertySettings[K],
  ) => setForm((current) => ({ ...current, [key]: value }));

  const tax = form.taxes[0];
  const setTax = (next: TaxRow | null) => set("taxes", next ? [next] : []);

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/admin/properties/${form.id}/settings`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          airbnbIcalUrl: form.airbnbIcalUrl ?? "",
          maxGuests: Number(form.maxGuests),
          timezone: form.timezone,
          ...Object.fromEntries(
            TEXT_FIELDS.map(({ key }) => [
              key,
              (form[key] as string | null) ?? "",
            ]),
          ),
          taxes: form.taxes,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error((data as { error?: string }).error || "Save failed");
      setStatus({ type: "success", text: "Saved" });
      onSaved();
      // A new or changed Airbnb link is imported straight away, so any problem shows up now.
      if ((form.airbnbIcalUrl ?? "").trim() && (form.airbnbIcalUrl ?? "") !== (initial.airbnbIcalUrl ?? "")) {
        setSaving(false);
        await handleSync();
        return;
      }
    } catch (err) {
      setStatus({ type: "error", text: (err as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async (allowEmpty = false) => {
    setSyncing(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/properties/${form.slug}/sync-ical`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allowEmpty }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        nights?: number;
        reason?: string;
      };
      if (res.status === 409 && data.reason === "EMPTY_FEED" && !allowEmpty) {
        const confirmed = window.confirm(
          "Airbnb's calendar now shows no upcoming reservations, but Bunks still has upcoming Airbnb nights blocked.\n\n" +
            "If you've checked Airbnb and it really has no upcoming reservations, press OK to clear them. Otherwise press Cancel.",
        );
        if (confirmed) {
          setSyncing(false);
          return handleSync(true);
        }
        throw new Error("Kept the existing Airbnb blocks.");
      }
      if (!res.ok) throw new Error(data.error || data.reason || "Sync failed");
      setStatus({
        type: "success",
        text: `Airbnb calendar synced: ${data.nights ?? 0} booked nights`,
      });
      onSaved();
    } catch (err) {
      setStatus({ type: "error", text: (err as Error).message });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{form.name}</h2>
        <p className="text-xs text-gray-500">{form.slug}</p>
        {PROPERTY_GUIDE_FILES[form.slug] && (
          <p className="mt-2 text-sm text-gray-600">
            Guest guides (paid guests get these on their trip page):{" "}
            {(Object.keys(PROPERTY_GUIDE_FILES[form.slug]) as GuideKind[]).map((kind, index) => (
              <span key={kind}>
                {index > 0 && " · "}
                <a
                  href={`/api/guides/${form.slug}/${kind}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  {kind === "brochure" ? "Brochure" : "Guide"} (PDF)
                </a>
              </span>
            ))}
          </p>
        )}
      </div>

      <section className="space-y-3">
        <h3 className="text-base font-semibold text-gray-900">Calendar sync</h3>
        <div>
          <label
            className="text-sm font-medium text-gray-700"
            htmlFor={`ical-${form.id}`}
          >
            Calendars to import: every Airbnb listing for this home, plus Vrbo
            or others. One link per line (Airbnb → Calendar → Availability →
            Connect calendars → Export).
          </label>
          <textarea
            id={`ical-${form.id}`}
            value={form.airbnbIcalUrl ?? ""}
            onChange={(e) => set("airbnbIcalUrl", e.target.value)}
            placeholder={"https://www.airbnb.com/calendar/ical/….ics?t=…\nhttps://www.vrbo.com/icalendar/….ics"}
            rows={3}
            className={`${inputClass} font-mono text-xs`}
          />
          <p className="mt-1 text-xs text-gray-500">
            {!initial.airbnbImportConfigured
              ? "Not connected: Airbnb bookings are not being imported."
              : initial.upcomingAirbnbNights > 0
                ? `Connected · ${initial.upcomingAirbnbNights} upcoming Airbnb nights imported`
                : "Link saved, but no upcoming Airbnb nights have been imported. Press “Sync now”: if it shows an error, copy a fresh link from Airbnb."}
          </p>
          {initial.airbnbImportConfigured && (
            <div className="mt-3">
              <CalendarCheck slug={form.slug} />
            </div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            className="text-sm font-medium text-gray-700"
            htmlFor={`guests-${form.id}`}
          >
            Max guests
          </label>
          <input
            id={`guests-${form.id}`}
            type="number"
            min={1}
            value={form.maxGuests}
            onChange={(e) => set("maxGuests", Number(e.target.value))}
            className={inputClass}
          />
        </div>
        <div>
          <label
            className="text-sm font-medium text-gray-700"
            htmlFor={`tz-${form.id}`}
          >
            Timezone
          </label>
          <select
            id={`tz-${form.id}`}
            value={form.timezone}
            onChange={(e) => set("timezone", e.target.value)}
            className={inputClass}
          >
            {!TIMEZONES.includes(form.timezone) && (
              <option value={form.timezone}>{form.timezone} (fix me)</option>
            )}
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>
        {TEXT_FIELDS.map(({ key, label, placeholder }) => (
          <div key={key}>
            <label
              className="text-sm font-medium text-gray-700"
              htmlFor={`${key}-${form.id}`}
            >
              {label}
            </label>
            <input
              id={`${key}-${form.id}`}
              value={(form[key] as string | null) ?? ""}
              placeholder={placeholder}
              onChange={(e) => set(key, e.target.value as never)}
              className={inputClass}
            />
          </div>
        ))}
      </section>
      <p className="text-xs text-gray-500">
        Door and locker codes are shown to paid guests on their trip page from
        24 hours before check-in, and emailed the day before arrival.
      </p>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-gray-900">
          Occupancy tax (direct bookings)
        </h3>
        {tax ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div>
              <label className="text-sm font-medium text-gray-700">Name</label>
              <input
                value={tax.name}
                onChange={(e) => setTax({ ...tax, name: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={tax.ratePercent}
                onChange={(e) =>
                  setTax({ ...tax, ratePercent: Number(e.target.value) })
                }
                className={inputClass}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700 pb-2">
              <input
                type="checkbox"
                checked={tax.appliesTo.includes("cleaning")}
                onChange={(e) =>
                  setTax({
                    ...tax,
                    appliesTo: e.target.checked
                      ? ["nightly", "cleaning"]
                      : ["nightly"],
                  })
                }
              />
              Also tax the cleaning fee
            </label>
            <button
              type="button"
              onClick={() => setTax(null)}
              className="text-left text-xs text-red-600 hover:underline"
            >
              Remove tax
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() =>
              setTax({
                name: "Transient Occupancy Tax",
                ratePercent: 12,
                appliesTo: ["nightly"],
              })
            }
            className="text-sm font-medium text-violet-700 hover:underline"
          >
            + Add occupancy tax
          </button>
        )}
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-2xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}{" "}
          Save
        </button>
        <button
          type="button"
          onClick={() => handleSync()}
          disabled={syncing || !initial.airbnbImportConfigured}
          className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {syncing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}{" "}
          Sync Airbnb now
        </button>
        {status && (
          <span
            className={`inline-flex items-center gap-1 text-sm ${status.type === "success" ? "text-emerald-700" : "text-red-600"}`}
          >
            {status.type === "success" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}{" "}
            {status.text}
          </span>
        )}
      </div>
    </div>
  );
}

export default function AdminSetupPage() {
  const [authState, setAuthState] = useState<AuthState>("checking");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [properties, setProperties] = useState<PropertySettings[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/session", { credentials: "include" })
      .then((res) => setAuthState(res.ok ? "authenticated" : "unauthenticated"))
      .catch(() => setAuthState("unauthenticated"));
  }, []);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const res = await fetch("/api/admin/properties/settings", {
        credentials: "include",
      });
      if (res.status === 401) {
        setAuthState("unauthenticated");
        return;
      }
      const data = (await res.json()) as {
        properties?: PropertySettings[];
        error?: string;
      };
      if (!res.ok || !data.properties)
        throw new Error(data.error || "Failed to load properties");
      setProperties(data.properties);
    } catch (err) {
      setLoadError((err as Error).message);
    }
  }, []);

  useEffect(() => {
    if (authState === "authenticated") void load();
  }, [authState, load]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: loginEmail, password: loginPassword }),
    });
    if (res.ok) {
      setAuthState("authenticated");
    } else {
      const payload = (await res.json().catch(() => ({}))) as {
        error?: string;
      };
      setAuthError(payload.error ?? "Invalid credentials");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", {
      method: "POST",
      credentials: "include",
    });
    setAuthState("unauthenticated");
    setProperties(null);
  };

  if (authState === "checking") {
    return <AdminCheckingShell active="setup" />;
  }

  if (authState !== "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <form
          onSubmit={handleLogin}
          className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-4"
        >
          <div className="text-center space-y-2">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-700">
              <Lock className="w-5 h-5" />
            </div>
            <h1 className="page-title text-gray-900">Property setup</h1>
          </div>
          {authError && <p className="text-sm text-red-600">{authError}</p>}
          <input
            type="email"
            required
            placeholder="Email"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            className={inputClass}
          />
          <input
            type="password"
            required
            placeholder="Password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            className={inputClass}
          />
          <button
            type="submit"
           
            className="w-full rounded-full bg-gray-900 text-white py-3 font-medium hover:bg-gray-800"
          >
            Sign in
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <AdminTopNav
        active="setup"
        actions={
          <Button
            onClick={handleLogout}
            className="inline-flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Logout
          </Button>
        }
      />
      <main className="w-full px-6 lg:px-12 mt-8">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h1 className="page-title text-gray-900">Property setup</h1>
            <p className="text-sm text-gray-500">
              Calendar sync, access codes, guest limits and taxes for each
              property.
            </p>
          </div>
          {loadError && (
            <p className="text-sm text-red-600 text-center">{loadError}</p>
          )}
          {!properties && !loadError && (
            <p className="text-center text-sm text-gray-500">
              <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
              Loading…
            </p>
          )}
          {properties?.map((property) => (
            <PropertySetupCard
              key={property.id}
              initial={property}
              onSaved={load}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
