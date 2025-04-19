import React, { useState } from "react";
import { 
  AlertCircle, 
  CalendarClock, 
  CircleCheck, 
  Clock, 
  FileText, 
  Pill 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

interface PendingItem {
  id: string;
  patientId: number;
  type: 'prescription' | 'followup' | 'test' | 'referral' | 'other';
  description: string;
  dueDate: string;
  isCompleted: boolean;
  priority: 'high' | 'medium' | 'low';
}

interface PendingItemsPanelProps {
  patientId: number;
}

export default function PendingItemsPanel({ patientId }: PendingItemsPanelProps) {
  // Sample data - would come from the backend in a real app
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([
    {
      id: "1",
      patientId,
      type: "prescription",
      description: "Renouveler l'ordonnance d'amoxicilline",
      dueDate: "2025-04-22",
      isCompleted: false,
      priority: "high"
    },
    {
      id: "2",
      patientId,
      type: "test",
      description: "Vérifier les résultats de la prise de sang",
      dueDate: "2025-04-25",
      isCompleted: false,
      priority: "medium"
    },
    {
      id: "3",
      patientId,
      type: "followup",
      description: "Rendez-vous de suivi post-traitement",
      dueDate: "2025-05-10",
      isCompleted: false,
      priority: "low"
    },
    {
      id: "4",
      patientId,
      type: "referral",
      description: "Référer au cardiologue pour consultation",
      dueDate: "2025-04-30",
      isCompleted: false,
      priority: "medium"
    },
  ]);
  
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming'>('all');
  
  // Handle toggling item completion
  const toggleItemCompletion = (id: string) => {
    setPendingItems(
      pendingItems.map(item => 
        item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
      )
    );
  };
  
  // Filter pending items based on current filter
  const filteredItems = pendingItems.filter(item => {
    if (filter === 'all') return true;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dueDate = new Date(item.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    
    if (filter === 'today') {
      return dueDate.getTime() === today.getTime();
    } else if (filter === 'upcoming') {
      return dueDate.getTime() > today.getTime();
    }
    
    return true;
  });
  
  // Get icon based on pending item type
  const getItemIcon = (type: PendingItem['type']) => {
    switch (type) {
      case 'prescription':
        return <Pill className="h-4 w-4" />;
      case 'followup':
        return <CalendarClock className="h-4 w-4" />;
      case 'test':
        return <FileText className="h-4 w-4" />;
      case 'referral':
        return <Clock className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };
  
  // Get priority badge color
  const getPriorityColor = (priority: PendingItem['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-600 hover:bg-red-700';
      case 'medium':
        return 'bg-yellow-600 hover:bg-yellow-700';
      case 'low':
        return 'bg-blue-600 hover:bg-blue-700';
    }
  };
  
  // Format date to display in a readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      month: 'short',
      day: 'numeric',
    });
  };
  
  return (
    <div className="flex flex-col h-full bg-[#1a1a1a] border-r border-gray-800">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-lg font-semibold text-white">Pending Items</h2>
        
        <div className="flex mt-2 space-x-2">
          <Button 
            size="sm" 
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            className={filter === 'all' ? 'bg-blue-600' : 'text-gray-400'}
          >
            All
          </Button>
          <Button 
            size="sm" 
            variant={filter === 'today' ? 'default' : 'outline'}
            onClick={() => setFilter('today')}
            className={filter === 'today' ? 'bg-blue-600' : 'text-gray-400'}
          >
            Today
          </Button>
          <Button 
            size="sm" 
            variant={filter === 'upcoming' ? 'default' : 'outline'}
            onClick={() => setFilter('upcoming')}
            className={filter === 'upcoming' ? 'bg-blue-600' : 'text-gray-400'}
          >
            Upcoming
          </Button>
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <CircleCheck className="h-8 w-8 mb-2" />
              <p>No pending items</p>
            </div>
          ) : (
            filteredItems.map(item => (
              <div 
                key={item.id} 
                className={`p-3 rounded-lg border ${
                  item.isCompleted 
                    ? 'bg-gray-800/30 border-gray-700 text-gray-500' 
                    : 'bg-[#2a2a2a] border-gray-700 text-white'
                }`}
              >
                <div className="flex items-start gap-2">
                  <Checkbox 
                    checked={item.isCompleted}
                    onCheckedChange={() => toggleItemCompletion(item.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {getItemIcon(item.type)}
                      <p className={item.isCompleted ? 'line-through' : ''}>
                        {item.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <Badge variant="outline" className="text-xs bg-transparent border-gray-600">
                        {formatDate(item.dueDate)}
                      </Badge>
                      <Badge className={`text-xs ${getPriorityColor(item.priority)}`}>
                        {item.priority}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t border-gray-800">
        <Button 
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          <AlertCircle className="h-4 w-4 mr-2" />
          Add Pending Item
        </Button>
      </div>
    </div>
  );
}