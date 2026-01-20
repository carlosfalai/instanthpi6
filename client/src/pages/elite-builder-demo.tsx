import React from "react";
import { EliteLayout } from "@/components/elite/EliteLayout";
import { EliteFormBuilder } from "@/components/elite/EliteFormBuilder";

export default function EliteBuilderDemo() {
  const handleSave = (schema: any) => {
    console.log("Saved Schema:", schema);
    alert("Schema saved to console!");
  };

  return (
    <EliteLayout
      title="Elite Form Builder"
      description="Next-generation form construction interface"
    >
      <EliteFormBuilder onSave={handleSave} />
    </EliteLayout>
  );
}
