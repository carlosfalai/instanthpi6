import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, Check, AlertCircle, Loader2, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface PendingItemsPanelProps {
  patientId: number;
}

interface PendingItem {
  id: string;
  patientId: number;
  type: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string | null;
  completedAt: string | null;
}

export default function PendingItemsPanel({ patientId }: PendingItemsPanelProps) {
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'completed'
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  
  // Query pending items
  const { 
    data: items = [], 
    isLoading, 
    error 
  } = useQuery<PendingItem[]>({
    queryKey: [`/api/patients/${patientId}/pending-items`],
    enabled: !!patientId,
  });
  
  // Filter items based on the selected filter
  const filteredItems = items.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'active') return item.status !== 'completed';
    if (filter === 'completed') return item.status === 'completed';
    return true;
  });
  
  // Toggle item expansion
  const toggleItemExpansion = (id: string) => {
    setExpandedItemId(expandedItemId === id ? null : id);
  };
  
  // Mark an item as complete
  const markItemComplete = async (id: string) => {
    try {
      await apiRequest('PATCH', `/api/pending-items/${id}`, {
        status: 'completed',
        completedAt: new Date().toISOString()
      });
      
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/pending-items`] });
    } catch (error) {
      console.error('Error completing item:', error);
    }
  };
  
  // Get appropriate icon based on priority
  const getPriorityIcon = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <Clock className="h-4 w-4 text-amber-500" />;
      default:
        return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };
  
  return (
    <div className="flex flex-col h-full bg-[#121212] text-white">
      {/* Header */}
      <div className="p-4 bg-[#1e1e1e] border-b border-gray-800">
        <h2 className="font-semibold mb-4">Pending Items</h2>
        
        <div className="flex space-x-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            className="text-xs"
          >
            All
          </Button>
          <Button
            variant={filter === 'active' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('active')}
            className="text-xs"
          >
            Active
          </Button>
          <Button
            variant={filter === 'completed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('completed')}
            className="text-xs"
          >
            Completed
          </Button>
        </div>
      </div>
      
      {/* Pending Items List */}
      <ScrollArea className="flex-1">
        {isLoading && (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        )}
        
        {error && (
          <div className="text-red-400 text-center p-4">
            Failed to load pending items
          </div>
        )}
        
        {!isLoading && filteredItems.length === 0 && (
          <div className="text-gray-500 text-center p-4">
            No pending items found
          </div>
        )}
        
        <div className="divide-y divide-gray-800">
          {filteredItems.map((item) => (
            <div key={item.id} className="p-3">
              <div className="flex items-start">
                <div className="mr-3 mt-1">
                  <Checkbox
                    checked={item.status === 'completed'}
                    onCheckedChange={() => {
                      if (item.status !== 'completed') {
                        markItemComplete(item.id);
                      }
                    }}
                    className="bg-[#262626] border-gray-700"
                  />
                </div>
                
                <div className="flex-1">
                  <div 
                    className="flex items-center justify-between cursor-pointer" 
                    onClick={() => toggleItemExpansion(item.id)}
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        {getPriorityIcon(item.priority)}
                        <span className={`font-medium ${item.status === 'completed' ? 'line-through text-gray-500' : ''}`}>
                          {item.description}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500">
                        <Badge 
                          variant="outline" 
                          className="bg-transparent border-gray-700 text-gray-400"
                        >
                          {item.type}
                        </Badge>
                        
                        {item.dueDate && (
                          <span>Due: {new Date(item.dueDate).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                    >
                      {expandedItemId === item.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                  
                  {expandedItemId === item.id && (
                    <div className="mt-2 pl-2 border-l border-gray-700 text-sm">
                      <p className="text-gray-400">
                        {item.type === 'lab' ? 'Request lab results' : 
                          item.type === 'medication' ? 'Verify medication status' : 
                          item.type === 'followup' ? 'Schedule follow-up appointment' : 
                          'Follow up on pending item'}
                      </p>
                      
                      <div className="flex mt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs h-7 bg-[#262626] hover:bg-gray-700"
                          onClick={() => markItemComplete(item.id)}
                        >
                          <Check className="h-3 w-3 mr-1" /> Mark Complete
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      
      {/* Mock data for development */}
      {!patientId && (
        <div className="p-3 bg-[#1e1e1e] border-t border-gray-800 text-xs text-gray-500 text-center">
          Select a patient to view pending items
        </div>
      )}
    </div>
  );
}