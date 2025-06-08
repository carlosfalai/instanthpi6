import React from 'react';
import AppLayoutSpruce from '@/components/layout/AppLayoutSpruce';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GlowingBox } from '@/components/ui/glowing-box';
import { RainbowButton } from '@/components/ui/rainbow-button';
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
          <GlowingBox>
            <div className="p-6">
              <div className="flex items-center mb-3">
                <Users className="h-5 w-5 mr-2 text-blue-400" />
                <h3 className="text-white font-semibold">Patients</h3>
              </div>
              <p className="text-gray-300 text-sm mb-4">View and manage patients</p>
              <p className="text-gray-400 mb-4">Access patient records, medical history, and documents</p>
              <Link href="/patients">
                <GlowingBox>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" variant="outline">View Patients</Button>
                </GlowingBox>
              </Link>
            </div>
          </GlowingBox>
          
          <GlowingBox>
            <div className="p-6">
              <div className="flex items-center mb-3">
                <PillIcon className="h-5 w-5 mr-2 text-green-400" />
                <h3 className="text-white font-semibold">Medication Refills</h3>
              </div>
              <p className="text-gray-300 text-sm mb-4">Handle medication requests</p>
              <p className="text-gray-400 mb-4">Review and process patient medication refill requests</p>
              <Link href="/medication-refills">
                <GlowingBox>
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white" variant="outline">View Refills</Button>
                </GlowingBox>
              </Link>
            </div>
          </GlowingBox>
          
          <GlowingBox>
            <div className="p-6">
              <div className="flex items-center mb-3">
                <Heart className="h-5 w-5 mr-2 text-red-400" />
                <h3 className="text-white font-semibold">Chronic Conditions</h3>
              </div>
              <p className="text-gray-300 text-sm mb-4">Track chronic conditions</p>
              <p className="text-gray-400 mb-4">Monitor and manage patients with chronic health conditions</p>
              <Link href="/chronic-conditions">
                <GlowingBox>
                  <Button className="w-full bg-red-600 hover:bg-red-700 text-white" variant="outline">View Conditions</Button>
                </GlowingBox>
              </Link>
            </div>
          </GlowingBox>
        </div>
        
        <h2 className="text-2xl font-bold mb-4">Quick Access</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <GlowingBox>
            <div className="p-4">
              <div className="flex items-center mb-2">
                <FileText className="h-4 w-4 mr-2 text-purple-400" />
                <h4 className="text-white font-medium">Documents</h4>
              </div>
              <Link href="/documents">
                <GlowingBox>
                  <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white" size="sm">
                    Access Documents
                  </Button>
                </GlowingBox>
              </Link>
            </div>
          </GlowingBox>
          
          <GlowingBox>
            <div className="p-4">
              <div className="flex items-center mb-2">
                <AlertTriangle className="h-4 w-4 mr-2 text-yellow-400" />
                <h4 className="text-white font-medium">Urgent Care</h4>
              </div>
              <Link href="/urgent-care">
                <GlowingBox>
                  <Button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white" size="sm">
                    View Urgent Cases
                  </Button>
                </GlowingBox>
              </Link>
            </div>
          </GlowingBox>
          
          <GlowingBox>
            <div className="p-4">
              <div className="flex items-center mb-2">
                <GraduationCap className="h-4 w-4 mr-2 text-blue-400" />
                <h4 className="text-white font-medium">Education</h4>
              </div>
              <Link href="/education">
                <GlowingBox>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" size="sm">
                    View Resources
                  </Button>
                </GlowingBox>
              </Link>
            </div>
          </GlowingBox>
          
          <GlowingBox>
            <div className="p-4">
              <div className="flex items-center mb-2">
                <CreditCard className="h-4 w-4 mr-2 text-green-400" />
                <h4 className="text-white font-medium">Subscription</h4>
              </div>
              <Link href="/subscription">
                <GlowingBox>
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white" size="sm">
                    Manage Plan
                  </Button>
                </GlowingBox>
              </Link>
            </div>
          </GlowingBox>
        </div>
        
        <GlowingBox>
          <div className="p-6">
            <div className="flex items-center mb-3">
              <Settings className="h-5 w-5 mr-2 text-gray-400" />
              <h3 className="text-white font-semibold">Settings</h3>
            </div>
            <p className="text-gray-300 text-sm mb-4">Configure your practice</p>
            <p className="text-gray-400 mb-4">
              Manage organization settings, teammates, and user preferences
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/settings/organization-profile">
                <GlowingBox>
                  <Button variant="outline" size="sm" className="bg-gray-600 hover:bg-gray-700 text-white">
                    Organization Profile
                  </Button>
                </GlowingBox>
              </Link>
              <Link href="/settings/teammates">
                <GlowingBox>
                  <Button variant="outline" size="sm" className="bg-gray-600 hover:bg-gray-700 text-white">
                    Teammates
                  </Button>
                </GlowingBox>
              </Link>
              <Link href="/settings">
                <GlowingBox>
                  <Button variant="outline" size="sm" className="bg-gray-600 hover:bg-gray-700 text-white">
                    All Settings
                  </Button>
                </GlowingBox>
              </Link>
            </div>
          </div>
        </GlowingBox>
      </div>
    </AppLayoutSpruce>
  );
}