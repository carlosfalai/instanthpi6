import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface RainbowButtonProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  size?: "sm" | "md" | "lg" | "icon";
  variant?: "default" | "outline";
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

export function RainbowButton({ 
  children, 
  className,
  onClick,
  size = "md",
  variant = "default",
  disabled = false,
  type = "button"
}: RainbowButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group relative inline-flex animate-rainbow cursor-pointer items-center justify-center rounded-xl border-0 bg-[length:200%] font-medium text-white transition-colors [background-clip:padding-box,border-box,border-box] [background-origin:border-box] [border:calc(0.08*1rem)_solid_transparent] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
        
        // Before pseudo-element for the animated background
        "before:absolute before:bottom-[-20%] before:left-1/2 before:z-0 before:h-1/5 before:w-3/5 before:-translate-x-1/2 before:animate-rainbow before:bg-[linear-gradient(90deg,hsl(var(--color-1)),hsl(var(--color-5)),hsl(var(--color-3)),hsl(var(--color-4)),hsl(var(--color-2)))] before:bg-[length:200%] before:[filter:blur(calc(0.8*1rem))]",
        
        // Main background with rainbow gradient
        "bg-[linear-gradient(#121213,#121213),linear-gradient(#121213_50%,rgba(18,18,19,0.6)_80%,rgba(18,18,19,0)),linear-gradient(90deg,hsl(var(--color-1)),hsl(var(--color-5)),hsl(var(--color-3)),hsl(var(--color-4)),hsl(var(--color-2)))]",
        
        // Size variants
        {
          "h-8 px-3 text-sm": size === "sm",
          "h-11 px-8 py-2": size === "md",
          "h-14 px-10 py-3 text-lg": size === "lg",
          "h-10 w-10": size === "icon",
        },
        
        className
      )}
      style={{
        "--color-1": "0 100% 63%",
        "--color-2": "270 100% 63%", 
        "--color-3": "210 100% 63%",
        "--color-4": "195 100% 63%",
        "--color-5": "90 100% 63%",
      } as React.CSSProperties}
    >
      {children}
    </button>
  );
}