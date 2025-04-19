import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Search, Loader2, RefreshCw, Check } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';

interface Patient {
  id: number;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  language: 'english' | 'french' | null;
  spruceId: string | null;
}

interface PatientSearchPanelProps {
  onSelectPatient: (patient: Patient) => void;
  selectedPatientId: number | null;
}

export default function PatientSearchPanel({ 
  onSelectPatient,
  selectedPatientId
}: PatientSearchPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [syncingPatients, setSyncingPatients] = useState(false);
  
  // Query patients with optional search filter
  const { 
    data: patients = [], 
    isLoading,
    refetch
  } = useQuery<Patient[]>({
    queryKey: ['/api/patients', debouncedSearchTerm],
    queryFn: async () => {
      const url = debouncedSearchTerm 
        ? `/api/patients?query=${encodeURIComponent(debouncedSearchTerm)}`
        : '/api/patients';
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error('Failed to fetch patients');
      }
      
      return res.json();
    }
  });
  
  // Sync patients with Spruce API
  const handleSyncPatients = async () => {
    setSyncingPatients(true);
    
    try {
      const res = await fetch('/api/spruce/sync-patients', {
        method: 'POST',
      });
      
      if (!res.ok) {
        throw new Error('Failed to sync patients');
      }
      
      // Refetch the patients list
      await refetch();
    } catch (error) {
      console.error('Error syncing patients:', error);
    } finally {
      setSyncingPatients(false);
    }
  };
  
  return (
    <div className="flex flex-col h-full bg-[#121212] text-white">
      <div className="p-4 bg-[#1e1e1e] border-b border-gray-800 flex justify-between items-center">
        <h2 className="font-semibold">Patients</h2>
        
        <Button 
          size="sm" 
          variant="outline" 
          onClick={handleSyncPatients}
          disabled={syncingPatients}
          className="text-xs bg-[#262626] hover:bg-gray-700"
        >
          {syncingPatients ? (
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3 mr-1" />
          )}
          Sync
        </Button>
      </div>
      
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="text"
            placeholder="Search patients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 bg-[#1e1e1e] border-gray-700 text-white"
          />
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        ) : patients.length > 0 ? (
          <div className="divide-y divide-gray-800">
            {patients.map((patient) => (
              <div 
                key={patient.id}
                className={`p-3 cursor-pointer hover:bg-[#1e1e1e] ${selectedPatientId === patient.id ? 'bg-[#1e1e1e]' : ''}`}
                onClick={() => onSelectPatient(patient)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{patient.name}</div>
                    <div className="text-sm text-gray-400">
                      {patient.email || patient.phone}
                    </div>
                  </div>
                  
                  {selectedPatientId === patient.id && (
                    <Check className="h-4 w-4 text-blue-500" />
                  )}
                </div>
                
                <div className="flex items-center mt-1 text-xs space-x-2">
                  {patient.language && (
                    <span className="px-1.5 py-0.5 rounded bg-[#262626] text-gray-300">
                      {patient.language.charAt(0).toUpperCase() + patient.language.slice(1)}
                    </span>
                  )}
                  
                  {patient.gender && (
                    <span className="px-1.5 py-0.5 rounded bg-[#262626] text-gray-300">
                      {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center p-4">
            {debouncedSearchTerm ? 'No patients found' : 'No patients available'}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}