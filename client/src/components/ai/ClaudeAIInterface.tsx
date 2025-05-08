import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

const ClaudeAIInterface = () => {
  const [activeTab, setActiveTab] = useState('text-generation');
  const [textInput, setTextInput] = useState('');
  const [summarizeInput, setSummarizeInput] = useState('');
  const [imageAnalysisPrompt, setImageAnalysisPrompt] = useState('');
  const [imageBase64, setImageBase64] = useState('');
  const [sentimentText, setSentimentText] = useState('');
  const [medicalDocSymptoms, setMedicalDocSymptoms] = useState('');
  const [medicalDocComplaint, setMedicalDocComplaint] = useState('');
  const [treatmentDiagnosis, setTreatmentDiagnosis] = useState('');
  const [wordLimit, setWordLimit] = useState('250');
  
  const { toast } = useToast();

  // Text generation mutation
  const textGenerationMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const res = await apiRequest('POST', '/api/anthropic/generate-text', { prompt });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Text generated',
        description: 'Claude has generated a response.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to generate text: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Summarization mutation
  const summarizeMutation = useMutation({
    mutationFn: async (data: { text: string, wordLimit?: string }) => {
      const res = await apiRequest('POST', '/api/anthropic/summarize-text', {
        text: data.text,
        wordLimit: parseInt(data.wordLimit || '250'),
      });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Text summarized',
        description: 'Claude has summarized the text.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to summarize text: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Image analysis mutation
  const imageAnalysisMutation = useMutation({
    mutationFn: async (data: { imageBase64: string, prompt: string }) => {
      const res = await apiRequest('POST', '/api/anthropic/analyze-image', {
        imageBase64: data.imageBase64,
        prompt: data.prompt,
      });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Image analyzed',
        description: 'Claude has analyzed the image.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to analyze image: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Sentiment analysis mutation
  const sentimentAnalysisMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await apiRequest('POST', '/api/anthropic/analyze-sentiment', { text });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Sentiment analyzed',
        description: `Sentiment: ${data.result.sentiment} (${Math.round(data.result.confidence * 100)}% confidence)`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to analyze sentiment: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Medical documentation generation mutation
  const medicalDocMutation = useMutation({
    mutationFn: async (data: { patientData: any, options?: any }) => {
      const res = await apiRequest('POST', '/api/anthropic/generate-medical-documentation', data);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Medical documentation generated',
        description: 'Claude has generated the medical documentation.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to generate medical documentation: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Treatment plan generation mutation
  const treatmentPlanMutation = useMutation({
    mutationFn: async (data: { diagnosis: string, patientDetails?: any }) => {
      const res = await apiRequest('POST', '/api/anthropic/generate-treatment-plan', data);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Treatment plan generated',
        description: 'Claude has generated a treatment plan.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to generate treatment plan: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Handle file input for image analysis
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result?.toString().split(',')[1];
        if (base64) {
          setImageBase64(base64);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Claude 3.7 Sonnet AI Interface</CardTitle>
        <CardDescription>
          Interact with Claude AI to generate text, analyze images, summarize content, and more.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-6 mb-6">
            <TabsTrigger value="text-generation">Text Generation</TabsTrigger>
            <TabsTrigger value="summarize">Summarize</TabsTrigger>
            <TabsTrigger value="image-analysis">Image Analysis</TabsTrigger>
            <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
            <TabsTrigger value="medical-doc">Medical Doc</TabsTrigger>
            <TabsTrigger value="treatment-plan">Treatment Plan</TabsTrigger>
          </TabsList>

          {/* Text Generation */}
          <TabsContent value="text-generation">
            <div className="space-y-4">
              <div>
                <Label htmlFor="prompt">Prompt for Claude</Label>
                <Textarea
                  id="prompt"
                  placeholder="Enter your prompt here..."
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  rows={5}
                />
              </div>
              <Button
                onClick={() => textGenerationMutation.mutate(textInput)}
                disabled={textGenerationMutation.isPending || !textInput.trim()}
              >
                {textGenerationMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Generate Text
              </Button>
              {textGenerationMutation.data && (
                <div className="mt-4 p-4 border rounded-md bg-muted">
                  <Label>Claude Response:</Label>
                  <div className="mt-2 whitespace-pre-wrap">{textGenerationMutation.data.result}</div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Summarization */}
          <TabsContent value="summarize">
            <div className="space-y-4">
              <div>
                <Label htmlFor="text-to-summarize">Text to Summarize</Label>
                <Textarea
                  id="text-to-summarize"
                  placeholder="Enter text to summarize..."
                  value={summarizeInput}
                  onChange={(e) => setSummarizeInput(e.target.value)}
                  rows={5}
                />
              </div>
              <div>
                <Label htmlFor="word-limit">Word Limit</Label>
                <Input
                  id="word-limit"
                  type="number"
                  min="10"
                  max="500"
                  value={wordLimit}
                  onChange={(e) => setWordLimit(e.target.value)}
                  className="w-32"
                />
              </div>
              <Button
                onClick={() => summarizeMutation.mutate({ text: summarizeInput, wordLimit })}
                disabled={summarizeMutation.isPending || !summarizeInput.trim()}
              >
                {summarizeMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Summarize
              </Button>
              {summarizeMutation.data && (
                <div className="mt-4 p-4 border rounded-md bg-muted">
                  <Label>Summary:</Label>
                  <div className="mt-2 whitespace-pre-wrap">{summarizeMutation.data.result}</div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Image Analysis */}
          <TabsContent value="image-analysis">
            <div className="space-y-4">
              <div>
                <Label htmlFor="image-upload">Upload Image</Label>
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="image-prompt">Analysis Prompt</Label>
                <Textarea
                  id="image-prompt"
                  placeholder="What would you like Claude to analyze in this image?"
                  value={imageAnalysisPrompt}
                  onChange={(e) => setImageAnalysisPrompt(e.target.value)}
                  rows={3}
                />
              </div>
              <Button
                onClick={() => imageAnalysisMutation.mutate({ imageBase64, prompt: imageAnalysisPrompt })}
                disabled={imageAnalysisMutation.isPending || !imageBase64 || !imageAnalysisPrompt.trim()}
              >
                {imageAnalysisMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Analyze Image
              </Button>
              {imageBase64 && (
                <div className="mt-4">
                  <Label>Selected Image:</Label>
                  <div className="mt-2">
                    <img 
                      src={`data:image/jpeg;base64,${imageBase64}`} 
                      alt="Uploaded" 
                      className="max-h-48 rounded-md" 
                    />
                  </div>
                </div>
              )}
              {imageAnalysisMutation.data && (
                <div className="mt-4 p-4 border rounded-md bg-muted">
                  <Label>Analysis:</Label>
                  <div className="mt-2 whitespace-pre-wrap">{imageAnalysisMutation.data.result}</div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Sentiment Analysis */}
          <TabsContent value="sentiment">
            <div className="space-y-4">
              <div>
                <Label htmlFor="sentiment-text">Text for Sentiment Analysis</Label>
                <Textarea
                  id="sentiment-text"
                  placeholder="Enter text to analyze sentiment..."
                  value={sentimentText}
                  onChange={(e) => setSentimentText(e.target.value)}
                  rows={5}
                />
              </div>
              <Button
                onClick={() => sentimentAnalysisMutation.mutate(sentimentText)}
                disabled={sentimentAnalysisMutation.isPending || !sentimentText.trim()}
              >
                {sentimentAnalysisMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Analyze Sentiment
              </Button>
              {sentimentAnalysisMutation.data && (
                <div className="mt-4 p-4 border rounded-md bg-muted">
                  <Label>Results:</Label>
                  <div className="mt-2">
                    <p><strong>Sentiment:</strong> {sentimentAnalysisMutation.data.result.sentiment}</p>
                    <p><strong>Confidence:</strong> {Math.round(sentimentAnalysisMutation.data.result.confidence * 100)}%</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Medical Documentation */}
          <TabsContent value="medical-doc">
            <div className="space-y-4">
              <div>
                <Label htmlFor="chief-complaint">Chief Complaint</Label>
                <Input
                  id="chief-complaint"
                  placeholder="Patient's main complaint"
                  value={medicalDocComplaint}
                  onChange={(e) => setMedicalDocComplaint(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="symptoms">Symptoms</Label>
                <Textarea
                  id="symptoms"
                  placeholder="List of symptoms"
                  value={medicalDocSymptoms}
                  onChange={(e) => setMedicalDocSymptoms(e.target.value)}
                  rows={3}
                />
              </div>
              <Button
                onClick={() => medicalDocMutation.mutate({
                  patientData: {
                    chiefComplaint: medicalDocComplaint,
                    symptoms: medicalDocSymptoms,
                  },
                  options: {
                    documentType: 'soap'
                  }
                })}
                disabled={medicalDocMutation.isPending || !medicalDocComplaint.trim() || !medicalDocSymptoms.trim()}
              >
                {medicalDocMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Generate Medical Documentation
              </Button>
              {medicalDocMutation.data && (
                <div className="mt-4 p-4 border rounded-md bg-muted">
                  <Label>Medical Documentation:</Label>
                  <div className="mt-2 whitespace-pre-wrap">{medicalDocMutation.data.result}</div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Treatment Plan */}
          <TabsContent value="treatment-plan">
            <div className="space-y-4">
              <div>
                <Label htmlFor="diagnosis">Diagnosis</Label>
                <Input
                  id="diagnosis"
                  placeholder="Patient's diagnosis"
                  value={treatmentDiagnosis}
                  onChange={(e) => setTreatmentDiagnosis(e.target.value)}
                />
              </div>
              <Button
                onClick={() => treatmentPlanMutation.mutate({
                  diagnosis: treatmentDiagnosis,
                })}
                disabled={treatmentPlanMutation.isPending || !treatmentDiagnosis.trim()}
              >
                {treatmentPlanMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Generate Treatment Plan
              </Button>
              {treatmentPlanMutation.data && (
                <div className="mt-4 p-4 border rounded-md bg-muted">
                  <Label>Treatment Plan:</Label>
                  <div className="mt-2 whitespace-pre-wrap">{treatmentPlanMutation.data.result}</div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ClaudeAIInterface;