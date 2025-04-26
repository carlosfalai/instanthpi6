import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, UserRound, FileSearch, Printer, X, Eye, Code } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formsitePseudonymService, PseudonymLookupResult } from "@/services/formsitePseudonym";
import { ScrollArea } from "@/components/ui/scroll-area";

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
      } else {
        toast({
          title: "Submission Found",
          description: `Successfully found patient data for pseudonym: ${pseudonym}`,
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
      <Card className="bg-[#1A1A1A] border-[#333]">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <UserRound className="h-5 w-5 mr-2 text-blue-500" />
            Patient Pseudonym Lookup
          </CardTitle>
          <CardDescription className="text-gray-400">
            Enter a patient pseudonym to retrieve their FormSite submission and AI-processed medical content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex w-full items-center space-x-2">
            <Input
              placeholder="Enter patient pseudonym"
              value={pseudonym}
              onChange={handlePseudonymChange}
              disabled={isLoading}
              className="bg-[#252525] border-[#444] text-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
            />
            <Button 
              onClick={handleLookup} 
              disabled={isLoading || !pseudonym}
              className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 border-0 shadow-md hover:shadow-lg transition-all duration-200"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Searching...
                </>
              ) : (
                <>
                  <FileSearch className="h-4 w-4 mr-2" />
                  Lookup
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {lookupResult?.success && lookupResult.aiProcessedContent && (
        <Card className="mt-4 bg-[#1A1A1A] border-[#333]">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-white">AI-Processed Medical Content</CardTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setLookupResult(null)}
                className="h-8 w-8 rounded-full hover:bg-red-900/50 hover:text-red-400"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription className="text-gray-400">
              Submission ID: <span className="text-blue-400">{lookupResult.submission_id}</span> | Pseudonym: <span className="text-blue-400">{pseudonym}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="preview" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-[#252525]">
                <TabsTrigger value="preview" className="data-[state=active]:bg-blue-900/20 data-[state=active]:text-blue-400">
                  <Eye className="h-4 w-4 mr-2" /> Preview
                </TabsTrigger>
                <TabsTrigger value="raw" className="data-[state=active]:bg-blue-900/20 data-[state=active]:text-blue-400">
                  <Code className="h-4 w-4 mr-2" /> Raw HTML
                </TabsTrigger>
              </TabsList>
              <TabsContent value="preview" className="bg-[#252525] rounded-md p-4 mt-4 border border-[#333] min-h-[500px]">
                <ScrollArea className="h-[500px] pr-4">
                  <div 
                    className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-blue-400" 
                    dangerouslySetInnerHTML={{ __html: lookupResult.aiProcessedContent }}
                  />
                </ScrollArea>
              </TabsContent>
              <TabsContent value="raw" className="bg-[#252525] rounded-md p-4 mt-4 border border-[#333] min-h-[500px]">
                <ScrollArea className="h-[500px]">
                  <pre className="text-xs text-gray-300 overflow-auto">
                    {lookupResult.aiProcessedContent}
                  </pre>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between border-t border-[#333] pt-4">
            <Button 
              variant="outline" 
              onClick={() => setLookupResult(null)}
              className="border-[#444] hover:bg-[#333] text-gray-300"
            >
              <X className="h-4 w-4 mr-2" /> Clear Result
            </Button>
            <Button 
              variant="default" 
              onClick={() => window.print()}
              className="bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 border-0"
            >
              <Printer className="h-4 w-4 mr-2" /> Print Document
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}

export default PseudonymLookup;