import React from "react";
import ModernLayout from "@/components/layout/ModernLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building, Users, CreditCard, Settings } from "lucide-react";
import { Link } from "wouter";

export default function SettingsPage() {
  return (
    <ModernLayout title="Settings" description="Application settings">
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        <p className="text-gray-400 mb-8">Configure your organization and account settings</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-[#1e1e1e] border-[#333]">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="h-5 w-5 mr-2" />
                Organization Profile
              </CardTitle>
              <CardDescription>Basic information about your organization</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 mb-4">
                Manage your organization's name, address, and contact information.
              </p>
              <Link href="/settings/organization-profile">
                <Button className="w-full" variant="outline">
                  Manage Profile
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-[#1e1e1e] border-[#333]">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Teammates
              </CardTitle>
              <CardDescription>Manage your team members</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 mb-4">
                Add, remove, and manage permissions for teammates.
              </p>
              <Link href="/settings/teammates">
                <Button className="w-full" variant="outline">
                  Manage Team
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-[#1e1e1e] border-[#333]">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Billing
              </CardTitle>
              <CardDescription>Subscription and payment details</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 mb-4">
                View and manage your subscription and payment methods.
              </p>
              <Link href="/subscription">
                <Button className="w-full" variant="outline">
                  Manage Billing
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <h2 className="text-2xl font-bold mb-4">Account Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-[#1e1e1e] border-[#333]">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Personal Preferences
              </CardTitle>
              <CardDescription>Your personal settings</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 mb-4">
                Customize your experience with notifications, theme, and language preferences.
              </p>
              <Button className="w-full" variant="outline">
                Edit Preferences
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="bg-[#1a1a1a] p-4 rounded-md border border-[#333] mb-8">
          <h3 className="text-lg font-medium mb-2">About this page</h3>
          <p className="text-gray-400">
            This settings page uses the new Spruce-like layout with a left sidebar for main
            navigation and a middle panel for settings categories. Notice how the middle panel
            appears when you select "Settings" from the left sidebar, providing contextual
            navigation options.
          </p>
        </div>
      </div>
    </ModernLayout>
  );
}
