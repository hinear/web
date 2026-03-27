import type * as React from "react";

import { Button } from "@/components/atoms/Button";
import { Field } from "@/components/atoms/Field";
import { GoogleAuthButton } from "@/features/auth/components/google-auth-button";
import type { AuthRedirectReason } from "@/features/auth/lib/next-path";
import { cn } from "@/lib/utils";

type AuthFormVariant = "desktop" | "tablet" | "mobile";

const variantClassNames: Record<AuthFormVariant, string> = {
  desktop: "w-[420px] gap-6 p-7",
  tablet: "w-[420px] gap-6 p-7",
  mobile: "w-[345px] gap-5 p-5",
};

const titleClassNames: Record<AuthFormVariant, string> = {
  desktop: "text-[22px] leading-[22px]",
  tablet: "text-[24px] leading-[24px]",
  mobile: "text-[22px] leading-[22px]",
};

export interface AuthFormProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "action"> {
  action?: React.ComponentProps<"form">["action"];
  defaultEmail?: string;
  errorMessage?: string;
  next?: string;
  noticeMessage?: string;
  onSignUpClick?: React.ButtonHTMLAttributes<HTMLButtonElement>["onClick"];
  reason?: AuthRedirectReason;
  submitLabel?: string;
  subtitle?: string;
  title?: string;
  variant?: AuthFormVariant;
}

export function AuthForm({
  action,
  className,
  defaultEmail = "",
  errorMessage,
  next = "/projects/new",
  noticeMessage,
  onSignUpClick,
  reason,
  submitLabel = "Send magic link",
  subtitle = "Welcome back! Please enter your details.",
  title = "Sign in to your account",
  variant = "desktop",
  ...props
}: AuthFormProps) {
  return (
    <section
      className={cn(
        "flex flex-col rounded-[20px] border border-[var(--app-color-border-soft)] bg-[var(--app-color-white)]",
        variantClassNames[variant],
        className
      )}
      {...props}
    >
      <div className="flex flex-col gap-2">
        <h2
          className={cn(
            "font-[var(--app-font-weight-600)] text-[var(--app-color-ink-900)]",
            titleClassNames[variant]
          )}
        >
          {title}
        </h2>
        <p className="text-[14px] leading-[1.45] font-normal text-[var(--app-color-gray-500)]">
          {subtitle}
        </p>
      </div>

      <form action={action} className="flex w-full flex-col gap-3">
        <div className="flex flex-col gap-2">
          <label
            className="text-[13px] leading-[13px] font-[var(--app-font-weight-500)] text-[var(--app-color-black)]"
            htmlFor="auth-email"
          >
            Email
          </label>
          <Field
            autoComplete="email"
            defaultValue={defaultEmail}
            id="auth-email"
            name="email"
            placeholder="you@company.com"
            type="email"
          />
        </div>
        <input name="next" readOnly type="hidden" value={next} />
        {reason ? (
          <input name="reason" readOnly type="hidden" value={reason} />
        ) : null}
        <Button size="md" type="submit">
          {submitLabel}
        </Button>
      </form>

      {noticeMessage ? (
        <div className="rounded-[12px] border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-3 text-[13px] leading-5 font-medium text-[#1D4ED8]">
          {noticeMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-[12px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[13px] leading-5 font-medium text-[#B91C1C]">
          {errorMessage}
        </div>
      ) : null}

      <div className="flex w-full flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-[var(--app-color-border-soft)]" />
          <span className="text-[12px] leading-[12px] font-normal text-[var(--app-color-gray-500)]">
            Or continue with Google later
          </span>
          <div className="h-px flex-1 bg-[var(--app-color-border-soft)]" />
        </div>

        <GoogleAuthButton next={next} reason={reason} />
      </div>

      <div className="flex items-center justify-center gap-1">
        <span className="text-[13px] leading-[13px] font-normal text-[var(--color-neutral-500)]">
          Don&apos;t have an account?
        </span>
        <button
          className="text-[13px] leading-[13px] font-[var(--app-font-weight-500)] text-[var(--app-color-brand-500)]"
          onClick={onSignUpClick}
          type="button"
        >
          Sign up
        </button>
      </div>
    </section>
  );
}
