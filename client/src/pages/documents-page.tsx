import React from 'react';
import { FileText, Search } from 'lucide-react';
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
          {/* Patient Records */}
          <div className="bg-[#1e1e1e] border border-gray-800 rounded-md p-6 hover:border-gray-700 transition-colors cursor-pointer">
            <div className="flex items-center mb-2">
              <FileText className="h-5 w-5 text-blue-400 mr-3" />
              <h3 className="text-xl font-semibold">Patient Records</h3>
            </div>
            <p className="text-sm text-gray-400">
              Access and manage all patient records
            </p>
          </div>
          
          {/* SOAP Notes */}
          <div className="bg-[#1e1e1e] border border-gray-800 rounded-md p-6 hover:border-gray-700 transition-colors cursor-pointer">
            <div className="flex items-center mb-2">
              <FileText className="h-5 w-5 text-blue-400 mr-3" />
              <h3 className="text-xl font-semibold">SOAP Notes</h3>
            </div>
            <p className="text-sm text-gray-400">
              Access and manage all soap notes
            </p>
          </div>
          
          {/* HPI Summaries */}
          <div className="bg-[#1e1e1e] border border-gray-800 rounded-md p-6 hover:border-gray-700 transition-colors cursor-pointer">
            <div className="flex items-center mb-2">
              <FileText className="h-5 w-5 text-blue-400 mr-3" />
              <h3 className="text-xl font-semibold">HPI Summaries</h3>
            </div>
            <p className="text-sm text-gray-400">
              Access and manage all hpi summaries
            </p>
          </div>
          
          {/* Prescription History */}
          <div className="bg-[#1e1e1e] border border-gray-800 rounded-md p-6 hover:border-gray-700 transition-colors cursor-pointer">
            <div className="flex items-center mb-2">
              <FileText className="h-5 w-5 text-blue-400 mr-3" />
              <h3 className="text-xl font-semibold">Prescription History</h3>
            </div>
            <p className="text-sm text-gray-400">
              Access and manage all prescription history
            </p>
          </div>
          
          {/* Lab Results */}
          <div className="bg-[#1e1e1e] border border-gray-800 rounded-md p-6 hover:border-gray-700 transition-colors cursor-pointer">
            <div className="flex items-center mb-2">
              <FileText className="h-5 w-5 text-blue-400 mr-3" />
              <h3 className="text-xl font-semibold">Lab Results</h3>
            </div>
            <p className="text-sm text-gray-400">
              Access and manage all lab results
            </p>
          </div>
          
          {/* Imaging Reports */}
          <div className="bg-[#1e1e1e] border border-gray-800 rounded-md p-6 hover:border-gray-700 transition-colors cursor-pointer">
            <div className="flex items-center mb-2">
              <FileText className="h-5 w-5 text-blue-400 mr-3" />
              <h3 className="text-xl font-semibold">Imaging Reports</h3>
            </div>
            <p className="text-sm text-gray-400">
              Access and manage all imaging reports
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}