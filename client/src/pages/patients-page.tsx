import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, User, Search, RefreshCw, List, Grid, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/use-debounce';
import AppLayoutSpruce from '@/components/layout/AppLayoutSpruce';

interface Patient {
  id: number;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  language: 'english' | 'french' | null;
  spruceId?: string | null;
}

export default function PatientsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Refresh patients data mutation
  const refreshPatientsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/spruce/refresh-patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to refresh patient data');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate queries to force a refetch
      queryClient.invalidateQueries({ queryKey: ['/api/spruce/search-patients'] });
      
      toast({
        title: 'Patient data refreshed',
        description: `Successfully refreshed ${data.count} patients from Spruce API.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Refresh failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Using the Spruce API for patient data
  const { 
    data: patientsResponse = { patients: [], source: 'spruce' }, 
    isLoading,
    error
  } = useQuery({
    queryKey: ['/api/spruce/search-patients', debouncedSearchTerm],
    queryFn: async () => {
      let url = '/api/spruce/search-patients';
      
      // Add query parameter if available
      if (debouncedSearchTerm) {
        url += `?query=${encodeURIComponent(debouncedSearchTerm)}`;
      }
      
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error('Failed to fetch patients');
      }
      
      return res.json();
    }
  });
  
  // Show error toast if patient fetching fails
  React.useEffect(() => {
    if (error) {
      toast({
        title: "Error loading patients",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  }, [error, toast]);
  
  // Extract patients array from response
  const filteredPatients = patientsResponse.patients || [];
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'unread'>('newest');

  // Generate initials for patient avatars
  const getInitials = (name: string) => {
    if (!name || name === 'Unknown Name') return '??';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };
  
  // Get random color for patient avatars
  const getAvatarColor = (patientId: number) => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-red-500'];
    return colors[patientId % colors.length];
  };

  // Format date for display in the list view
  const formatDate = (date: string | null) => {
    if (!date) return '';
    const today = new Date().toDateString();
    const messageDate = new Date(date);
    
    if (messageDate.toDateString() === today) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return messageDate.toLocaleDateString([], { month: 'numeric', day: 'numeric', year: 'numeric' });
    }
  };

  return (
    <AppLayoutSpruce>
      <div className="flex h-full bg-[#121212] overflow-hidden">
        {/* Left column - Patient List */}
        <div className="w-full md:w-1/3 border-r border-[#333] flex flex-col bg-[#1a1a1a] overflow-hidden">
          {/* Patient List Header */}
          <div className="p-4 border-b border-[#333] flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <div className="relative">
                <Select
                  value={sortOrder}
                  onValueChange={(value) => setSortOrder(value as any)}
                >
                  <SelectTrigger className="bg-[#252525] border-[#444] text-white w-52 h-8">
                    <div className="flex items-center">
                      <ChevronDown className="h-4 w-4 mr-1" />
                      <SelectValue>
                        {sortOrder === 'newest' ? 'All, Newest First' : 
                         sortOrder === 'oldest' ? 'Oldest First' : 'Unread Only'}
                      </SelectValue>
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-[#252525] border-[#444] text-white">
                    <SelectItem value="newest">All, Newest First</SelectItem>
                    <SelectItem value="unread">Unread Only</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                size="sm" 
                variant="ghost" 
                className={`p-2 ${viewMode === 'list' ? 'bg-[#333]' : ''}`}
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                className={`p-2 ${viewMode === 'grid' ? 'bg-[#333]' : ''}`}
                onClick={() => setViewMode('grid')}
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
                className="pl-10 bg-[#252525] border-[#444] text-white w-full"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
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
              <div className="divide-y divide-[#333]">
                {filteredPatients.map((patient: Patient) => (
                  <div 
                    key={patient.id}
                    className="p-3 hover:bg-[#252525] cursor-pointer transition-colors flex items-start"
                  >
                    {/* Patient Avatar */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full ${getAvatarColor(patient.id)} flex items-center justify-center mr-3`}>
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
                        {patient.gender === 'male' ? 'Male' : 
                         patient.gender === 'female' ? 'Female' : 'Unknown gender'}
                         {patient.phone ? ` • ${patient.phone}` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                No patients found
              </div>
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
              <RefreshCw className={`h-3 w-3 mr-1 ${refreshPatientsMutation.isPending ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
            >
              Add Patient
            </Button>
          </div>
        </div>
        
        {/* Middle column - Patient Details */}
        <div className="hidden md:block md:w-1/3 border-r border-[#333] bg-[#1a1a1a]">
          <div className="p-4 border-b border-[#333]">
            <h2 className="text-xl font-bold">Patient Details</h2>
          </div>
          <div className="p-4">
            <p className="text-gray-400">Select a patient to view details</p>
          </div>
        </div>
        
        {/* Right column - AI Recommendations */}
        <div className="hidden md:block md:w-1/3 bg-[#1a1a1a]">
          <div className="p-4 border-b border-[#333]">
            <h2 className="text-xl font-bold">AI Recommendations</h2>
          </div>
          <div className="p-4">
            <p className="text-gray-400">AI-powered suggestions will appear here</p>
          </div>
        </div>
      </div>
    </AppLayoutSpruce>
  );
}