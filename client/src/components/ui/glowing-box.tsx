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
      <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-pink-600 to-purple-600 opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt blur-sm" />
      <div className="relative bg-black rounded-lg px-7 py-4 ring-1 ring-gray-900/5">
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