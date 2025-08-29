import React, { useState } from "react";
import AppLayoutSpruce from "@/components/layout/AppLayoutSpruce";
import ClaudeAIInterface from "@/components/ai/ClaudeAIInterface";
import ClaudeDevAssistant from "@/components/ai/ClaudeDevAssistant";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ClaudeAIPage = () => {
  const [activeTab, setActiveTab] = useState("features");

  return (
    <AppLayoutSpruce>
      <div className="p-6">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Claude 3.7 Sonnet AI</CardTitle>
            <CardDescription>
              Leverage the power of Claude 3.7 Sonnet for advanced medical AI capabilities and
              development assistance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              Claude 3.7 Sonnet is a state-of-the-art language model that can assist with a wide
              range of tasks, including medical documentation, treatment plans, sentiment analysis,
              image recognition, and code generation.
            </p>
            <p className="mt-2">
              Use the interfaces below to interact with Claude and explore its capabilities.
            </p>
          </CardContent>
        </Card>

        <Tabs
          defaultValue="features"
          value={activeTab}
          onValueChange={setActiveTab}
          className="mb-6"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="features">AI Features</TabsTrigger>
            <TabsTrigger value="development">Development Assistant</TabsTrigger>
          </TabsList>

          <TabsContent value="features" className="mt-4">
            <ClaudeAIInterface />
          </TabsContent>

          <TabsContent value="development" className="mt-4">
            <ClaudeDevAssistant />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayoutSpruce>
  );
};

export default ClaudeAIPage;
