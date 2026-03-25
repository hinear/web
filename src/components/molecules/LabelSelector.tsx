"use client";

import { Check, ChevronDown, Plus, Tag, X } from "lucide-react";
import * as React from "react";
import { createLabelKey } from "@/features/issues/lib/labels";
import { cn } from "@/lib/utils";

export interface LabelOption {
  id: string;
  name: string;
  color: string;
}

interface LabelSelectorProps {
  availableLabels: LabelOption[];
  selectedLabelIds: string[];
  onLabelToggle: (labelId: string) => void;
  onCreateLabel?: (name: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function LabelSelector({
  availableLabels,
  selectedLabelIds,
  onLabelToggle,
  onCreateLabel,
  disabled = false,
  placeholder = "Select labels",
  className,
}: LabelSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");
  const [isCreating, setIsCreating] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const selectedLabels = availableLabels.filter((label) =>
    selectedLabelIds.includes(label.id)
  );

  // 필터링된 라벨 목록
  const filteredLabels = availableLabels.filter((label) => {
    const search = searchValue.toLowerCase().trim();
    if (!search) return true;
    return label.name.toLowerCase().includes(search);
  });

  // 새 라벨 생성 가능 여부
  const existingLabel = availableLabels.find(
    (label) => createLabelKey(label.name) === createLabelKey(searchValue)
  );
  const canCreateLabel =
    onCreateLabel && searchValue.trim().length > 0 && !existingLabel;

  // 드롭다운 외부 클릭 처리
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchValue("");
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // 드롭다운 열릴 때 검색창 포커스
  React.useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleLabelToggle = (labelId: string) => {
    onLabelToggle(labelId);
  };

  const handleCreateLabel = async () => {
    if (!onCreateLabel || !searchValue.trim()) return;

    setIsCreating(true);
    try {
      await onCreateLabel(searchValue.trim());
      setSearchValue("");
    } finally {
      setIsCreating(false);
    }
  };

  const handleRemoveLabel = (e: React.MouseEvent, labelId: string) => {
    e.stopPropagation();
    onLabelToggle(labelId);
  };

  const handleTriggerClick = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleTriggerClick();
    }
  };

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      {/* 선택된 라벨 표시 영역 */}
      {/* biome-ignore lint/a11y/useSemanticElements: Using div with role=button to avoid nested button HTML error */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={handleTriggerClick}
        onKeyDown={handleTriggerKeyDown}
        className={cn(
          "flex min-h-[42px] w-full flex-wrap items-center gap-2 rounded-[10px] border border-[var(--app-color-border-soft)] bg-[var(--app-color-white)] px-3 py-2 text-left cursor-pointer",
          "transition-colors duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-color-brand-300)] focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          isOpen && "ring-2 ring-[var(--app-color-brand-300)] ring-offset-2"
        )}
      >
        {selectedLabels.length > 0 ? (
          selectedLabels.map((label) => (
            <span
              key={label.id}
              className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: `${label.color}15`,
                color: label.color,
                border: `1px solid ${label.color}40`,
              }}
            >
              <Tag className="h-3 w-3" />
              {label.name}
              <button
                type="button"
                onClick={(e) => handleRemoveLabel(e, label.id)}
                disabled={disabled}
                className="hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))
        ) : (
          <span className="text-sm text-[var(--app-color-gray-400)]">
            {placeholder}
          </span>
        )}

        <ChevronDown
          className={cn(
            "ml-auto h-4 w-4 shrink-0 text-[var(--app-color-gray-500)] transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </div>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div className="absolute top-full z-50 mt-1 w-full overflow-hidden rounded-[14px] border border-[var(--app-color-border-soft)] bg-[var(--app-color-white)] p-2 shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
          {/* 검색 입력창 */}
          <div className="relative mb-2">
            <input
              ref={searchInputRef}
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search or create label..."
              disabled={disabled}
              className={cn(
                "h-9 w-full rounded-[8px] border border-[var(--app-color-border-soft)] bg-[var(--app-color-white)] px-3 py-2 text-sm",
                "placeholder:text-[var(--app-color-gray-400)]",
                "focus:outline-none focus:ring-2 focus:ring-[var(--app-color-brand-300)] focus:ring-offset-2",
                "disabled:cursor-not-allowed disabled:opacity-50"
              )}
            />
          </div>

          {/* 라벨 목록 */}
          <div className="max-h-64 overflow-y-auto">
            {filteredLabels.length > 0 ? (
              <div className="flex flex-col gap-1">
                {filteredLabels.map((label) => {
                  const isSelected = selectedLabelIds.includes(label.id);

                  return (
                    <button
                      key={label.id}
                      type="button"
                      onClick={() => handleLabelToggle(label.id)}
                      disabled={disabled}
                      className={cn(
                        "flex items-center gap-2 rounded-[8px] px-3 py-2 text-left text-sm transition-colors",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        isSelected
                          ? "bg-[var(--app-color-brand-50)] font-medium text-[var(--app-color-ink-900)]"
                          : "text-[var(--app-color-black)] hover:bg-[var(--color-surface-50)]"
                      )}
                    >
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: label.color }}
                      />
                      <span className="flex-1 truncate">{label.name}</span>
                      {isSelected && (
                        <Check className="h-4 w-4 text-[var(--app-color-brand-500)]" />
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="px-3 py-4 text-center text-sm text-[var(--app-color-gray-400)]">
                No labels found
              </p>
            )}
          </div>

          {/* 새 라벨 생성 버튼 또는 중복 메시지 */}
          {searchValue.trim().length > 0 &&
            !filteredLabels.some(
              (label) =>
                createLabelKey(label.name) === createLabelKey(searchValue)
            ) && (
              <div className="mt-2 pt-2 border-t border-[var(--app-color-border-soft)]">
                {canCreateLabel ? (
                  <button
                    type="button"
                    onClick={handleCreateLabel}
                    disabled={isCreating || disabled}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-[8px] px-3 py-2 text-sm text-[var(--app-color-brand-600)]",
                      "transition-colors",
                      "hover:bg-[var(--app-color-brand-50)]",
                      "disabled:cursor-not-allowed disabled:opacity-50"
                    )}
                  >
                    {isCreating ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--app-color-brand-600)] border-t-transparent" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    Create "{searchValue.trim()}"
                  </button>
                ) : (
                  <div className="flex items-center gap-2 rounded-[8px] px-3 py-2 text-sm text-[var(--app-color-gray-500)]">
                    <Tag className="h-4 w-4" />
                    Label already exists
                  </div>
                )}
              </div>
            )}
        </div>
      )}
    </div>
  );
}
