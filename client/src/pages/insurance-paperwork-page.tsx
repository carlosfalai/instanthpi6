import React, { useState, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Search, 
  FileText, 
  Download, 
  Check, 
  X, 
  AlertCircle,
  Loader2,
  HelpCircle,
  ClipboardList
} from 'lucide-react';
import BaseLayout from '@/components/layout/BaseLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';

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

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(date);
};

const getStatusBadge = (status: InsuranceDocument['status']) => {
  switch (status) {
    case 'pending':
      return <Badge variant="outline" className="bg-yellow-900/30 text-yellow-300 border-yellow-700">Pending</Badge>;
    case 'processed':
      return <Badge variant="outline" className="bg-green-900/30 text-green-300 border-green-700">Processed</Badge>;
    case 'needs_info':
      return <Badge variant="outline" className="bg-purple-900/30 text-purple-300 border-purple-700">Needs Info</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

const InsurancePaperworkPage: React.FC = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocument, setSelectedDocument] = useState<InsuranceDocument | null>(null);
  const [currentTab, setCurrentTab] = useState<'pending' | 'processed'>('pending');
  const [processingNotes, setProcessingNotes] = useState('');
  const pdfViewerRef = useRef<HTMLIFrameElement>(null);

  // Fetch insurance documents
  const {
    data: documents = [],
    isLoading,
    error,
    refetch
  } = useQuery<InsuranceDocument[]>({
    queryKey: ['/api/insurance-documents'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/insurance-documents');
        if (!response.ok) throw new Error('Failed to fetch insurance documents');
        return await response.json();
      } catch (error) {
        console.error('Error fetching insurance documents:', error);
        // Return mock data for development
        return [
          {
            id: '1',
            patientName: 'Jane Smith',
            dateReceived: new Date().toISOString(),
            status: 'pending',
            documentType: 'Insurance Claim Form',
            pdfUrl: '/sample-documents/insurance-claim.pdf',
            emailSource: 'claims@insurance.com',
            aiProcessed: true,
            aiConfidence: 0.89,
          },
          {
            id: '2',
            patientName: 'John Doe',
            dateReceived: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            status: 'pending',
            documentType: 'Prior Authorization Request',
            pdfUrl: '/sample-documents/prior-auth.pdf',
            emailSource: 'patient@email.com',
            aiProcessed: true,
            aiConfidence: 0.76,
          }
        ];
      }
    },
  });

  // Process document mutation
  const processDocumentMutation = useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      notes 
    }: { 
      id: string; 
      status: InsuranceDocument['status']; 
      notes?: string 
    }) => {
      try {
        const response = await apiRequest('POST', `/api/insurance-documents/${id}/process`, {
          status,
          notes
        });
        return response;
      } catch (error) {
        console.error('Error processing insurance document:', error);
        throw new Error('Failed to process insurance document');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/insurance-documents'] });
      toast({
        title: 'Document processed',
        description: 'The insurance document has been updated.',
      });
      setSelectedDocument(null);
      setProcessingNotes('');
    },
    onError: (error: Error) => {
      toast({
        title: 'Processing failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Check email for new insurance documents
  const checkEmailMutation = useMutation({
    mutationFn: async () => {
      try {
        const response = await apiRequest('POST', '/api/insurance-documents/check-email', {});
        return response;
      } catch (error) {
        console.error('Error checking email for insurance documents:', error);
        throw new Error('Failed to check email for new insurance documents');
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/insurance-documents'] });
      toast({
        title: 'Email Checked',
        description: `Found ${data.count} new insurance documents.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Check Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleProcessDocument = (status: InsuranceDocument['status']) => {
    if (!selectedDocument) return;
    
    processDocumentMutation.mutate({
      id: selectedDocument.id,
      status,
      notes: processingNotes
    });
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          doc.documentType.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = currentTab === 'pending' ? doc.status !== 'processed' : doc.status === 'processed';
    return matchesSearch && matchesTab;
  });

  return (
    <BaseLayout>
      <div className="px-6 py-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Insurance Paperwork</h1>
            <p className="text-gray-400">Review and process insurance documents from patients</p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => checkEmailMutation.mutate()}
              disabled={checkEmailMutation.isPending}
            >
              {checkEmailMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Check Email
            </Button>
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Document List */}
          <div>
            <div className="mb-4">
              <Input
                placeholder="Search by patient name or document type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#252525] border-[#333]"
              />
            </div>

            <Tabs defaultValue="pending" value={currentTab} onValueChange={(v) => setCurrentTab(v as 'pending' | 'processed')}>
              <TabsList className="mb-4 bg-[#252525]">
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="processed">Processed</TabsTrigger>
              </TabsList>
              
              <TabsContent value="pending" className="m-0">
                <ScrollArea className="h-[calc(100vh-310px)]">
                  {isLoading ? (
                    <div className="flex justify-center items-center h-32">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                  ) : filteredDocuments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center h-32">
                      <FileText className="h-8 w-8 mb-2 text-gray-600" />
                      <h3 className="text-lg font-medium mb-1">No documents found</h3>
                      <p className="text-gray-400 text-sm">
                        {searchQuery ? 'Try a different search term' : 'Check email for new insurance documents'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredDocuments.map((doc) => (
                        <div
                          key={doc.id}
                          onClick={() => {
                            setSelectedDocument(doc);
                            setProcessingNotes(doc.processingNotes || '');
                          }}
                          className={`cursor-pointer p-4 rounded-lg transition-colors ${
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

          {/* Right Column - PDF Viewer and Details */}
          <div className="bg-[#1A1A1A] rounded-lg p-4 border border-[#333] h-[calc(100vh-180px)] flex flex-col">
            {!selectedDocument ? (
              <div className="flex-grow flex flex-col items-center justify-center text-center">
                <FileText className="h-16 w-16 mb-4 text-gray-600" />
                <h3 className="text-xl font-medium mb-2">No document selected</h3>
                <p className="text-gray-400 max-w-md">
                  Select an insurance document from the list to view details and process
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
                  >
                    <Download className="h-4 w-4 mr-1" /> Download
                  </Button>
                </div>
                
                <div className="bg-[#252525] rounded border border-[#333] p-2 mb-4">
                  <div className="flex items-center text-sm mb-2">
                    <ClipboardList className="h-4 w-4 mr-1 text-blue-400" />
                    <span className="text-blue-400 font-medium">AI Analysis</span>
                    <div className="ml-2 px-2 py-0.5 bg-blue-900/30 border border-blue-800 rounded text-xs">
                      {Math.round(selectedDocument.aiConfidence * 100)}% confidence
                    </div>
                  </div>
                </div>
                
                <div className="flex-grow mb-4 h-0 border border-[#333] rounded">
                  <iframe
                    ref={pdfViewerRef}
                    src={selectedDocument.pdfUrl}
                    className="w-full h-full bg-[#252525] rounded"
                    title="PDF Viewer"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Processing Notes</label>
                  <Textarea
                    value={processingNotes}
                    onChange={(e) => setProcessingNotes(e.target.value)}
                    placeholder="Add any notes about this document..."
                    className="bg-[#252525] border-[#333] resize-none"
                    rows={2}
                  />
                </div>
                
                <div className="flex space-x-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => handleProcessDocument('needs_info')}
                    disabled={processDocumentMutation.isPending}
                  >
                    <HelpCircle className="h-4 w-4 mr-1 text-purple-400" />
                    <span className="text-purple-400">Needs Info</span>
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      const confirmDelete = window.confirm(
                        "Are you sure you want to mark as 'Not Insurance'? This will remove the document from this view."
                      );
                      if (confirmDelete) {
                        handleProcessDocument('processed');
                      }
                    }}
                    disabled={processDocumentMutation.isPending}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Not Insurance
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => handleProcessDocument('processed')}
                    disabled={processDocumentMutation.isPending}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Mark Processed
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </BaseLayout>
  );
};

export default InsurancePaperworkPage;