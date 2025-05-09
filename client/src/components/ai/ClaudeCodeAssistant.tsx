import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Copy, Check } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ClaudeCodeAssistant = () => {
  const [prompt, setPrompt] = useState('');
  const [language, setLanguage] = useState('typescript');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Code generation mutation
  const codeGenerationMutation = useMutation({
    mutationFn: async (data: { prompt: string, language: string }) => {
      const res = await apiRequest('POST', '/api/anthropic/generate-text', {
        prompt: `You are an expert software developer. 
        I need you to write ${data.language} code for the following request. 
        Only return the code with proper formatting, without explanations, comments, or markdown:
        
        ${data.prompt}`,
      });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Code generated',
        description: 'Claude has generated code based on your request.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to generate code: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Code explanation mutation
  const codeExplanationMutation = useMutation({
    mutationFn: async (data: { code: string, language: string }) => {
      const res = await apiRequest('POST', '/api/anthropic/generate-text', {
        prompt: `You are an expert software developer.
        Please explain the following ${data.language} code in detail, describing what it does and how it works:
        
        \`\`\`${data.language}
        ${data.code}
        \`\`\``,
      });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Explanation generated',
        description: 'Claude has explained the code for you.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to explain code: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Code improvement mutation
  const codeImprovementMutation = useMutation({
    mutationFn: async (data: { code: string, language: string }) => {
      const res = await apiRequest('POST', '/api/anthropic/generate-text', {
        prompt: `You are an expert software developer.
        Please improve the following ${data.language} code. Focus on:
        1. Fixing any bugs or issues
        2. Improving performance
        3. Enhancing readability
        4. Following best practices
        
        Return only the improved code with proper formatting:
        
        \`\`\`${data.language}
        ${data.code}
        \`\`\``,
      });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Code improved',
        description: 'Claude has improved the code for you.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to improve code: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Function to copy code to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: 'Copied to clipboard',
      description: 'The code has been copied to your clipboard.',
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Claude Code Assistant</CardTitle>
        <CardDescription>
          Let Claude help you write, explain, and improve code for your application.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-4">
          <div className="flex-1">
            <Label htmlFor="code-language">Programming Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger id="code-language">
                <SelectValue placeholder="Select a language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="typescript">TypeScript</SelectItem>
                <SelectItem value="javascript">JavaScript</SelectItem>
                <SelectItem value="html">HTML</SelectItem>
                <SelectItem value="css">CSS</SelectItem>
                <SelectItem value="sql">SQL</SelectItem>
                <SelectItem value="python">Python</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div>
          <Label htmlFor="code-prompt">What code do you need?</Label>
          <Textarea
            id="code-prompt"
            placeholder="Describe the code you want Claude to generate, explain, or improve..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={6}
          />
        </div>
        
        <div className="flex space-x-4">
          <Button
            onClick={() => codeGenerationMutation.mutate({ prompt, language })}
            disabled={codeGenerationMutation.isPending || !prompt.trim()}
          >
            {codeGenerationMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Generate Code
          </Button>
          
          <Button
            variant="outline"
            onClick={() => codeExplanationMutation.mutate({ code: prompt, language })}
            disabled={codeExplanationMutation.isPending || !prompt.trim()}
          >
            {codeExplanationMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Explain Code
          </Button>
          
          <Button
            variant="secondary"
            onClick={() => codeImprovementMutation.mutate({ code: prompt, language })}
            disabled={codeImprovementMutation.isPending || !prompt.trim()}
          >
            {codeImprovementMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Improve Code
          </Button>
        </div>
        
        {(codeGenerationMutation.data || codeExplanationMutation.data || codeImprovementMutation.data) && (
          <div className="mt-6 p-4 border rounded-md bg-muted relative">
            <div className="absolute top-2 right-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(
                  codeGenerationMutation.data?.result || 
                  codeExplanationMutation.data?.result || 
                  codeImprovementMutation.data?.result
                )}
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <Label>Claude Response:</Label>
            <pre className="mt-2 p-4 bg-black text-white rounded-md overflow-x-auto">
              <code>{
                codeGenerationMutation.data?.result || 
                codeExplanationMutation.data?.result || 
                codeImprovementMutation.data?.result
              }</code>
            </pre>
          </div>
        )}
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        Powered by Claude 3.7 Sonnet AI
      </CardFooter>
    </Card>
  );
};

export default ClaudeCodeAssistant;