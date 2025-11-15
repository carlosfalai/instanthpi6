import React, { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PageContainerProps {
  children: ReactNode;
  title?: string;
  description?: string;
  headerActions?: ReactNode;
  className?: string;
}

export default function PageContainer({
  children,
  title,
  description,
  headerActions,
  className = "",
}: PageContainerProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Page Header */}
      {(title || headerActions) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            {title && (
              <h1 className="text-3xl font-bold text-foreground mb-2">{title}</h1>
            )}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {headerActions && (
            <div className="flex items-center gap-2">{headerActions}</div>
          )}
        </div>
      )}

      {/* Page Content */}
      <div>{children}</div>
    </div>
  );
}

interface PageCardProps {
  children: ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export function PageCard({ children, title, description, className = "" }: PageCardProps) {
  return (
    <Card className={`bg-card border-border ${className}`}>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle className="text-card-foreground">{title}</CardTitle>}
          {description && (
            <CardDescription className="text-muted-foreground">{description}</CardDescription>
          )}
        </CardHeader>
      )}
      <CardContent className={title || description ? "" : "pt-6"}>{children}</CardContent>
    </Card>
  );
}

