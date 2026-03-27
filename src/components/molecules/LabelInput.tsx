"use client";

import { X } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

interface LabelInputProps {
  value: string[];
  onChange: (labels: string[]) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  name?: string;
  suggestions?: string[];
}

export function LabelInput({
  value = [],
  onChange,
  placeholder = "라벨 입력 후 엔터...",
  className,
  id,
  name,
  suggestions = [],
}: LabelInputProps) {
  const [inputValue, setInputValue] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addLabel();
    } else if (e.key === "Backspace" && inputValue === "" && value.length > 0) {
      // 입력이 비어있고 백스페이스를 누르면 마지막 라벨 삭제
      removeLabel(value.length - 1);
    }
  };

  const addLabel = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
      setInputValue("");
    }
  };

  const removeLabel = (index: number) => {
    const newLabels = value.filter((_, i) => i !== index);
    onChange(newLabels);
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (!value.includes(suggestion)) {
      onChange([...value, suggestion]);
    }
    inputRef.current?.focus();
  };

  // 폼 제출을 위한 hidden input 값 (쉼표로 구분)
  const formValue = value.join(",");

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* 라벨 태그들 */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((label) => (
            <span
              key={label}
              className="inline-flex items-center gap-1 rounded-full bg-[var(--app-color-brand-50)] px-3 py-1 text-[13px] font-medium text-[var(--app-color-brand-700)]"
            >
              {label}
              <button
                type="button"
                onClick={() => {
                  const index = value.indexOf(label);
                  if (index !== -1) {
                    removeLabel(index);
                  }
                }}
                className="hover:text-[var(--app-color-brand-900)]"
                aria-label={`Remove ${label} label`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* 입력 필드 */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addLabel}
          placeholder={value.length === 0 ? placeholder : ""}
          className="w-full rounded-[10px] border border-[var(--app-color-border-soft)] bg-[var(--app-color-white)] px-4 py-3 text-[14px] leading-[14px] font-normal text-[var(--app-color-black)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-color-brand-300)] focus-visible:ring-offset-2 placeholder:text-[var(--app-color-gray-400)]"
          id={id}
        />
        {name && <input name={name} readOnly type="hidden" value={formValue} />}
      </div>

      {/* 제안 라벨 */}
      {suggestions.length > 0 && inputValue.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {suggestions
            .filter(
              (s) =>
                s.toLowerCase().includes(inputValue.toLowerCase()) &&
                !value.includes(s)
            )
            .slice(0, 5)
            .map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className="rounded-full border border-[var(--app-color-border-soft)] bg-[var(--app-color-surface-50)] px-3 py-1 text-[12px] text-[var(--app-color-gray-600)] hover:bg-[var(--app-color-brand-50)] hover:text-[var(--app-color-brand-700)] transition-colors"
              >
                + {suggestion}
              </button>
            ))}
        </div>
      )}

      <p className="text-[11px] leading-[11px] font-normal text-[var(--app-color-gray-400)]">
        엔터를 눌러 라벨을 추가하세요
      </p>
    </div>
  );
}
