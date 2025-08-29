import React from "react";
import AppLayoutSpruce from "@/components/layout/AppLayoutSpruce";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GlowingBox } from "@/components/ui/glowing-box";
import { RainbowButton } from "@/components/ui/rainbow-button";

import { Link } from "wouter";
import {
  Users,
  FileText,
  Settings,
  PillIcon,
  Heart,
  AlertTriangle,
  GraduationCap,
  CreditCard,
  BrainCircuit,
} from "lucide-react";

export default function HomePage() {
  return (
    <AppLayoutSpruce>
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <GlowingBox>
            <div className="p-6">
              <div className="flex items-center mb-3">
                <Users className="h-5 w-5 mr-2 text-muted-foreground" />
                <h3 className="text-foreground font-semibold text-lg">Patients</h3>
              </div>
              <p className="text-muted-foreground text-base font-medium mb-2">
                View and manage patients
              </p>
              <p className="text-muted-foreground/80 mb-4 leading-relaxed">
                Access patient records, medical history, and documents
              </p>
              <Link href="/patients">
                <RainbowButton className="w-full">View Patients</RainbowButton>
              </Link>
            </div>
          </GlowingBox>

          <GlowingBox>
            <div className="p-6">
              <div className="flex items-center mb-3">
                <PillIcon className="h-5 w-5 mr-2 text-muted-foreground" />
                <h3 className="text-foreground font-semibold text-lg">Medication Refills</h3>
              </div>
              <p className="text-muted-foreground text-base font-medium mb-2">
                Handle medication requests
              </p>
              <p className="text-muted-foreground/80 mb-4 leading-relaxed">
                Review and process patient medication refill requests
              </p>
              <Link href="/medication-refills">
                <RainbowButton className="w-full">View Refills</RainbowButton>
              </Link>
            </div>
          </GlowingBox>

          <GlowingBox>
            <div className="p-6">
              <div className="flex items-center mb-3">
                <Heart className="h-5 w-5 mr-2 text-muted-foreground" />
                <h3 className="text-foreground font-semibold text-lg">Chronic Conditions</h3>
              </div>
              <p className="text-muted-foreground text-base font-medium mb-2">
                Track chronic conditions
              </p>
              <p className="text-muted-foreground/80 mb-4 leading-relaxed">
                Monitor and manage patients with chronic health conditions
              </p>
              <Link href="/chronic-conditions">
                <RainbowButton className="w-full">View Conditions</RainbowButton>
              </Link>
            </div>
          </GlowingBox>
        </div>

        <h2 className="text-2xl font-bold mb-4 text-foreground">Quick Access</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <GlowingBox>
            <div className="p-4">
              <div className="flex items-center mb-3">
                <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                <h4 className="text-foreground font-semibold">Documents</h4>
              </div>
              <Link href="/documents">
                <RainbowButton className="w-full h-8 px-3 text-sm">Access Documents</RainbowButton>
              </Link>
            </div>
          </GlowingBox>

          <GlowingBox>
            <div className="p-4">
              <div className="flex items-center mb-3">
                <AlertTriangle className="h-4 w-4 mr-2 text-muted-foreground" />
                <h4 className="text-foreground font-semibold">Urgent Care</h4>
              </div>
              <Link href="/urgent-care">
                <RainbowButton className="w-full h-8 px-3 text-sm">View Urgent Cases</RainbowButton>
              </Link>
            </div>
          </GlowingBox>

          <GlowingBox>
            <div className="p-4">
              <div className="flex items-center mb-3">
                <GraduationCap className="h-4 w-4 mr-2 text-muted-foreground" />
                <h4 className="text-foreground font-semibold">Education</h4>
              </div>
              <Link href="/education">
                <RainbowButton className="w-full h-8 px-3 text-sm">View Resources</RainbowButton>
              </Link>
            </div>
          </GlowingBox>

          <GlowingBox>
            <div className="p-4">
              <div className="flex items-center mb-3">
                <CreditCard className="h-4 w-4 mr-2 text-muted-foreground" />
                <h4 className="text-foreground font-semibold">Subscription</h4>
              </div>
              <Link href="/subscription">
                <RainbowButton className="w-full h-8 px-3 text-sm">Manage Plan</RainbowButton>
              </Link>
            </div>
          </GlowingBox>
        </div>

        <GlowingBox>
          <div className="p-6">
            <div className="flex items-center mb-3">
              <Settings className="h-5 w-5 mr-2 text-gray-400" />
              <h3 className="text-white font-semibold text-lg">Settings</h3>
            </div>
            <p className="text-white/90 text-base font-medium mb-2">Configure your practice</p>
            <p className="text-gray-300 mb-4 leading-relaxed">
              Manage organization settings, teammates, and user preferences
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/settings/organization-profile">
                <RainbowButton className="h-8 px-3 text-sm">Organization Profile</RainbowButton>
              </Link>
              <Link href="/settings/teammates">
                <RainbowButton className="h-8 px-3 text-sm">Teammates</RainbowButton>
              </Link>
              <Link href="/settings">
                <RainbowButton className="h-8 px-3 text-sm">All Settings</RainbowButton>
              </Link>
            </div>
          </div>
        </GlowingBox>
      </div>
    </AppLayoutSpruce>
  );
}
