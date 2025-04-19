import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Search, Loader2, AlertCircle, CheckCircle2, UserRound, Phone, Calendar, Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDebounce } from '@/hooks/use-debounce';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface PatientSearchPanelProps {
  onPatientSelect: (patientId: number) => void;
}

interface Patient {
  id: number;
  name: string;
  gender: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  avatarUrl: string | null;
  spruceId: string | null;
  language: string;
}

export default function PatientSearchPanel({ onPatientSelect }: PatientSearchPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 300);
  
  // Query patients based on search
  const { 
    data: patients = [], 
    isLoading, 
    error 
  } = useQuery<Patient[]>({
    queryKey: ['/api/patients', debouncedQuery],
    enabled: debouncedQuery.length > 0,
  });
  
  // Fetch patients from Spruce API
  const fetchSpruceMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/spruce/sync-patients', {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/patients'] });
    },
  });
  
  // Calculate age from date of birth
  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };
  
  // Get initials for avatar
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };
  
  return (
    <div className="flex flex-col h-full bg-[#121212] text-white">
      {/* Header and Search */}
      <div className="p-4 bg-[#1e1e1e] border-b border-gray-800">
        <h2 className="font-semibold mb-4">Patient Search</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
          <Input
            placeholder="Search patients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-[#262626] border-gray-700 pl-10 text-white rounded-md"
          />
        </div>
        
        <div className="flex justify-end mt-2">
          <Button 
            size="sm" 
            onClick={() => fetchSpruceMutation.mutate()}
            disabled={fetchSpruceMutation.isPending}
            className="text-xs"
          >
            {fetchSpruceMutation.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <CheckCircle2 className="h-3 w-3 mr-1" />
            )}
            Refresh from Spruce
          </Button>
        </div>
      </div>
      
      {/* Results */}
      <ScrollArea className="flex-1">
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400">
            <Loader2 className="h-8 w-8 animate-spin mb-2" />
            <p className="text-sm">Searching patients...</p>
          </div>
        )}
        
        {error && (
          <div className="flex flex-col items-center justify-center h-40 text-red-400">
            <AlertCircle className="h-8 w-8 mb-2" />
            <p className="text-sm">Error loading patients</p>
          </div>
        )}
        
        {!isLoading && !error && searchQuery && patients.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400">
            <UserRound className="h-8 w-8 mb-2" />
            <p className="text-sm">No patients found</p>
          </div>
        )}
        
        {!searchQuery && !isLoading && (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400">
            <Search className="h-8 w-8 mb-2" />
            <p className="text-sm">Start typing to search</p>
          </div>
        )}
        
        <div className="divide-y divide-gray-800">
          {patients.map((patient) => (
            <button
              key={patient.id}
              className="w-full p-4 flex items-center gap-4 hover:bg-[#1e1e1e] text-left transition-colors"
              onClick={() => onPatientSelect(patient.id)}
            >
              <Avatar className="h-12 w-12 bg-blue-800">
                {patient.avatarUrl ? (
                  <AvatarImage src={patient.avatarUrl} alt={patient.name} />
                ) : (
                  <AvatarFallback>{getInitials(patient.name)}</AvatarFallback>
                )}
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium truncate">{patient.name}</h3>
                  <span className="text-xs text-gray-400 ml-2">
                    {patient.spruceId ? 'Spruce' : 'Local'}
                  </span>
                </div>
                
                <div className="text-sm text-gray-400 mt-1">
                  {patient.gender}, {calculateAge(patient.dateOfBirth)} years
                </div>
                
                <div className="flex mt-2 text-xs text-gray-500 gap-3">
                  <div className="flex items-center">
                    <Phone className="h-3 w-3 mr-1" />
                    <span className="truncate">{patient.phone}</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="h-3 w-3 mr-1" />
                    <span className="truncate">{patient.email}</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}