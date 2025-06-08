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
    <div className={cn("relative group", className)}>
      <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-gray-600/20 to-gray-400/20 opacity-50 group-hover:opacity-75 transition duration-500 blur-[1px]" />
      <div className="relative bg-gray-900/90 rounded-lg border border-gray-700/50 backdrop-blur-sm">
        {children}
      </div>
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