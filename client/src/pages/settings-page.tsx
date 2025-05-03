import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import AppLayout from '@/components/layout/AppLayout';
import { 
  ChevronRight, 
  Building, 
  Users, 
  UserCog, 
  Tag, 
  Phone, 
  ShieldCheck,
  Mail,
  FileText,
  Calendar,
  Headphones,
  MessageSquare,
  PlugZap,
  DatabaseIcon,
  Share2,
  Bell,
  Settings as SettingsIcon,
  CreditCard
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

interface SettingsSectionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  to: string;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({ 
  title, 
  description, 
  icon, 
  to 
}) => {
  return (
    <Link href={to}>
      <div className="flex items-center justify-between py-4 px-4 rounded-md hover:bg-[#2a2a2a] transition-colors cursor-pointer">
        <div className="flex items-start space-x-4">
          <div className="text-blue-500 mt-1">{icon}</div>
          <div>
            <h3 className="font-medium text-white">{title}</h3>
            <p className="text-sm text-gray-400">{description}</p>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-gray-500" />
      </div>
    </Link>
  );
};

export default function SettingsPage() {
  const [location, setLocation] = useLocation();
  
  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left sidebar */}
          <div className="md:col-span-1 space-y-4">
            <div className="bg-[#1e1e1e] rounded-lg border border-[#333] p-4">
              <h2 className="text-xl font-semibold mb-2">Centre Médical Font</h2>
              <div className="space-y-1">
                <Button variant="ghost" className="w-full justify-start">
                  <Building className="h-4 w-4 mr-2" /> Organization Profile
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Tag className="h-4 w-4 mr-2" /> Organization Preferences
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" /> Teammates
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" /> Teams
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <CreditCard className="h-4 w-4 mr-2" /> Billing
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <PlugZap className="h-4 w-4 mr-2" /> Integrations & API
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <DatabaseIcon className="h-4 w-4 mr-2" /> Data Exports
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Share2 className="h-4 w-4 mr-2" /> Referral Program
                </Button>
              </div>
            </div>
            
            <div className="bg-[#1e1e1e] rounded-lg border border-[#333] p-4">
              <h2 className="text-xl font-semibold mb-2">Account</h2>
              <div className="space-y-1">
                <Button variant="ghost" className="w-full justify-start">
                  <UserCog className="h-4 w-4 mr-2" /> Profile
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <SettingsIcon className="h-4 w-4 mr-2" /> Personal Preferences
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Bell className="h-4 w-4 mr-2" /> Notifications
                </Button>
              </div>
            </div>
            
            <div className="bg-[#1e1e1e] rounded-lg border border-[#333] p-4">
              <h2 className="text-xl font-semibold mb-2">Communication</h2>
              <div className="space-y-1">
                <Button variant="ghost" className="w-full justify-start">
                  <Phone className="h-4 w-4 mr-2" /> Phone System
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <ShieldCheck className="h-4 w-4 mr-2" /> Secure Messaging
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" /> Fax
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Mail className="h-4 w-4 mr-2" /> Email
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" /> Schedules
                </Button>
              </div>
            </div>
          </div>
          
          {/* Main content */}
          <div className="md:col-span-2">
            {/* Organization section */}
            <div className="bg-[#1e1e1e] rounded-lg border border-[#333] mb-6">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-6">Centre Médical Font</h2>
                
                <SettingsSection
                  title="Organization Profile"
                  description="Manage your organization's profile that's visible to patients."
                  icon={<Building className="h-5 w-5" />}
                  to="/settings/organization-profile"
                />
                
                <Separator className="my-2 bg-gray-800" />
                
                <SettingsSection
                  title="Organization Preferences"
                  description="Manage your organization's tags and custom contact fields."
                  icon={<Tag className="h-5 w-5" />}
                  to="/settings/organization-preferences"
                />
                
                <Separator className="my-2 bg-gray-800" />
                
                <SettingsSection
                  title="Teammates"
                  description="Add and manage your organization's teammates."
                  icon={<Users className="h-5 w-5" />}
                  to="/settings/teammates"
                />
                
                <Separator className="my-2 bg-gray-800" />
                
                <SettingsSection
                  title="Teams"
                  description="Create and manage teams within your organization."
                  icon={<Users className="h-5 w-5" />}
                  to="/settings/teams"
                />
                
                <Separator className="my-2 bg-gray-800" />
                
                <SettingsSection
                  title="Billing"
                  description="View and manage your billing information and plan."
                  icon={<CreditCard className="h-5 w-5" />}
                  to="/settings/billing"
                />
              </div>
            </div>
            
            {/* Account section */}
            <div className="bg-[#1e1e1e] rounded-lg border border-[#333] mb-6">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-6">Account</h2>
                <p className="text-gray-400 mb-4">cmf@centremedicalfont.ca</p>
                
                <SettingsSection
                  title="Profile"
                  description="Manage your profile that's visible to patients and teammates."
                  icon={<UserCog className="h-5 w-5" />}
                  to="/settings/profile"
                />
                
                <Separator className="my-2 bg-gray-800" />
                
                <SettingsSection
                  title="Personal Preferences"
                  description="Customize your experience with InstantHPI."
                  icon={<SettingsIcon className="h-5 w-5" />}
                  to="/settings/personal-preferences"
                />
                
                <Separator className="my-2 bg-gray-800" />
                
                <SettingsSection
                  title="Notifications"
                  description="Manage your notification settings."
                  icon={<Bell className="h-5 w-5" />}
                  to="/settings/notifications"
                />
              </div>
            </div>
            
            {/* Communication section */}
            <div className="bg-[#1e1e1e] rounded-lg border border-[#333]">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-6">Communication</h2>
                
                <SettingsSection
                  title="Phone System"
                  description="Configure your phone system settings."
                  icon={<Phone className="h-5 w-5" />}
                  to="/settings/phone-system"
                />
                
                <Separator className="my-2 bg-gray-800" />
                
                <SettingsSection
                  title="Secure Messaging"
                  description="Manage your secure messaging settings."
                  icon={<MessageSquare className="h-5 w-5" />}
                  to="/settings/secure-messaging"
                />
                
                <Separator className="my-2 bg-gray-800" />
                
                <SettingsSection
                  title="Fax"
                  description="Configure fax settings and numbers."
                  icon={<FileText className="h-5 w-5" />}
                  to="/settings/fax"
                />
                
                <Separator className="my-2 bg-gray-800" />
                
                <SettingsSection
                  title="Email"
                  description="Manage email integration settings."
                  icon={<Mail className="h-5 w-5" />}
                  to="/settings/email"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}