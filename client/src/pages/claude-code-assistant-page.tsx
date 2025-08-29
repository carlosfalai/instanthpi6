import React from "react";
import AppLayoutSpruce from "@/components/layout/AppLayoutSpruce";
import ClaudeCodeAssistant from "@/components/ai/ClaudeCodeAssistant";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const ClaudeCodeAssistantPage = () => {
  return (
    <AppLayoutSpruce>
      <div className="p-6">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Claude Code Assistant</CardTitle>
            <CardDescription>
              Leverage Claude 3.7 Sonnet to generate, explain, and improve code for your
              application.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              The Claude Code Assistant can help you with various programming tasks, such as
              generating new code components, explaining unfamiliar code, and improving existing
              implementations.
            </p>
            <p className="mt-2">
              Simply describe what you need or paste code you want to improve or understand, and
              Claude will provide intelligent assistance based on best programming practices.
            </p>
          </CardContent>
        </Card>

        <ClaudeCodeAssistant />
      </div>
    </AppLayoutSpruce>
  );
};

export default ClaudeCodeAssistantPage;
