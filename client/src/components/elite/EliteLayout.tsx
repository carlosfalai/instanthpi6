import React from "react";

interface EliteLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  showAura?: boolean;
}

export function EliteLayout({ children, title, description, showAura = true }: EliteLayoutProps) {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {showAura && (
        <>
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
          <div
            className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px] animate-pulse"
            style={{ animationDelay: "-2s" }}
          />
        </>
      )}
      <div className="relative z-10 p-6">
        {title && (
          <div className="mb-8">
            <h1 className="text-3xl font-black tracking-tight text-foreground">{title}</h1>
            {description && <p className="text-muted-foreground mt-2">{description}</p>}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
