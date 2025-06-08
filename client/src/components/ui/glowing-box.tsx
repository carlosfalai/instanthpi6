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
  glowColor = "blue", 
  intensity = "medium",
  variant = "subtle"
}: GlowingBoxProps) {
  const getGlowStyles = () => {
    const colors = {
      blue: {
        border: "border-blue-500/70 hover:border-blue-400/90",
        shadow: "shadow-blue-500/40 hover:shadow-blue-400/60",
        glow: "shadow-[0_0_25px_rgba(59,130,246,0.6)] hover:shadow-[0_0_40px_rgba(59,130,246,0.8)]"
      },
      green: {
        border: "border-green-500/70 hover:border-green-400/90",
        shadow: "shadow-green-500/40 hover:shadow-green-400/60",
        glow: "shadow-[0_0_25px_rgba(34,197,94,0.6)] hover:shadow-[0_0_40px_rgba(34,197,94,0.8)]"
      },
      red: {
        border: "border-red-500/70 hover:border-red-400/90",
        shadow: "shadow-red-500/40 hover:shadow-red-400/60",
        glow: "shadow-[0_0_25px_rgba(239,68,68,0.6)] hover:shadow-[0_0_40px_rgba(239,68,68,0.8)]"
      },
      purple: {
        border: "border-purple-500/70 hover:border-purple-400/90",
        shadow: "shadow-purple-500/40 hover:shadow-purple-400/60",
        glow: "shadow-[0_0_25px_rgba(168,85,247,0.6)] hover:shadow-[0_0_40px_rgba(168,85,247,0.8)]"
      },
      yellow: {
        border: "border-yellow-500/70 hover:border-yellow-400/90",
        shadow: "shadow-yellow-500/40 hover:shadow-yellow-400/60",
        glow: "shadow-[0_0_25px_rgba(234,179,8,0.6)] hover:shadow-[0_0_40px_rgba(234,179,8,0.8)]"
      },
      primary: {
        border: "border-primary/70 hover:border-primary/90",
        shadow: "shadow-primary/40 hover:shadow-primary/60",
        glow: "shadow-[0_0_25px_rgba(59,130,246,0.6)] hover:shadow-[0_0_40px_rgba(59,130,246,0.8)]"
      },
      muted: {
        border: "border-slate-500/70 hover:border-slate-400/90",
        shadow: "shadow-slate-500/40 hover:shadow-slate-400/60",
        glow: "shadow-[0_0_25px_rgba(100,116,139,0.6)] hover:shadow-[0_0_40px_rgba(100,116,139,0.8)]"
      }
    };
    
    return colors[glowColor as keyof typeof colors] || colors.blue;
  };

  const glowStyles = getGlowStyles();
  
  const baseClasses = "relative rounded-lg transition-all duration-500 ease-in-out";
  
  const intensityClasses = {
    low: "border-2",
    medium: "border-2",
    high: "border-3"
  };

  const variantClasses = {
    subtle: `${glowStyles.border} ${glowStyles.glow} bg-card/60 backdrop-blur-sm`,
    prominent: `${glowStyles.border} ${glowStyles.glow} bg-card/70 backdrop-blur-sm`,
    interactive: `${glowStyles.border} ${glowStyles.glow} bg-card/75 backdrop-blur-sm cursor-pointer transform hover:scale-[1.01] active:scale-[0.99] hover:bg-card/85`
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
      {/* Enhanced inner glow effect */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/15 via-transparent to-white/8 pointer-events-none" />
      {/* Outer glow ring */}
      <div className="absolute inset-[-1px] rounded-lg bg-gradient-to-br from-white/20 to-transparent pointer-events-none opacity-60" />
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