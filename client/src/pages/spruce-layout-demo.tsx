import React from 'react';
import SpruceLikeLayout from '@/components/layout/SpruceLikeLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function SpruceLayoutDemo() {
  return (
    <SpruceLikeLayout>
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">InstantHPI with Spruce-like Layout</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-[#1e1e1e] border-[#333]">
            <CardHeader>
              <CardTitle>Patients</CardTitle>
              <CardDescription>View and manage your patients</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 mb-4">Total active patients: 124</p>
              <Button className="w-full" variant="outline">View Patients</Button>
            </CardContent>
          </Card>
          
          <Card className="bg-[#1e1e1e] border-[#333]">
            <CardHeader>
              <CardTitle>Messages</CardTitle>
              <CardDescription>Communication with patients</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 mb-4">Unread messages: 7</p>
              <Button className="w-full" variant="outline">View Messages</Button>
            </CardContent>
          </Card>
          
          <Card className="bg-[#1e1e1e] border-[#333]">
            <CardHeader>
              <CardTitle>Medication Refills</CardTitle>
              <CardDescription>Process medication refill requests</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 mb-4">Pending refills: 3</p>
              <Button className="w-full" variant="outline">View Refills</Button>
            </CardContent>
          </Card>
        </div>
        
        <Card className="bg-[#1e1e1e] border-[#333] mb-8">
          <CardHeader>
            <CardTitle>Layout Information</CardTitle>
            <CardDescription>About this layout demo</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400 mb-4">
              This page demonstrates the Spruce-like layout for InstantHPI. The layout includes:
            </p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 mb-4">
              <li>Left sidebar with main navigation sections</li>
              <li>Secondary contextual navigation panel when needed</li>
              <li>Main content area with header and content</li>
              <li>Dropdown submenus similar to Spruce</li>
            </ul>
            <p className="text-gray-400">
              Try clicking on the different sections in the left sidebar to see how the navigation works.
              The "Settings" section will show the additional middle panel similar to Spruce.
            </p>
          </CardContent>
        </Card>
      </div>
    </SpruceLikeLayout>
  );
}