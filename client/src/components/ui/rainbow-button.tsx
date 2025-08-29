import React from "react";
import { cn } from "@/lib/utils";

interface RainbowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export function RainbowButton({ children, className, ...props }: RainbowButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors",
        "bg-muted hover:bg-muted/80 text-foreground border border-border/50",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        "disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
