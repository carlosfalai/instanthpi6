import React, { ReactNode } from 'react';
import NavigationBar from '@/components/navigation/NavigationBar';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[#121212] text-white">
      {/* Header - Fixed for all pages */}
      <header className="h-14 flex items-center px-4 bg-[#1e1e1e] border-b border-gray-800">
        <h1 className="text-xl font-semibold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">InstantHPI</h1>
      </header>
      
      {/* Navigation Bar - Fixed for all pages */}
      <NavigationBar />
      
      {/* Main Content - This will change per page */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}