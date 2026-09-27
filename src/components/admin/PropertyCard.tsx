"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  PlusCircle,
  Trash2,
} from "lucide-react";
import type { AdminProperty, DateRange } from "@/types";

const Calendar = dynamic(
  () => import("@/components/shared/Calendar").then((mod) => mod.Calendar),
  {
    loading: () => (
      <div className="p-4 text-center text-sm text-gray-500">
        Loading calendar...
      </div>
    ),
    ssr: false,
  },
);

const currencyLabel = (
  value: number,
  currency = "USD",
  options?: { minimumFractionDigits?: number; maximumFractionDigits?: number },
) => {
  const minimumFractionDigits = options?.minimumFractionDigits ?? 2;
  const maximumFractionDigits =
    options?.maximumFractionDigits ?? minimumFractionDigits;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value / 100);
};

const inputValueFromCents = (cents: number, decimals = 2) =>
  (cents / 100).toFixed(decimals);

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

const dayNumber = (isoDate: string) =>
  Math.floor(new Date(`${isoDate}T00:00:00Z`).getTime() / 86400000);

interface PropertyCardProps {
  property: AdminProperty;
  onSaveRates: (
    propertyId: number,
    payload: {
      weekdayRate: number;
      weekendRate: number;
      cleaningFee: number;
      serviceFee: number;
    },
  ) => Promise<void>;
  onSaveSpecial: (
    propertyId: number,
    payload: {
      startDate: string;
      endDate?: string;
      price?: number;
      note?: string;
      isBlocked?: boolean;
    },
  ) => Promise<void>;
  onDeleteSpecial: (
    propertyId: number,
    specialIds: number | number[],
  ) => Promise<void>;
}

export function PropertyCard({
  property,
  onSaveRates,
  onSaveSpecial,
  onDeleteSpecial,
}: PropertyCardProps) {
  const [savingRates, setSavingRates] = useState(false);
  const [savingSpecial, setSavingSpecial] = useState(false);
  const [specialForm, setSpecialForm] = useState({
    price: "",
    note: "",
    isBlocked: false,
  });
  const [specialRange, setSpecialRange] = useState<DateRange>({
    start: null,
    end: null,
  });
  const [showCalendar, setShowCalendar] = useState(false);
  const [removingOverrideKey, setRemovingOverrideKey] = useState<string | null>(
    null,
  );
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
  }, [
    property.weekdayRate,
    property.weekendRate,
    property.cleaningFee,
    property.serviceFee,
  ]);

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

  const formatDateInput = (date: Date | null) =>
    date ? date.toISOString().split("T")[0] : "";

  const handleSpecialSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
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
        endDate: specialRange.end
          ? formatDateInput(specialRange.end)
          : undefined,
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
    const sorted = property.specialRates
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date));
    const groups: OverrideGroup[] = [];

    for (const rate of sorted) {
      const last = groups[groups.length - 1];
      const matchesType =
        last &&
        last.isBlocked === rate.isBlocked &&
        (last.price ?? 0) === rate.price &&
        (last.note ?? "") === (rate.note ?? "");
      const consecutive =
        last &&
        dayNumber(rate.date) === dayNumber(last.endDate ?? last.startDate) + 1;

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
    () =>
      property.specialRates
        .filter((rate) => rate.isBlocked)
        .map((rate) => rate.date),
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
    <section className="bg-white border border-gray-200 rounded-xl p-6 ">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-xl font-serif text-gray-900">{property.name}</h2>
          <p className="text-sm text-gray-500">
            Baseline rates: Weekday{" "}
            {currencyLabel(property.weekdayRate, property.currency, {
              minimumFractionDigits: 0,
            })}{" "}
            · Weekend{" "}
            {currencyLabel(property.weekendRate, property.currency, {
              minimumFractionDigits: 0,
            })}
          </p>
        </div>
        <div className="flex gap-2">
          <div className="text-xs text-gray-500 bg-gray-100 rounded-full px-3 py-1 inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Connected
          </div>
        </div>
      </div>

      <div
        className="grid gap-6 lg:grid-cols-2"
      >
        <form
          className="border border-gray-100 rounded-xl p-5 space-y-4"
          onSubmit={handleRatesSubmit}
        >
          <h3 className="font-medium text-gray-900 flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-gray-500" /> Base Rates & Fees
          </h3>
          <p className="text-xs text-gray-500">
            Enter the nightly rate you charge on Airbnb. Direct guests pay 10% less, plus a 5% Bunks service fee.
            Use Special Pricing for holidays and events.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <LabeledField
              label="Airbnb rate · Sun–Thu"
              value={rateForm.weekday}
              onChange={(value) =>
                setRateForm((prev) => ({ ...prev, weekday: value }))
              }
              prefix="$"
              step="1"
              disabled={savingRates}
            />
            <LabeledField
              label="Airbnb rate · Fri–Sat"
              value={rateForm.weekend}
              onChange={(value) =>
                setRateForm((prev) => ({ ...prev, weekend: value }))
              }
              prefix="$"
              step="1"
              disabled={savingRates}
            />
            <LabeledField
              label="Cleaning Fee"
              value={rateForm.cleaning}
              onChange={(value) =>
                setRateForm((prev) => ({ ...prev, cleaning: value }))
              }
              prefix="$"
              step="1"
              disabled={savingRates}
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-gray-900 text-white py-3 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={savingRates}
          >
            {savingRates ? "Saving..." : "Save Rates"}
          </button>
        </form>

        <form
          className="border border-amber-100 rounded-xl p-5 space-y-4 bg-amber-50/40 relative"
          onSubmit={handleSpecialSubmit}
        >
          <h3 className="font-medium text-gray-900 flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-amber-500" /> Special Pricing /
            Blocks
          </h3>
          <p className="text-xs text-gray-600">
            Use this panel to set per-night overrides or fully block a range of
            dates for holds, shoots, or maintenance windows.
          </p>
          <div className="grid gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600">
                Date Range
              </label>
              <button
                type="button"
                onClick={() => setShowCalendar((prev) => !prev)}
                className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-left flex items-center justify-between gap-3"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {dateSummaryLabel}
                  </p>
                  <p className="text-xs text-gray-500">
                    {specialRange.end
                      ? "Inclusive of all nights"
                      : specialRange.start
                        ? "Tap to set checkout"
                        : "Tap to choose dates"}
                  </p>
                </div>
                <CalendarIcon className="w-4 h-4 text-gray-500" />
              </button>
              {showCalendar && (
                <div className="mt-3 rounded-xl border border-gray-100 bg-white shadow-xl">
                  <Calendar
                    blockedDates={blockedDates}
                    selectedRange={specialRange}
                    onSelectDates={(range) => setSpecialRange(range)}
                  />
                  <div className="flex flex-col gap-2 border-t border-gray-100 px-4 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="button"
                      className="rounded-xl border border-gray-200 px-4 py-2 font-medium text-gray-600 hover:border-gray-400"
                      onClick={() =>
                        setSpecialRange({ start: null, end: null })
                      }
                    >
                      Clear Selection
                    </button>
                    <button
                      type="button"
                      className="rounded-xl bg-gray-900 px-4 py-2 font-medium text-white hover:bg-gray-800"
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
                  onChange={(value) =>
                    setSpecialForm((prev) => ({ ...prev, price: value }))
                  }
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
              <label className="text-xs font-medium text-gray-600 inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={specialForm.isBlocked}
                  onChange={(event) =>
                    setSpecialForm((prev) => ({
                      ...prev,
                      isBlocked: event.target.checked,
                    }))
                  }
                />
                Block dates only
              </label>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Note</label>
              <input
                type="text"
                value={specialForm.note}
                onChange={(event) =>
                  setSpecialForm((prev) => ({
                    ...prev,
                    note: event.target.value,
                  }))
                }
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white"
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
        <h4 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-3">
          Upcoming Overrides
        </h4>
        {overrideGroups.length ? (
          <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
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
                    <p className="font-medium text-gray-900">
                      {formatOverrideRange(group)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {description}
                      {group.note ? ` · ${group.note}` : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteOverride(group)}
                    className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-600"
                    disabled={removingOverrideKey === group.key}
                  >
                    <Trash2 className="w-3 h-3" />{" "}
                    {removingOverrideKey === group.key
                      ? "Removing..."
                      : "Remove"}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No overrides yet.</p>
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  prefix: string;
  step?: string;
  min?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  type?: string;
  inputMode?:
    | "search"
    | "text"
    | "none"
    | "tel"
    | "url"
    | "email"
    | "numeric"
    | "decimal";
}) {
  return (
    <div>
      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
        {label}
      </label>
      <div className="relative mt-1">
        <span className="absolute left-3 top-2.5 text-gray-500">{prefix}</span>
        <input
          type={type}
          inputMode={inputMode}
          step={step}
          min={min}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          className="w-full rounded-xl border border-gray-200 pl-7 pr-3 py-2 text-sm font-medium text-gray-900 focus:border-gray-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-500"
        />
      </div>
    </div>
  );
}
