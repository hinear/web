import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariantClassNames = {
  primary:
    "border-[var(--app-color-brand-500)] bg-[var(--app-color-brand-500)] text-[var(--app-color-white)] font-[var(--app-font-weight-600)] hover:border-[var(--app-color-brand-500)] hover:bg-[var(--app-color-brand-500)]",
  secondary:
    "border-[var(--app-color-border-soft)] bg-[var(--app-color-white)] text-[var(--app-color-ink-900)] font-[var(--app-font-weight-500)] hover:border-[var(--app-color-border-soft)] hover:bg-[var(--app-color-white)]",
  ghost:
    "border-transparent bg-transparent text-[var(--app-color-brand-500)] font-[var(--app-font-weight-500)] hover:bg-[var(--app-color-brand-50)]",
} as const;

const buttonSizeClassNames = {
  sm: "rounded-[10px] px-[14px] py-[9px] text-[13px] leading-[13px]",
  md: "min-h-11 rounded-[var(--app-radius-12)] px-[var(--app-space-16)]",
} as const;

type ButtonVariant = keyof typeof buttonVariantClassNames;
type ButtonSize = keyof typeof buttonSizeClassNames;

export function getButtonClassName(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "sm",
  className?: string
) {
  return cn(
    "inline-flex shrink-0 items-center justify-center whitespace-nowrap border border-solid font-[var(--app-font-family-base)] align-middle transition-colors select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-color-brand-300)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
    buttonVariantClassNames[variant],
    buttonSizeClassNames[size],
    className
  );
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  size?: ButtonSize;
  variant?: ButtonVariant;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      loading = false,
      size = "sm",
      type = "button",
      variant = "primary",
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        className={getButtonClassName(variant, size, className)}
        ref={ref}
        type={type}
        {...(disabled || loading ? { disabled: true } : {})}
        {...props}
      >
        {loading ? (
          <span
            aria-hidden="true"
            className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
        ) : null}
        {props.children}
      </button>
    );
  }
);

Button.displayName = "Button";
