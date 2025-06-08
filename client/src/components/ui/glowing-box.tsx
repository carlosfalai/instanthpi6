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
      "relative bg-gray-900/95 rounded-lg border border-gray-600/70 backdrop-blur-md shadow-2xl",
      "before:absolute before:-inset-0.5 before:rounded-lg before:bg-gradient-to-r before:from-purple-600/30 before:to-blue-600/30 before:opacity-50 before:transition before:duration-500 before:blur-[1px] before:-z-10",
      "hover:before:opacity-75",
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