import React, { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import {
  Users,
  FileText,
  Settings,
  Home,
  User,
  Search,
  Bell,
  FilePlus2,
  ListTodo,
  Heart,
  PillIcon,
  AlertCircle,
  GraduationCap,
  CreditCard,
  LayoutList,
  Calendar,
  MessageSquare,
  Clock,
  Stethoscope,
  FileCheck,
  Brain,
  DollarSign,
  Plus,
  Menu,
  UserCog,
  ChevronDown,
  BrainCircuit
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { RetroGrid } from '@/components/ui/retro-grid';

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  notificationCount?: number;
}

interface NavSection {
  id: string;
  title: string;
  items: NavItem[];
}

// Define all notification counts
const notificationCounts = {
  inbox: 7,
  priorityAI: 4,
  patients: 12
};

const NotificationBadge: React.FC<{ count: number }> = ({ count }) => {
  if (count === 0) return null;
  
  return (
    <Badge 
      variant="destructive" 
      className="ml-auto text-xs min-w-[1.5rem] h-5 flex items-center justify-center rounded-full"
    >
      {count > 99 ? '99+' : count}
    </Badge>
  );
};

interface AppLayoutSpruceProps {
  children: ReactNode;
}

export default function AppLayoutSpruce({ children }: AppLayoutSpruceProps) {
  const [location, navigate] = useLocation();

  // User data without photo - using initials only
  const currentUser = {
    name: 'Dr. Carlos Font',
    role: 'Family Medicine'
  };

  // Define main navigation sections
  const mainNavSections: NavSection[] = [
    {
      id: 'main',
      title: 'Main',
      items: [
        { id: 'home', label: 'Home', path: '/', icon: Home },
        { id: 'inbox', label: 'Inbox', path: '/inbox', icon: MessageSquare, notificationCount: notificationCounts.inbox },
        { id: 'priorityAI', label: 'Priority AI', path: '/priority-tasks', icon: BrainCircuit, notificationCount: notificationCounts.priorityAI },
      ]
    },
    {
      id: 'patients',
      title: 'Patients',
      items: [
        { id: 'patients', label: 'Patients', path: '/patients', icon: Users, notificationCount: notificationCounts.patients },
        { id: 'chronicConditions', label: 'Chronic Conditions', path: '/chronic-conditions', icon: Heart },
        { id: 'medicationRefills', label: 'Medication Refills', path: '/medication-refills', icon: PillIcon },
        { id: 'urgentCare', label: 'Urgent Care', path: '/urgent-care', icon: AlertCircle },
      ]
    },
    {
      id: 'documents',
      title: 'Documents',
      items: [
        { id: 'documents', label: 'Documents', path: '/documents', icon: FileText },
        { id: 'insurancePaperwork', label: 'Insurance Paperwork', path: '/insurance-paperwork', icon: FileCheck },
      ]
    },
    {
      id: 'tools',
      title: 'Tools & AI',
      items: [
        { id: 'knowledgeBase', label: 'Knowledge Base', path: '/knowledge-base', icon: GraduationCap },
        { id: 'aiBilling', label: 'AI Billing', path: '/ai-billing', icon: DollarSign },
        { id: 'claudeAI', label: 'Claude AI', path: '/claude-ai', icon: Brain },
      ]
    },
    {
      id: 'tier35',
      title: 'Tier 3.5 (The Association)',
      items: [
        { id: 'association', label: 'Association', path: '/tier-association', icon: UserCog },
      ]
    },
    {
      id: 'leadership',
      title: 'Leadership',
      items: [
        { id: 'leadership', label: 'Leadership', path: '/leadership-association', icon: UserCog },
      ]
    },
    {
      id: 'settings',
      title: 'Settings',
      items: [
        { id: 'settings', label: 'Settings', path: '/settings', icon: Settings },
        { id: 'organizationProfile', label: 'Organization Profile', path: '/organization-profile', icon: User },
        { id: 'teammates', label: 'Teammates', path: '/teammates', icon: Users },
      ]
    }
  ];

  // Determine active section from path
  const determineActiveSection = () => {
    const pathSegment = location.split('/')[1] || 'home';
    
    if (pathSegment === 'settings' || pathSegment === 'organization-profile' || pathSegment === 'teammates') {
      return 'settings';
    } else if (pathSegment === 'patients' || pathSegment === 'chronic-conditions' || pathSegment === 'medication-refills' || pathSegment === 'urgent-care') {
      return 'patients';
    } else if (pathSegment === 'documents' || pathSegment === 'insurance-paperwork') {
      return 'documents';
    } else if (pathSegment === 'knowledge-base') {
      return 'knowledgeBase';
    } else if (pathSegment === 'leadership-association') {
      return 'leadership';
    } else if (pathSegment === 'ai-billing') {
      return 'aiBilling';
    } else if (pathSegment === 'priority-tasks') {
      return 'priorityAI';
    } else if (pathSegment === 'claude-ai') {
      return 'claudeAI';
    } else if (pathSegment === 'tier-association') {
      return 'association';
    } else if (pathSegment === '' || pathSegment === 'home') {
      return 'home';
    } else {
      const matchingSection = mainNavSections.find(section => 
        section.items.some(item => item.path.substring(1) === pathSegment)
      );
      return matchingSection?.items.find(item => item.path.substring(1) === pathSegment)?.id || 'home';
    }
  };

  const currentActiveSection = determineActiveSection();

  // Generate initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background flex relative">
      {/* Background with retro grid */}
      <div className="absolute top-0 z-0 h-screen w-screen bg-gray-950/95 bg-[radial-gradient(ellipse_20%_80%_at_50%_-20%,rgba(120,119,198,0.1),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_20%_80%_at_50%_-20%,rgba(120,119,198,0.2),rgba(255,255,255,0))]" />
      <RetroGrid className="absolute inset-0 z-0" opacity={0.1} />
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black/20 z-[1]" />
      
      {/* Sidebar */}
      <div className="w-64 bg-card/50 backdrop-blur border-r border-border flex-shrink-0 relative z-10">
        <div className="p-6">
          {/* Header with InstantHPI in Purple */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-2">
              <span className="text-lg font-semibold text-purple-600">InstantHPI</span>
              <span className="text-sm text-muted-foreground">Centre Médical Font</span>
            </div>
            <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* User Profile */}
          <div className="flex items-center space-x-3 mb-6 p-3 rounded-lg bg-muted/50">
            <Avatar className="h-10 w-10">
              <AvatarFallback>{getInitials(currentUser.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {currentUser.name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {currentUser.role}
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-6">
            {mainNavSections.map((section) => (
              <div key={section.id} className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {section.title}
                </h3>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = currentActiveSection === item.id;
                    const Icon = item.icon;
                    
                    return (
                      <Link key={item.id} href={item.path}>
                        <div
                          className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isActive
                              ? 'bg-primary text-primary-foreground'
                              : 'text-foreground hover:bg-muted'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="flex-1">{item.label}</span>
                          <NotificationBadge count={item.notificationCount || 0} />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative z-10">
        {/* Main Content Area */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}