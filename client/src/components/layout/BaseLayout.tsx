import React, { ReactNode } from 'react';
import NavigationBar from '@/components/navigation/NavigationBar';

interface BaseLayoutProps {
  children: ReactNode;
}

export default function BaseLayout({ children }: BaseLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[#121212] text-white">
      {/* Header */}
      <header className="h-14 flex items-center px-4 bg-[#1e1e1e] border-b border-gray-800">
        <h1 className="text-xl font-semibold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">InstantHPI</h1>
      </header>
      
      {/* Navigation Bar */}
      <NavigationBar />
      
      {/* Main Content */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}