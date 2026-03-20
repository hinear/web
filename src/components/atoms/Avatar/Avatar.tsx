import Image from "next/image";
import * as React from "react";

import { cn } from "@/lib/utils";

function getInitials(name?: string, fallback?: string) {
  const source = name?.trim() || fallback?.trim() || "";

  if (!source) {
    return "";
  }

  const words = source.split(/\s+/).filter(Boolean);

  if (words.length >= 2) {
    return `${words[0]?.[0] ?? ""}${words[1]?.[0] ?? ""}`.toUpperCase();
  }

  return source.replace(/\s+/g, "").slice(0, 2).toUpperCase();
}

export interface AvatarProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  alt?: string;
  fallback?: string;
  name?: string;
  size?: number;
  src?: string | null;
}

export function Avatar({
  alt,
  className,
  fallback,
  name,
  size = 20,
  src,
  style,
  ...props
}: AvatarProps) {
  const [failedSource, setFailedSource] = React.useState<string | null>(null);
  const initials = getInitials(name, fallback);
  const showImage = Boolean(src) && failedSource !== (src ?? null);
  const ariaLabel = alt ?? name ?? initials ?? "Avatar";

  return (
    <span
      aria-label={ariaLabel}
      className={cn(
        "relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-[var(--color-teal-700)] text-[9px] leading-[9px] font-[var(--app-font-weight-600)] text-[var(--app-color-white)]",
        className
      )}
      role="img"
      style={{
        width: size,
        height: size,
        ...style,
      }}
      {...props}
    >
      {showImage ? (
        <Image
          alt={alt ?? name ?? "Avatar"}
          className="h-full w-full object-cover"
          fill
          onError={() => setFailedSource(src ?? null)}
          sizes={`${size}px`}
          src={src ?? ""}
          unoptimized
        />
      ) : (
        <span>{initials}</span>
      )}
    </span>
  );
}
