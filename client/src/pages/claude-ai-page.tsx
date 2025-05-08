import React from 'react';
import AppLayoutSpruce from '@/components/layout/AppLayoutSpruce';
import ClaudeAIInterface from '@/components/ai/ClaudeAIInterface';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const ClaudeAIPage = () => {
  return (
    <AppLayoutSpruce>
      <div className="p-6">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Claude 3.7 Sonnet AI</CardTitle>
            <CardDescription>
              Leverage the power of Claude 3.7 Sonnet for advanced medical AI capabilities.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              Claude 3.7 Sonnet is a state-of-the-art language model that can assist with a wide range of tasks, 
              including medical documentation, treatment plans, sentiment analysis, and image recognition.
            </p>
            <p className="mt-2">
              Use the interface below to interact with Claude and explore its capabilities.
            </p>
          </CardContent>
        </Card>
        
        <ClaudeAIInterface />
      </div>
    </AppLayoutSpruce>
  );
};

export default ClaudeAIPage;