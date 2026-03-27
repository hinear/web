import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ExplicitActionOptions {
  action?: unknown;
  disabled?: boolean;
  href?: string | null;
  onClick?: unknown;
  type?: "button" | "reset" | "submit";
}

export function hasExplicitAction({
  action,
  disabled = false,
  href,
  onClick,
  type = "button",
}: ExplicitActionOptions) {
  if (disabled) {
    return false;
  }

  if (href) {
    return true;
  }

  if (typeof onClick === "function") {
    return true;
  }

  if (type === "submit" || type === "reset") {
    return true;
  }

  return action != null;
}
