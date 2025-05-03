import React from 'react';
import { FileText } from 'lucide-react';
import NavigationBar from '@/components/navigation/NavigationBar';
import { Link } from 'wouter';

// Document category interface
interface DocumentCategory {
  title: string;
  description: string;
  icon: React.ReactNode;
  link: string;
}

export default function DocumentsPage() {
  // Document categories
  const documentCategories: DocumentCategory[] = [
    {
      title: "Patient Records",
      description: "Access and manage all patient records",
      icon: <FileText className="h-5 w-5 text-blue-500 mr-2" />,
      link: "/documents/patient-records"
    },
    {
      title: "SOAP Notes",
      description: "Access and manage all soap notes",
      icon: <FileText className="h-5 w-5 text-blue-500 mr-2" />,
      link: "/documents/soap-notes"
    },
    {
      title: "HPI Summaries",
      description: "Access and manage all hpi summaries",
      icon: <FileText className="h-5 w-5 text-blue-500 mr-2" />,
      link: "/documents/hpi-summaries"
    },
    {
      title: "Prescription History",
      description: "Access and manage all prescription history",
      icon: <FileText className="h-5 w-5 text-blue-500 mr-2" />,
      link: "/documents/prescription-history"
    },
    {
      title: "Lab Results",
      description: "Access and manage all lab results",
      icon: <FileText className="h-5 w-5 text-blue-500 mr-2" />,
      link: "/documents/lab-results"
    },
    {
      title: "Imaging Reports",
      description: "Access and manage all imaging reports",
      icon: <FileText className="h-5 w-5 text-blue-500 mr-2" />,
      link: "/documents/imaging-reports"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#121212] text-white">
      {/* Header with InstantHPI title - matches screenshot */}
      <div className="bg-[#1e1e1e] border-b border-gray-800">
        <div className="container mx-auto">
          <div className="px-4 py-3">
            <h1 className="text-xl font-semibold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">InstantHPI</h1>
          </div>
        </div>
      </div>
      
      {/* Navigation Bar - matches screenshot */}
      <NavigationBar />
      
      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="container mx-auto">
          {/* Documents Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold">Documents</h2>
            <p className="text-gray-400">Access patient documents and medical records</p>
          </div>
          
          {/* Document Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documentCategories.map((category, index) => (
              <Link key={index} href={category.link}>
                <a className="block bg-[#1e1e1e] hover:bg-[#252525] border border-gray-800 rounded-lg p-6 transition-colors">
                  <div className="flex items-center mb-2">
                    {category.icon}
                    <h3 className="text-lg font-semibold">{category.title}</h3>
                  </div>
                  <p className="text-sm text-gray-400">{category.description}</p>
                </a>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}