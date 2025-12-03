"use client";

import { useEffect, useMemo, useState } from "react";
import type { HTMLInputTypeAttribute, InputHTMLAttributes } from "react";
import { AlertCircle, Calendar as CalendarIcon, CheckCircle2, Lock, LogOut, PlusCircle, RefreshCw, Trash2 } from "lucide-react";
import { Calendar } from "@/components/shared/Calendar";
import type { DateRange } from "@/types";
import { AdminTopNav } from "@/components/admin/AdminTopNav";

interface AdminSpecialRate {
  id: number;
  date: string;
  price: number;
  note?: string | null;
  isBlocked: boolean;
}

interface AdminProperty {
  id: number;
  name: string;
  slug: string;
  weekdayRate: number;
  weekendRate: number;
  cleaningFee: number;
  serviceFee: number;
  currency: string;
  specialRates: AdminSpecialRate[];
}

interface AdminFeatureToggle {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
}

const currencyLabel = (
  value: number,
  currency = "USD",
  options?: { minimumFractionDigits?: number; maximumFractionDigits?: number },
) => {
  const minimumFractionDigits = options?.minimumFractionDigits ?? 2;
  const maximumFractionDigits = options?.maximumFractionDigits ?? minimumFractionDigits;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value / 100);
};

const inputValueFromCents = (cents: number, decimals = 2) => (cents / 100).toFixed(decimals);

const getOrdinalSuffix = (day: number) => {
  if (day % 100 >= 11 && day % 100 <= 13) {
    return "th";
  }
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
};

const formatLongDate = (isoDate: string) => {
  const date = new Date(`${isoDate}T00:00:00Z`);
  const month = date.toLocaleString("en-GB", { month: "long" });
  const day = date.getUTCDate();
  return `${month}, ${day}${getOrdinalSuffix(day)} ${date.getUTCFullYear()}`;
};

const dayNumber = (isoDate: string) => Math.floor(new Date(`${isoDate}T00:00:00Z`).getTime() / 86400000);

export default function AdminPage() {
  const [authState, setAuthState] = useState<"checking" | "unauthenticated" | "authenticated">("checking");
  const [properties, setProperties] = useState<AdminProperty[]>([]);
  const [featureFlags, setFeatureFlags] = useState<AdminFeatureToggle[]>([]);
  const [email, setEmail] = useState("ali@bunks.com");
  const [password, setPassword] = useState("PMbunks101!");
  const [error, setError] = useState<string | null>(null);
  const [featureError, setFeatureError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingFeatureKey, setUpdatingFeatureKey] = useState<string | null>(null);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const res = await fetch("/api/admin/session", { credentials: "include" });
        if (res.ok) {
          setAuthState("authenticated");
          await Promise.all([fetchProperties(), fetchFeatureFlags()]);
        } else {
          setAuthState("unauthenticated");
        }
      } catch (err) {
        console.error("Failed to check admin session", err);
        setAuthState("unauthenticated");
      }
    };
    bootstrap();
  }, []);

  const fetchProperties = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/admin/properties", { credentials: "include" });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        const message = (payload as { error?: string }).error;
        throw new Error(message ?? `Failed to load properties (status ${res.status})`);
      }
      const data = (await res.json()) as { properties: AdminProperty[] };
      setProperties(data.properties);
    } catch (err) {
      console.error(err);
      setError((err as Error).message ?? "Failed to load properties");
    } finally {
      setRefreshing(false);
    }
  };

  const fetchFeatureFlags = async () => {
    try {
      const res = await fetch("/api/admin/features", { credentials: "include" });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        const message = (payload as { error?: string }).error;
        throw new Error(message ?? `Failed to load feature toggles (status ${res.status})`);
      }
      const data = (await res.json()) as { features: AdminFeatureToggle[] };
      setFeatureFlags(data.features ?? []);
      setFeatureError(null);
    } catch (err) {
      console.error(err);
      setFeatureError((err as Error).message ?? "Failed to load feature toggles");
    }
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error ?? "Invalid credentials");
      }
      setAuthState("authenticated");
      await Promise.all([fetchProperties(), fetchFeatureFlags()]);
    } catch (err) {
      setAuthState("unauthenticated");
      setError((err as Error).message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    setAuthState("unauthenticated");
    setProperties([]);
  };

  const handleRatesSave = async (
    propertyId: number,
    payload: { weekdayRate: number; weekendRate: number; cleaningFee: number; serviceFee: number },
  ) => {
    setError(null);
    const res = await fetch(`/api/admin/properties/${propertyId}/rates`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "Failed to save rates");
    }
    await fetchProperties();
  };

  const handleSpecialSave = async (
    propertyId: number,
    payload: { startDate: string; endDate?: string; price?: number; note?: string; isBlocked?: boolean },
  ) => {
    setError(null);
    const res = await fetch(`/api/admin/properties/${propertyId}/special-pricing`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "Failed to save special rate");
    }
    await fetchProperties();
  };

  const handleFeatureToggle = async (feature: AdminFeatureToggle) => {
    setFeatureError(null);
    setUpdatingFeatureKey(feature.key);
    try {
      const res = await fetch("/api/admin/features", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: feature.key, enabled: !feature.enabled }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error ?? "Failed to update feature toggle");
      }

      const data = (await res.json()) as { features: AdminFeatureToggle[] };
      setFeatureFlags(data.features ?? []);
    } catch (err) {
      console.error(err);
      setFeatureError((err as Error).message ?? "Failed to update feature toggle");
    } finally {
      setUpdatingFeatureKey(null);
    }
  };

  const handleSpecialDelete = async (propertyId: number, specialIds: number | number[]) => {
    setError(null);
    const ids = Array.isArray(specialIds) ? specialIds : [specialIds];

    for (const specialId of ids) {
      const res = await fetch(`/api/admin/properties/${propertyId}/special-pricing/${specialId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to delete special rate");
      }
    }

    await fetchProperties();
  };

  if (authState !== "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-700">
              <Lock className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-serif text-slate-900">Admin Console</h1>
            <p className="text-sm text-slate-500">Restricted area for rate management.</p>
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
        active="pricing"
        title="Rate & Availability Console"
        subtitle="Adjust weekday/weekend rates, cleaning & service fees, plus date-specific overrides."
        actions={
          <>
            <button
              onClick={fetchProperties}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:border-slate-400"
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
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

      {error && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        </div>
      )}
      {featureError && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4" /> {featureError}
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        {featureFlags.length > 0 && (
          <section className="bg-white border border-slate-200 rounded-2xl p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-serif text-2xl text-slate-900">Feature toggles</h2>
                <p className="text-sm text-slate-500">Quickly enable or pause marketplace experiments before launch.</p>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              {featureFlags.map((feature) => {
                const isLoading = updatingFeatureKey === feature.key;
                return (
                  <div
                    key={feature.key}
                    className="flex flex-col gap-3 rounded-xl border border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{feature.label}</p>
                      <p className="text-sm text-slate-500">{feature.description}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                          feature.enabled ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {feature.enabled ? "Enabled" : "Disabled"}
                      </span>
                      <button
                        onClick={() => handleFeatureToggle(feature)}
                        disabled={isLoading}
                        className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition ${
                          feature.enabled
                            ? "border-slate-200 text-slate-600 hover:border-slate-400"
                            : "border-violet-200 text-violet-700 hover:border-violet-400"
                        } ${isLoading ? "opacity-50" : ""}`}
                      >
                        {isLoading ? "Updating..." : feature.enabled ? "Disable" : "Enable"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
        {properties.map((property) => (
          <PropertyCard
            key={property.id}
            property={property}
            onSaveRates={handleRatesSave}
            onSaveSpecial={handleSpecialSave}
            onDeleteSpecial={handleSpecialDelete}
          />
        ))}
        {!properties.length && !refreshing && (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500">
            No properties in the database. Run the Prisma seed or add listings to begin.
          </div>
        )}
      </main>
    </div>
  );
}

function PropertyCard({
  property,
  onSaveRates,
  onSaveSpecial,
  onDeleteSpecial,
}: {
  property: AdminProperty;
  onSaveRates: (
    propertyId: number,
    payload: { weekdayRate: number; weekendRate: number; cleaningFee: number; serviceFee: number },
  ) => Promise<void>;
  onSaveSpecial: (
    propertyId: number,
    payload: { startDate: string; endDate?: string; price?: number; note?: string; isBlocked?: boolean },
  ) => Promise<void>;
  onDeleteSpecial: (propertyId: number, specialIds: number | number[]) => Promise<void>;
}) {
  const [savingRates, setSavingRates] = useState(false);
  const [savingSpecial, setSavingSpecial] = useState(false);
  const [specialForm, setSpecialForm] = useState({
    price: "",
    note: "",
    isBlocked: false,
  });
  const [specialRange, setSpecialRange] = useState<DateRange>({ start: null, end: null });
  const [showCalendar, setShowCalendar] = useState(false);
  const [removingOverrideKey, setRemovingOverrideKey] = useState<string | null>(null);
  const [rateForm, setRateForm] = useState({
    weekday: inputValueFromCents(property.weekdayRate, 0),
    weekend: inputValueFromCents(property.weekendRate, 0),
    cleaning: inputValueFromCents(property.cleaningFee, 0),
    service: inputValueFromCents(property.serviceFee, 0),
  });

  useEffect(() => {
    setRateForm({
      weekday: inputValueFromCents(property.weekdayRate, 0),
      weekend: inputValueFromCents(property.weekendRate, 0),
      cleaning: inputValueFromCents(property.cleaningFee, 0),
      service: inputValueFromCents(property.serviceFee, 0),
    });
  }, [property.weekdayRate, property.weekendRate, property.cleaningFee, property.serviceFee]);

  const handleRatesSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingRates(true);
    try {
      const cleaningValue = Math.round(parseFloat(rateForm.cleaning));
      const serviceValue = Math.round(parseFloat(rateForm.service));
      await onSaveRates(property.id, {
        weekdayRate: parseFloat(rateForm.weekday),
        weekendRate: parseFloat(rateForm.weekend),
        cleaningFee: cleaningValue,
        serviceFee: serviceValue,
      });
    } catch (err) {
      console.error(err);
      alert((err as Error).message);
    } finally {
      setSavingRates(false);
    }
  };

  const formatDateInput = (date: Date | null) => (date ? date.toISOString().split("T")[0] : "");

  const handleSpecialSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!specialRange.start) {
      alert("Select at least a start date for the override");
      return;
    }

    let priceValue: number | undefined;
    if (!specialForm.isBlocked) {
      priceValue = parseFloat(specialForm.price);
      if (Number.isNaN(priceValue) || priceValue <= 0) {
        alert("Enter a valid special rate");
        return;
      }
    }

    setSavingSpecial(true);
    try {
      await onSaveSpecial(property.id, {
        startDate: formatDateInput(specialRange.start),
        endDate: specialRange.end ? formatDateInput(specialRange.end) : undefined,
        price: specialForm.isBlocked ? undefined : priceValue,
        note: specialForm.note,
        isBlocked: specialForm.isBlocked,
      });
      setSpecialForm({ price: "", note: "", isBlocked: false });
      setSpecialRange({ start: null, end: null });
      setShowCalendar(false);
    } catch (err) {
      console.error(err);
      alert((err as Error).message);
    } finally {
      setSavingSpecial(false);
    }
  };

  type OverrideGroup = {
    key: string;
    startDate: string;
    endDate?: string;
    ids: number[];
    isBlocked: boolean;
    price?: number;
    note?: string | null;
  };

  const overrideGroups = useMemo<OverrideGroup[]>(() => {
    const sorted = property.specialRates.slice().sort((a, b) => a.date.localeCompare(b.date));
    const groups: OverrideGroup[] = [];

    for (const rate of sorted) {
      const last = groups[groups.length - 1];
      const matchesType =
        last &&
        last.isBlocked === rate.isBlocked &&
        (last.price ?? 0) === rate.price &&
        (last.note ?? "") === (rate.note ?? "");
      const consecutive = last && dayNumber(rate.date) === dayNumber(last.endDate ?? last.startDate) + 1;

      if (last && matchesType && consecutive) {
        last.endDate = rate.date;
        last.ids.push(rate.id);
      } else {
        groups.push({
          key: `override-${rate.id}`,
          startDate: rate.date,
          endDate: undefined,
          ids: [rate.id],
          isBlocked: rate.isBlocked,
          price: rate.price,
          note: rate.note,
        });
      }
    }

    return groups;
  }, [property.specialRates]);
  const blockedDates = useMemo(
    () => property.specialRates.filter((rate) => rate.isBlocked).map((rate) => rate.date),
    [property.specialRates],
  );

  const dateSummaryLabel = useMemo(() => {
    if (!specialRange.start && !specialRange.end) {
      return "Select dates";
    }
    const format = (date: Date | null) =>
      date?.toLocaleDateString("en-GB", {
        month: "short",
        day: "numeric",
      });
    if (specialRange.start && specialRange.end) {
      return `${format(specialRange.start)} → ${format(specialRange.end)}`;
    }
    return format(specialRange.start);
  }, [specialRange.end, specialRange.start]);

  const formatOverrideRange = (group: OverrideGroup) =>
    group.endDate && group.endDate !== group.startDate
      ? `${formatLongDate(group.startDate)} to ${formatLongDate(group.endDate)}`
      : formatLongDate(group.startDate);

  const handleDeleteOverride = async (group: OverrideGroup) => {
    setRemovingOverrideKey(group.key);
    try {
      await onDeleteSpecial(property.id, group.ids);
    } catch (err) {
      console.error(err);
      alert((err as Error).message);
    } finally {
      setRemovingOverrideKey(null);
    }
  };

  return (
    <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-xl font-serif text-slate-900">{property.name}</h2>
          <p className="text-sm text-slate-500">
            Baseline rates: Weekday
            {" "}
            {currencyLabel(property.weekdayRate, property.currency, { minimumFractionDigits: 0 })} · Weekend {" "}
            {currencyLabel(property.weekendRate, property.currency, { minimumFractionDigits: 0 })}
          </p>
        </div>
        <div className="text-xs text-slate-500 bg-slate-100 rounded-full px-3 py-1 inline-flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Connected
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form className="border border-slate-100 rounded-2xl p-5 space-y-4" onSubmit={handleRatesSubmit}>
          <h3 className="font-medium text-slate-900 flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-slate-500" /> Base Rates & Fees
          </h3>
          <p className="text-xs text-slate-500">Cleaning fee defaults to $85 and service fee to $20 for every property—update as needed here.</p>
          <div className="grid grid-cols-2 gap-4">
            <LabeledField
              label="Weekday Rate"
              value={rateForm.weekday}
              onChange={(value) => setRateForm((prev) => ({ ...prev, weekday: value }))}
              prefix="$"
              step="1"
            />
            <LabeledField
              label="Weekend Rate"
              value={rateForm.weekend}
              onChange={(value) => setRateForm((prev) => ({ ...prev, weekend: value }))}
              prefix="$"
              step="1"
            />
            <LabeledField
              label="Cleaning Fee"
              value={rateForm.cleaning}
              onChange={(value) => setRateForm((prev) => ({ ...prev, cleaning: value }))}
              prefix="$"
              step="1"
            />
            <LabeledField
              label="Service Fee"
              value={rateForm.service}
              onChange={(value) => setRateForm((prev) => ({ ...prev, service: value }))}
              prefix="$"
              step="1"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-slate-900 text-white py-3 text-sm font-medium hover:bg-slate-800"
            disabled={savingRates}
          >
            {savingRates ? "Saving..." : "Save Rates"}
          </button>
        </form>

        <form className="border border-amber-100 rounded-2xl p-5 space-y-4 bg-amber-50/40" onSubmit={handleSpecialSubmit}>
          <h3 className="font-medium text-slate-900 flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-amber-500" /> Special Pricing / Blocks
          </h3>
          <p className="text-xs text-slate-600">
            Use this panel to set per-night overrides or fully block a range of dates for holds, shoots, or maintenance windows.
          </p>
          <div className="grid gap-4">
            <div>
              <label className="text-xs font-medium text-slate-600">Date Range</label>
              <button
                type="button"
                onClick={() => setShowCalendar((prev) => !prev)}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left flex items-center justify-between gap-3"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{dateSummaryLabel}</p>
                  <p className="text-xs text-slate-500">
                    {specialRange.end ? "Inclusive of all nights" : specialRange.start ? "Tap to set checkout" : "Tap to choose dates"}
                  </p>
                </div>
                <CalendarIcon className="w-4 h-4 text-slate-400" />
              </button>
              {showCalendar && (
                <div className="mt-3 rounded-3xl border border-slate-100 bg-white shadow-xl">
                  <Calendar
                    blockedDates={blockedDates}
                    selectedRange={specialRange}
                    onSelectDates={(range) => setSpecialRange(range)}
                  />
                  <div className="flex flex-col gap-2 border-t border-slate-100 px-4 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="button"
                      className="rounded-xl border border-slate-200 px-4 py-2 font-medium text-slate-600 hover:border-slate-400"
                      onClick={() => setSpecialRange({ start: null, end: null })}
                    >
                      Clear Selection
                    </button>
                    <button
                      type="button"
                      className="rounded-xl bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-800"
                      onClick={() => setShowCalendar(false)}
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <LabeledField
                  label="Special Rate ($)"
                  value={specialForm.price}
                  onChange={(value) => setSpecialForm((prev) => ({ ...prev, price: value }))}
                  prefix="$"
                  step="0.01"
                  min="0"
                  disabled={specialForm.isBlocked}
                  required={!specialForm.isBlocked}
                  placeholder="per night"
                  type="text"
                  inputMode="decimal"
                />
              </div>
              <label className="text-xs font-medium text-slate-600 inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={specialForm.isBlocked}
                  onChange={(event) => setSpecialForm((prev) => ({ ...prev, isBlocked: event.target.checked }))}
                />
                Block dates only
              </label>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Note</label>
              <input
                type="text"
                value={specialForm.note}
                onChange={(event) => setSpecialForm((prev) => ({ ...prev, note: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white"
                placeholder="e.g., Film shoot hold"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-amber-500 text-white py-3 text-sm font-medium hover:bg-amber-400"
            disabled={savingSpecial}
          >
            {savingSpecial ? "Applying..." : "Add Special Rate / Block"}
          </button>
        </form>
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-medium text-slate-600 uppercase tracking-wide mb-3">Upcoming Overrides</h4>
        {overrideGroups.length ? (
          <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
            {overrideGroups.map((group) => {
              const description = group.isBlocked
                ? "Blocked (no bookings)"
                : `Special rate ${currencyLabel(group.price ?? 0)}`;
              return (
              <div
                  key={group.key}
                  className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between bg-white px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-slate-900">{formatOverrideRange(group)}</p>
                    <p className="text-xs text-slate-500">
                      {description}
                      {group.note ? ` · ${group.note}` : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteOverride(group)}
                    className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-600"
                    disabled={removingOverrideKey === group.key}
                  >
                    <Trash2 className="w-3 h-3" /> {removingOverrideKey === group.key ? "Removing..." : "Remove"}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No overrides yet.</p>
        )}
      </div>
    </section>
  );
}

function LabeledField({
  label,
  value,
  onChange,
  prefix,
  step = "0.01",
  min = "0",
  disabled = false,
  required = true,
  placeholder,
  type = "number",
  inputMode,
  pattern,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  prefix?: string;
  step?: string | number;
  min?: string | number;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  type?: HTMLInputTypeAttribute;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
  pattern?: string;
}) {
  return (
    <label className="text-xs font-medium text-slate-600">
      {label}
      <div className="mt-1 flex rounded-xl border border-slate-200 overflow-hidden">
        {prefix && <span className="px-3 py-2 text-sm text-slate-500 bg-slate-50">{prefix}</span>}
        <input
          type={type}
          step={step}
          min={min}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="flex-1 px-3 py-2 text-sm focus:outline-none bg-white"
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          inputMode={inputMode}
          pattern={pattern}
        />
      </div>
    </label>
  );
}
