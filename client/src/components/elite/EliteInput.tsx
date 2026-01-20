import React from "react";
import { cn } from "@/lib/utils";

interface EliteInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function EliteInput({ label, className, ...props }: EliteInputProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
          {label}
        </label>
      )}
      <input
        className={cn(
          "w-full h-12 px-4 glass border-white/10 text-foreground placeholder:text-muted-foreground rounded-xl",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all",
          className
        )}
        {...props}
      />
    </div>
  );
}
