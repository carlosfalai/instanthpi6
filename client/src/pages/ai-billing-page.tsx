import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useBillingEntries, useBillingMutations } from "@/hooks/use-billing";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import {
  Calendar,
  CalendarIcon,
  Download,
  FileText,
  Loader2,
  Mail,
  Printer,
  RefreshCw,
  Search,
  Settings,
  Wallet,
  ClipboardList,
  CheckCircle,
  PlusCircle,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import AppLayoutSpruce from "@/components/layout/AppLayoutSpruce";

interface BillingEntry {
  id: number;
  patientName: string;
  patientId: number;
  patientDOB?: string; // Date of birth for patient
  date: string;
  encounterType: "message" | "video" | "form" | "phone";
  duration: number;
  description: string;
  suggestedCodes: string[];
  status: "pending" | "processed" | "rejected";
  providerNote?: string;
  serviceTime?: string; // Timestamp when service ended
}

export default function AiBillingPage() {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [aiEnabled, setAiEnabled] = useState(true);
  const [selectedEntries, setSelectedEntries] = useState<number[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Use our custom hook to fetch billing entries
  const { data: billingEntries = [], isLoading, refetch } = useBillingEntries();

  // Get mutations for billing entries
  const { createBillingEntry, updateBillingEntry, deleteBillingEntry } = useBillingMutations();

  // Filter entries based on search and filters
  const filteredEntries = billingEntries.filter((entry) => {
    const matchesSearch =
      entry.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || entry.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Toggle entry selection
  const toggleEntrySelection = (id: number) => {
    if (selectedEntries.includes(id)) {
      setSelectedEntries(selectedEntries.filter((entryId) => entryId !== id));
    } else {
      setSelectedEntries([...selectedEntries, id]);
    }
  };

  // Handle regenerating AI suggestions
  const handleRegenerateAI = async () => {
    if (selectedEntries.length === 0) {
      toast({
        title: "No entries selected",
        description: "Please select at least one billing entry to regenerate AI suggestions.",
        variant: "destructive",
      });
      return;
    }

    // Mock API call - you would replace this with actual API call
    toast({
      title: "Generating billing codes",
      description: `Analyzing ${selectedEntries.length} entries with AI...`,
    });

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast({
      title: "AI analysis complete",
      description: "Billing codes have been updated with AI suggestions.",
    });
  };

  // Handle exporting selected entries
  const handleExport = (format: "pdf" | "csv" | "email") => {
    if (selectedEntries.length === 0) {
      toast({
        title: "No entries selected",
        description: "Please select at least one billing entry to export.",
        variant: "destructive",
      });
      return;
    }

    switch (format) {
      case "pdf":
        toast({
          title: "PDF Export Started",
          description: `Exporting ${selectedEntries.length} entries as PDF...`,
        });
        break;
      case "csv":
        toast({
          title: "CSV Export Started",
          description: `Exporting ${selectedEntries.length} entries as CSV...`,
        });
        break;
      case "email":
        toast({
          title: "Email Initiated",
          description: `Preparing to email ${selectedEntries.length} entries to billing department...`,
        });
        break;
    }
  };

  return (
    <AppLayoutSpruce>
      <div className="p-4">
        <div className="max-w-7xl mx-auto">
          <header className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold mb-1">AI Billing Assistant</h1>
                <p className="text-[#999]">
                  Organize and process billing information with AI assistance
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="ai-toggle" className="text-sm font-medium">
                  AI Suggestions
                </Label>
                <Switch id="ai-toggle" checked={aiEnabled} onCheckedChange={setAiEnabled} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="bg-[#1e1e1e] border-[#2a2a2a]">
                <CardContent className="flex items-start p-4">
                  <div className="mr-3 mt-1">
                    <div className="p-2 bg-blue-900/20 border border-blue-800/30 rounded-md">
                      <ClipboardList className="h-5 w-5 text-blue-400" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-md font-semibold mb-1">Pending Entries</h3>
                    <div className="text-2xl font-bold">
                      {isLoading ? (
                        <div className="h-7 w-12 bg-[#1a1a1a] rounded animate-pulse"></div>
                      ) : (
                        billingEntries.filter((e) => e.status === "pending").length || 0
                      )}
                    </div>
                    <p className="text-sm text-[#999]">Entries awaiting processing</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#1e1e1e] border-[#2a2a2a]">
                <CardContent className="flex items-start p-4">
                  <div className="mr-3 mt-1">
                    <div className="p-2 bg-green-900/20 border border-green-800/30 rounded-md">
                      <Calendar className="h-5 w-5 text-green-400" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-md font-semibold mb-1">Today's Encounters</h3>
                    <div className="text-2xl font-bold">
                      {isLoading ? (
                        <div className="h-7 w-12 bg-[#1a1a1a] rounded animate-pulse"></div>
                      ) : (
                        // Count today's entries
                        billingEntries.filter((e) => {
                          const today = new Date().toISOString().split("T")[0];
                          return e.date.includes(today);
                        }).length || 0
                      )}
                    </div>
                    <p className="text-sm text-[#999]">New patient encounters today</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#1e1e1e] border-[#2a2a2a]">
                <CardContent className="flex items-start p-4">
                  <div className="mr-3 mt-1">
                    <div className="p-2 bg-purple-900/20 border border-purple-800/30 rounded-md">
                      <CheckCircle className="h-5 w-5 text-purple-400" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-md font-semibold mb-1">Processed This Month</h3>
                    <div className="text-2xl font-bold">
                      {isLoading ? (
                        <div className="h-7 w-12 bg-[#1a1a1a] rounded animate-pulse"></div>
                      ) : (
                        billingEntries.filter((e) => e.status === "processed").length || 0
                      )}
                    </div>
                    <p className="text-sm text-[#999]">Billing entries processed</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
              <div className="flex items-center flex-wrap gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="text"
                    placeholder="Search patients or descriptions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 bg-[#1e1e1e] border-gray-700 text-white w-full md:w-64"
                  />
                </div>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full md:w-40 bg-[#1e1e1e] border-gray-700 text-white">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e1e1e] border-gray-700 text-white">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processed">Processed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="bg-[#1e1e1e] border-gray-700 text-white">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-[#1e1e1e] border-gray-700">
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="default"
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => {
                    // Sample entry for testing - in real app, this would open a form
                    const newEntry = {
                      patientId: 1,
                      patientName: "Jessica Thompson",
                      date: new Date().toISOString(),
                      encounterType: "message",
                      duration: 15,
                      description: "Video consultation for headache",
                      suggestedCodes: ["15773#tt", "8129"],
                      status: "pending",
                    };

                    createBillingEntry.mutate(newEntry as any);
                  }}
                >
                  <PlusCircle className="mr-1 h-4 w-4" />
                  New Entry
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="bg-[#1e1e1e] border-gray-700 text-white"
                  onClick={() => handleRegenerateAI()}
                  disabled={!aiEnabled}
                >
                  <RefreshCw className="mr-1 h-4 w-4" />
                  Regenerate AI
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="bg-[#1e1e1e] border-gray-700 text-white"
                  onClick={() => handleExport("pdf")}
                >
                  <Download className="mr-1 h-4 w-4" />
                  Export PDF
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="bg-[#1e1e1e] border-gray-700 text-white"
                  onClick={() => handleExport("email")}
                >
                  <Mail className="mr-1 h-4 w-4" />
                  Email Report
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="bg-[#1e1e1e] border-gray-700 text-white"
                  onClick={() => handleExport("csv")}
                >
                  <Printer className="mr-1 h-4 w-4" />
                  Print
                </Button>
              </div>
            </div>
          </header>

          <main>
            <Card className="bg-[#1e1e1e] border-[#2a2a2a]">
              <CardHeader className="pb-0">
                <CardTitle>Billing Entries</CardTitle>
                <CardDescription className="text-[#999]">
                  {aiEnabled
                    ? "AI-assisted billing code suggestions enabled"
                    : "AI suggestions disabled"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                  </div>
                ) : filteredEntries.length > 0 ? (
                  <div className="rounded-md border border-[#2a2a2a]">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-[#2a2a2a]">
                          <TableHead className="w-12">
                            <Checkbox
                              checked={
                                selectedEntries.length > 0 &&
                                selectedEntries.length === filteredEntries.length
                              }
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedEntries(filteredEntries.map((entry) => entry.id));
                                } else {
                                  setSelectedEntries([]);
                                }
                              }}
                            />
                          </TableHead>
                          <TableHead>Patient</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Suggested Codes</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredEntries.map((entry) => (
                          <TableRow key={entry.id} className="border-[#2a2a2a]">
                            <TableCell>
                              <Checkbox
                                checked={selectedEntries.includes(entry.id)}
                                onCheckedChange={() => toggleEntrySelection(entry.id)}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{entry.patientName}</TableCell>
                            <TableCell>{entry.date}</TableCell>
                            <TableCell>{entry.encounterType}</TableCell>
                            <TableCell>{entry.description}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {(entry.suggestedCodes || []).map((code) => (
                                  <span
                                    key={code}
                                    className="px-1.5 py-0.5 text-xs rounded bg-blue-900/30 text-blue-300"
                                  >
                                    {code}
                                  </span>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span
                                className={`px-1.5 py-0.5 text-xs rounded ${
                                  entry.status === "pending"
                                    ? "bg-yellow-900/30 text-yellow-300"
                                    : entry.status === "processed"
                                      ? "bg-green-900/30 text-green-300"
                                      : "bg-red-900/30 text-red-300"
                                }`}
                              >
                                {entry.status}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <FileText className="h-12 w-12 text-gray-500 mb-4" />
                    <p className="text-xl font-semibold mb-2">No billing entries found</p>
                    <p className="text-[#999] mb-4">
                      {searchTerm || filterStatus !== "all"
                        ? "Try adjusting your filters to find what you're looking for"
                        : "Create your first billing entry to get started"}
                    </p>
                    {!(searchTerm || filterStatus !== "all") && (
                      <Button
                        variant="default"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => {
                          // Sample entry for testing
                          const newEntry = {
                            patientId: 1,
                            patientName: "Jessica Thompson",
                            date: new Date().toISOString(),
                            encounterType: "message",
                            duration: 15,
                            description: "Video consultation for headache",
                            suggestedCodes: ["15773#tt", "8129"],
                            status: "pending",
                          };

                          createBillingEntry.mutate(newEntry as any);
                        }}
                      >
                        <PlusCircle className="mr-1 h-4 w-4" />
                        Create Billing Entry
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between border-t border-[#2a2a2a] pt-4">
                <div className="text-sm text-[#999]">
                  {filteredEntries.length > 0
                    ? `Showing ${filteredEntries.length} billing entries`
                    : "No billing entries found"}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-[#1e1e1e] border-gray-700 text-white"
                  >
                    <Settings className="mr-1 h-4 w-4" />
                    Settings
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </main>
        </div>
      </div>
    </AppLayoutSpruce>
  );
}
