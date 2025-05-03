import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

export default function HomePage() {
  return (
    <AppLayout>
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">InstantHPI Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-[#1e1e1e] border-[#333]">
            <CardHeader>
              <CardTitle>Current Layout</CardTitle>
              <CardDescription>Standard InstantHPI layout</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 mb-4">
                The current layout features a fixed header with navigation tabs and a main content area.
              </p>
              <Button disabled className="w-full bg-blue-600 hover:bg-blue-700">
                You are here
              </Button>
            </CardContent>
          </Card>
          
          <Card className="bg-[#1e1e1e] border-[#333]">
            <CardHeader>
              <CardTitle>Spruce-like Layout</CardTitle>
              <CardDescription>New layout option based on Spruce Health</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 mb-4">
                Try our new Spruce-like layout with a left sidebar, contextual navigation panel, and content area.
              </p>
              <Link href="/spruce-demo">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Try Spruce Layout
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-[#1e1e1e] border-[#333]">
            <CardHeader>
              <CardTitle>Patients</CardTitle>
              <CardDescription>View and manage patients</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 mb-4">Access your patient records</p>
              <Link href="/patients">
                <Button className="w-full" variant="outline">
                  Go to Patients
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card className="bg-[#1e1e1e] border-[#333]">
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>Configure your practice</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 mb-4">Manage organization settings</p>
              <Link href="/settings">
                <Button className="w-full" variant="outline">
                  Go to Settings
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card className="bg-[#1e1e1e] border-[#333]">
            <CardHeader>
              <CardTitle>Medication Refills</CardTitle>
              <CardDescription>Process medication requests</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 mb-4">Review and approve refills</p>
              <Link href="/medication-refills">
                <Button className="w-full" variant="outline">
                  Go to Refills
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}