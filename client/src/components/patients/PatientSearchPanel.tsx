import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Loader2 } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface PatientSearchPanelProps {
  onPatientSelect: (patientId: number) => void;
}

interface Patient {
  id: number;
  name: string;
  avatarUrl: string | null;
  gender: string;
  dateOfBirth: string;
  phone: string;
  email: string;
}

export default function PatientSearchPanel({ onPatientSelect }: PatientSearchPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  // Query for Spruce patients
  const { 
    data: sprucePatients = [], 
    error: spruceError,
    isLoading: spruceLoading,
    refetch: refetchSprucePatients
  } = useQuery<Patient[]>({
    queryKey: ['/api/patients/spruce'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/patients/spruce');
      return await res.json();
    },
    enabled: false // Don't fetch on component mount
  });
  
  // Query for local patients
  const { 
    data: localPatients = [], 
    isLoading: localLoading 
  } = useQuery<Patient[]>({
    queryKey: ['/api/patients'],
  });
  
  // Combine both patient sets and filter by search query
  const allPatients = [...sprucePatients, ...localPatients];
  const filteredPatients = searchQuery.trim() === '' 
    ? allPatients 
    : allPatients.filter(patient => {
        const query = searchQuery.toLowerCase();
        return (
          patient.name?.toLowerCase().includes(query) || 
          patient.email?.toLowerCase().includes(query) || 
          patient.phone?.includes(query)
        );
      });
  
  // Function to handle search submission
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      // Search Spruce patients
      await refetchSprucePatients();
    } catch (error) {
      console.error('Error searching patients:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Search when user presses Enter
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  return (
    <div className="h-full flex flex-col bg-[#121212] text-white p-4">
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-4">Patient Search</h2>
        
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyPress}
              className="w-full bg-[#2a2a2a] border-gray-700 text-white"
            />
          </div>
          <Button 
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search size={16} />}
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-3">
        {(localLoading || spruceLoading) && (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        )}
        
        {!localLoading && !spruceLoading && filteredPatients.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <Search size={48} className="mb-2 opacity-50" />
            <p>No patients found. Try a different search term.</p>
          </div>
        )}
        
        {filteredPatients.map((patient) => (
          <Card 
            key={patient.id} 
            className="bg-[#1e1e1e] border-gray-800 hover:bg-[#262626] cursor-pointer transition-colors"
            onClick={() => onPatientSelect(patient.id)}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <Avatar className="h-12 w-12 bg-blue-600">
                <AvatarFallback>
                  {patient.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h3 className="font-medium text-white">{patient.name}</h3>
                <div className="flex flex-col sm:flex-row sm:gap-4 text-sm text-gray-400">
                  <span>{patient.gender}</span>
                  <span>DOB: {new Date(patient.dateOfBirth).toLocaleDateString()}</span>
                  <span>{patient.phone}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}