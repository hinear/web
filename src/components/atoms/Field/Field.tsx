import * as React from "react";

import { cn } from "@/lib/utils";

export interface FieldProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "value" | "defaultValue"
  > {
  value?: string;
  defaultValue?: string;
}

export const Field = React.forwardRef<HTMLInputElement, FieldProps>(
  ({ className, value, defaultValue, ...props }, ref) => {
    // Prevent both value and defaultValue from being set
    const hasValue = value !== undefined;
    const hasDefaultValue = defaultValue !== undefined;

    if (hasValue && hasDefaultValue) {
      console.warn(
        "Field: Both 'value' and 'defaultValue' were provided. Using 'value' (controlled component)."
      );
    }

    return (
      <input
        className={cn(
          "h-11 w-full rounded-[10px] border border-[var(--app-color-border-soft)] bg-[var(--app-color-white)] px-4 text-[14px] leading-[14px] font-normal text-[var(--app-color-ink-900)] placeholder:text-[var(--app-color-gray-400)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-color-brand-300)] focus-visible:ring-offset-2",
          className
        )}
        ref={ref}
        {...props}
        {...(hasValue ? { value } : { defaultValue })}
      />
    );
  }
);

Field.displayName = "Field";
