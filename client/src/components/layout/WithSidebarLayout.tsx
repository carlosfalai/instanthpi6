import React, { ReactNode } from "react";
import AppLayoutSpruce from "@/components/layout/AppLayoutSpruce";

/**
 * Wrapper component that ensures all protected pages use the consistent sidebar layout
 */
export function WithSidebarLayout({ children }: { children: ReactNode }) {
  return <AppLayoutSpruce>{children}</AppLayoutSpruce>;
}

