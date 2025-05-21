import React, { useState, ReactNode, useEffect, useCallback } from 'react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

// Navigation item interface
interface NavItem {
  id: string;
  path: string;
  icon: ReactNode;
  label: string;
  visible: boolean;
  order: number;
  row?: 'primary' | 'secondary' | 'tertiary';
  notificationCount?: number;
  children?: NavItem[];
  expanded?: boolean;
}

// Badge component for notification counts
const NotificationBadge = ({ count }: { count: number }) => {
  return (
    <Badge
      className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center bg-red-500 text-[10px] font-medium text-white"
    >
      {count > 9 ? '9+' : count}
    </Badge>
  );
};

interface AppLayoutSpruceProps {
  children: ReactNode;
}

export default function AppLayoutSpruce({ children }: AppLayoutSpruceProps) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('inbox');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    patients: true,
    documents: false,
    settings: false
  });
  
  // Use this instead of direct navigation
  const [, setLocation] = useLocation();

  // Mock user data - in a real app this would come from context or API
  const currentUser = {
    name: 'Dr. Carlos Font',
    avatar: null,
    navPreferences: {
      showChronicConditions: true,
      showMedicationRefills: true,
      showUrgentCare: true,
      navItems: []
    }
  };

  // Mock notification counts as Record<string, number> to allow dynamic access
  const notificationCounts: Record<string, number> = {
    patients: 3,
    medicationRefills: 2,
    documents: 5,
    forms: 1,
    education: 0,
    scheduler: 0,
    formsite: 0,
    knowledge: 0,
    aiBilling: 0,
    priorityTasks: 0,
    leadership: 0,
    claudeAI: 0,
    subscription: 0,
    settings: 0
  };

  // Default navigation items
  const defaultNavItems: NavItem[] = [
    // Primary navigation (top row)
    { id: 'home', path: '/', icon: <Home className="h-5 w-5" />, label: 'Home', visible: true, order: 1, row: 'primary' },
    { id: 'patients', path: '/patients', icon: <Users className="h-5 w-5" />, label: 'Patients', visible: true, order: 2, row: 'primary' },
    { id: 'documents', path: '/documents', icon: <FileText className="h-5 w-5" />, label: 'Documents', visible: true, order: 3, row: 'primary' },
    
    // Secondary navigation (middle row) - conditional on user preferences
    { id: 'forms', path: '/forms', icon: <LayoutList className="h-5 w-5" />, label: 'Forms', visible: true, order: 1, row: 'secondary' },
    { id: 'chronicConditions', path: '/chronic-conditions', icon: <Heart className="h-5 w-5" />, label: 'Chronic Conditions', visible: currentUser.navPreferences.showChronicConditions, order: 2, row: 'secondary' },
    { id: 'medicationRefills', path: '/medication-refills', icon: <PillIcon className="h-5 w-5" />, label: 'Medication Refills', visible: currentUser.navPreferences.showMedicationRefills, order: 3, row: 'secondary' },
    { id: 'urgentCare', path: '/urgent-care', icon: <AlertCircle className="h-5 w-5" />, label: 'Urgent Care', visible: currentUser.navPreferences.showUrgentCare, order: 4, row: 'secondary' },
    { id: 'education', path: '/education', icon: <GraduationCap className="h-5 w-5" />, label: 'Education', visible: true, order: 5, row: 'secondary' },
    { id: 'subscription', path: '/subscription', icon: <CreditCard className="h-5 w-5" />, label: 'Subscription', visible: true, order: 6, row: 'secondary' },
    { id: 'settings', path: '/settings', icon: <Settings className="h-5 w-5" />, label: 'Organization Settings', visible: true, order: 7, row: 'secondary' },
    
    // Tertiary navigation (bottom row)
    { id: 'scheduler', path: '/scheduler', icon: <Calendar className="h-5 w-5" />, label: 'Scheduler', visible: true, order: 0, row: 'tertiary' },
    { id: 'formsite', path: '/formsite', icon: <FilePlus2 className="h-5 w-5" />, label: 'Formsite', visible: true, order: 1, row: 'tertiary' },
    { id: 'pseudonym', path: '/pseudonym', icon: <UserCog className="h-5 w-5" />, label: 'Pseudonym', visible: true, order: 2, row: 'tertiary' },
    { id: 'insurancePaperwork', path: '/insurance-paperwork', icon: <FileCheck className="h-5 w-5" />, label: 'Insurance', visible: true, order: 3, row: 'tertiary' },
    { id: 'knowledgeBase', path: '/knowledge-base', icon: <Brain className="h-5 w-5" />, label: 'Knowledge Base', visible: true, order: 4, row: 'tertiary' },
    { id: 'aiBilling', path: '/ai-billing', icon: <DollarSign className="h-5 w-5" />, label: 'AI Billing', visible: true, order: 5, row: 'tertiary' },
    { id: 'priorityTasks', path: '/priority-tasks', icon: <BrainCircuit className="h-5 w-5" />, label: 'Priority AI', visible: true, order: 6, row: 'tertiary' },
    { id: 'claudeAI', path: '/claude-ai', icon: <Brain className="h-5 w-5" />, label: 'Claude AI', visible: true, order: 7, row: 'tertiary' },
    { id: 'leadershipAssociation', path: '/leadership-association', icon: <Users className="h-5 w-5" />, label: 'Leadership', visible: true, order: 8, row: 'tertiary' },
  ];

  // The main navigation sections for the left sidebar exactly as shown in the screenshot
  const mainNavSections = [
    { 
      id: 'clinic', 
      label: 'Centre Médical Font', 
      icon: <Stethoscope className="h-5 w-5" />, 
      badge: 0, 
      path: '/clinic',
      hasClinicSwitcher: true  // Add this flag to identify this entry
    },
    { id: 'home', label: 'Home', icon: <Home className="h-5 w-5" />, badge: 0, path: '/' },
    { id: 'patients', label: 'Patients', icon: <Users className="h-5 w-5" />, badge: notificationCounts.patients || 0, path: '/patients', hasSubmenu: true },
    { id: 'documents', label: 'Documents', icon: <FileText className="h-5 w-5" />, badge: notificationCounts.documents || 0, path: '/documents', hasSubmenu: true },
    { id: 'messages', label: 'Messages', icon: <MessageSquare className="h-5 w-5" />, badge: 0, path: '/messages' },
    { id: 'scheduler', label: 'Scheduler', icon: <Calendar className="h-5 w-5" />, badge: 0, path: '/scheduler' },
    { id: 'formsite', label: 'Formsite', icon: <FileText className="h-5 w-5" />, badge: 0, path: '/formsite' },
    { id: 'knowledgeBase', label: 'Knowledge Base', icon: <Brain className="h-5 w-5" />, badge: 0, path: '/knowledge-base' },
    { id: 'aiBilling', label: 'AI Billing', icon: <DollarSign className="h-5 w-5" />, badge: 0, path: '/ai-billing' },
    { id: 'forms', label: 'Forms', icon: <LayoutList className="h-5 w-5" />, badge: notificationCounts.forms || 0, path: '/forms' },
    { id: 'chronicConditions', label: 'Chronic Conditions', icon: <Heart className="h-5 w-5" />, badge: 0, path: '/chronic-conditions' },
    { id: 'medicationRefills', label: 'Medication Refills', icon: <PillIcon className="h-5 w-5" />, badge: notificationCounts.medicationRefills || 0, path: '/medication-refills' },
    { id: 'urgentCare', label: 'Urgent Care', icon: <AlertCircle className="h-5 w-5" />, badge: 0, path: '/urgent-care' },
    { id: 'education', label: 'Education', icon: <GraduationCap className="h-5 w-5" />, badge: 0, path: '/education' },
    { id: 'subscription', label: 'Subscription', icon: <CreditCard className="h-5 w-5" />, badge: 0, path: '/subscription' },
    { id: 'orgSettings', label: 'Organization Settings', icon: <Settings className="h-5 w-5" />, badge: 0, path: '/settings' },
    { id: 'priorityAI', label: 'Priority AI', icon: <BrainCircuit className="h-5 w-5" />, badge: 0, path: '/priority-tasks' },
    { id: 'claudeAI', label: 'Claude AI', icon: <Brain className="h-5 w-5" />, badge: notificationCounts.claudeAI || 0, path: '/claude-ai', hasSubmenu: true },
    { id: 'tier35', label: 'Tier 3.5 (The Association)', icon: <UserCog className="h-5 w-5" />, badge: 0, path: '/tier-association' },
    { id: 'leadership', label: 'Leadership', icon: <Users className="h-5 w-5" />, badge: 0, path: '/leadership-association' },
  ];

  // Sub-sections for patient-related items
  const patientSubSections = [
    { id: 'all-patients', label: 'All Patients', path: '/patients' },
    { id: 'chronic-conditions', label: 'Chronic Conditions', path: '/chronic-conditions' },
    { id: 'medication-refills', label: 'Medication Refills', path: '/medication-refills', badge: notificationCounts.medicationRefills || 0 },
    { id: 'urgent-care', label: 'Urgent Care', path: '/urgent-care' },
  ];

  // Sub-sections for document-related items
  const documentSubSections = [
    { id: 'all-documents', label: 'All Documents', path: '/documents' },
    { id: 'insurance-paperwork', label: 'Insurance Paperwork', path: '/insurance-paperwork' },
  ];
  
  // Sub-sections for Claude AI related items
  const claudeAISubSections = [
    { id: 'claude-ai-features', label: 'Claude AI Features', path: '/claude-ai' },
    { id: 'claude-code-assistant', label: 'Code Assistant', path: '/claude-code-assistant' },
  ];

  // Sub-sections for settings-related items
  const settingsSubSections = [
    { id: 'organization-profile', label: 'Organization Profile', path: '/settings/organization-profile' },
    { id: 'teammates', label: 'Teammates', path: '/settings/teammates' },
    { id: 'personal-preferences', label: 'Personal Preferences', path: '/settings' },
  ];

  // Toggle expanded state for a section
  const toggleSectionExpanded = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // State for navigation items, initialized from default
  const [navItems, setNavItems] = useState<NavItem[]>(defaultNavItems);

  // Update notification counts
  useEffect(() => {
    if (Object.keys(notificationCounts).length > 0) {
      setNavItems(prev => prev.map(item => ({
        ...item,
        notificationCount: notificationCounts[item.id] || 0
      })));
    }
  }, [notificationCounts]);

  // Determine which section is active based on URL
  useEffect(() => {
    const path = location.split('/')[1] || 'home';
    
    // Handle special cases where subsections should highlight parent section
    if (path === 'settings' || path === 'organization-profile' || path === 'teammates') {
      setActiveSection('settings');
    } else if (path === 'patients' || path === 'chronic-conditions' || path === 'medication-refills' || path === 'urgent-care') {
      setActiveSection('patients');
    } else if (path === 'documents' || path === 'insurance-paperwork') {
      setActiveSection('documents');
    } else if (path === 'knowledge-base') {
      setActiveSection('knowledge');
    } else if (path === 'leadership-association') {
      setActiveSection('leadership');
    } else if (path === 'ai-billing') {
      setActiveSection('aiBilling');
    } else if (path === 'priority-tasks') {
      setActiveSection('priorityTasks');
    } else if (path === 'claude-ai') {
      setActiveSection('claudeAI');
    } else if (path === '') {
      // Handle root path
      setActiveSection('home');
    } else {
      // Find the matching section based on exact path match
      const matchingSection = mainNavSections.find(section => 
        section.path.substring(1) === path
      );
      if (matchingSection) {
        setActiveSection(matchingSection.id);
      }
    }
  }, [location]);

  // Generate initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="flex h-screen bg-[#121212] text-white overflow-hidden">
      {/* Left Sidebar - Main Navigation */}
      <div className="w-64 border-r border-[#333] flex flex-col bg-[#1a1a1a] hidden md:flex">
        {/* Sidebar header with InstantHPI branding */}
        <div className="p-4 border-b border-[#333] flex items-center justify-between">
          <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-500">
            InstantHPI
          </h1>
        </div>

        {/* Main navigation sections */}
        <div className="overflow-y-auto flex-grow px-2 py-3">
          {mainNavSections.map((section) => (
            <div key={section.id} className="mb-1">
              <div
                className={cn(
                  "flex items-center w-full py-2 px-3 rounded-md text-sm transition-colors cursor-pointer",
                  activeSection === section.id 
                    ? "bg-[#2a2a2a] text-white" 
                    : "text-gray-300 hover:bg-[#252525]",
                  section.id === 'patients' || section.id === 'documents' || section.id === 'settings'
                    ? "justify-between"
                    : ""
                )}
                onClick={() => {
                  if (section.id === 'patients' || section.id === 'documents' || section.id === 'settings') {
                    toggleSectionExpanded(section.id);
                  }
                  setLocation(section.path);
                }}
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0 mr-3 relative">
                    {section.icon}
                    {section.badge > 0 && (
                      <NotificationBadge count={section.badge} />
                    )}
                  </div>
                  <span className="truncate">{section.label}</span>
                </div>
                
                {section.hasClinicSwitcher && (
                  <div 
                    className="p-1 h-6 w-6 rounded-full ml-2 bg-transparent hover:bg-[#333] cursor-pointer flex items-center justify-center"
                    title="Switch clinics"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering the parent click
                      // Add clinic switching logic here
                      alert('Switch to a different clinic');
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </div>
                )}
                
                {(section.id === 'patients' || section.id === 'documents' || section.id === 'settings') && (
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      expandedSections[section.id] ? "transform rotate-180" : ""
                    )}
                  />
                )}
              </div>
              
              {/* Patient subsections */}
              {section.id === 'patients' && expandedSections.patients && (
                <div className="ml-8 mt-1 space-y-1">
                  {patientSubSections.map((subsection) => (
                    <div
                      key={subsection.id}
                      className={cn(
                        "flex items-center justify-between text-sm py-1 px-3 rounded-md hover:bg-[#252525] cursor-pointer",
                        location === subsection.path
                          ? "text-white bg-[#252525]"
                          : "text-gray-300"
                      )}
                      onClick={() => { window.location.href = subsection.path }}
                    >
                      <span>{subsection.label}</span>
                      {subsection.badge && subsection.badge > 0 && (
                        <Badge variant="destructive" className="text-xs h-5">
                          {subsection.badge}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Document subsections */}
              {section.id === 'documents' && expandedSections.documents && (
                <div className="ml-8 mt-1 space-y-1">
                  {documentSubSections.map((subsection) => (
                    <Link key={subsection.id} href={subsection.path}>
                      <a
                        className={cn(
                          "flex items-center justify-between text-sm py-1 px-3 rounded-md hover:bg-[#252525] cursor-pointer",
                          location === subsection.path
                            ? "text-white bg-[#252525]"
                            : "text-gray-300"
                        )}
                      >
                        <span>{subsection.label}</span>
                      </a>
                    </Link>
                  ))}
                </div>
              )}
              
              {/* Settings subsections */}
              {section.id === 'settings' && expandedSections.settings && (
                <div className="ml-8 mt-1 space-y-1">
                  {settingsSubSections.map((subsection) => (
                    <Link key={subsection.id} href={subsection.path}>
                      <a
                        className={cn(
                          "flex items-center justify-between text-sm py-1 px-3 rounded-md hover:bg-[#252525] cursor-pointer",
                          location === subsection.path
                            ? "text-white bg-[#252525]"
                            : "text-gray-300"
                        )}
                      >
                        <span>{subsection.label}</span>
                      </a>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* User profile at bottom */}
        <div className="p-4 border-t border-[#333] flex items-center">
          <Avatar className="h-8 w-8 mr-3">
            <AvatarImage src={currentUser.avatar || ''} alt={currentUser.name} />
            <AvatarFallback className="bg-blue-700 text-xs">
              {getInitials(currentUser.name)}
            </AvatarFallback>
          </Avatar>
          <div className="overflow-hidden">
            <p className="text-sm font-medium truncate">{currentUser.name}</p>
            <p className="text-xs text-gray-400 truncate">Family Medicine</p>
          </div>
        </div>
      </div>
      
      {/* Mobile menu button - visible on small screens */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#1a1a1a] border-b border-[#333] p-3 flex items-center justify-between">
        <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-500">
          InstantHPI
        </h1>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-1"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </div>
      
      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Mobile sidebar - slides in from left */}
      <div 
        className={cn(
          "md:hidden fixed inset-y-0 left-0 w-64 bg-[#1a1a1a] z-50 transform transition-transform duration-200 ease-in-out",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-4 border-b border-[#333] flex items-center justify-between">
          <div className="mr-auto">
            <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-500">
              InstantHPI
            </h1>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1"
          >
            <ChevronDown className="h-5 w-5 transform -rotate-90" />
          </Button>
        </div>
        
        {/* Mobile navigation sections - same as desktop */}
        <div className="overflow-y-auto h-full px-2 py-3">
          {mainNavSections.map((section) => (
            <div key={section.id} className="mb-1">
              <div
                className={cn(
                  "flex items-center w-full py-2 px-3 rounded-md text-sm transition-colors",
                  activeSection === section.id 
                    ? "bg-[#2a2a2a] text-white" 
                    : "text-gray-300 hover:bg-[#252525]",
                  section.id === 'patients' || section.id === 'documents' || section.id === 'settings'
                    ? "justify-between"
                    : ""
                )}
                onClick={() => {
                  if (section.id === 'patients' || section.id === 'documents' || section.id === 'settings') {
                    toggleSectionExpanded(section.id);
                  } else {
                    setLocation(section.path);
                    setIsMobileMenuOpen(false);
                  }
                }}
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0 mr-3 relative">
                    {section.icon}
                    {section.badge > 0 && (
                      <NotificationBadge count={section.badge} />
                    )}
                  </div>
                  <span className="truncate">{section.label}</span>
                </div>
                
                {(section.id === 'patients' || section.id === 'documents' || section.id === 'settings') && (
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      expandedSections[section.id] ? "transform rotate-180" : ""
                    )}
                  />
                )}
              </div>
              
              {/* Subsections - same as desktop */}
              {section.id === 'patients' && expandedSections.patients && (
                <div className="ml-8 mt-1 space-y-1">
                  {patientSubSections.map((subsection) => (
                    <Link key={subsection.id} href={subsection.path}>
                      <a
                        className={cn(
                          "flex items-center justify-between text-sm py-1 px-3 rounded-md hover:bg-[#252525] cursor-pointer",
                          location === subsection.path
                            ? "text-white bg-[#252525]"
                            : "text-gray-300"
                        )}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <span>{subsection.label}</span>
                        {subsection.badge && subsection.badge > 0 && (
                          <Badge variant="destructive" className="text-xs h-5">
                            {subsection.badge}
                          </Badge>
                        )}
                      </a>
                    </Link>
                  ))}
                </div>
              )}
              
              {/* Document subsections - same as desktop */}
              {section.id === 'documents' && expandedSections.documents && (
                <div className="ml-8 mt-1 space-y-1">
                  {documentSubSections.map((subsection) => (
                    <Link key={subsection.id} href={subsection.path}>
                      <a
                        className={cn(
                          "flex items-center justify-between text-sm py-1 px-3 rounded-md hover:bg-[#252525] cursor-pointer",
                          location === subsection.path
                            ? "text-white bg-[#252525]"
                            : "text-gray-300"
                        )}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <span>{subsection.label}</span>
                      </a>
                    </Link>
                  ))}
                </div>
              )}
              
              {/* Settings subsections - same as desktop */}
              {section.id === 'settings' && expandedSections.settings && (
                <div className="ml-8 mt-1 space-y-1">
                  {settingsSubSections.map((subsection) => (
                    <Link key={subsection.id} href={subsection.path}>
                      <a
                        className={cn(
                          "flex items-center justify-between text-sm py-1 px-3 rounded-md hover:bg-[#252525] cursor-pointer",
                          location === subsection.path
                            ? "text-white bg-[#252525]"
                            : "text-gray-300"
                        )}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <span>{subsection.label}</span>
                      </a>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden md:ml-0 mt-14 md:mt-0">
        {/* Top Navigation Bar with Branding */}
        <header className="h-14 border-b border-[#333] bg-[#1a1a1a] flex items-center px-4">
          <div className="flex-1 flex items-center">
            {/* Left side is kept empty */}
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Search..."
                className="pl-10 py-1 h-9 w-64 bg-[#252525] border-[#444] rounded-md text-sm"
              />
            </div>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </Button>
            <Avatar className="h-8 w-8">
              <AvatarImage src={currentUser.avatar || ''} alt={currentUser.name} />
              <AvatarFallback className="bg-blue-700 text-xs">
                {getInitials(currentUser.name)}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>
        
        {/* Content Area */}
        <main className="flex-1 overflow-auto bg-[#151515] p-6">
          {children}
        </main>
      </div>
    </div>
  );
}