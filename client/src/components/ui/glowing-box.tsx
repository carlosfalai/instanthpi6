import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GlowingBoxProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
  intensity?: "low" | "medium" | "high";
  variant?: "subtle" | "prominent" | "interactive";
}

export function GlowingBox({ 
  children, 
  className, 
  glowColor = "primary", 
  intensity = "medium",
  variant = "subtle"
}: GlowingBoxProps) {
  const baseClasses = "relative rounded-lg transition-all duration-300";
  
  const intensityClasses = {
    low: "shadow-sm",
    medium: "shadow-md",
    high: "shadow-lg"
  };

  const variantClasses = {
    subtle: `border border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-${glowColor}/20 hover:border-${glowColor}/30`,
    prominent: `border border-${glowColor}/30 bg-card shadow-${glowColor}/10 hover:shadow-${glowColor}/30 hover:border-${glowColor}/50`,
    interactive: `border border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-${glowColor}/40 hover:border-${glowColor}/60 hover:bg-card cursor-pointer transform hover:scale-[1.02]`
  };

  const glowClasses = cn(
    baseClasses,
    intensityClasses[intensity],
    variantClasses[variant],
    className
  );

  return (
    <div className={glowClasses}>
      <div className="relative z-10">
        {children}
      </div>
      {/* Subtle inner glow effect */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
    </div>
  );
}

export function GlowingCard({ 
  children, 
  className, 
  ...props 
}: GlowingBoxProps) {
  return (
    <GlowingBox 
      className={cn("p-6", className)} 
      variant="prominent"
      {...props}
    >
      {children}
    </GlowingBox>
  );
}

export function GlowingButton({ 
  children, 
  className, 
  onClick,
  ...props 
}: GlowingBoxProps & { onClick?: () => void }) {
  return (
    <GlowingBox 
      className={cn("p-3 text-center", className)} 
      variant="interactive"
      intensity="high"
      {...props}
    >
      <div onClick={onClick} className="w-full h-full">
        {children}
      </div>
    </GlowingBox>
  );
}