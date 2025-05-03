import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, User, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import AppLayout from '@/components/layout/AppLayout';

interface Patient {
  id: number;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  language: 'english' | 'french' | null;
}

export default function PatientsPage() {
  const { data: allPatients, isLoading } = useQuery<Patient[]>({
    queryKey: ['/api/patients'],
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  
  // Filter patients when search term or patient data changes
  useEffect(() => {
    if (!allPatients) return;
    
    if (!searchTerm) {
      setFilteredPatients(allPatients);
      return;
    }
    
    const term = searchTerm.toLowerCase();
    const filtered = allPatients.filter(patient => 
      patient.name.toLowerCase().includes(term) ||
      (patient.email && patient.email.toLowerCase().includes(term)) ||
      (patient.phone && patient.phone.includes(term))
    );
    
    setFilteredPatients(filtered);
  }, [searchTerm, allPatients]);

  return (
    <AppLayout>
      <div className="p-6">
        <div className="container mx-auto">
          {/* Page Title and Search */}
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-4 md:mb-0">
              <h2 className="text-2xl font-bold">Patients</h2>
              <p className="text-gray-400">View and manage your patients</p>
            </div>
            
            <div className="flex space-x-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input 
                  type="text"
                  placeholder="Search patients..." 
                  className="pl-10 bg-[#1e1e1e] border-gray-800 text-white w-full"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Add Patient
              </Button>
            </div>
          </div>
          
          {/* Patient Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          ) : filteredPatients && filteredPatients.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPatients.map((patient) => (
                <Card key={patient.id} className="bg-[#1e1e1e] border-gray-800 hover:border-gray-700 cursor-pointer transition-colors">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-[#2a2a2a] flex items-center justify-center mr-3">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      {patient.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-400 space-y-1">
                      <p><span className="text-gray-500">Email:</span> {patient.email}</p>
                      <p><span className="text-gray-500">Phone:</span> {patient.phone}</p>
                      <p><span className="text-gray-500">DOB:</span> {new Date(patient.dateOfBirth).toLocaleDateString()}</p>
                      <p><span className="text-gray-500">Gender:</span> {patient.gender}</p>
                      <p><span className="text-gray-500">Language:</span> {patient.language || 'Not specified'}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="text-center">
                <p className="text-xl font-medium mb-2">No patients found</p>
                <p className="text-gray-500 mb-6">
                  {searchTerm ? 'No patients match your search criteria.' : 'You haven\'t added any patients yet.'}
                </p>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Add Your First Patient
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}