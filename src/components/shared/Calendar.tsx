"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { DateRange } from "@/types";
import { isDateSelectable, isRangeValid } from "@/lib/availability";

interface CalendarProps {
  blockedDates?: string[];
  minStay?: Record<string, number>;
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

// Helper to format date as YYYY-MM-DD
const toISODate = (d: Date) => {
  const parts = d.toLocaleDateString('en-CA').split('-'); // YYYY-MM-DD in most locales, but safer:
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function Calendar({
  blockedDates = [],
  minStay = {},
  onSelectDates,
  selectedRange,
  variant = "default",
  monthsToShow = 6,
  className = "",
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
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

  // Use centralized availability logic
  const isBlocked = (date: Date) => !isDateSelectable(date, blockedDates);

  const getMinStayForDate = (date: Date) => {
    return minStay[toISODate(date)] || 1;
  };

  const isDateInvalidForEnd = (date: Date) => {
    if (!startDate || endDate) return false;
    // If selecting end date:
    // Check if `date` satisfies minStay from `startDate`
    const requiredNights = getMinStayForDate(startDate);
    const nights = Math.ceil((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return nights < requiredNights && date > startDate;
  };

  const handleDateClick = (day: number, contextDate: Date) => {
    const clickedDate = new Date(contextDate.getFullYear(), contextDate.getMonth(), day);
    clickedDate.setHours(0, 0, 0, 0);

    // Check if clicked date itself is available
    if (isBlocked(clickedDate)) {
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

    // Check min stay constraints
    const requiredNights = getMinStayForDate(startDate);
    const nights = Math.ceil((clickedDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (nights < requiredNights) {
      // Don't alert, just ignore as it should be disabled visually or show tooltip
      return;
    }

    // Check availability of the entire range
    const proposedRange = { start: startDate, end: clickedDate };
    if (!isRangeValid(proposedRange, blockedDates)) {
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

            const blocked = isBlocked(dateObj);
            const invalidEnd = isDateInvalidForEnd(dateObj);

            // Determine min stay for tooltip
            // If selecting end date (startDate exists, !endDate), check if this specific date is invalid due to min stay
            // And show the tooltip if so.
            // Also, show min stay for the start date if hovering?
            // "2-night minimum" usually appears when you select a start date and hover over invalid end dates, OR
            // when you hover a start date that implies a minimum?
            // Let's mimic the request: "blank out dates... and give a tool tip"

            const isStart = startDate && normalized.getTime() === startDate.getTime();
            const isEnd = endDate && normalized.getTime() === endDate.getTime();
            const inRange = startDate && endDate && normalized > startDate && normalized < endDate;

            const isRestricted = invalidEnd;

            let buttonClass = "h-10 w-full text-sm font-medium relative z-10 transition-all rounded-full";

            if (blocked) {
              buttonClass += " text-gray-300 cursor-not-allowed decoration-gray-300 line-through decoration-1 rounded-full";
            } else if (isRestricted) {
              // "Blank out" or disable visual for restricted end dates
              buttonClass += " text-gray-300 cursor-not-allowed rounded-full bg-gray-50/50";
            } else {
              buttonClass += " cursor-pointer hover:bg-gray-100 text-gray-700";
            }

            if (isStart || isEnd) {
              buttonClass =
                "h-10 w-full text-sm font-medium relative z-10 bg-gray-900 text-white rounded-full shadow-md hover:bg-gray-800";
            } else if (inRange) {
              buttonClass = "h-10 w-full text-sm font-medium relative z-10 bg-gray-100 text-gray-900 rounded-none";
            }

            // Tooltip logic
            const showTooltip = hoveredDate && normalized.getTime() === hoveredDate.getTime() && isRestricted && startDate;
            const minNights = startDate ? getMinStayForDate(startDate) : 0;
            const tooltipText = `${minNights}-night minimum`;

            return (
              <div
                key={`${monthKey}-day-${day}`}
                className="relative p-0.5"
                onMouseEnter={() => setHoveredDate(normalized)}
                onMouseLeave={() => setHoveredDate(null)}
              >
                {inRange && <div className="absolute inset-y-0.5 left-0 right-0 bg-gray-100 -z-0" />}
                {isStart && endDate && <div className="absolute inset-y-0.5 right-0 w-1/2 bg-gray-100 -z-0" />}
                {isEnd && startDate && <div className="absolute inset-y-0.5 left-0 w-1/2 bg-gray-100 -z-0" />}

                <button
                  onClick={() => handleDateClick(day, referenceDate)}
                  disabled={blocked || isRestricted}
                  className={buttonClass}
                >
                  {day}
                </button>
                {showTooltip && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 whitespace-nowrap bg-white text-gray-900 text-xs font-medium px-2 py-1 rounded shadow-lg border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
                    {tooltipText}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-white" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const baseLayoutClass = variant === "vertical" ? "max-h-[600px] overflow-y-auto" : "max-w-md mx-auto lg:mx-0";
  const containerClasses = `bg-white p-6 rounded-2xl border border-gray-200 shadow-sm ${baseLayoutClass} ${className}`;

  return (
    <div className={containerClasses}>
      {variant === "vertical"
        ? verticalMonths.map((monthDate, idx) => renderMonth(monthDate, `vertical-month-${idx}`))
        : renderMonth(currentDate, "single-month")}
    </div>
  );
}
