import React from 'react';
import { Link } from 'wouter';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import NavigationBar from '@/components/navigation/NavigationBar';

export default function NotFound() {
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
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <AlertTriangle className="h-20 w-20 text-yellow-500 mb-6" />
        <h1 className="text-4xl font-bold mb-2">404</h1>
        <p className="text-xl text-gray-400 mb-8">Page not found</p>
        <Link href="/" className="flex items-center text-blue-500 hover:text-blue-400 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Return to Home
        </Link>
      </div>
    </div>
  );
}