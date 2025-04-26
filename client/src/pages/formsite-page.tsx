import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import BaseLayout from '@/components/layout/BaseLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, FileText, RefreshCw, Zap } from 'lucide-react';
import { format } from 'date-fns';
import formsiteService, { FormSiteSubmission } from '@/services/formsite';

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
      // Temporarily update the submissions data with search results
      queryClient.setQueryData(['/api/formsite/submissions'], results);
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
      return format(new Date(dateString), 'PPP');
    } catch (error) {
      return dateString;
    }
  };

  // Get a preview of form content
  const getFormPreview = (results: Record<string, any>) => {
    const entries = Object.entries(results);
    if (entries.length === 0) return 'No form data';

    // Get the first few form fields for preview
    const preview = entries.slice(0, 3).map(([key, value]) => {
      // Try to extract the question if it's in a complex format
      let question = key;
      if (typeof key === 'string' && key.includes(':')) {
        question = key.split(':')[1];
      }
      return `${question}: ${value}`;
    }).join(', ');

    return entries.length > 3 ? `${preview}...` : preview;
  };

  return (
    <BaseLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">FormSite Submissions</h1>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => refetchSubmissions()}
              disabled={isLoadingSubmissions}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingSubmissions ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left column - Submissions list */}
          <Card className="h-[calc(100vh-200px)] flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle>Form Submissions</CardTitle>
              <CardDescription>
                View and process patient form submissions from FormSite
              </CardDescription>
              <div className="relative mt-2">
                <Input
                  placeholder="Search submissions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
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
            </CardHeader>
            <CardContent className="pb-3 flex-grow overflow-hidden">
              <ScrollArea className="h-full pr-4">
                {isLoadingSubmissions ? (
                  <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : submissionsError ? (
                  <div className="py-10 text-center text-muted-foreground">
                    <p>Failed to load form submissions</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => refetchSubmissions()}
                    >
                      Try Again
                    </Button>
                  </div>
                ) : submissions.length === 0 ? (
                  <div className="py-10 text-center text-muted-foreground">
                    <p>No form submissions found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {submissions.map((submission) => (
                      <Card
                        key={submission.id}
                        className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                          selectedSubmission?.id === submission.id ? 'border-primary' : ''
                        }`}
                        onClick={() => handleSelectSubmission(submission)}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-medium">
                                Submission #{submission.reference || submission.id}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(submission.date_submitted)}
                              </p>
                            </div>
                            {submission.processed && (
                              <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                                Processed
                              </div>
                            )}
                          </div>
                          <p className="text-sm truncate">
                            {getFormPreview(submission.results)}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Right column - Submission details and AI processing */}
          <Card className="h-[calc(100vh-200px)] flex flex-col">
            {!selectedSubmission ? (
              <div className="flex-grow flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mb-4" />
                <h3 className="text-lg font-medium mb-2">No submission selected</h3>
                <p>Select a form submission from the list to view details and process with AI</p>
              </div>
            ) : (
              <>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle>Submission #{selectedSubmission.reference || selectedSubmission.id}</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleProcessSubmission(selectedSubmission.id)}
                      disabled={processSubmissionMutation.isPending}
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
                  <CardDescription>
                    Submitted on {formatDate(selectedSubmission.date_submitted)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow overflow-hidden p-0">
                  <Tabs defaultValue="form-data">
                    <div className="px-6">
                      <TabsList className="w-full">
                        <TabsTrigger value="form-data" className="flex-1">Form Data</TabsTrigger>
                        <TabsTrigger value="ai-content" className="flex-1">AI Processed Content</TabsTrigger>
                      </TabsList>
                    </div>

                    <TabsContent value="form-data" className="mt-0 flex-grow h-[calc(100%-48px)]">
                      <ScrollArea className="h-full px-6 py-4">
                        {isLoadingDetails ? (
                          <div className="flex justify-center items-center h-40">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                          </div>
                        ) : detailsError ? (
                          <div className="py-10 text-center text-muted-foreground">
                            <p>Failed to load submission details</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {Object.entries(selectedSubmission.results).map(([key, value]) => {
                              // Try to extract the question if it's in a complex format
                              let question = key;
                              if (typeof key === 'string' && key.includes(':')) {
                                question = key.split(':')[1];
                              }
                              
                              return (
                                <div key={key} className="border-b pb-3 last:border-b-0">
                                  <h4 className="font-medium">{question}</h4>
                                  <p className="mt-1">{value || 'No response'}</p>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value="ai-content" className="mt-0 flex-grow h-[calc(100%-48px)]">
                      <ScrollArea className="h-full px-6 py-4">
                        {selectedSubmission.processed && selectedSubmission.aiProcessedContent ? (
                          <div 
                            className="prose max-w-none"
                            dangerouslySetInnerHTML={{ 
                              __html: selectedSubmission.aiProcessedContent 
                            }}
                          />
                        ) : (
                          <div className="py-10 text-center">
                            <p className="text-muted-foreground mb-4">
                              This submission has not been processed with AI yet
                            </p>
                            <Button
                              onClick={() => handleProcessSubmission(selectedSubmission.id)}
                              disabled={processSubmissionMutation.isPending}
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
                </CardContent>
              </>
            )}
          </Card>
        </div>
      </div>
    </BaseLayout>
  );
};

export default FormsitePage;