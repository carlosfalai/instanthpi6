import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  Home, 
  Users, 
  FileText, 
  Calendar, 
  Settings, 
  MessageSquare,
  User,
  GraduationCap,
  ClipboardList,
  Heart,
  PillIcon,
  AlertCircle
} from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { User as UserType } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';

// Badge component to show unread/pending counts
interface NotificationBadgeProps {
  count: number;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({ count }) => {
  if (count <= 0) return null;
  
  return (
    <div className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full">
      {count > 99 ? '99+' : count}
    </div>
  );
};

// Interface for navigation items
interface NavItem {
  id: string;
  path: string;
  icon: React.ReactNode;
  label: string;
  visible: boolean;
  order: number;
  row: 'primary' | 'secondary';
  notificationCount?: number;
}

export default function NavigationBar() {
  const [location] = useLocation();
  
  // Fetch current user to get navigation preferences
  const { data: currentUser } = useQuery<UserType>({
    queryKey: ['/api/user'],
  });
  
  // Fetch notification counts
  const { data: notificationCounts = {} } = useQuery<Record<string, number>>({
    queryKey: ['/api/notifications/counts'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });
  
  // Default navigation preferences if user not loaded yet
  const navPreferences = currentUser?.navPreferences as {
    showChronicConditions: boolean;
    showMedicationRefills: boolean;
    showUrgentCare: boolean;
    navItems?: NavItem[];
  } || {
    showChronicConditions: true,
    showMedicationRefills: true,
    showUrgentCare: true
  };
  
  // Default navigation items
  const defaultNavItems: NavItem[] = [
    { id: 'home', path: '/', icon: <Home className="h-5 w-5" />, label: 'Home', visible: true, order: 1, row: 'primary' },
    { id: 'patients', path: '/patients', icon: <Users className="h-5 w-5" />, label: 'Patients', visible: true, order: 2, row: 'primary' },
    { id: 'documents', path: '/documents', icon: <FileText className="h-5 w-5" />, label: 'Documents', visible: true, order: 3, row: 'primary' },
    { id: 'messages', path: '/messages', icon: <MessageSquare className="h-5 w-5" />, label: 'Messages', visible: true, order: 4, row: 'primary' },
    { id: 'forms', path: '/forms', icon: <ClipboardList className="h-5 w-5" />, label: 'Forms', visible: true, order: 1, row: 'secondary' },
    { id: 'chronicConditions', path: '/chronic-conditions', icon: <Heart className="h-5 w-5" />, label: 'Chronic Conditions', visible: navPreferences.showChronicConditions, order: 2, row: 'secondary' },
    { id: 'medicationRefills', path: '/medication-refills', icon: <PillIcon className="h-5 w-5" />, label: 'Medication Refills', visible: navPreferences.showMedicationRefills, order: 3, row: 'secondary' },
    { id: 'urgentCare', path: '/urgent-care', icon: <AlertCircle className="h-5 w-5" />, label: 'Urgent Care', visible: navPreferences.showUrgentCare, order: 4, row: 'secondary' },
    { id: 'education', path: '/education', icon: <GraduationCap className="h-5 w-5" />, label: 'Education', visible: true, order: 5, row: 'secondary' },
    { id: 'settings', path: '/settings', icon: <Settings className="h-5 w-5" />, label: 'Settings', visible: true, order: 6, row: 'secondary' },
  ];
  
  // State for navigation items, initialized from user preferences or defaults
  const [navItems, setNavItems] = useState<NavItem[]>(
    navPreferences.navItems || defaultNavItems
  );
  
  // Update navItems when user preferences change
  useEffect(() => {
    if (currentUser?.navPreferences?.navItems) {
      setNavItems(currentUser.navPreferences.navItems);
    }
  }, [currentUser]);
  
  // Update notification counts
  useEffect(() => {
    if (Object.keys(notificationCounts).length > 0) {
      setNavItems(prev => prev.map(item => ({
        ...item,
        notificationCount: notificationCounts[item.id] || 0
      })));
    }
  }, [notificationCounts]);
  
  // Filter and sort items for primary and secondary rows
  const primaryNavItems = navItems
    .filter(item => item.visible && item.row === 'primary')
    .sort((a, b) => a.order - b.order);
    
  const secondaryNavItems = navItems
    .filter(item => item.visible && item.row === 'secondary')
    .sort((a, b) => a.order - b.order);
  
  // Render navigation item with notification badge
  const renderNavItem = (item: NavItem) => (
    <Link 
      key={item.id} 
      href={item.path}
      className={`relative flex items-center p-2 px-3 text-sm rounded-md hover:bg-[#262626] transition-colors ${
        location === item.path ? 'bg-[#262626] text-blue-400' : 'text-gray-300'
      }`}
    >
      <div className="relative mr-2">
        {item.icon}
        {item.notificationCount && item.notificationCount > 0 && (
          <NotificationBadge count={item.notificationCount} />
        )}
      </div>
      {item.label}
    </Link>
  );
  
  return (
    <div className="flex flex-col">
      {/* Primary Nav Row */}
      <div className="flex items-center space-x-1 px-1 mb-1">
        {primaryNavItems.map(renderNavItem)}
        
        <div className="ml-auto flex items-center">
          <div className="w-8 h-8 rounded-full bg-[#262626] flex items-center justify-center">
            <User className="h-4 w-4 text-gray-300" />
          </div>
        </div>
      </div>
      
      {/* Secondary Nav Row */}
      <div className="flex items-center space-x-1 px-1">
        {secondaryNavItems.map(renderNavItem)}
      </div>
    </div>
  );
}