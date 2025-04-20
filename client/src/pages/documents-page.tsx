import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, FileText, Search } from 'lucide-react';
import NavigationBar from '@/components/navigation/NavigationBar';
import { Input } from '@/components/ui/input';

export default function DocumentsPage() {
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
          {/* Sample documents - these would be fetched from API in a real implementation */}
          {["Patient Records", "SOAP Notes", "HPI Summaries", "Prescription History", "Lab Results", "Imaging Reports"].map((docType, index) => (
            <Card key={index} className="bg-[#1e1e1e] border-gray-800 hover:border-gray-700 transition-colors cursor-pointer">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-[#2a2a2a] flex items-center justify-center mr-3">
                    <FileText className="h-5 w-5 text-gray-400" />
                  </div>
                  {docType}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-400">
                  Access and manage all {docType.toLowerCase()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}