import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Copy, Check, Code, RefreshCw } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ClaudeDevAssistant = () => {
  const [prompt, setPrompt] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [language, setLanguage] = useState('typescript');
  const [activeTab, setActiveTab] = useState('generate');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Map of programming languages to their file extensions
  const languageExtensions = {
    typescript: 'ts',
    javascript: 'js',
    python: 'py',
    html: 'html',
    css: 'css',
    sql: 'sql',
  };

  // Code generation mutation
  const generateCodeMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const res = await apiRequest('POST', '/api/anthropic/generate-text', {
        prompt: `You are an expert TypeScript and React developer specialized in medical software. Generate production-quality ${language} code for the following request. Only provide the code without explanations, comments or markdown formatting:

${prompt}`,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Code Generated',
        description: 'Claude has generated code based on your request',
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
  const explainCodeMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await apiRequest('POST', '/api/anthropic/generate-text', {
        prompt: `You are an expert ${language} developer. Explain this code in detail:

\`\`\`${language}
${code}
\`\`\`

Provide a clear and thorough explanation covering:
1. What the code does
2. How it works
3. Key components and functions 
4. Any potential issues or optimizations`,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Explanation Generated',
        description: 'Claude has explained the code',
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

  // Code refactor/improvement mutation
  const refactorCodeMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await apiRequest('POST', '/api/anthropic/generate-text', {
        prompt: `You are an expert ${language} developer. Refactor this code to improve it:

\`\`\`${language}
${code}
\`\`\`

Return only the refactored code without explanations or markdown formatting. Focus on:
1. Improving readability and maintainability
2. Fixing any bugs or edge cases
3. Following best practices
4. Making it more efficient`,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Code Refactored',
        description: 'Claude has improved your code',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to refactor code: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Copy to clipboard function
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: 'Copied',
      description: 'Code copied to clipboard',
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Claude Developer Assistant</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="generate" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="generate">Generate Code</TabsTrigger>
            <TabsTrigger value="explain">Explain Code</TabsTrigger>
            <TabsTrigger value="refactor">Refactor Code</TabsTrigger>
          </TabsList>
          
          <div className="mt-4 mb-4">
            <Label htmlFor="language">Programming Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger id="language" className="w-full">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="typescript">TypeScript</SelectItem>
                <SelectItem value="javascript">JavaScript</SelectItem>
                <SelectItem value="python">Python</SelectItem>
                <SelectItem value="html">HTML</SelectItem>
                <SelectItem value="css">CSS</SelectItem>
                <SelectItem value="sql">SQL</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <TabsContent value="generate" className="space-y-4">
            <div>
              <Label htmlFor="prompt">What code do you need?</Label>
              <Textarea
                id="prompt"
                placeholder="Describe the code you need (e.g., 'Create a React component for a medical form with patient information fields')"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-32"
              />
            </div>
            <Button 
              onClick={() => generateCodeMutation.mutate(prompt)}
              disabled={generateCodeMutation.isPending || !prompt.trim()}
              className="w-full"
            >
              {generateCodeMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Code className="mr-2 h-4 w-4" />
              )}
              Generate Code
            </Button>
            
            {generateCodeMutation.data && (
              <div className="mt-4 relative">
                <div className="absolute top-2 right-2">
                  <Button size="sm" variant="ghost" onClick={() => copyToClipboard(generateCodeMutation.data.result)}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <pre className="p-4 rounded-lg bg-black text-white overflow-x-auto">
                  <code>{generateCodeMutation.data.result}</code>
                </pre>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="explain" className="space-y-4">
            <div>
              <Label htmlFor="code-to-explain">Code to Explain</Label>
              <Textarea
                id="code-to-explain"
                placeholder={`Paste your ${language} code here`}
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                className="min-h-32 font-mono text-sm"
              />
            </div>
            <Button 
              onClick={() => explainCodeMutation.mutate(codeInput)}
              disabled={explainCodeMutation.isPending || !codeInput.trim()}
              className="w-full"
            >
              {explainCodeMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Code className="mr-2 h-4 w-4" />
              )}
              Explain Code
            </Button>
            
            {explainCodeMutation.data && (
              <div className="mt-4 p-4 border rounded-lg bg-muted">
                <Label>Explanation:</Label>
                <div className="mt-2 whitespace-pre-wrap">{explainCodeMutation.data.result}</div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="refactor" className="space-y-4">
            <div>
              <Label htmlFor="code-to-refactor">Code to Refactor</Label>
              <Textarea
                id="code-to-refactor"
                placeholder={`Paste your ${language} code here to refactor/improve`}
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                className="min-h-32 font-mono text-sm"
              />
            </div>
            <Button 
              onClick={() => refactorCodeMutation.mutate(codeInput)}
              disabled={refactorCodeMutation.isPending || !codeInput.trim()}
              className="w-full"
            >
              {refactorCodeMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Refactor Code
            </Button>
            
            {refactorCodeMutation.data && (
              <div className="mt-4 relative">
                <div className="absolute top-2 right-2">
                  <Button size="sm" variant="ghost" onClick={() => copyToClipboard(refactorCodeMutation.data.result)}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <pre className="p-4 rounded-lg bg-black text-white overflow-x-auto">
                  <code>{refactorCodeMutation.data.result}</code>
                </pre>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        Powered by Claude 3.7 Sonnet - The newest Anthropic model released February 24, 2025
      </CardFooter>
    </Card>
  );
};

export default ClaudeDevAssistant;