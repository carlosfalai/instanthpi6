import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, AlertCircle, CheckCircle, FileText, RefreshCw } from "lucide-react";
import BaseLayout from '@/components/layout/BaseLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

interface InsuranceDocument {
  id: string;
  patientName: string;
  dateReceived: string;
  status: 'pending' | 'processed' | 'needs_info';
  documentType: string; // e.g., 'claim', 'prior_authorization', 'coverage', etc.
  pdfUrl: string;
  emailSource: string;
  aiProcessed: boolean;
  aiConfidence: number;
  processingNotes?: string;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'pending':
      return <Badge variant="outline" className="bg-yellow-900/20 text-yellow-500 border-yellow-800">Pending</Badge>;
    case 'processed':
      return <Badge variant="outline" className="bg-green-900/20 text-green-500 border-green-800">Processed</Badge>;
    case 'needs_info':
      return <Badge variant="outline" className="bg-red-900/20 text-red-500 border-red-800">Needs Info</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function InsurancePaperworkPage() {
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<InsuranceDocument | null>(null);
  const [processingStatus, setProcessingStatus] = useState<'pending' | 'processed' | 'needs_info'>('pending');
  const [processingNotes, setProcessingNotes] = useState('');
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const { toast } = useToast();

  // Fetch all insurance documents
  const {
    data: documents,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery<InsuranceDocument[]>({
    queryKey: ['/api/insurance-documents'],
    queryFn: async () => {
      const response = await fetch('/api/insurance-documents');
      if (!response.ok) {
        throw new Error('Failed to fetch insurance documents');
      }
      return response.json();
    }
  });

  // Process document mutation
  const processMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes: string }) => {
      const response = await fetch(`/api/insurance-documents/${id}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, notes }),
      });

      if (!response.ok) {
        throw new Error('Failed to process document');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/insurance-documents'] });
      setIsProcessDialogOpen(false);
      toast({
        title: 'Success',
        description: 'Document processed successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Check email for new insurance documents
  const checkEmailMutation = useMutation({
    mutationFn: async () => {
      setIsCheckingEmail(true);
      const response = await fetch('/api/insurance-documents/check-email', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to check email');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setIsCheckingEmail(false);
      queryClient.invalidateQueries({ queryKey: ['/api/insurance-documents'] });
      toast({
        title: 'Email Check Complete',
        description: `${data.count} new insurance documents found`,
      });
    },
    onError: (error: Error) => {
      setIsCheckingEmail(false);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleViewDocument = (document: InsuranceDocument) => {
    setSelectedDocument(document);
    setIsViewDialogOpen(true);
  };

  const handleProcessDocument = (document: InsuranceDocument) => {
    setSelectedDocument(document);
    setProcessingStatus(document.status);
    setProcessingNotes(document.processingNotes || '');
    setIsProcessDialogOpen(true);
  };

  const handleSubmitProcessing = () => {
    if (selectedDocument) {
      processMutation.mutate({
        id: selectedDocument.id,
        status: processingStatus,
        notes: processingNotes,
      });
    }
  };

  const pendingDocuments = documents?.filter(doc => doc.status === 'pending') || [];
  const processedDocuments = documents?.filter(doc => doc.status === 'processed') || [];
  const needsInfoDocuments = documents?.filter(doc => doc.status === 'needs_info') || [];

  return (
    <BaseLayout>
      <div className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Insurance Paperwork</h1>
            <p className="text-gray-400">
              Manage and process patient insurance documents
            </p>
          </div>
          <Button 
            onClick={() => checkEmailMutation.mutate()} 
            disabled={isCheckingEmail}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isCheckingEmail ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Check Email
              </>
            )}
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full bg-[#252525]" />
            <Skeleton className="h-64 w-full bg-[#252525]" />
          </div>
        ) : isError ? (
          <Card className="mb-6 bg-[#1A1A1A] border-[#333]">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center flex-col">
                <AlertCircle className="h-12 w-12 text-red-500 mb-2" />
                <h3 className="text-xl font-medium">Error loading insurance documents</h3>
                <p className="text-gray-400">{error?.message}</p>
                <Button 
                  className="mt-4" 
                  variant="outline" 
                  onClick={() => refetch()}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Document List */}
            <div className="bg-[#1A1A1A] rounded-lg p-4 border border-[#333] h-[calc(100vh-180px)] flex flex-col">
              <Tabs 
                defaultValue="pending" 
                className="flex-grow flex flex-col"
              >
                <TabsList className="w-full bg-[#252525] mb-4 grid grid-cols-3">
                  <TabsTrigger value="pending">
                    Pending ({pendingDocuments.length})
                  </TabsTrigger>
                  <TabsTrigger value="processed">
                    Processed ({processedDocuments.length})
                  </TabsTrigger>
                  <TabsTrigger value="needs_info">
                    Needs Info ({needsInfoDocuments.length})
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="pending" className="flex-grow data-[state=active]:flex flex-col mt-0">
                  <ScrollArea className="flex-grow pr-2">
                    {pendingDocuments.length === 0 ? (
                      <div className="py-10 text-center">
                        <p className="text-gray-400">No pending documents found</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {pendingDocuments.map((doc) => (
                          <div
                            key={doc.id}
                            onClick={() => setSelectedDocument(doc)}
                            className={`p-3 rounded-md cursor-pointer transition-colors ${
                              selectedDocument?.id === doc.id 
                                ? 'bg-blue-900/30 border border-blue-700' 
                                : 'bg-[#252525] border border-[#333] hover:border-[#444]'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium text-lg">
                                  {doc.patientName}
                                </h3>
                                <p className="text-sm text-gray-400">
                                  {doc.documentType}
                                </p>
                                <div className="flex items-center space-x-2 mt-1">
                                  <p className="text-xs text-gray-500">
                                    {formatDate(doc.dateReceived)}
                                  </p>
                                  {getStatusBadge(doc.status)}
                                </div>
                              </div>
                              <div>
                                {doc.aiProcessed && (
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
                
                <TabsContent value="processed" className="flex-grow data-[state=active]:flex flex-col mt-0">
                  <ScrollArea className="flex-grow pr-2">
                    {processedDocuments.length === 0 ? (
                      <div className="py-10 text-center">
                        <p className="text-gray-400">No processed documents found</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {processedDocuments.map((doc) => (
                          <div
                            key={doc.id}
                            onClick={() => setSelectedDocument(doc)}
                            className={`p-3 rounded-md cursor-pointer transition-colors ${
                              selectedDocument?.id === doc.id 
                                ? 'bg-blue-900/30 border border-blue-700' 
                                : 'bg-[#252525] border border-[#333] hover:border-[#444]'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium text-lg">
                                  {doc.patientName}
                                </h3>
                                <p className="text-sm text-gray-400">
                                  {doc.documentType}
                                </p>
                                <div className="flex items-center space-x-2 mt-1">
                                  <p className="text-xs text-gray-500">
                                    {formatDate(doc.dateReceived)}
                                  </p>
                                  {getStatusBadge(doc.status)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="needs_info" className="flex-grow data-[state=active]:flex flex-col mt-0">
                  <ScrollArea className="flex-grow pr-2">
                    {needsInfoDocuments.length === 0 ? (
                      <div className="py-10 text-center">
                        <p className="text-gray-400">No documents needing information found</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {needsInfoDocuments.map((doc) => (
                          <div
                            key={doc.id}
                            onClick={() => setSelectedDocument(doc)}
                            className={`p-3 rounded-md cursor-pointer transition-colors ${
                              selectedDocument?.id === doc.id 
                                ? 'bg-blue-900/30 border border-blue-700' 
                                : 'bg-[#252525] border border-[#333] hover:border-[#444]'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium text-lg">
                                  {doc.patientName}
                                </h3>
                                <p className="text-sm text-gray-400">
                                  {doc.documentType}
                                </p>
                                <div className="flex items-center space-x-2 mt-1">
                                  <p className="text-xs text-gray-500">
                                    {formatDate(doc.dateReceived)}
                                  </p>
                                  {getStatusBadge(doc.status)}
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

            {/* Right Column - Document Viewer and Actions */}
            <div className="bg-[#1A1A1A] rounded-lg p-4 border border-[#333] h-[calc(100vh-180px)] flex flex-col">
              {!selectedDocument ? (
                <div className="flex-grow flex flex-col items-center justify-center text-center">
                  <FileText className="h-16 w-16 mb-4 text-gray-600" />
                  <h3 className="text-xl font-medium mb-2">No document selected</h3>
                  <p className="text-gray-400 max-w-md">
                    Select an insurance document from the list to view details and process it
                  </p>
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-xl font-bold">{selectedDocument.patientName}</h2>
                      <p className="text-gray-400">
                        Document: <span className="text-white">{selectedDocument.documentType}</span>
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <p className="text-xs text-gray-500">
                          Received: {formatDate(selectedDocument.dateReceived)}
                        </p>
                        {getStatusBadge(selectedDocument.status)}
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(selectedDocument.pdfUrl, '_blank')}
                      className="border-[#444] hover:bg-[#252525]"
                    >
                      View PDF
                    </Button>
                  </div>

                  {/* PDF Viewer */}
                  <div className="flex-grow rounded overflow-hidden border border-[#333] bg-[#252525] mb-4">
                    <iframe
                      src={selectedDocument.pdfUrl}
                      className="w-full h-full"
                      title="PDF Viewer"
                    />
                  </div>

                  {/* Notes and Actions */}
                  <div>
                    {selectedDocument.processingNotes && (
                      <div className="mb-4">
                        <Label className="text-gray-400">Processing Notes</Label>
                        <div className="mt-1 border border-[#333] rounded-md p-3 bg-[#252525] text-gray-300 max-h-32 overflow-y-auto">
                          {selectedDocument.processingNotes}
                        </div>
                      </div>
                    )}
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        className="border-[#444] hover:bg-[#252525]"
                        onClick={() => handleViewDocument(selectedDocument)}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        View Details
                      </Button>
                      <Button
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => handleProcessDocument(selectedDocument)}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Process Document
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* View Document Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-4xl bg-[#1A1A1A] border-[#333]">
            <DialogHeader>
              <DialogTitle>Document Details</DialogTitle>
              <DialogDescription className="text-gray-400">
                Viewing complete insurance document information
              </DialogDescription>
            </DialogHeader>
            
            {selectedDocument && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="mb-4">
                    <Label className="text-gray-400">Patient Name</Label>
                    <div className="text-lg font-medium">{selectedDocument.patientName}</div>
                  </div>
                  <div className="mb-4">
                    <Label className="text-gray-400">Document Type</Label>
                    <div>{selectedDocument.documentType}</div>
                  </div>
                  <div className="mb-4">
                    <Label className="text-gray-400">Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedDocument.status)}</div>
                  </div>
                  <div className="mb-4">
                    <Label className="text-gray-400">Date Received</Label>
                    <div>{formatDate(selectedDocument.dateReceived)}</div>
                  </div>
                  <div className="mb-4">
                    <Label className="text-gray-400">Email Source</Label>
                    <div>{selectedDocument.emailSource || 'N/A'}</div>
                  </div>
                  <div className="mb-4">
                    <Label className="text-gray-400">AI Processed</Label>
                    <div>{selectedDocument.aiProcessed ? 'Yes' : 'No'}</div>
                  </div>
                  {selectedDocument.aiProcessed && (
                    <div className="mb-4">
                      <Label className="text-gray-400">AI Confidence</Label>
                      <div>{(selectedDocument.aiConfidence * 100).toFixed(1)}%</div>
                    </div>
                  )}
                </div>
                <div>
                  <div className="mb-4">
                    <Label className="text-gray-400">PDF Document</Label>
                    <div className="mt-2 border rounded-md p-4 h-64 flex items-center justify-center bg-[#252525] border-[#333]">
                      <div className="text-center">
                        <FileText className="h-12 w-12 mx-auto text-gray-500" />
                        <p className="mt-2 font-medium">{selectedDocument.documentType}</p>
                        <Button 
                          className="mt-2 bg-blue-600 hover:bg-blue-700" 
                          size="sm" 
                          onClick={() => window.open(selectedDocument.pdfUrl, '_blank')}
                        >
                          View PDF
                        </Button>
                      </div>
                    </div>
                  </div>
                  {selectedDocument.processingNotes && (
                    <div className="mb-4">
                      <Label className="text-gray-400">Processing Notes</Label>
                      <div className="mt-1 border rounded-md p-2 max-h-32 overflow-y-auto bg-[#252525] border-[#333]">
                        {selectedDocument.processingNotes}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Process Document Dialog */}
        <Dialog open={isProcessDialogOpen} onOpenChange={setIsProcessDialogOpen}>
          <DialogContent className="bg-[#1A1A1A] border-[#333]">
            <DialogHeader>
              <DialogTitle>Process Insurance Document</DialogTitle>
              <DialogDescription className="text-gray-400">
                Update the status and add processing notes for this document
              </DialogDescription>
            </DialogHeader>
            
            {selectedDocument && (
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-400" htmlFor="patient-name">Patient</Label>
                  <Input 
                    id="patient-name"
                    value={selectedDocument.patientName}
                    readOnly
                    className="bg-[#252525] border-[#444] text-white"
                  />
                </div>
                
                <div>
                  <Label className="text-gray-400" htmlFor="document-type">Document Type</Label>
                  <Input 
                    id="document-type"
                    value={selectedDocument.documentType}
                    readOnly
                    className="bg-[#252525] border-[#444] text-white"
                  />
                </div>
                
                <div>
                  <Label className="text-gray-400" htmlFor="status">Status</Label>
                  <Select
                    value={processingStatus}
                    onValueChange={(value) => setProcessingStatus(value as any)}
                  >
                    <SelectTrigger id="status" className="bg-[#252525] border-[#444] text-white">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1A1A] border-[#333]">
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processed">Processed</SelectItem>
                      <SelectItem value="needs_info">Needs More Information</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-gray-400" htmlFor="notes">Processing Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add processing notes here..."
                    value={processingNotes}
                    onChange={(e) => setProcessingNotes(e.target.value)}
                    rows={5}
                    className="bg-[#252525] border-[#444] text-white resize-none"
                  />
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsProcessDialogOpen(false)}
                className="border-[#444] hover:bg-[#252525]"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSubmitProcessing}
                disabled={processMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {processMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Update Status
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </BaseLayout>
  );
}