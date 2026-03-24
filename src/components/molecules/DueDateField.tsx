"use client";

import { Calendar } from "lucide-react";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import { cn } from "@/lib/utils";
import "./DueDateField.css";

interface DueDateFieldProps {
  value: string | null;
  onChange: (date: string | null) => void;
  label?: string;
  id?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export function DueDateField({
  value,
  onChange,
  label,
  id,
  disabled = false,
  required = false,
  className,
}: DueDateFieldProps) {
  const selectedDate = value ? new Date(value) : null;

  const handleChange = (date: Date | null) => {
    if (date) {
      // ISO 8601 format (YYYY-MM-DD)
      const isoDate = date.toISOString().split("T")[0];
      onChange(isoDate);
    } else {
      onChange(null);
    }
  };

  return (
    <div
      className={cn("flex flex-col gap-[6px]", className)}
      suppressHydrationWarning
    >
      {label ? (
        <label
          className="text-[11px] leading-[11px] font-[var(--app-font-weight-600)] text-[#6B7280]"
          htmlFor={id}
        >
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      ) : null}

      <div className="relative w-full">
        <ReactDatePicker
          selected={selectedDate}
          onChange={handleChange}
          disabled={disabled}
          dateFormat="yyyy-MM-dd"
          placeholderText="Due Date"
          id={id}
          popperClassName="date-picker-popper"
          showPopperArrow={false}
          calendarClassName="rounded-[10px] w-full border border-[var(--app-color-border-soft)]"
          customInput={
            <input
              type="text"
              id={id}
              value={
                selectedDate ? selectedDate.toLocaleDateString("ko-KR") : ""
              }
              placeholder="Due Date"
              disabled={disabled}
              required={required}
              className={cn(
                "h-11 w-full rounded-[10px] border border-[var(--app-color-border-soft)] bg-[var(--app-color-white)] px-4 pr-10 text-[14px] leading-[14px] font-normal text-[var(--app-color-black)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-color-brand-300)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              )}
              readOnly
            />
          }
        />
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
          <Calendar className="h-4 w-4 text-[#6B7280]" />
        </div>
      </div>
    </div>
  );
}
