import React, { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Wand2, Loader, AlertCircle } from "lucide-react";

interface AIPromptBoxProps {
  sectionName: string;
  patientData?: any;
  writingStyleTemplate?: any;
  onGenerate: (generatedText: string) => void;
  isLoading?: boolean;
  doctorApiKey?: string;
  doctorApiProvider?: "claude" | "openai";
}

export function AIPromptBox({
  sectionName,
  patientData,
  writingStyleTemplate,
  onGenerate,
  isLoading = false,
  doctorApiKey,
  doctorApiProvider = "claude",
}: AIPromptBoxProps) {
  const [open, setOpen] = useState(false);
  const [customRequest, setCustomRequest] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!customRequest.trim()) {
      setError("Please enter your request");
      return;
    }

    if (!doctorApiKey) {
      setError("Please add your API key in Doctor Profile settings");
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/ai-generate-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section_name: sectionName,
          custom_request: customRequest,
          patient_data: patientData,
          writing_style_template: writingStyleTemplate,
          api_key: doctorApiKey,
          api_provider: doctorApiProvider,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate content");
      }

      const data = await response.json();
      onGenerate(data.generated_text);
      setCustomRequest("");
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setOpen(true)}
        disabled={isLoading || !doctorApiKey}
        className="bg-[#222]/40 border-[#2a2a2a] text-[#999] hover:bg-[#222] hover:text-[#e6e6e6] disabled:opacity-50"
        title={!doctorApiKey ? "Please add API key in Doctor Profile" : "Generate with AI"}
      >
        <Wand2 className="w-3.5 h-3.5 mr-1.5" />
        AI Generate
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a]">
          <DialogHeader>
            <DialogTitle className="text-[#e6e6e6]">Generate {sectionName}</DialogTitle>
            <DialogDescription className="text-[#999]">
              Describe what you'd like in this section and the AI will generate it using your
              writing style preferences.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {writingStyleTemplate && (
              <div className="bg-[#222]/40 border border-[#2a2a2a] rounded-lg p-3">
                <p className="text-xs text-[#666] mb-1">Using writing style:</p>
                <p className="text-sm text-[#999]">{writingStyleTemplate.template_name}</p>
              </div>
            )}

            <div>
              <label className="text-sm text-[#e6e6e6] mb-2 block">Your Request:</label>
              <textarea
                value={customRequest}
                onChange={(e) => {
                  setCustomRequest(e.target.value);
                  setError(null);
                }}
                placeholder={`e.g., "Make it concise and clinical for a referral letter"`}
                className="w-full px-3 py-2 bg-[#222] border border-[#333] text-[#e6e6e6] rounded-lg placeholder:text-[#666] focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] focus:border-transparent h-24 resize-none"
              />
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 flex gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-red-300">{error}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t border-[#333]">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={generating}
                className="bg-[#1a1a1a] border-[#333] text-[#999] hover:bg-[#222]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={generating || !customRequest.trim()}
                className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <Loader className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3.5 h-3.5 mr-1.5" />
                    Generate
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
