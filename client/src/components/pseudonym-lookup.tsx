import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formsitePseudonymService, PseudonymLookupResult } from "@/services/formsitePseudonym";

export function PseudonymLookup() {
  const [pseudonym, setPseudonym] = useState("");
  const [lookupResult, setLookupResult] = useState<PseudonymLookupResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handlePseudonymChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPseudonym(e.target.value);
  };

  const handleLookup = async () => {
    if (!pseudonym) {
      toast({
        title: "Missing Pseudonym",
        description: "Please enter a pseudonym to search for",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await formsitePseudonymService.lookupByPseudonym(pseudonym);
      setLookupResult(result);
      
      if (!result.success) {
        toast({
          title: "Lookup Failed",
          description: result.message || "No submission found for this pseudonym",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error during pseudonym lookup:", error);
      toast({
        title: "Lookup Error",
        description: "An error occurred while looking up the pseudonym",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Patient Pseudonym Lookup</CardTitle>
          <CardDescription>
            Enter a patient pseudonym to retrieve their FormSite submission and AI-processed content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex w-full max-w-sm items-center space-x-2">
            <Input
              placeholder="Enter pseudonym"
              value={pseudonym}
              onChange={handlePseudonymChange}
              disabled={isLoading}
            />
            <Button onClick={handleLookup} disabled={isLoading || !pseudonym}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {isLoading ? "Searching..." : "Lookup"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {lookupResult?.success && lookupResult.aiProcessedContent && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>AI-Processed Medical Content</CardTitle>
            <CardDescription>
              Submission ID: {lookupResult.submission_id}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="preview" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="raw">Raw HTML</TabsTrigger>
              </TabsList>
              <TabsContent value="preview" className="bg-card rounded-md p-4 mt-4">
                <div 
                  className="prose prose-sm dark:prose-invert max-w-none" 
                  dangerouslySetInnerHTML={{ __html: lookupResult.aiProcessedContent }}
                />
              </TabsContent>
              <TabsContent value="raw" className="bg-muted rounded-md p-4 mt-4">
                <pre className="text-xs overflow-auto max-h-[500px]">
                  {lookupResult.aiProcessedContent}
                </pre>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setLookupResult(null)}>
              Clear Result
            </Button>
            <Button variant="default" onClick={() => window.print()}>
              Print Document
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}

export default PseudonymLookup;