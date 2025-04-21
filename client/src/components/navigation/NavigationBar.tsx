import React from 'react';
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
import { useQuery } from '@tanstack/react-query';
import { User as UserType } from '@shared/schema';

export default function NavigationBar() {
  const [location] = useLocation();
  
  // Fetch current user to get navigation preferences
  const { data: currentUser } = useQuery<UserType>({
    queryKey: ['/api/user'],
  });
  
  // Default navigation preferences if user not loaded yet
  const navPreferences = currentUser?.navPreferences || {
    showChronicConditions: true,
    showMedicationRefills: true,
    showUrgentCare: true
  };
  
  // Base navigation items always shown
  const baseNavItems = [
    { path: '/', icon: <Home className="h-5 w-5" />, label: 'Home' },
    { path: '/patients', icon: <Users className="h-5 w-5" />, label: 'Patients' },
    { path: '/documents', icon: <FileText className="h-5 w-5" />, label: 'Documents' },
    { path: '/appointments', icon: <Calendar className="h-5 w-5" />, label: 'Appointments' },
    { path: '/messages', icon: <MessageSquare className="h-5 w-5" />, label: 'Messages' },
    { path: '/forms', icon: <ClipboardList className="h-5 w-5" />, label: 'Forms' },
  ];
  
  // Optional navigation items based on user preferences
  const optionalNavItems = [
    ...(navPreferences.showChronicConditions ? [{ path: '/chronic-conditions', icon: <Heart className="h-5 w-5" />, label: 'Chronic Conditions' }] : []),
    ...(navPreferences.showMedicationRefills ? [{ path: '/medication-refills', icon: <PillIcon className="h-5 w-5" />, label: 'Medication Refills' }] : []),
    ...(navPreferences.showUrgentCare ? [{ path: '/urgent-care', icon: <AlertCircle className="h-5 w-5" />, label: 'Urgent Care' }] : []),
  ];
  
  // Always show these items at the end
  const endNavItems = [
    { path: '/education', icon: <GraduationCap className="h-5 w-5" />, label: 'Education' },
    { path: '/settings', icon: <Settings className="h-5 w-5" />, label: 'Settings' },
  ];
  
  // Combine all navigation items
  const navItems = [...baseNavItems, ...optionalNavItems, ...endNavItems];
  
  return (
    <div className="flex items-center space-x-1 px-1 overflow-x-auto">
      {navItems.map((item) => (
        <Link 
          key={item.path} 
          href={item.path}
          className={`flex items-center p-2 px-3 text-sm rounded-md hover:bg-[#262626] transition-colors ${
            location === item.path ? 'bg-[#262626] text-blue-400' : 'text-gray-300'
          }`}
        >
          <div className="mr-2">{item.icon}</div>
          {item.label}
        </Link>
      ))}
      
      <div className="ml-auto flex items-center">
        <div className="w-8 h-8 rounded-full bg-[#262626] flex items-center justify-center">
          <User className="h-4 w-4 text-gray-300" />
        </div>
      </div>
    </div>
  );
}