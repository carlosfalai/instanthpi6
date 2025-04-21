import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { User } from '@shared/schema';
import { GripVertical, Home, Users, FileText, MessageSquare, ClipboardList, Heart, PillIcon, AlertCircle, GraduationCap, Settings } from 'lucide-react';

// Interface for navigation items
interface NavItem {
  id: string;
  path: string;
  icon: React.ReactNode;
  label: string;
  visible: boolean;
  order: number;
  row: 'primary' | 'secondary';
  description: string;
}

// Props for NavigationSettings component
interface NavigationSettingsProps {
  currentUser?: User;
}

// Generate default navigation items
const generateDefaultNavItems = (): NavItem[] => [
  { 
    id: 'home', 
    path: '/', 
    icon: <Home className="h-5 w-5" />, 
    label: 'Home', 
    visible: true, 
    order: 1, 
    row: 'primary',
    description: 'Main dashboard and overview'
  },
  { 
    id: 'patients', 
    path: '/patients', 
    icon: <Users className="h-5 w-5" />, 
    label: 'Patients', 
    visible: true, 
    order: 2, 
    row: 'primary',
    description: 'Manage and view patient information'
  },
  { 
    id: 'documents', 
    path: '/documents', 
    icon: <FileText className="h-5 w-5" />, 
    label: 'Documents', 
    visible: true, 
    order: 3, 
    row: 'primary',
    description: 'Access patient documents and reports'
  },
  { 
    id: 'messages', 
    path: '/messages', 
    icon: <MessageSquare className="h-5 w-5" />, 
    label: 'Messages', 
    visible: true, 
    order: 4, 
    row: 'primary',
    description: 'Patient communication and messaging'
  },
  { 
    id: 'forms', 
    path: '/forms', 
    icon: <ClipboardList className="h-5 w-5" />, 
    label: 'Forms', 
    visible: true, 
    order: 1, 
    row: 'secondary',
    description: 'Create and manage patient forms'
  },
  { 
    id: 'chronicConditions', 
    path: '/chronic-conditions', 
    icon: <Heart className="h-5 w-5" />, 
    label: 'Chronic Conditions', 
    visible: true, 
    order: 2, 
    row: 'secondary',
    description: 'Manage patient chronic conditions and ongoing care'
  },
  { 
    id: 'medicationRefills', 
    path: '/medication-refills', 
    icon: <PillIcon className="h-5 w-5" />, 
    label: 'Medication Refills', 
    visible: true, 
    order: 3, 
    row: 'secondary',
    description: 'Handle medication refill requests from patients'
  },
  { 
    id: 'urgentCare', 
    path: '/urgent-care', 
    icon: <AlertCircle className="h-5 w-5" />, 
    label: 'Urgent Care', 
    visible: true, 
    order: 4, 
    row: 'secondary',
    description: 'Manage urgent care requests and walk-ins'
  },
  { 
    id: 'education', 
    path: '/education', 
    icon: <GraduationCap className="h-5 w-5" />, 
    label: 'Education', 
    visible: true, 
    order: 5, 
    row: 'secondary',
    description: 'Access educational resources and training'
  },
  { 
    id: 'settings', 
    path: '/settings', 
    icon: <Settings className="h-5 w-5" />, 
    label: 'Settings', 
    visible: true, 
    order: 6, 
    row: 'secondary',
    description: 'Configure system settings and preferences'
  },
];

// Sortable item component
const SortableNavItem = ({ item, onToggleChange }: { item: NavItem, onToggleChange: (id: string, visible: boolean) => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="flex items-center justify-between py-4 px-2 border-b border-gray-800 hover:bg-[#262626] rounded-md transition-colors"
    >
      <div className="flex items-center space-x-3">
        <div {...attributes} {...listeners} className="cursor-grab">
          <GripVertical className="h-5 w-5 text-gray-500" />
        </div>
        <div className="text-primary">{item.icon}</div>
        <div>
          <h3 className="font-medium">{item.label}</h3>
          <p className="text-sm text-gray-400">{item.description}</p>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <div className="text-sm text-gray-400">
          {item.row === 'primary' ? 'Top row' : 'Bottom row'}
        </div>
        <Switch
          checked={item.visible}
          onCheckedChange={(checked) => onToggleChange(item.id, checked)}
        />
      </div>
    </div>
  );
};

// Main component
const NavigationSettings: React.FC<NavigationSettingsProps> = ({ currentUser }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Default navigation preferences from user or default
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
  
  // Initialize navigation items
  const [navItems, setNavItems] = useState<NavItem[]>(() => {
    if (navPreferences.navItems) {
      return navPreferences.navItems;
    }
    
    // Otherwise, create default items and adjust visibility based on preferences
    const defaults = generateDefaultNavItems();
    return defaults.map(item => {
      if (item.id === 'chronicConditions') {
        return { ...item, visible: navPreferences.showChronicConditions };
      } else if (item.id === 'medicationRefills') {
        return { ...item, visible: navPreferences.showMedicationRefills };
      } else if (item.id === 'urgentCare') {
        return { ...item, visible: navPreferences.showUrgentCare };
      }
      return item;
    });
  });
  
  // Update nav items when user preferences change
  useEffect(() => {
    if (currentUser?.navPreferences?.navItems) {
      setNavItems(currentUser.navPreferences.navItems);
    }
  }, [currentUser]);
  
  // Setup DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );
  
  // Update user navigation preferences mutation
  const updateNavPreferencesMutation = useMutation({
    mutationFn: async (preferences: { navItems: NavItem[] }) => {
      const response = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          navPreferences: {
            ...navPreferences,
            navItems: preferences.navItems,
            // Update individual flags for compatibility with existing code
            showChronicConditions: preferences.navItems.find(item => item.id === 'chronicConditions')?.visible ?? true,
            showMedicationRefills: preferences.navItems.find(item => item.id === 'medicationRefills')?.visible ?? true,
            showUrgentCare: preferences.navItems.find(item => item.id === 'urgentCare')?.visible ?? true,
          }
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update navigation preferences');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({
        title: 'Navigation updated',
        description: 'Your navigation preferences have been saved successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update navigation preferences: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      // Find the items we're swapping
      const activeItem = navItems.find(item => item.id === active.id);
      const overItem = navItems.find(item => item.id === over.id);
      
      if (!activeItem || !overItem) return;
      
      // Only allow reordering within the same row
      if (activeItem.row !== overItem.row) {
        toast({
          title: 'Cannot move between rows',
          description: 'Items can only be reordered within the same row.',
          variant: 'destructive',
        });
        return;
      }
      
      // Update orders
      const updatedItems = navItems.map(item => {
        if (item.id === active.id) {
          return { ...item, order: overItem.order };
        } else if (item.id === over.id) {
          return { ...item, order: activeItem.order };
        } else if (
          item.row === activeItem.row && 
          ((activeItem.order < overItem.order && item.order > activeItem.order && item.order <= overItem.order) ||
           (activeItem.order > overItem.order && item.order < activeItem.order && item.order >= overItem.order))
        ) {
          // Adjust orders of items in between
          const newOrder = activeItem.order < overItem.order ? item.order - 1 : item.order + 1;
          return { ...item, order: newOrder };
        }
        return item;
      });
      
      setNavItems(updatedItems);
    }
  };
  
  // Handle toggle change
  const handleToggleChange = (id: string, visible: boolean) => {
    const updatedItems = navItems.map(item => 
      item.id === id ? { ...item, visible } : item
    );
    setNavItems(updatedItems);
  };
  
  // Handle save changes
  const handleSaveChanges = () => {
    updateNavPreferencesMutation.mutate({ navItems });
  };
  
  // Handle reset to defaults
  const handleResetToDefaults = () => {
    setNavItems(generateDefaultNavItems());
    toast({
      title: 'Reset to defaults',
      description: 'Navigation settings have been reset to default values. Click Save to apply changes.',
    });
  };
  
  // Filter items by row for sorting context
  const primaryItems = navItems
    .filter(item => item.row === 'primary')
    .sort((a, b) => a.order - b.order);
    
  const secondaryItems = navItems
    .filter(item => item.row === 'secondary')
    .sort((a, b) => a.order - b.order);
  
  return (
    <Card className="bg-[#1e1e1e] border-gray-800">
      <CardHeader>
        <CardTitle>Navigation Menu Customization</CardTitle>
        <CardDescription className="text-gray-400">
          Customize which items appear in your navigation menu and their order
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Top Row Menu Items</h3>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToVerticalAxis, restrictToParentElement]}
            >
              <SortableContext items={primaryItems.map(item => item.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2 mb-4">
                  {primaryItems.map(item => (
                    <SortableNavItem key={item.id} item={item} onToggleChange={handleToggleChange} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Bottom Row Menu Items</h3>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToVerticalAxis, restrictToParentElement]}
            >
              <SortableContext items={secondaryItems.map(item => item.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2 mb-4">
                  {secondaryItems.map(item => (
                    <SortableNavItem key={item.id} item={item} onToggleChange={handleToggleChange} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
          
          <div className="flex space-x-4 justify-end pt-4">
            <Button 
              variant="outline" 
              onClick={handleResetToDefaults}
              className="border-gray-700 hover:bg-gray-800"
            >
              Reset to Defaults
            </Button>
            <Button 
              onClick={handleSaveChanges}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={updateNavPreferencesMutation.isPending}
            >
              {updateNavPreferencesMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
          
          <div className="pt-4">
            <p className="text-sm text-gray-400">
              Drag and drop items to reorder them. Toggle switches to show or hide menu items.
              Changes won't take effect until you click "Save Changes".
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NavigationSettings;