"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { DateRange } from "@/types";

interface CalendarProps {
  blockedDates?: string[];
  onSelectDates: (range: DateRange) => void;
  selectedRange: DateRange;
  variant?: "default" | "vertical";
  monthsToShow?: number;
  className?: string;
}

const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const normalizeDate = (value: Date) => {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  return next;
};

const parseISODateAsLocal = (value: string) => {
  const parts = value.split("-").map(Number);
  if (parts.length === 3 && parts.every((part) => Number.isFinite(part))) {
    const [year, month, day] = parts;
    return new Date(year, month - 1, day);
  }
  const fallback = new Date(value);
  fallback.setHours(0, 0, 0, 0);
  return fallback;
};

export function Calendar({
  blockedDates = [],
  onSelectDates,
  selectedRange,
  variant = "default",
  monthsToShow = 6,
  className = "",
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const startDate = selectedRange?.start ? normalizeDate(selectedRange.start) : null;
  const endDate = selectedRange?.end ? normalizeDate(selectedRange.end) : null;

  const verticalMonths = useMemo(() => {
    if (variant !== "vertical") return [] as Date[];
    const base = new Date();
    base.setDate(1);
    base.setHours(0, 0, 0, 0);
    return Array.from({ length: Math.max(1, monthsToShow) }).map((_, idx) =>
      new Date(base.getFullYear(), base.getMonth() + idx, 1),
    );
  }, [monthsToShow, variant]);

  const isDateBlocked = (date: Date) =>
    blockedDates.some((blocked) => {
      const blockedDate = parseISODateAsLocal(blocked);
      return (
        blockedDate.getDate() === date.getDate() &&
        blockedDate.getMonth() === date.getMonth() &&
        blockedDate.getFullYear() === date.getFullYear()
      );
    });

  const handleDateClick = (day: number, contextDate: Date) => {
    const clickedDate = new Date(contextDate.getFullYear(), contextDate.getMonth(), day);
    clickedDate.setHours(0, 0, 0, 0);

    if (isDateBlocked(clickedDate) || clickedDate < normalizeDate(new Date())) {
      return;
    }

    if (!startDate || (startDate && endDate)) {
      onSelectDates({ start: clickedDate, end: null });
      return;
    }

    if (clickedDate < startDate) {
      onSelectDates({ start: clickedDate, end: null });
      return;
    }

    let hasBlocked = false;
    const cursor = new Date(startDate);
    while (cursor < clickedDate) {
      cursor.setDate(cursor.getDate() + 1);
      if (isDateBlocked(cursor)) {
        hasBlocked = true;
        break;
      }
    }

    if (hasBlocked) {
      alert("You cannot select a range that includes blocked dates.");
      return;
    }

    onSelectDates({ start: startDate, end: clickedDate });
  };

  const renderMonth = (referenceDate: Date, monthKey: string) => {
    const daysInMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1).getDay();
    return (
      <div key={monthKey} className="mb-6 last:mb-0">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-serif text-lg text-gray-900">
            {referenceDate.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
          </h3>
          {variant === "default" && (
            <div className="flex gap-2">
              <button
                onClick={() =>
                  setCurrentDate(new Date(referenceDate.getFullYear(), referenceDate.getMonth() - 1, 1))
                }
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() =>
                  setCurrentDate(new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 1))
                }
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAY_LABELS.map((label) => (
            <div key={`${monthKey}-${label}`} className="text-center text-xs font-bold text-gray-400 py-2">
              {label}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-2">
          {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
            <div key={`${monthKey}-empty-${idx}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const day = idx + 1;
            const dateObj = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), day);
            const normalized = normalizeDate(dateObj);
            const blocked = isDateBlocked(dateObj);
            const isPast = normalized < normalizeDate(new Date());
            const isStart = startDate && normalized.getTime() === startDate.getTime();
            const isEnd = endDate && normalized.getTime() === endDate.getTime();
            const inRange = startDate && endDate && normalized > startDate && normalized < endDate;

            let buttonClass = "h-10 w-full text-sm font-medium relative z-10 transition-all rounded-full";

            if (blocked || isPast) {
              buttonClass += " text-gray-300 cursor-not-allowed decoration-gray-300 line-through decoration-1 rounded-full";
            } else {
              buttonClass += " cursor-pointer hover:bg-gray-100 text-gray-700";
            }

            if (isStart || isEnd) {
              buttonClass =
                "h-10 w-full text-sm font-medium relative z-10 bg-gray-900 text-white rounded-full shadow-md hover:bg-gray-800";
            } else if (inRange) {
              buttonClass = "h-10 w-full text-sm font-medium relative z-10 bg-gray-100 text-gray-900 rounded-none";
            }

            return (
              <div key={`${monthKey}-day-${day}`} className="relative p-0.5">
                {inRange && <div className="absolute inset-y-0.5 left-0 right-0 bg-gray-100 -z-0" />}
                {isStart && endDate && <div className="absolute inset-y-0.5 right-0 w-1/2 bg-gray-100 -z-0" />}
                {isEnd && startDate && <div className="absolute inset-y-0.5 left-0 w-1/2 bg-gray-100 -z-0" />}
                <button
                  onClick={() => handleDateClick(day, referenceDate)}
                  disabled={blocked || isPast}
                  className={buttonClass}
                >
                  {day}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const baseLayoutClass = variant === "vertical" ? "max-h-[600px] overflow-y-auto" : "max-w-md mx-auto lg:mx-0";
  const containerClasses = `bg-white p-6 rounded-2xl border border-gray-100 shadow-sm ${baseLayoutClass} ${className}`;

  return (
    <div className={containerClasses}>
      {variant === "vertical"
        ? verticalMonths.map((monthDate, idx) => renderMonth(monthDate, `vertical-month-${idx}`))
        : renderMonth(currentDate, "single-month")}
    </div>
  );
}
