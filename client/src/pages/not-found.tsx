import React from "react";
import { Link } from "wouter";
import { AlertTriangle, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import NavigationBar from "@/components/navigation/NavigationBar";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-[#121212] text-white">
      {/* Always include the navigation bar */}
      <NavigationBar />

      <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-auto">
        <AlertTriangle className="h-24 w-24 text-yellow-400 mb-6" />
        <h1 className="text-4xl font-bold mb-2">404</h1>
        <p className="text-xl mb-8 text-center">Page not found</p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-5 w-5" />
            Go Back
          </Button>

          <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700" asChild>
            <Link href="/">
              <Home className="h-5 w-5" />
              Return to Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
