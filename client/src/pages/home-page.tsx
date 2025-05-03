import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { 
  Users, 
  FileText, 
  Settings, 
  PillIcon, 
  Heart, 
  AlertTriangle, 
  GraduationCap,
  CreditCard
} from 'lucide-react';

export default function HomePage() {
  return (
    <AppLayout>
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Welcome to InstantHPI</h1>
        <p className="text-gray-400 mb-8">
          Your comprehensive telemedicine platform for enhanced medical interactions
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-[#1e1e1e] border-[#333]">
            <CardHeader className="pb-3">
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-blue-400" />
                <CardTitle>Patients</CardTitle>
              </div>
              <CardDescription>View and manage patients</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 mb-4">Access patient records, medical history, and documents</p>
              <Link href="/patients">
                <Button className="w-full" variant="outline">View Patients</Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card className="bg-[#1e1e1e] border-[#333]">
            <CardHeader className="pb-3">
              <div className="flex items-center">
                <PillIcon className="h-5 w-5 mr-2 text-green-400" />
                <CardTitle>Medication Refills</CardTitle>
              </div>
              <CardDescription>Handle medication requests</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 mb-4">Review and process patient medication refill requests</p>
              <Link href="/medication-refills">
                <Button className="w-full" variant="outline">View Refills</Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card className="bg-[#1e1e1e] border-[#333]">
            <CardHeader className="pb-3">
              <div className="flex items-center">
                <Heart className="h-5 w-5 mr-2 text-red-400" />
                <CardTitle>Chronic Conditions</CardTitle>
              </div>
              <CardDescription>Track chronic conditions</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 mb-4">Monitor and manage patients with chronic health conditions</p>
              <Link href="/chronic-conditions">
                <Button className="w-full" variant="outline">View Conditions</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
        
        <h2 className="text-2xl font-bold mb-4">Quick Access</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-[#1e1e1e] border-[#333]">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center">
                <FileText className="h-4 w-4 mr-2 text-purple-400" />
                <CardTitle className="text-base">Documents</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <Link href="/documents">
                <Button className="w-full" size="sm" variant="ghost">
                  Access Documents
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card className="bg-[#1e1e1e] border-[#333]">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2 text-yellow-400" />
                <CardTitle className="text-base">Urgent Care</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <Link href="/urgent-care">
                <Button className="w-full" size="sm" variant="ghost">
                  View Urgent Cases
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card className="bg-[#1e1e1e] border-[#333]">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center">
                <GraduationCap className="h-4 w-4 mr-2 text-blue-400" />
                <CardTitle className="text-base">Education</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <Link href="/education">
                <Button className="w-full" size="sm" variant="ghost">
                  View Resources
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card className="bg-[#1e1e1e] border-[#333]">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center">
                <CreditCard className="h-4 w-4 mr-2 text-green-400" />
                <CardTitle className="text-base">Subscription</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <Link href="/subscription">
                <Button className="w-full" size="sm" variant="ghost">
                  Manage Plan
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
        
        <Card className="bg-[#1e1e1e] border-[#333]">
          <CardHeader className="pb-3">
            <div className="flex items-center">
              <Settings className="h-5 w-5 mr-2 text-gray-400" />
              <CardTitle>Settings</CardTitle>
            </div>
            <CardDescription>Configure your practice</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400 mb-4">
              Manage organization settings, teammates, and user preferences
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/settings/organization-profile">
                <Button variant="outline" size="sm">
                  Organization Profile
                </Button>
              </Link>
              <Link href="/settings/teammates">
                <Button variant="outline" size="sm">
                  Teammates
                </Button>
              </Link>
              <Link href="/settings">
                <Button variant="outline" size="sm">
                  All Settings
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}