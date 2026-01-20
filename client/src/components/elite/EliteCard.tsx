import React from "react";
import { cn } from "@/lib/utils";

interface EliteCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
}

export function EliteCard({ children, className, hover = true, glow = false }: EliteCardProps) {
  return (
    <div
      className={cn(
        "glass-dark border-primary/20 rounded-3xl p-6",
        hover && "hover:border-primary/40 transition-all",
        glow && "neon-glow-primary",
        className
      )}
    >
      {children}
    </div>
  );
}
