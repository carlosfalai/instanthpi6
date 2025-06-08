import React from 'react';
import AppLayoutSpruce from '@/components/layout/AppLayoutSpruce';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GlowingBox } from '@/components/ui/glowing-box';
import { HeroSectionDark } from '@/components/ui/hero-section-dark';
import { Link } from 'wouter';
import { 
  Users, 
  FileText, 
  Settings, 
  PillIcon, 
  Heart, 
  AlertTriangle, 
  GraduationCap,
  CreditCard,
  BrainCircuit
} from 'lucide-react';

export default function HomePage() {
  return (
    <AppLayoutSpruce>
      <div className="container mx-auto p-6">
        {/* Hero Section */}
        <div className="mb-8">
          <HeroSectionDark
            title="InstantHPI"
            subtitle="AI-Powered Medical Platform"
            description="Transform your medical practice with intelligent workflow automation, real-time patient communication, and advanced diagnostic support."
            primaryAction={{
              label: "Start Consultation",
              onClick: () => window.location.href = "/inbox"
            }}
            secondaryAction={{
              label: "View Documentation",
              onClick: () => window.location.href = "/documents"
            }}
            features={[
              { icon: <BrainCircuit className="h-4 w-4" />, label: "AI-Enhanced" },
              { icon: <Heart className="h-4 w-4" />, label: "Patient-Focused" },
              { icon: <Users className="h-4 w-4" />, label: "Team Collaboration" }
            ]}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <GlowingBox color="blue">
            <Card className="bg-transparent border-0">
              <CardHeader className="pb-3">
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-blue-400" />
                  <CardTitle className="text-white">Patients</CardTitle>
                </div>
                <CardDescription className="text-gray-300">View and manage patients</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 mb-4">Access patient records, medical history, and documents</p>
                <Link href="/patients">
                  <GlowingBox color="blue">
                    <Button className="w-full border-0 bg-blue-600 hover:bg-blue-700 text-white" variant="outline">View Patients</Button>
                  </GlowingBox>
                </Link>
              </CardContent>
            </Card>
          </GlowingBox>
          
          <GlowingBox color="green">
            <Card className="bg-transparent border-0">
              <CardHeader className="pb-3">
                <div className="flex items-center">
                  <PillIcon className="h-5 w-5 mr-2 text-green-400" />
                  <CardTitle className="text-white">Medication Refills</CardTitle>
                </div>
                <CardDescription className="text-gray-300">Handle medication requests</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 mb-4">Review and process patient medication refill requests</p>
                <Link href="/medication-refills">
                  <GlowingBox color="green">
                    <Button className="w-full border-0 bg-green-600 hover:bg-green-700 text-white" variant="outline">View Refills</Button>
                  </GlowingBox>
                </Link>
              </CardContent>
            </Card>
          </GlowingBox>
          
          <GlowingBox color="red">
            <Card className="bg-transparent border-0">
              <CardHeader className="pb-3">
                <div className="flex items-center">
                  <Heart className="h-5 w-5 mr-2 text-red-400" />
                  <CardTitle className="text-white">Chronic Conditions</CardTitle>
                </div>
                <CardDescription className="text-gray-300">Track chronic conditions</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 mb-4">Monitor and manage patients with chronic health conditions</p>
                <Link href="/chronic-conditions">
                  <GlowingBox color="red">
                    <Button className="w-full border-0 bg-red-600 hover:bg-red-700 text-white" variant="outline">View Conditions</Button>
                  </GlowingBox>
                </Link>
              </CardContent>
            </Card>
          </GlowingBox>
        </div>
        
        <h2 className="text-2xl font-bold mb-4">Quick Access</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <GlowingBox color="purple">
            <Card className="bg-transparent border-0">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-purple-400" />
                  <CardTitle className="text-base text-white">Documents</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <Link href="/documents">
                  <GlowingBox color="purple">
                    <Button className="w-full border-0 bg-purple-600 hover:bg-purple-700 text-white" size="sm" variant="ghost">
                      Access Documents
                    </Button>
                  </GlowingBox>
                </Link>
              </CardContent>
            </Card>
          </GlowingBox>
          
          <GlowingBox color="yellow">
            <Card className="bg-transparent border-0">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2 text-yellow-400" />
                  <CardTitle className="text-base text-white">Urgent Care</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <Link href="/urgent-care">
                  <GlowingBox color="yellow">
                    <Button className="w-full border-0 bg-yellow-600 hover:bg-yellow-700 text-white" size="sm" variant="ghost">
                      View Urgent Cases
                    </Button>
                  </GlowingBox>
                </Link>
              </CardContent>
            </Card>
          </GlowingBox>
          
          <GlowingBox variant="subtle" intensity="low" glowColor="blue">
            <Card className="bg-[#1e1e1e]/80 border-0">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center">
                  <GraduationCap className="h-4 w-4 mr-2 text-blue-400" />
                  <CardTitle className="text-base">Education</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <Link href="/education">
                  <GlowingBox variant="interactive" intensity="medium">
                    <Button className="w-full border-0" size="sm" variant="ghost">
                      View Resources
                    </Button>
                  </GlowingBox>
                </Link>
              </CardContent>
            </Card>
          </GlowingBox>
          
          <GlowingBox variant="subtle" intensity="low" glowColor="green">
            <Card className="bg-[#1e1e1e]/80 border-0">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center">
                  <CreditCard className="h-4 w-4 mr-2 text-green-400" />
                  <CardTitle className="text-base">Subscription</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <Link href="/subscription">
                  <GlowingBox variant="interactive" intensity="medium">
                    <Button className="w-full border-0" size="sm" variant="ghost">
                      Manage Plan
                    </Button>
                  </GlowingBox>
                </Link>
              </CardContent>
            </Card>
          </GlowingBox>
        </div>
        
        <GlowingBox variant="prominent" intensity="medium" glowColor="muted">
          <Card className="bg-[#1e1e1e]/80 border-0">
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
                  <GlowingBox variant="interactive" intensity="low">
                    <Button variant="outline" size="sm" className="border-0">
                      Organization Profile
                    </Button>
                  </GlowingBox>
                </Link>
                <Link href="/settings/teammates">
                  <GlowingBox variant="interactive" intensity="low">
                    <Button variant="outline" size="sm" className="border-0">
                      Teammates
                    </Button>
                  </GlowingBox>
                </Link>
                <Link href="/settings">
                  <GlowingBox variant="interactive" intensity="low">
                    <Button variant="outline" size="sm" className="border-0">
                      All Settings
                    </Button>
                  </GlowingBox>
                </Link>
              </div>
            </CardContent>
          </Card>
        </GlowingBox>
      </div>
    </AppLayoutSpruce>
  );
}