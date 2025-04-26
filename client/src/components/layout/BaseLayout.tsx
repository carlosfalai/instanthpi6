import React, { ReactNode, useState, useEffect } from 'react';
import NavigationBar from '@/components/navigation/NavigationBar';

interface BaseLayoutProps {
  children: ReactNode;
}

export default function BaseLayout({ children }: BaseLayoutProps) {
  const [scrolled, setScrolled] = useState(false);

  // Add scroll event listener to detect when page is scrolled
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

  return (
    <div className="min-h-screen flex flex-col bg-[#121212] text-white">
      {/* Header - with glass morphism effect and transition */}
      <header 
        className={`sticky top-0 z-50 h-14 flex items-center px-6 transition-all duration-300 ease-in-out
          ${scrolled 
            ? 'bg-[#1e1e1e]/80 backdrop-blur-md shadow-md' 
            : 'bg-gradient-to-r from-[#1e1e1e]/70 to-[#121212]/70 backdrop-blur-sm'
          } border-b border-gray-800/50`}
      >
        <h1 className="text-xl font-semibold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">InstantHPI</h1>
      </header>
      
      {/* Navigation Bar - also with glass morphism effect */}
      <div className="sticky top-14 z-40 bg-[#151515]/80 backdrop-blur-sm">
        <NavigationBar />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}