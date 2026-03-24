"use client";

import { Calendar } from "lucide-react";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import { cn } from "@/lib/utils";

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

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  return (
    <div className={cn("flex flex-col gap-[6px]", className)}>
      {label ? (
        <label
          className="text-[11px] leading-[11px] font-[var(--app-font-weight-600)] text-[#6B7280]"
          htmlFor={id}
        >
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      ) : null}

      <div className="relative">
        <ReactDatePicker
          selected={selectedDate}
          onChange={handleChange}
          disabled={disabled}
          dateFormat="yyyy-MM-dd"
          placeholderText="마감일 선택"
          className="w-full rounded-[10px] border border-[#E6E8EC] bg-white px-3 py-[9px] text-[13px] leading-[13px] font-[var(--app-font-weight-500)] text-[#111318] outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-color-brand-300)] disabled:cursor-not-allowed disabled:bg-[#F3F4F6] disabled:text-[#9CA3AF]"
          id={id}
          popperClassName="date-picker-popper"
          showPopperArrow={false}
          isClearable
          customInput={
            <div className="relative">
              <input
                type="text"
                id={id}
                value={
                  selectedDate ? selectedDate.toLocaleDateString("ko-KR") : ""
                }
                placeholder="마감일 선택"
                disabled={disabled}
                required={required}
                className={cn(
                  "w-full rounded-[10px] border border-[#E6E8EC] bg-white px-3 py-[9px] pr-10 text-[13px] leading-[13px] font-[var(--app-font-weight-500)] text-[#111318] outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-color-brand-300)] disabled:cursor-not-allowed disabled:bg-[#F3F4F6] disabled:text-[#9CA3AF]"
                )}
                readOnly
              />
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                <Calendar className="h-4 w-4 text-[#6B7280]" />
              </div>
            </div>
          }
        />
      </div>
    </div>
  );
}
