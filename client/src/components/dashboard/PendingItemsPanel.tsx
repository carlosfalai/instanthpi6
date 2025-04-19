import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clipboard, 
  Loader2, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ClipboardCheck, 
  Syringe, 
  BarChart4, 
  Stethoscope, 
  FileText
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface PendingItemsPanelProps {
  patientId: number;
}

interface PendingItem {
  id: string;
  type: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  dueDate: string | null;
}

export default function PendingItemsPanel({ patientId }: PendingItemsPanelProps) {
  const { data: pendingItems = [], isLoading, error } = useQuery<PendingItem[]>({
    queryKey: [`/api/patients/${patientId}/pending-items`],
    enabled: !!patientId,
  });

  // Count items by priority
  const highPriorityCount = pendingItems.filter(item => item.priority === 'high' && item.status === 'pending').length;
  const mediumPriorityCount = pendingItems.filter(item => item.priority === 'medium' && item.status === 'pending').length;
  const lowPriorityCount = pendingItems.filter(item => item.priority === 'low' && item.status === 'pending').length;
  
  // Get icon based on item type
  const getItemIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'test':
        return <Clipboard size={16} />;
      case 'bloodwork':
        return <Syringe size={16} />;
      case 'imaging':
        return <BarChart4 size={16} />;
      case 'referral':
        return <Stethoscope size={16} />;
      default:
        return <FileText size={16} />;
    }
  };
  
  // Get color based on priority
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-amber-500';
      case 'low':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#121212] text-white p-4">
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-2">Pending Items</h2>
        
        {/* Priority counts */}
        <div className="flex gap-2 mb-4">
          {highPriorityCount > 0 && (
            <Badge variant="outline" className="bg-red-900/30 text-red-400 border-red-800">
              {highPriorityCount} High
            </Badge>
          )}
          {mediumPriorityCount > 0 && (
            <Badge variant="outline" className="bg-amber-900/30 text-amber-400 border-amber-800">
              {mediumPriorityCount} Medium
            </Badge>
          )}
          {lowPriorityCount > 0 && (
            <Badge variant="outline" className="bg-blue-900/30 text-blue-400 border-blue-800">
              {lowPriorityCount} Low
            </Badge>
          )}
          {(highPriorityCount + mediumPriorityCount + lowPriorityCount) === 0 && !isLoading && (
            <Badge variant="outline" className="bg-green-900/30 text-green-400 border-green-800">
              All Complete
            </Badge>
          )}
        </div>
      </div>
      
      {/* Loading state */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      )}
      
      {/* Error state */}
      {error && (
        <div className="flex-1 flex flex-col items-center justify-center text-red-400">
          <AlertTriangle className="h-8 w-8 mb-2" />
          <p className="text-center">Failed to load pending items</p>
        </div>
      )}
      
      {/* No items state */}
      {!isLoading && !error && pendingItems.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
          <ClipboardCheck className="h-12 w-12 mb-2" />
          <p className="text-center">No pending items for this patient</p>
        </div>
      )}
      
      {/* Items list */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {pendingItems
          .filter(item => item.status === 'pending')
          .sort((a, b) => {
            // Sort by priority first (high > medium > low)
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            const priorityA = priorityOrder[a.priority as keyof typeof priorityOrder] || 3;
            const priorityB = priorityOrder[b.priority as keyof typeof priorityOrder] || 3;
            
            if (priorityA !== priorityB) {
              return priorityA - priorityB;
            }
            
            // Then sort by due date if available
            if (a.dueDate && b.dueDate) {
              return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            }
            
            // Finally sort by created date
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          })
          .map(item => (
            <Card key={item.id} className="bg-[#1e1e1e] border-gray-800">
              <CardHeader className="p-3 pb-0 flex flex-row justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${getPriorityColor(item.priority)}`} />
                  <CardTitle className="text-sm font-medium text-white flex items-center gap-1">
                    {getItemIcon(item.type)}
                    <span className="ml-1">{item.type}</span>
                  </CardTitle>
                </div>
                {item.dueDate && (
                  <div className="text-xs text-gray-400 flex items-center">
                    <Clock size={12} className="mr-1" />
                    {new Date(item.dueDate) < new Date() ? (
                      <span className="text-red-400">
                        Overdue by {formatDistanceToNow(new Date(item.dueDate))}
                      </span>
                    ) : (
                      <span>
                        Due in {formatDistanceToNow(new Date(item.dueDate))}
                      </span>
                    )}
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-3 pt-2">
                <p className="text-sm text-gray-300">{item.description}</p>
              </CardContent>
              <CardFooter className="p-3 pt-0 flex justify-end">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-8 text-xs text-gray-400 hover:text-white hover:bg-gray-700"
                >
                  <CheckCircle2 size={14} className="mr-1" />
                  Mark Complete
                </Button>
              </CardFooter>
            </Card>
          ))}
      </div>
    </div>
  );
}