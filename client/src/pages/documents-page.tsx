import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Search } from 'lucide-react';
import NavigationBar from '@/components/navigation/NavigationBar';
import { Input } from '@/components/ui/input';
import { Link } from 'wouter';

export default function DocumentsPage() {
  // Document categories
  const documentTypes = [
    {
      id: 'patient-records',
      title: 'Patient Records',
      description: 'Access and manage all patient records'
    },
    {
      id: 'soap-notes',
      title: 'SOAP Notes',
      description: 'Access and manage all soap notes'
    },
    {
      id: 'hpi-summaries',
      title: 'HPI Summaries',
      description: 'Access and manage all hpi summaries'
    },
    {
      id: 'prescription-history',
      title: 'Prescription History',
      description: 'Access and manage all prescription history'
    },
    {
      id: 'lab-results',
      title: 'Lab Results',
      description: 'Access and manage all lab results'
    },
    {
      id: 'imaging-reports',
      title: 'Imaging Reports',
      description: 'Access and manage all imaging reports'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#121212] text-white">
      {/* Header */}
      <header className="h-14 flex items-center px-4 bg-[#1e1e1e] border-b border-gray-800">
        <h1 className="text-xl font-semibold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">InstantHPI</h1>
        <div className="ml-6 flex-1">
          <NavigationBar />
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Documents</h2>
            <p className="text-gray-400">Access patient documents and medical records</p>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input 
              placeholder="Search documents..." 
              className="pl-8 bg-[#1e1e1e] border-gray-800 text-white"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documentTypes.map((docType) => (
            <Card 
              key={docType.id} 
              className="bg-[#1e1e1e] border border-[#333] hover:border-gray-700 transition-colors cursor-pointer"
            >
              <CardContent className="p-6">
                <div className="flex items-center mb-2">
                  <FileText className="h-5 w-5 text-blue-400 mr-3" />
                  <h3 className="text-lg font-semibold">{docType.title}</h3>
                </div>
                <p className="text-sm text-gray-400">
                  {docType.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}