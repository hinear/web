import { Check, ChevronDown } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

interface SelectOption {
  disabled?: boolean;
  label: string;
  value: string;
}

function getOptions(children: React.ReactNode): SelectOption[] {
  return React.Children.toArray(children)
    .filter(
      (child): child is React.ReactElement<React.ComponentProps<"option">> =>
        React.isValidElement<React.ComponentProps<"option">>(child)
    )
    .flatMap((child) => {
      if (child.type !== "option") return [];

      return [
        {
          disabled: child.props.disabled,
          label:
            typeof child.props.children === "string"
              ? child.props.children
              : String(child.props.children ?? child.props.value ?? ""),
          value: String(child.props.value ?? ""),
        },
      ];
    });
}

export interface SelectProps
  extends Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    "children" | "defaultValue" | "onChange" | "size" | "value"
  > {
  children?: React.ReactNode;
  defaultOpen?: boolean;
  defaultValue?: string;
  name?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  value?: string;
}

export const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      children,
      className,
      defaultOpen = false,
      defaultValue,
      disabled,
      name,
      onBlur,
      onFocus,
      onValueChange,
      placeholder,
      value,
      ...props
    },
    ref
  ) => {
    const options = React.useMemo(() => getOptions(children), [children]);
    const listboxId = React.useId();
    const rootRef = React.useRef<HTMLDivElement>(null);
    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = React.useState(
      String(defaultValue ?? options[0]?.value ?? "")
    );
    const [isOpen, setIsOpen] = React.useState(defaultOpen);

    const selectedValue = isControlled ? String(value ?? "") : internalValue;
    const selectedOption = options.find(
      (option) => option.value === selectedValue
    );
    const selectedLabel =
      selectedOption?.label ?? placeholder ?? options[0]?.label ?? "";

    React.useEffect(() => {
      function handlePointerDown(event: MouseEvent) {
        if (!rootRef.current?.contains(event.target as Node)) {
          setIsOpen(false);
        }
      }

      document.addEventListener("mousedown", handlePointerDown);
      return () => {
        document.removeEventListener("mousedown", handlePointerDown);
      };
    }, []);

    function handleSelect(nextValue: string) {
      if (!isControlled) {
        setInternalValue(nextValue);
      }

      onValueChange?.(nextValue);
      setIsOpen(false);
    }

    return (
      <div className="relative w-full" ref={rootRef}>
        {name ? (
          <input name={name} readOnly type="hidden" value={selectedValue} />
        ) : null}
        <button
          aria-controls={listboxId}
          aria-expanded={isOpen}
          className={cn(
            "flex h-11 w-full items-center justify-between rounded-[10px] border border-[var(--app-color-border-soft)] bg-[var(--app-color-white)] px-4 text-left text-[14px] leading-[14px] font-normal text-[var(--app-color-black)]",
            "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-color-brand-300)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          disabled={disabled}
          onBlur={onBlur}
          onClick={() => setIsOpen((open) => !open)}
          onFocus={onFocus}
          {...props}
          ref={ref}
          type="button"
        >
          <span className="truncate">{selectedLabel}</span>
          <ChevronDown
            aria-hidden="true"
            className={cn(
              "h-4 w-4 shrink-0 text-[var(--app-color-gray-500)] transition-transform",
              isOpen ? "rotate-180" : "rotate-0"
            )}
          />
        </button>

        {isOpen ? (
          <div
            className="absolute top-[calc(100%+8px)] left-0 z-20 w-full overflow-hidden rounded-[14px] border border-[var(--app-color-border-soft)] bg-[var(--app-color-white)] p-2 shadow-[0_18px_40px_rgba(15,23,42,0.12)]"
            id={listboxId}
            role="listbox"
          >
            <div className="flex max-h-64 flex-col gap-1 overflow-y-auto">
              {options.map((option) => {
                const isSelected = option.value === selectedValue;

                return (
                  <button
                    aria-selected={isSelected}
                    className={cn(
                      "flex min-h-10 w-full items-center justify-between rounded-[10px] px-3 py-2 text-left text-[14px] leading-5 transition-colors",
                      option.disabled
                        ? "cursor-not-allowed text-[var(--app-color-gray-400)] opacity-50"
                        : isSelected
                          ? "bg-[var(--app-color-brand-50)] font-[var(--app-font-weight-600)] text-[var(--app-color-ink-900)]"
                          : "cursor-pointer text-[var(--app-color-black)] hover:bg-[var(--color-surface-50)]"
                    )}
                    disabled={option.disabled}
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    role="option"
                    type="button"
                  >
                    <span>{option.label}</span>
                    {isSelected ? (
                      <Check
                        aria-hidden="true"
                        className="h-4 w-4 text-[var(--app-color-brand-500)]"
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    );
  }
);

Select.displayName = "Select";
