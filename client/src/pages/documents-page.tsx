import React from "react";
import { FileText, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import AppLayoutSpruce from "@/components/layout/AppLayoutSpruce";

export default function DocumentsPage() {
  return (
    <AppLayoutSpruce>
      <div className="p-6">
        <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center">
          <div className="mb-4 md:mb-0">
            <h2 className="text-2xl font-medium text-foreground">Documents</h2>
            <p className="text-muted-foreground text-sm">Access patient documents and medical records</p>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              className="pl-9 bg-background border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent w-full"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Patient Records */}
          <div className="bg-card border border-border rounded-md p-6 hover:bg-secondary transition-colors cursor-pointer">
            <div className="flex items-center mb-2">
              <FileText className="h-5 w-5 text-muted-foreground mr-3" />
              <h3 className="text-lg font-medium text-foreground">Patient Records</h3>
            </div>
            <p className="text-sm text-muted-foreground">Access and manage all patient records</p>
          </div>

          {/* SOAP Notes */}
          <div className="bg-card border border-border rounded-md p-6 hover:bg-secondary transition-colors cursor-pointer">
            <div className="flex items-center mb-2">
              <FileText className="h-5 w-5 text-muted-foreground mr-3" />
              <h3 className="text-lg font-medium text-foreground">SOAP Notes</h3>
            </div>
            <p className="text-sm text-muted-foreground">Access and manage all soap notes</p>
          </div>

          {/* HPI Summaries */}
          <div className="bg-card border border-border rounded-md p-6 hover:bg-secondary transition-colors cursor-pointer">
            <div className="flex items-center mb-2">
              <FileText className="h-5 w-5 text-muted-foreground mr-3" />
              <h3 className="text-lg font-medium text-foreground">HPI Summaries</h3>
            </div>
            <p className="text-sm text-muted-foreground">Access and manage all hpi summaries</p>
          </div>

          {/* Prescription History */}
          <div className="bg-card border border-border rounded-md p-6 hover:bg-secondary transition-colors cursor-pointer">
            <div className="flex items-center mb-2">
              <FileText className="h-5 w-5 text-muted-foreground mr-3" />
              <h3 className="text-lg font-medium text-foreground">Prescription History</h3>
            </div>
            <p className="text-sm text-muted-foreground">Access and manage all prescription history</p>
          </div>

          {/* Lab Results */}
          <div className="bg-card border border-border rounded-md p-6 hover:bg-secondary transition-colors cursor-pointer">
            <div className="flex items-center mb-2">
              <FileText className="h-5 w-5 text-muted-foreground mr-3" />
              <h3 className="text-lg font-medium text-foreground">Lab Results</h3>
            </div>
            <p className="text-sm text-muted-foreground">Access and manage all lab results</p>
          </div>

          {/* Imaging Reports */}
          <div className="bg-card border border-border rounded-md p-6 hover:bg-secondary transition-colors cursor-pointer">
            <div className="flex items-center mb-2">
              <FileText className="h-5 w-5 text-muted-foreground mr-3" />
              <h3 className="text-lg font-medium text-foreground">Imaging Reports</h3>
            </div>
            <p className="text-sm text-muted-foreground">Access and manage all imaging reports</p>
          </div>
        </div>
      </div>
    </AppLayoutSpruce>
  );
}
