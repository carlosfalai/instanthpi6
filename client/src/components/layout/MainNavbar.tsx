import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  MessageSquare, 
  Users, 
  BarChart, 
  FileText, 
  Clipboard, 
  Settings, 
  Calendar,
  ChevronDown
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const DOCTOR_NAME = "Dr. Font";
const DOCTOR_INITIALS = "CF";

export default function MainNavbar() {
  const [location, navigate] = useLocation();
  
  // Get current active section
  const currentSection = location === '/' 
    ? 'messages' 
    : location.split('/')[1] || 'messages';
  
  return (
    <div className="w-full bg-[#121212] px-4 py-2 border-b border-gray-800 flex items-center justify-between h-16">
      {/* Left side - Logo/Brand */}
      <div className="flex items-center">
        <h1 className="text-white font-semibold text-xl mr-8">MediConnect</h1>
        
        {/* Main Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          <NavButton 
            href="/" 
            icon={<MessageSquare className="h-5 w-5" />}
            label="Messages"
            isActive={currentSection === 'messages'}
          />
          
          <NavButton 
            href="/patients" 
            icon={<Users className="h-5 w-5" />}
            label="Patients"
            isActive={currentSection === 'patients'}
          />
          
          <NavButton 
            href="/calendar" 
            icon={<Calendar className="h-5 w-5" />}
            label="Calendar"
            isActive={currentSection === 'calendar'}
          />
          
          <NavButton 
            href="/dashboard" 
            icon={<BarChart className="h-5 w-5" />}
            label="Dashboard"
            isActive={currentSection === 'dashboard'}
          />
          
          <NavButton 
            href="/documents" 
            icon={<FileText className="h-5 w-5" />}
            label="Documents"
            isActive={currentSection === 'documents'}
          />
          
          <NavButton 
            href="/billing" 
            icon={<Clipboard className="h-5 w-5" />}
            label="Billing"
            isActive={currentSection === 'billing'}
          />
        </nav>
        
        {/* Mobile dropdown menu */}
        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="text-white">
                {getSectionLabel(currentSection)}
                <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-[#1a1a1a] border-gray-800 text-white">
              <NavMenuItem 
                href="/" 
                icon={<MessageSquare className="h-5 w-5" />}
                label="Messages"
                isActive={currentSection === 'messages'}
              />
              
              <NavMenuItem 
                href="/patients" 
                icon={<Users className="h-5 w-5" />}
                label="Patients"
                isActive={currentSection === 'patients'}
              />
              
              <NavMenuItem 
                href="/calendar" 
                icon={<Calendar className="h-5 w-5" />}
                label="Calendar"
                isActive={currentSection === 'calendar'}
              />
              
              <NavMenuItem 
                href="/dashboard" 
                icon={<BarChart className="h-5 w-5" />}
                label="Dashboard"
                isActive={currentSection === 'dashboard'}
              />
              
              <NavMenuItem 
                href="/documents" 
                icon={<FileText className="h-5 w-5" />}
                label="Documents"
                isActive={currentSection === 'documents'}
              />
              
              <NavMenuItem 
                href="/billing" 
                icon={<Clipboard className="h-5 w-5" />}
                label="Billing"
                isActive={currentSection === 'billing'}
              />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Right side - User menu */}
      <div className="flex items-center">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="text-gray-400 mr-2">
                <Settings className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Settings</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 text-white">
              <Avatar className="h-8 w-8 bg-blue-600">
                <AvatarFallback>{DOCTOR_INITIALS}</AvatarFallback>
              </Avatar>
              <span className="hidden md:inline">{DOCTOR_NAME}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-gray-800 text-white">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-gray-800" />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Schedule</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-800" />
            <DropdownMenuItem>Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// Helper function to get section label based on path
function getSectionLabel(section: string): string {
  switch (section) {
    case 'messages': return 'Messages';
    case 'patients': return 'Patients';
    case 'calendar': return 'Calendar';
    case 'dashboard': return 'Dashboard';
    case 'documents': return 'Documents';
    case 'billing': return 'Billing';
    default: return 'Messages';
  }
}

// Navigation button for desktop view
function NavButton({ href, icon, label, isActive }: { 
  href: string; 
  icon: React.ReactNode; 
  label: string; 
  isActive: boolean;
}) {
  return (
    <Link href={href}>
      <Button 
        variant={isActive ? "default" : "ghost"} 
        className={`flex items-center gap-1 py-2 ${isActive ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
      >
        {icon}
        <span>{label}</span>
      </Button>
    </Link>
  );
}

// Navigation menu item for mobile dropdown
function NavMenuItem({ href, icon, label, isActive }: { 
  href: string; 
  icon: React.ReactNode; 
  label: string; 
  isActive: boolean;
}) {
  return (
    <Link href={href}>
      <DropdownMenuItem className={`flex items-center gap-2 ${isActive ? 'bg-blue-600/20 text-blue-400' : ''}`}>
        {icon}
        <span>{label}</span>
      </DropdownMenuItem>
    </Link>
  );
}