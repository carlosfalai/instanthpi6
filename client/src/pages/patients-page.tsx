import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, User } from 'lucide-react';
import NavigationBar from '@/components/navigation/NavigationBar';

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
  const { data: patients, isLoading } = useQuery<Patient[]>({
    queryKey: ['/api/patients'],
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#121212] text-white">
      {/* Header */}
      <header className="h-14 flex items-center px-6 bg-[#1e1e1e] border-b border-gray-800">
        <h1 className="text-xl font-semibold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">InstantHPI</h1>
      </header>
      
      {/* Navigation Bar */}
      <NavigationBar />
      
      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="container mx-auto mb-6">
          <h2 className="text-2xl font-bold">Patients</h2>
          <p className="text-gray-400">View and manage your patients</p>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        ) : (
          <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {patients?.map((patient) => (
              <Card key={patient.id} className="bg-[#1e1e1e] border-gray-800">
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
        )}
      </div>
    </div>
  );
}