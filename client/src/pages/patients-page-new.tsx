import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, User, Search, RefreshCw, List, Grid, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";
import { Badge } from "@/components/ui/badge";

interface Patient {
  id: number;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  language: "english" | "french" | null;
  spruceId?: string | null;
}

export default function PatientsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "unread">("newest");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Refresh patients data mutation
  const refreshPatientsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/spruce/refresh-patients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to refresh patient data");
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate queries to force a refetch
      queryClient.invalidateQueries({ queryKey: ["/api/spruce/search-patients"] });

      toast({
        title: "Patient data refreshed",
        description: `Successfully refreshed ${data.count} patients from Spruce API.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Refresh failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Using the Spruce API for patient data
  const {
    data: patientsResponse = { patients: [], source: "spruce" },
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/spruce/search-patients", debouncedSearchTerm],
    queryFn: async () => {
      let url = "/api/spruce/search-patients";

      // Add query parameter if available
      if (debouncedSearchTerm) {
        url += `?query=${encodeURIComponent(debouncedSearchTerm)}`;
      }

      const res = await fetch(url);

      if (!res.ok) {
        throw new Error("Failed to fetch patients");
      }

      return res.json();
    },
  });

  // Show error toast if patient fetching fails
  React.useEffect(() => {
    if (error) {
      toast({
        title: "Error loading patients",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Extract patients array from response
  const filteredPatients = patientsResponse.patients || [];

  // Generate initials for patient avatars
  const getInitials = (name: string) => {
    if (!name || name === "Unknown Name") return "??";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  };

  // Get random color for patient avatars
  const getAvatarColor = (patientId: number) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-red-500",
    ];
    return colors[patientId % colors.length];
  };

  // Format date for display in the list view
  const formatDate = (date: string | null) => {
    if (!date) return "";
    const today = new Date().toDateString();
    const messageDate = new Date(date);

    if (messageDate.toDateString() === today) {
      return messageDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else {
      return messageDate.toLocaleDateString([], {
        month: "numeric",
        day: "numeric",
        year: "numeric",
      });
    }
  };

  // Handle patient selection
  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
  };

  return (
    <div className="flex h-screen bg-[#0d0d0d] overflow-hidden">
      {/* Left column - Patient List */}
      <div className="w-full md:w-1/3 border-r border-[#333] flex flex-col bg-[#1a1a1a] overflow-hidden">
        {/* Patient List Header */}
        <div className="p-3 border-b border-[#333] flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as any)}>
              <SelectTrigger className="bg-[#1a1a1a] border-[#444] text-white w-44 h-8">
                <div className="flex items-center">
                  <ChevronDown className="h-4 w-4 mr-1" />
                  <SelectValue>
                    {sortOrder === "newest"
                      ? "All, Newest First"
                      : sortOrder === "oldest"
                        ? "Oldest First"
                        : "Unread Only"}
                  </SelectValue>
                </div>
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-[#444] text-white">
                <SelectItem value="newest">All, Newest First</SelectItem>
                <SelectItem value="unread">Unread Only</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="ghost"
              className={`p-2 ${viewMode === "list" ? "bg-[#333]" : ""}`}
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className={`p-2 ${viewMode === "grid" ? "bg-[#333]" : ""}`}
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search Box */}
        <div className="p-3 border-b border-[#333]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Search patients..."
              className="pl-10 bg-[#1a1a1a] border-[#444] text-white w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Patient List */}
        <div className="overflow-y-auto flex-grow">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
            </div>
          ) : filteredPatients.length > 0 ? (
            viewMode === "list" ? (
              <div>
                {filteredPatients.map((patient: Patient) => (
                  <div
                    key={patient.id}
                    className={`border-b border-[#333] hover:bg-[#1a1a1a] cursor-pointer transition-colors
                      ${selectedPatient?.id === patient.id ? "bg-[#222]" : ""}`}
                    onClick={() => handlePatientSelect(patient)}
                  >
                    <div className="p-3 flex items-start">
                      {/* Patient Avatar */}
                      <div
                        className={`flex-shrink-0 w-10 h-10 rounded-full ${getAvatarColor(patient.id)} flex items-center justify-center mr-3`}
                      >
                        <span className="font-medium text-white">{getInitials(patient.name)}</span>
                      </div>

                      {/* Patient Info */}
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-white truncate">{patient.name}</h3>
                          <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                            {formatDate(new Date().toISOString())}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 truncate">
                          {patient.gender === "male"
                            ? "Male"
                            : patient.gender === "female"
                              ? "Female"
                              : "Unknown gender"}
                          {patient.phone ? ` • ${patient.phone}` : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
                {filteredPatients.map((patient: Patient) => (
                  <div
                    key={patient.id}
                    className={`p-4 rounded-md bg-[#1a1a1a] hover:bg-[#222] cursor-pointer border border-[#333] transition-colors
                      ${selectedPatient?.id === patient.id ? "border-blue-500" : "border-[#333]"}`}
                    onClick={() => handlePatientSelect(patient)}
                  >
                    <div className="flex items-center mb-2">
                      <div
                        className={`w-10 h-10 rounded-full ${getAvatarColor(patient.id)} flex items-center justify-center mr-3`}
                      >
                        <span className="font-medium text-white">{getInitials(patient.name)}</span>
                      </div>
                      <div>
                        <h3 className="font-medium text-white">{patient.name}</h3>
                        <span className="text-xs text-gray-400">{patient.gender}</span>
                      </div>
                    </div>
                    {patient.phone && (
                      <p className="text-sm text-gray-400">
                        <span className="text-gray-500">Phone:</span> {patient.phone}
                      </p>
                    )}
                    {patient.email && (
                      <p className="text-sm text-gray-400">
                        <span className="text-gray-500">Email:</span> {patient.email}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="p-4 text-center text-gray-500">No patients found</div>
          )}
        </div>

        {/* Patient List Footer */}
        <div className="p-3 border-t border-[#333] flex justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshPatientsMutation.mutate()}
            disabled={refreshPatientsMutation.isPending}
            className="text-xs"
          >
            <RefreshCw
              className={`h-3 w-3 mr-1 ${refreshPatientsMutation.isPending ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs">
            Add Patient
          </Button>
        </div>
      </div>

      {/* Middle column - Patient Details */}
      <div className="hidden md:block md:w-1/3 border-r border-[#333] bg-[#1a1a1a] overflow-y-auto">
        {selectedPatient ? (
          <div>
            <div className="p-4 border-b border-[#333] flex items-center">
              <div
                className={`w-12 h-12 rounded-full ${getAvatarColor(selectedPatient.id)} flex items-center justify-center mr-4`}
              >
                <span className="font-medium text-white text-lg">
                  {getInitials(selectedPatient.name)}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{selectedPatient.name}</h2>
                <p className="text-sm text-gray-400">
                  {selectedPatient.gender === "male"
                    ? "Male"
                    : selectedPatient.gender === "female"
                      ? "Female"
                      : "Unknown gender"}
                  {selectedPatient.dateOfBirth
                    ? ` • ${formatDate(selectedPatient.dateOfBirth)}`
                    : ""}
                </p>
              </div>
            </div>
            <div className="p-4">
              <div className="mb-6">
                <h3 className="text-md font-semibold mb-2 text-white">Contact Information</h3>
                <div className="space-y-2 text-sm text-gray-400">
                  {selectedPatient.phone && (
                    <p>
                      <span className="text-gray-500">Phone:</span> {selectedPatient.phone}
                    </p>
                  )}
                  {selectedPatient.email && (
                    <p>
                      <span className="text-gray-500">Email:</span> {selectedPatient.email}
                    </p>
                  )}
                  {selectedPatient.language && (
                    <p>
                      <span className="text-gray-500">Language:</span> {selectedPatient.language}
                    </p>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-md font-semibold mb-2 text-white">Recent Communications</h3>
                <div className="bg-[#1a1a1a] rounded-md p-3 text-sm text-gray-400">
                  <p>No recent communications</p>
                </div>
              </div>

              <div>
                <h3 className="text-md font-semibold mb-2 text-white">Medical Information</h3>
                <div className="bg-[#1a1a1a] rounded-md p-3 text-sm text-gray-400">
                  <p>No medical information available</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-6">
              <User className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No Patient Selected</h3>
              <p className="text-gray-400">Select a patient from the list to view their details</p>
            </div>
          </div>
        )}
      </div>

      {/* Right column - AI Recommendations */}
      <div className="hidden md:block md:w-1/3 bg-[#1a1a1a] overflow-y-auto">
        <div className="p-4 border-b border-[#333]">
          <h2 className="text-xl font-bold">AI Recommendations</h2>
        </div>
        {selectedPatient ? (
          <div className="p-4">
            <div className="space-y-4">
              <div className="bg-[#1a1a1a] rounded-md p-4">
                <h3 className="text-md font-semibold mb-2 text-white">Suggested Actions</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center text-blue-400 hover:text-blue-300 cursor-pointer">
                    <Badge className="mr-2 bg-blue-900 text-blue-200">New</Badge>
                    Schedule follow-up appointment
                  </li>
                  <li className="flex items-center text-blue-400 hover:text-blue-300 cursor-pointer">
                    Send prescription refill
                  </li>
                  <li className="flex items-center text-blue-400 hover:text-blue-300 cursor-pointer">
                    Review medical history
                  </li>
                </ul>
              </div>

              <div className="bg-[#1a1a1a] rounded-md p-4">
                <h3 className="text-md font-semibold mb-2 text-white">Patient Insights</h3>
                <p className="text-sm text-gray-400">
                  AI analysis of this patient's data is not available. Select "Generate Insights" to
                  analyze patient history and receive personalized recommendations.
                </p>
                <Button className="mt-3 w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  Generate Insights
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-6">
              <BrainIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">AI Assistant Ready</h3>
              <p className="text-gray-400">
                Select a patient to receive personalized AI recommendations
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BrainIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
    </svg>
  );
}
