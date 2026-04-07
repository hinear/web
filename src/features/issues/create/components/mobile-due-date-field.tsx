"use client";

import { CalendarDays } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

function formatDueDateLabel(value: string) {
  if (!value) {
    return "Select date";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export interface MobileDueDateFieldProps {
  defaultValue: string;
  id: string;
  name: string;
}

export function MobileDueDateField({
  defaultValue,
  id,
  name,
}: MobileDueDateFieldProps) {
  const [value, setValue] = React.useState(defaultValue);

  return (
    <div className="relative">
      <div className="flex h-[41px] items-center justify-between rounded-[10px] border border-[var(--app-color-border-soft)] bg-white px-[12px] py-[10px]">
        <span
          className={cn(
            "text-[13px] leading-[13px]",
            value
              ? "font-[var(--app-font-weight-500)] text-[#111318]"
              : "font-normal text-[#8A90A2]"
          )}
        >
          {formatDueDateLabel(value)}
        </span>
        <CalendarDays
          aria-hidden="true"
          className="h-[14px] w-[14px] text-[#6B7280]"
        />
      </div>

      <input
        className="absolute inset-0 cursor-pointer opacity-0"
        defaultValue={defaultValue}
        id={id}
        name={name}
        onChange={(event) => setValue(event.target.value)}
        type="date"
      />
    </div>
  );
}
