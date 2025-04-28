import React from 'react';
import { FileText, Search, Cat } from 'lucide-react';
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
        
        <div className="flex flex-col items-center justify-center p-10">
          <div className="bg-[#1e1e1e] border border-gray-800 rounded-md p-8 hover:border-gray-700 transition-colors cursor-pointer max-w-2xl w-full">
            <div className="flex items-center mb-4 justify-center">
              <Cat className="h-10 w-10 text-purple-400 mr-4" />
              <h2 className="text-3xl font-bold">Catty</h2>
            </div>
            <div className="bg-[#272727] p-6 rounded-md mt-4">
              <h3 className="text-xl font-semibold mb-2 text-blue-400">Definition:</h3>
              <p className="text-lg text-gray-200 leading-relaxed">
                "Catty" is a term used to describe slyly malicious or spiteful behavior, particularly in verbal interactions. 
                It often refers to subtle, passive-aggressive comments or actions that appear innocuous on the surface but are actually intended to hurt, 
                criticize, or undermine someone. The term derives from stereotypical cat-like behaviors such as being calculating, 
                stealthy, or having hidden intentions.
              </p>
              <p className="text-lg text-gray-200 mt-4 leading-relaxed">
                In social contexts, someone described as "catty" might engage in gossip, backhanded compliments, or making 
                seemingly innocent remarks with underlying negative intentions. The behavior is characterized by its indirect nature - 
                avoiding direct confrontation while still attempting to cause emotional harm or establish social dominance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}