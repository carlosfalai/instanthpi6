import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#121212] text-white p-4">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl font-semibold mb-2">Page Not Found</p>
        <p className="text-gray-400 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild variant="default">
            <Link href="/">
              <Home className="h-4 w-4 mr-2" /> 
              Go to Home
            </Link>
          </Button>
          
          <Button asChild variant="outline">
            <Link href="#" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" /> 
              Go Back
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}