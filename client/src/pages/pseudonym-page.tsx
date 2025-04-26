import React from "react";
import BaseLayout from "@/components/layout/BaseLayout";
import PseudonymLookup from "@/components/pseudonym-lookup";

export function PseudonymPage() {
  return (
    <BaseLayout>
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Patient Pseudonym Lookup</h1>
          <p className="text-gray-400">Look up patient submissions by pseudonym</p>
        </div>
        <PseudonymLookup />
      </div>
    </BaseLayout>
  );
}

export default PseudonymPage;