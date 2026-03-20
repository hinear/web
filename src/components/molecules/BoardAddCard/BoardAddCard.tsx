import { Plus } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

export interface BoardAddCardProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
}

export const BoardAddCard = React.forwardRef<
  HTMLButtonElement,
  BoardAddCardProps
>(({ className, label = "Add card", type = "button", ...props }, ref) => {
  return (
    <button
      className={cn(
        "flex h-11 w-[216px] items-center justify-center gap-2 rounded-[12px] border border-[#D7DCE5] bg-[var(--app-color-white)] px-3 py-[10px] text-center",
        "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-color-brand-300)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      ref={ref}
      type={type}
      {...props}
    >
      <Plus
        aria-hidden="true"
        className="h-[14px] w-[14px] shrink-0 text-[var(--app-color-gray-500)]"
      />
      <span className="text-[13px] leading-[13px] font-[var(--app-font-weight-600)] text-[var(--app-color-gray-500)]">
        {label}
      </span>
    </button>
  );
});

BoardAddCard.displayName = "BoardAddCard";
