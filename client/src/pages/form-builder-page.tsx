import React from "react";
import FormsPage from "./forms-page";
import AppLayoutSpruce from "@/components/layout/AppLayoutSpruce";

export default function FormBuilderPage() {
  // This page simply redirects to the main FormsPage where the form builder is already implemented
  return (
    <AppLayoutSpruce>
      <FormsPage />
    </AppLayoutSpruce>
  );
}
