import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GlowingBoxProps {
  children: ReactNode;
  className?: string;
  color?: "blue" | "green" | "red" | "purple" | "yellow" | "white";
}

export function GlowingBox({ 
  children, 
  className, 
  color = "blue"
}: GlowingBoxProps) {
  return (
    <div className={cn("relative group", className)}>
      <div
        className={cn(
          "absolute -inset-0.5 rounded-lg blur-sm opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt",
          {
            "bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600": color === "blue",
            "bg-gradient-to-r from-green-600 via-green-400 to-green-600": color === "green", 
            "bg-gradient-to-r from-red-600 via-red-400 to-red-600": color === "red",
            "bg-gradient-to-r from-purple-600 via-purple-400 to-purple-600": color === "purple",
            "bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600": color === "yellow",
            "bg-gradient-to-r from-white via-gray-300 to-white": color === "white"
          }
        )}
      />
      <div className="relative bg-black/80 backdrop-blur-xl rounded-lg p-4 ring-1 ring-gray-900/5">
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