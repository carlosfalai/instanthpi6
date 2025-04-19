import { useState, useEffect, ChangeEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Patient } from "@shared/schema";
import { Search, Users, Phone, Mail, Clock, Calendar, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

interface PatientSearchPanelProps {
  onSelectPatient: (patientId: number) => void;
}

export default function PatientSearchPanel({ onSelectPatient }: PatientSearchPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  
  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  // Fetch patients based on search query
  const {
    data: patients = [],
    isLoading,
    error
  } = useQuery<Patient[]>({
    queryKey: ['/api/patients/search', debouncedQuery],
    queryFn: async () => {
      const response = await axios.get('/api/patients/search', {
        params: { query: debouncedQuery }
      });
      return response.data;
    }
  });
  
  // Handle search input change
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  // Get patient initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Format patient's date of birth
  const formatDateOfBirth = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  return (
    <div className="flex flex-col h-full bg-[#121212] border-l border-gray-800">
      {/* Search Header */}
      <div className="p-4 border-b border-gray-800 bg-[#1a1a1a]">
        <h2 className="text-lg font-semibold text-white mb-3">Patient Search</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search patients by name, email or phone..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-10 bg-[#2a2a2a] border-gray-700 text-white"
          />
        </div>
      </div>
      
      {/* Patient List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 5 }).map((_, index) => (
              <Card key={index} className="bg-[#1e1e1e] border-gray-800">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : error ? (
            // Error state
            <div className="text-center py-8">
              <p className="text-red-400">Error loading patients. Please try again.</p>
              <Button 
                variant="outline" 
                className="mt-4 border-gray-700 text-gray-400"
                onClick={() => setSearchQuery("")}
              >
                Clear search
              </Button>
            </div>
          ) : patients.length === 0 ? (
            // Empty state
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-gray-500 mb-4" />
              <p className="text-gray-400">
                {debouncedQuery ? 
                  "No patients found matching your search." : 
                  "Search for patients to view their details."}
              </p>
              {debouncedQuery && (
                <Button 
                  variant="outline" 
                  className="mt-4 border-gray-700 text-gray-400"
                  onClick={() => setSearchQuery("")}
                >
                  Clear search
                </Button>
              )}
            </div>
          ) : (
            // Patient cards
            patients.map(patient => (
              <Card 
                key={patient.id} 
                className="bg-[#1e1e1e] border-gray-800 hover:bg-[#252525] transition-colors cursor-pointer"
                onClick={() => onSelectPatient(patient.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start">
                    <Avatar className="h-12 w-12 mr-4 bg-blue-600 text-white">
                      <AvatarFallback>{getInitials(patient.name)}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h3 className="font-medium text-white">{patient.name}</h3>
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                      </div>
                      
                      <div className="text-sm text-gray-400 mt-1 space-y-1">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1 inline" />
                          <span>DOB: {formatDateOfBirth(patient.dateOfBirth)}</span>
                          <span className="mx-2">•</span>
                          <Badge variant="outline" className="ml-1 text-xs px-1 py-0 border-gray-700">
                            {patient.gender}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center">
                          <Mail className="h-3 w-3 mr-1 inline" />
                          <span>{patient.email}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <Phone className="h-3 w-3 mr-1 inline" />
                          <span>{patient.phone}</span>
                        </div>
                        
                        {patient.lastVisit && (
                          <div className="flex items-center text-xs text-gray-500 mt-2">
                            <Clock className="h-3 w-3 mr-1 inline" />
                            <span>Last visit: {new Date(patient.lastVisit).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}