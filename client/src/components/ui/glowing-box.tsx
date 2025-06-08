import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GlowingBoxProps {
  children: ReactNode;
  className?: string;
}

export function GlowingBox({ 
  children, 
  className
}: GlowingBoxProps) {
  return (
    <div className={cn(
      "relative bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/30 hover:bg-gray-700/50 transition-all duration-200",
      className
    )}>
      {children}
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
      className={cn("p-6 cursor-pointer hover:scale-[1.02] transition-transform", className)} 
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
    <button onClick={onClick} className="w-full">
      <GlowingBox 
        className={cn("p-3 text-center cursor-pointer hover:scale-[1.01] transition-transform", className)} 
        {...props}
      >
        {children}
      </GlowingBox>
    </button>
  );
}