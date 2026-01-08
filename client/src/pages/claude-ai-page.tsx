import React, { useState } from "react";
import ModernLayout from "@/components/layout/ModernLayout";
import ClaudeAIInterface from "@/components/ai/ClaudeAIInterface";
import ClaudeDevAssistant from "@/components/ai/ClaudeDevAssistant";
import ClaudeProfileAssistant from "@/components/ai/ClaudeProfileAssistant";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ClaudeAIPage = () => {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <ModernLayout title="Claude AI Assistant" description="Advanced AI capabilities">
      <div className="p-6">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Claude Haiku 4.5</CardTitle>
            <CardDescription>
              Leverage the power of Claude Haiku 4.5 for advanced medical AI capabilities and
              development assistance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              Claude Haiku 4.5 is a fast and efficient language model that can assist with a wide
              range of tasks, including medical documentation, treatment plans, sentiment analysis,
              image recognition, and code generation.
            </p>
            <p className="mt-2">
              Use the interfaces below to interact with Claude and explore its capabilities. The Profile Assistant can help you manage your doctor profile through conversation.
            </p>
          </CardContent>
        </Card>

        <Tabs
          defaultValue="profile"
          value={activeTab}
          onValueChange={setActiveTab}
          className="mb-6"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile Assistant</TabsTrigger>
            <TabsTrigger value="features">AI Features</TabsTrigger>
            <TabsTrigger value="development">Development Assistant</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-4">
            <ClaudeProfileAssistant />
          </TabsContent>

          <TabsContent value="features" className="mt-4">
            <ClaudeAIInterface />
          </TabsContent>

          <TabsContent value="development" className="mt-4">
            <ClaudeDevAssistant />
          </TabsContent>
        </Tabs>
      </div>
    </ModernLayout>
  );
};

export default ClaudeAIPage;
