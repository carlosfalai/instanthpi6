import React, { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import NavigationBar from '@/components/navigation/NavigationBar';
import { 
  Home, 
  Users, 
  FileText, 
  Calendar, 
  Settings, 
  Search,
  Bell,
  MessageSquare,
  User,
  Menu,
  X,
  ChevronDown,
  Heart,
  PillIcon,
  AlertCircle,
  CreditCard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { User as UserType } from '@shared/schema';

interface AppLayoutProps {
  children: ReactNode;
}

// Badge component for notification counts
const NotificationBadge = ({ count }: { count: number }) => {
  if (count <= 0) return null;
  
  return (
    <div className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full">
      {count > 99 ? '99+' : count}
    </div>
  );
};

export default function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    patients: false,
    documents: false,
    settings: false
  });
  
  // Fetch current user for avatar and preferences
  const { data: currentUser } = useQuery<UserType>({
    queryKey: ['/api/user'],
  });
  
  // Fetch notification counts
  const { data: notificationCounts = {} } = useQuery<Record<string, number>>({
    queryKey: ['/api/notifications/counts'],
  });
  
  // Determine active section based on URL
  const getActiveSection = () => {
    const path = location.split('/')[1] || 'home';
    if (path === 'patients' || path === 'chronic-conditions' || path === 'medication-refills') {
      return 'patients';
    } else if (path === 'documents') {
      return 'documents';
    } else if (path === 'settings') {
      return 'settings';
    } else if (path === 'scheduler') {
      return 'scheduler';
    }
    return path;
  };
  
  const activeSection = getActiveSection();
  
  // Toggle expanded state for a section
  const toggleSectionExpanded = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Main navigation sections for the left sidebar
  const mainNavSections = [
    { id: 'home', label: 'Home', icon: <Home className="h-5 w-5" />, badge: 0, path: '/' },
    { id: 'patients', label: 'Patients', icon: <Users className="h-5 w-5" />, badge: notificationCounts.patients || 0, path: '/patients', hasSubmenu: true },
    { id: 'documents', label: 'Documents', icon: <FileText className="h-5 w-5" />, badge: notificationCounts.documents || 0, path: '/documents', hasSubmenu: true },
    { id: 'messages', label: 'Messages', icon: <MessageSquare className="h-5 w-5" />, badge: 0, path: '/messages' },
    { id: 'scheduler', label: 'Scheduler', icon: <Calendar className="h-5 w-5" />, badge: 0, path: '/scheduler' },
    { id: 'settings', label: 'Settings', icon: <Settings className="h-5 w-5" />, badge: 0, path: '/settings', hasSubmenu: true },
  ];
  
  // Patient subsections
  const patientSubSections = [
    { id: 'all-patients', label: 'All Patients', path: '/patients' },
    { id: 'chronic-conditions', label: 'Chronic Conditions', path: '/chronic-conditions', badge: notificationCounts.chronicConditions || 0 },
    { id: 'medication-refills', label: 'Medication Refills', path: '/medication-refills', badge: notificationCounts.medicationRefills || 0 },
    { id: 'urgent-care', label: 'Urgent Care', path: '/urgent-care', badge: notificationCounts.urgentCare || 0 },
  ];
  
  // Document subsections
  const documentSubSections = [
    { id: 'all-documents', label: 'All Documents', path: '/documents' },
    { id: 'insurance-paperwork', label: 'Insurance Paperwork', path: '/insurance-paperwork' },
  ];
  
  // Settings subsections
  const settingsSubSections = [
    { id: 'organization-profile', label: 'Organization Profile', path: '/settings/organization-profile' },
    { id: 'teammates', label: 'Teammates', path: '/settings/teammates' },
    { id: 'education', label: 'Education', path: '/education' },
    { id: 'subscription', label: 'Subscription', path: '/subscription' },
  ];
  
  // Generate initials for avatar
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };
  
  // User name and role
  const userName = currentUser?.fullName || 'User';
  const userRole = 'Family Medicine';

  return (
    <div className="min-h-screen flex bg-[#121212] text-white overflow-hidden">
      {/* Left Sidebar - Main Navigation */}
      <div className="w-64 border-r border-[#333] bg-[#1a1a1a] hidden md:flex flex-col">
        {/* Organization name header */}
        <div className="p-4 border-b border-[#333] flex items-center justify-between">
          <h1 className="text-lg font-semibold">InstantHPI</h1>
        </div>
        
        {/* Main navigation sections */}
        <div className="overflow-y-auto flex-grow px-2 py-3">
          {mainNavSections.map((section) => (
            <div key={section.id} className="mb-1">
              <button
                className={cn(
                  "flex items-center w-full py-2 px-3 rounded-md text-sm transition-colors",
                  activeSection === section.id 
                    ? "bg-[#2a2a2a] text-white" 
                    : "text-gray-300 hover:bg-[#252525]",
                  section.hasSubmenu ? "justify-between" : ""
                )}
                onClick={() => {
                  if (section.hasSubmenu) {
                    toggleSectionExpanded(section.id);
                  } else {
                    window.location.href = section.path;
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
                
                {section.hasSubmenu && (
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      expandedSections[section.id] ? "transform rotate-180" : ""
                    )}
                  />
                )}
              </button>
              
              {/* Patient subsections */}
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
        
        {/* User profile */}
        <div className="p-4 border-t border-[#333] flex items-center">
          <Avatar className="h-8 w-8 mr-3">
            <AvatarImage src="" alt={userName} />
            <AvatarFallback className="bg-blue-700 text-xs">
              {getInitials(userName)}
            </AvatarFallback>
          </Avatar>
          <div className="overflow-hidden">
            <p className="text-sm font-medium truncate">{userName}</p>
            <p className="text-xs text-gray-400 truncate">{userRole}</p>
          </div>
        </div>
      </div>
      
      {/* Mobile menu button - top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#1a1a1a] border-b border-[#333] p-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold">InstantHPI</h1>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-1"
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>
      
      {/* Mobile sidebar - slides in from left */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setIsMobileMenuOpen(false)}>
          <div 
            className="fixed inset-y-0 left-0 w-64 bg-[#1a1a1a] z-50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-[#333] flex items-center justify-between">
              <h1 className="text-lg font-semibold">InstantHPI</h1>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Mobile navigation - same as desktop */}
            <div className="overflow-y-auto h-full px-2 py-3">
              {mainNavSections.map((section) => (
                <div key={section.id} className="mb-1">
                  <button
                    className={cn(
                      "flex items-center w-full py-2 px-3 rounded-md text-sm transition-colors",
                      activeSection === section.id 
                        ? "bg-[#2a2a2a] text-white" 
                        : "text-gray-300 hover:bg-[#252525]",
                      section.hasSubmenu ? "justify-between" : ""
                    )}
                    onClick={() => {
                      if (section.hasSubmenu) {
                        toggleSectionExpanded(section.id);
                      } else {
                        window.location.href = section.path;
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
                    
                    {section.hasSubmenu && (
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform",
                          expandedSections[section.id] ? "transform rotate-180" : ""
                        )}
                      />
                    )}
                  </button>
                  
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
                  
                  {/* Other subsections - same pattern */}
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
        </div>
      )}
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden md:ml-0 mt-14 md:mt-0">
        {/* Top Navigation Bar */}
        <header className="h-14 border-b border-[#333] bg-[#1a1a1a] flex items-center px-4">
          <div className="flex-1 flex items-center">
            <h1 className="text-lg font-medium ml-2">
              {/* Dynamic title based on active section */}
              {mainNavSections.find(section => section.id === activeSection)?.label || 'InstantHPI'}
            </h1>
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
              <AvatarImage src="" alt={userName} />
              <AvatarFallback className="bg-blue-700 text-xs">
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>
        
        {/* Keep our existing navigation bar for the tabs interface */}
        <NavigationBar />
        
        {/* Main Content - This will change per page */}
        <main className="flex-1 overflow-auto bg-[#151515]">
          {children}
        </main>
      </div>
    </div>
  );
}