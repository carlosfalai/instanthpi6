import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, Search, Loader2, AlertCircle, Download, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import ModernLayout from "@/components/layout/ModernLayout";
import { format } from "date-fns";

interface Document {
  id: string;
  patientName: string;
  documentType: string;
  createdAt: string;
  fileUrl: string;
  fileSize?: number;
  status?: string;
}

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  // Fetch documents
  const {
    data: documents = [],
    isLoading,
    error,
  } = useQuery<Document[]>({
    queryKey: ["/api/documents", searchQuery],
    queryFn: async () => {
      try {
        const url = searchQuery
          ? `/api/documents?search=${encodeURIComponent(searchQuery)}`
          : "/api/documents";
        const response = await fetch(url);
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Error fetching documents:", response.status, errorText);
          if (response.status === 404) {
            return [];
          }
          throw new Error(`Failed to fetch documents: ${response.status}`);
        }
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Error fetching documents:", error);
        return [];
      }
    },
    retry: 1,
  });

  const filteredDocuments = documents.filter((doc) =>
    searchQuery
      ? doc.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.documentType?.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  return (
    <ModernLayout title="Documents" description="Access patient documents and medical records">
      <div className="p-6">
        <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center">
          <div className="mb-4 md:mb-0">
            <h2 className="text-2xl font-medium text-foreground">Documents</h2>
            <p className="text-muted-foreground text-sm">
              Access patient documents and medical records
            </p>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent w-full"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <Card className="border-red-300 bg-red-50 dark:bg-red-950">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center flex-col">
                <AlertCircle className="h-12 w-12 text-red-500 mb-2" />
                <h3 className="text-xl font-medium">Error loading documents</h3>
                <p className="text-gray-400 mt-2">
                  Unable to fetch documents. Please try again later.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : filteredDocuments.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No documents found</h3>
                <p className="text-muted-foreground">
                  {searchQuery
                    ? "Try adjusting your search query"
                    : "Documents will appear here once they are uploaded or generated"}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocuments.map((doc) => (
              <Card key={doc.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-lg">{doc.documentType}</CardTitle>
                    </div>
                    {doc.status && (
                      <Badge variant="outline" className="text-xs">
                        {doc.status}
                      </Badge>
                    )}
                  </div>
                  <CardDescription>{doc.patientName}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Created: {format(new Date(doc.createdAt), "MMM d, yyyy")}
                    </p>
                    {doc.fileSize && (
                      <p className="text-xs text-muted-foreground">
                        Size: {(doc.fileSize / 1024).toFixed(1)} KB
                      </p>
                    )}
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(doc.fileUrl, "_blank")}
                        className="flex-1"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const link = document.createElement("a");
                          link.href = doc.fileUrl;
                          link.download = `${doc.documentType}-${doc.id}.pdf`;
                          link.click();
                        }}
                        className="flex-1"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ModernLayout>
  );
}
