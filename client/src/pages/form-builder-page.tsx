import React from "react";
import FormsPage from "./forms-page";
import ModernLayout from "@/components/layout/ModernLayout";

export default function FormBuilderPage() {
  // This page simply redirects to the main FormsPage where the form builder is already implemented
  return (
    <ModernLayout title="Form Builder" description="Create and edit forms">
      <FormsPage />
    </ModernLayout>
  );
}
