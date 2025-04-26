import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import BaseLayout from '@/components/layout/BaseLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, FileText, RefreshCw, Zap, FormInput, UserRound } from 'lucide-react';
import { format } from 'date-fns';
import formsiteService, { FormSiteSubmission } from '@/services/formsite';
import { getFieldLabel, formatFieldValue } from '@/services/formsiteFieldMapping';
import { PseudonymLookup } from '@/components/pseudonym-lookup';

const FormsitePage: React.FC = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<FormSiteSubmission | null>(null);

  // Fetch all form submissions
  const {
    data: submissions = [],
    isLoading: isLoadingSubmissions,
    error: submissionsError,
    refetch: refetchSubmissions,
  } = useQuery({
    queryKey: ['/api/formsite/submissions'],
    queryFn: async () => {
      try {
        return await formsiteService.getFormSubmissions();
      } catch (error) {
        console.error('Error fetching FormSite submissions:', error);
        throw error;
      }
    },
  });

  // Fetch submission details when a submission is selected
  const {
    data: submissionDetails,
    isLoading: isLoadingDetails,
    error: detailsError,
  } = useQuery({
    queryKey: ['/api/formsite/submissions', selectedSubmission?.id],
    queryFn: async () => {
      if (!selectedSubmission?.id) return null;
      return await formsiteService.getFormSubmission(selectedSubmission.id);
    },
    enabled: !!selectedSubmission?.id,
  });

  // Process submission with AI mutation
  const processSubmissionMutation = useMutation({
    mutationFn: async (submissionId: string) => {
      return await formsiteService.processFormSubmission(submissionId);
    },
    onSuccess: (data) => {
      // Update the selected submission with the processed content
      if (selectedSubmission) {
        setSelectedSubmission({
          ...selectedSubmission,
          processed: true,
          aiProcessedContent: data.aiContent,
        });
      }
      toast({
        title: 'Form Processed',
        description: 'The form submission has been processed successfully.',
      });
      // Invalidate the submissions query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/formsite/submissions'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Processing Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Handle search submissions
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      // If search query is empty, fetch all submissions
      refetchSubmissions();
      return;
    }

    try {
      const results = await formsiteService.searchFormSubmissions(searchQuery);
      
      // Ensure results is an array before updating the state
      const formattedResults = Array.isArray(results) 
        ? results 
        : 'results' in results && Array.isArray(results.results)
          ? results.results
          : [];
      
      // Temporarily update the submissions data with search results
      queryClient.setQueryData(['/api/formsite/submissions'], formattedResults);
    } catch (error) {
      console.error('Error searching submissions:', error);
      toast({
        title: 'Search Failed',
        description: 'Failed to search form submissions',
        variant: 'destructive',
      });
    }
  };

  // Handle processing a submission with AI
  const handleProcessSubmission = (submissionId: string) => {
    processSubmissionMutation.mutate(submissionId);
  };

  // Handle selecting a submission for viewing
  const handleSelectSubmission = (submission: FormSiteSubmission) => {
    setSelectedSubmission(submission);
  };

  // Format date string
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return dateString;
    }
  };

  // Get a preview of form content - only show the Patient ID (field 5)
  const getFormPreview = (results: Record<string, any>) => {
    const entries = Object.entries(results);
    if (entries.length === 0) return 'No patient ID available';

    // Find the patient ID field (field 5)
    for (const [key, value] of entries) {
      // Extract the field ID
      let fieldId = key;
      if (typeof key === 'string') {
        // Handle keys in various formats like "items[0][id]:2" or just "2"
        fieldId = key.includes('[id]') 
          ? key.split('[id]')[1].replace(/[^\d]/g, '') 
          : key.includes(':')
            ? key.split(':')[0]
            : key;
      }
      
      // If this is field 5 (Patient ID), return just its value
      if (fieldId === '5') {
        // Format the value for display
        let displayValue = value;
        if (typeof value === 'object') {
          if (value.value !== undefined) {
            displayValue = value.value;
          } else {
            displayValue = JSON.stringify(value);
          }
        }
        
        return String(displayValue);
      }
    }

    return 'Patient ID not found';
  };

  // Render the submissions list (with error handling for non-array data)
  const renderSubmissionsList = () => {
    // Make sure submissions is an array before mapping
    if (!Array.isArray(submissions)) {
      return (
        <div className="py-10 text-center">
          <p className="text-gray-400">Invalid data format received</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetchSubmissions()}
            className="mt-2"
          >
            Refresh Data
          </Button>
        </div>
      );
    }

    if (submissions.length === 0) {
      return (
        <div className="py-10 text-center">
          <p className="text-gray-400">No form submissions found</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {submissions.map((submission) => {
          // Get the patient ID
          const patientId = getFormPreview(submission.results);
          
          return (
            <div
              key={submission.id}
              onClick={() => handleSelectSubmission(submission)}
              className={`p-3 rounded-md cursor-pointer transition-colors ${
                selectedSubmission?.id === submission.id 
                  ? 'bg-blue-900/30 border border-blue-700' 
                  : 'bg-[#252525] border border-[#333] hover:border-[#444]'
              }`}
            >
              <div className="flex flex-col">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-2xl text-blue-400">
                    {patientId}
                  </h3>
                  
                  {submission.processed && (
                    <div className="bg-blue-900/50 text-blue-400 px-2 py-0.5 rounded text-xs font-medium">
                      Processed
                    </div>
                  )}
                </div>
                
                <p className="text-xs text-gray-500 mt-1">
                  Submission ID: {submission.id}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <BaseLayout>
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center">
          <FormInput className="h-6 w-6 mr-2 text-blue-500" />
          <h1 className="text-2xl font-bold">formsite</h1>
        </div>
        <div className="flex space-x-2">
          {/* Refresh Button */}
          <Button 
            onClick={() => refetchSubmissions()}
            disabled={isLoadingSubmissions}
            variant="outline"
            size="sm"
            className="border border-gray-700 hover:bg-gray-800 transition-all duration-200"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingSubmissions ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Tabs for Submissions and Pseudonym Lookup */}
        <div className="bg-[#1A1A1A] rounded-lg p-4 border border-[#333] h-[calc(100vh-180px)] flex flex-col">
          <Tabs defaultValue="submissions" className="flex-grow flex flex-col">
            <TabsList className="w-full bg-[#252525] mb-4 grid grid-cols-2">
              <TabsTrigger value="submissions" className="flex items-center gap-2">
                <FormInput className="h-4 w-4" />
                Generated Patient IDs
              </TabsTrigger>
              <TabsTrigger value="pseudonym" className="flex items-center gap-2">
                <UserRound className="h-4 w-4" />
                Pseudonym Lookup
              </TabsTrigger>
            </TabsList>
            
            {/* Submissions Tab */}
            <TabsContent value="submissions" className="flex-grow data-[state=active]:flex flex-col mt-0">
              <div className="mb-4">
                <p className="text-sm text-gray-400 mb-3">
                  View and process patient information by their generated ID
                </p>
                
                {/* Search Input */}
                <div className="relative">
                  <Input
                    placeholder="Search patient IDs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10 bg-[#252525] border-[#444]"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
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
              
              {/* Submissions List */}
              <ScrollArea className="flex-grow pr-2">
                {isLoadingSubmissions ? (
                  <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  </div>
                ) : submissionsError ? (
                  <div className="py-10 text-center">
                    <p className="text-gray-400 mb-2">Failed to load form submissions</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => refetchSubmissions()}
                    >
                      Try Again
                    </Button>
                  </div>
                ) : renderSubmissionsList()}
              </ScrollArea>
            </TabsContent>
            
            {/* Pseudonym Lookup Tab */}
            <TabsContent value="pseudonym" className="flex-grow data-[state=active]:flex flex-col mt-0">
              <PseudonymLookup />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Submission Details */}
        <div className="bg-[#1A1A1A] rounded-lg p-4 border border-[#333] h-[calc(100vh-180px)] flex flex-col">
          {!selectedSubmission ? (
            <div className="flex-grow flex flex-col items-center justify-center text-center">
              <FileText className="h-16 w-16 mb-4 text-gray-600" />
              <h3 className="text-xl font-medium mb-2">No submission selected</h3>
              <p className="text-gray-400 max-w-md">
                Select a form submission from the list to view details and process with AI
              </p>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-lg font-semibold">
                    Submission #{selectedSubmission.reference || selectedSubmission.id}
                  </h2>
                  <p className="text-sm text-gray-400">
                    Submitted on {formatDate(selectedSubmission.date_submitted)}
                  </p>
                </div>
                <Button
                  onClick={() => handleProcessSubmission(selectedSubmission.id)}
                  disabled={processSubmissionMutation.isPending}
                  variant="default"
                  className="bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  {processSubmissionMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" /> Process with AI
                    </>
                  )}
                </Button>
              </div>
              
              <Tabs defaultValue="form-data" className="flex-grow flex flex-col">
                <TabsList className="w-full bg-[#252525] mb-4">
                  <TabsTrigger value="form-data" className="flex-1">Form Data</TabsTrigger>
                  <TabsTrigger value="ai-content" className="flex-1">AI Processed Content</TabsTrigger>
                </TabsList>

                <TabsContent value="form-data" className="flex-grow data-[state=active]:flex flex-col mt-0">
                  <ScrollArea className="flex-grow pr-2">
                    {isLoadingDetails ? (
                      <div className="flex justify-center items-center h-40">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                      </div>
                    ) : detailsError ? (
                      <div className="py-10 text-center">
                        <p className="text-gray-400">Failed to load submission details</p>
                      </div>
                    ) : !selectedSubmission.results || Object.keys(selectedSubmission.results).length === 0 ? (
                      <div className="py-10 text-center">
                        <p className="text-gray-400">No form data available</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {Object.entries(selectedSubmission.results).map(([key, value]) => {
                          // Extract the field ID
                          const fieldId = key.includes(':') ? key.split(':')[0] : key;
                          // Get human-readable label for the field
                          const fieldLabel = getFieldLabel(fieldId);
                          
                          return (
                            <div key={key} className="border-b border-[#333] pb-3 last:border-b-0">
                              <h4 className="font-medium text-gray-300">{fieldLabel}</h4>
                              <div className="mt-1 text-gray-200 whitespace-pre-wrap font-mono text-sm bg-[#252525] rounded p-2">
                                {formatFieldValue(value)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="ai-content" className="flex-grow data-[state=active]:flex flex-col mt-0">
                  <ScrollArea className="flex-grow pr-2">
                    {selectedSubmission.processed && selectedSubmission.aiProcessedContent ? (
                      <div 
                        className="prose prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ 
                          __html: selectedSubmission.aiProcessedContent 
                        }}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-60 text-center">
                        <p className="text-gray-400 mb-4">
                          This submission has not been processed with AI yet
                        </p>
                        <Button
                          onClick={() => handleProcessSubmission(selectedSubmission.id)}
                          disabled={processSubmissionMutation.isPending}
                          variant="default"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {processSubmissionMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...
                            </>
                          ) : (
                            <>
                              <Zap className="h-4 w-4 mr-2" /> Process Now
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </div>
    </BaseLayout>
  );
};

export default FormsitePage;