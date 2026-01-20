import React from "react";
import { cn } from "@/lib/utils";

interface EliteBadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "error";
  className?: string;
}

export function EliteBadge({ children, variant = "default", className }: EliteBadgeProps) {
  const variants = {
    default: "bg-white/5 border-white/10 text-muted-foreground",
    success: "bg-green-500/10 border-green-500/20 text-green-500",
    warning: "bg-yellow-500/10 border-yellow-500/20 text-yellow-500",
    error: "bg-red-500/10 border-red-500/20 text-red-500",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
