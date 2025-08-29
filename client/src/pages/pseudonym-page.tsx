import React from "react";
import BaseLayout from "@/components/layout/BaseLayout";
import PseudonymLookup from "@/components/pseudonym-lookup";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";

export function PseudonymPage() {
  return (
    <BaseLayout>
      <div className="container mx-auto py-6">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Patient Pseudonym Lookup</h1>
            <p className="text-gray-400">Look up patient submissions by pseudonym</p>
          </div>

          <Button
            onClick={() => (window.location.href = "/formsite")}
            variant="ghost"
            size="sm"
            className="mt-4 sm:mt-0 self-start bg-transparent hover:bg-[#2a2a2a] border border-[#444] transition-all duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            <FileText className="h-4 w-4 mr-2 text-blue-500" />
            Back to FormSite Submissions
          </Button>
        </div>

        <PseudonymLookup />
      </div>
    </BaseLayout>
  );
}

export default PseudonymPage;
