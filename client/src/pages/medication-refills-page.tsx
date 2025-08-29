import React, { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import {
  Loader2,
  FileText,
  Check,
  X,
  RefreshCw,
  AlertCircle,
  Search,
  Download,
} from "lucide-react";
import { format } from "date-fns";

import AppLayoutSpruce from "@/components/layout/AppLayoutSpruce";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

// Types
interface RefillRequest {
  id: string;
  patientName: string;
  dateReceived: string;
  status: "pending" | "approved" | "denied" | "needs_info";
  medicationName: string;
  prescriptionNumber?: string;
  pharmacy?: string;
  pdfUrl: string;
  emailSource: string;
  aiProcessed: boolean;
  aiConfidence: number;
  processingNotes?: string;
}

const MedicationRefillsPage: React.FC = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRefill, setSelectedRefill] = useState<RefillRequest | null>(null);
  const [currentTab, setCurrentTab] = useState<"pending" | "processed">("pending");
  const pdfViewerRef = useRef<HTMLIFrameElement>(null);

  // Fetch medication refill requests
  const {
    data: refillRequests = [],
    isLoading,
    error,
    refetch,
  } = useQuery<RefillRequest[]>({
    queryKey: ["/api/medication-refills"],
    queryFn: async () => {
      // We'll implement this API endpoint later
      try {
        const response = await fetch("/api/medication-refills");
        if (!response.ok) throw new Error("Failed to fetch refill requests");
        return await response.json();
      } catch (error) {
        console.error("Error fetching refill requests:", error);
        throw error;
      }
    },
  });

  // Process refill request mutation
  const processRefillMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      notes,
    }: {
      id: string;
      status: RefillRequest["status"];
      notes?: string;
    }) => {
      // We'll implement this API endpoint later
      const response = await fetch(`/api/medication-refills/${id}/process`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status, notes }),
      });

      if (!response.ok) throw new Error("Failed to process refill request");
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medication-refills"] });
      toast({
        title: "Refill request processed",
        description: "The medication refill request has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Processing failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Fetch new emails mutation
  const fetchEmailsMutation = useMutation({
    mutationFn: async () => {
      // We'll implement this API endpoint later
      const response = await fetch("/api/medication-refills/check-email", {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to check emails");
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/medication-refills"] });
      toast({
        title: `${data.count} new refill requests found`,
        description: "New medication refill requests have been imported.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to check emails",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy h:mm a");
    } catch (error) {
      return dateString;
    }
  };

  // Handle search
  const handleSearch = () => {
    // For now, we'll do client-side filtering
    // In the future, this could be a server-side search
    if (!searchQuery.trim()) {
      refetch();
    }
  };

  // Handle process refill
  const handleProcessRefill = (status: RefillRequest["status"], notes?: string) => {
    if (!selectedRefill) return;

    processRefillMutation.mutate({
      id: selectedRefill.id,
      status,
      notes,
    });
  };

  // Get status badge
  const getStatusBadge = (status: RefillRequest["status"]) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-900/20 text-yellow-500 border-yellow-800">
            Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-900/20 text-green-500 border-green-800">
            Approved
          </Badge>
        );
      case "denied":
        return (
          <Badge variant="outline" className="bg-red-900/20 text-red-500 border-red-800">
            Denied
          </Badge>
        );
      case "needs_info":
        return (
          <Badge variant="outline" className="bg-blue-900/20 text-blue-500 border-blue-800">
            Needs Info
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Filter refill requests based on current tab
  const filteredRefills = refillRequests.filter((refill) => {
    if (currentTab === "pending") {
      return refill.status === "pending";
    } else {
      return refill.status !== "pending";
    }
  });

  return (
    <AppLayoutSpruce>
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Medication Refill Requests</h1>
          <p className="text-gray-400">
            Manage and process medication refill requests from pharmacies
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => fetchEmailsMutation.mutate()}
            disabled={fetchEmailsMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {fetchEmailsMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Check for New Requests
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Refill Requests List */}
        <div className="bg-[#1A1A1A] rounded-lg p-4 border border-[#333] h-[calc(100vh-180px)] flex flex-col">
          <Tabs
            defaultValue="pending"
            className="flex-grow flex flex-col"
            onValueChange={(value) => setCurrentTab(value as "pending" | "processed")}
          >
            <TabsList className="w-full bg-[#252525] mb-4 grid grid-cols-2">
              <TabsTrigger value="pending">Pending Requests</TabsTrigger>
              <TabsTrigger value="processed">Processed Requests</TabsTrigger>
            </TabsList>

            <div className="mb-4">
              <div className="relative">
                <Input
                  placeholder="Search by patient name, medication..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10 bg-[#252525] border-[#444]"
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={handleSearch}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <TabsContent
              value="pending"
              className="flex-grow data-[state=active]:flex flex-col mt-0"
            >
              <ScrollArea className="flex-grow pr-2">
                {isLoading ? (
                  <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  </div>
                ) : error ? (
                  <div className="py-10 text-center">
                    <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                    <p className="text-gray-400 mb-2">Failed to load refill requests</p>
                    <Button variant="outline" size="sm" onClick={() => refetch()}>
                      Try Again
                    </Button>
                  </div>
                ) : filteredRefills.length === 0 ? (
                  <div className="py-10 text-center">
                    <p className="text-gray-400">No pending refill requests found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredRefills.map((refill) => (
                      <div
                        key={refill.id}
                        onClick={() => setSelectedRefill(refill)}
                        className={`p-3 rounded-md cursor-pointer transition-colors ${
                          selectedRefill?.id === refill.id
                            ? "bg-blue-900/30 border border-blue-700"
                            : "bg-[#252525] border border-[#333] hover:border-[#444]"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-lg">{refill.patientName}</h3>
                            <p className="text-sm text-gray-400">{refill.medicationName}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <p className="text-xs text-gray-500">
                                {formatDate(refill.dateReceived)}
                              </p>
                              {getStatusBadge(refill.status)}
                            </div>
                          </div>
                          <div>
                            {refill.aiProcessed && (
                              <div className="text-xs bg-purple-900/30 text-purple-400 px-2 py-1 rounded">
                                AI Processed
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent
              value="processed"
              className="flex-grow data-[state=active]:flex flex-col mt-0"
            >
              <ScrollArea className="flex-grow pr-2">
                {isLoading ? (
                  <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  </div>
                ) : error ? (
                  <div className="py-10 text-center">
                    <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                    <p className="text-gray-400 mb-2">Failed to load refill requests</p>
                    <Button variant="outline" size="sm" onClick={() => refetch()}>
                      Try Again
                    </Button>
                  </div>
                ) : filteredRefills.length === 0 ? (
                  <div className="py-10 text-center">
                    <p className="text-gray-400">No processed refill requests found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredRefills.map((refill) => (
                      <div
                        key={refill.id}
                        onClick={() => setSelectedRefill(refill)}
                        className={`p-3 rounded-md cursor-pointer transition-colors ${
                          selectedRefill?.id === refill.id
                            ? "bg-blue-900/30 border border-blue-700"
                            : "bg-[#252525] border border-[#333] hover:border-[#444]"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-lg">{refill.patientName}</h3>
                            <p className="text-sm text-gray-400">{refill.medicationName}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <p className="text-xs text-gray-500">
                                {formatDate(refill.dateReceived)}
                              </p>
                              {getStatusBadge(refill.status)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - PDF Viewer and Details */}
        <div className="bg-[#1A1A1A] rounded-lg p-4 border border-[#333] h-[calc(100vh-180px)] flex flex-col">
          {!selectedRefill ? (
            <div className="flex-grow flex flex-col items-center justify-center text-center">
              <FileText className="h-16 w-16 mb-4 text-gray-600" />
              <h3 className="text-xl font-medium mb-2">No refill request selected</h3>
              <p className="text-gray-400 max-w-md">
                Select a medication refill request from the list to view details and process
              </p>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold">{selectedRefill.patientName}</h2>
                  <p className="text-gray-400">
                    Medication: <span className="text-white">{selectedRefill.medicationName}</span>
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <p className="text-xs text-gray-500">
                      Received: {formatDate(selectedRefill.dateReceived)}
                    </p>
                    {getStatusBadge(selectedRefill.status)}
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    window.open(`/api/medication-refills/${selectedRefill.id}/pdf`, "_blank")
                  }
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>

              {/* PDF Viewer */}
              <div className="flex-grow rounded overflow-hidden border border-[#333] bg-[#252525] mb-4">
                <iframe
                  ref={pdfViewerRef}
                  src={`/api/medication-refills/${selectedRefill.id}/pdf`}
                  className="w-full h-full"
                  title="PDF Viewer"
                />
              </div>

              {/* Action Buttons (only for pending requests) */}
              {selectedRefill.status === "pending" && (
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => handleProcessRefill("approved")}
                    disabled={processRefillMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {processRefillMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="mr-2 h-4 w-4" />
                    )}
                    Approve Refill
                  </Button>
                  <Button
                    onClick={() => handleProcessRefill("denied")}
                    disabled={processRefillMutation.isPending}
                    variant="destructive"
                  >
                    {processRefillMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <X className="mr-2 h-4 w-4" />
                    )}
                    Deny Refill
                  </Button>
                </div>
              )}

              {/* Processing Notes (for processed requests) */}
              {selectedRefill.status !== "pending" && selectedRefill.processingNotes && (
                <Card className="bg-[#252525] border-[#333]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Processing Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-300">{selectedRefill.processingNotes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayoutSpruce>
  );
};

export default MedicationRefillsPage;
