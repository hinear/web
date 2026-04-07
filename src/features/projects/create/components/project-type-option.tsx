"use client";

import type { ProjectType } from "@/features/projects/types";

export function ProjectTypeOption({
  description,
  title,
  value,
  checked,
  onChange,
}: {
  value: ProjectType;
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: ProjectType) => void;
}) {
  return (
    <label
      className={[
        "flex cursor-pointer flex-col gap-2 rounded-[18px] border p-[18px] transition-colors",
        checked
          ? "border-[2px] border-[#818CF8] bg-[#EEF2FF]"
          : "border-[#CBD5E1] bg-white",
      ].join(" ")}
    >
      <input
        className="sr-only"
        checked={checked}
        onChange={() => onChange(value)}
        name="type"
        type="radio"
        value={value}
      />
      <span className="text-base font-bold text-[#111318]">{title}</span>
      <span
        className={
          checked
            ? "text-[13px] font-medium leading-5 text-[#4338CA]"
            : "text-[13px] font-medium leading-5 text-[#4B5563]"
        }
      >
        {description}
      </span>
    </label>
  );
}
