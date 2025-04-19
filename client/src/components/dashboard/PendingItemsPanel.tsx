import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, FileText, Timer, Heart, Stethoscope, Activity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

interface PendingItem {
  id: string;
  patientId: number;
  title: string;
  description?: string;
  dueDate: string;
  priority: "low" | "medium" | "high";
  type: "medication" | "followup" | "lab" | "referral" | "preventative";
  isCompleted: boolean;
}

interface ChronicCondition {
  id: string;
  patientId: number;
  name: string;
  diagnosisDate: string;
  status: "active" | "controlled" | "resolved";
  notes?: string;
}

interface PreventativeCare {
  id: string;
  patientId: number;
  title: string;
  recommendedDate: string;
  frequency: string;
  isCompleted: boolean;
  lastCompleted?: string;
}

interface PendingItemsPanelProps {
  patientId: number;
}

export default function PendingItemsPanel({ patientId }: PendingItemsPanelProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'today' | 'upcoming'>('all');
  const [filter, setFilter] = useState<'all' | 'conditions' | 'preventative'>('all');
  
  // Fetch pending items from the API
  const { data: pendingItems = [], isLoading: pendingLoading } = useQuery({
    queryKey: [`/api/patients/${patientId}/pending-items`],
    queryFn: async () => {
      try {
        const response = await axios.get(`/api/patients/${patientId}/pending-items`);
        return response.data;
      } catch (error) {
        console.error("Error fetching pending items:", error);
        return [];
      }
    },
    refetchOnWindowFocus: false
  });
  
  // Fetch chronic conditions from the API
  const { data: chronicConditions = [], isLoading: conditionsLoading } = useQuery({
    queryKey: [`/api/patients/${patientId}/chronic-conditions`],
    queryFn: async () => {
      try {
        const response = await axios.get(`/api/patients/${patientId}/chronic-conditions`);
        return response.data;
      } catch (error) {
        console.error("Error fetching chronic conditions:", error);
        return [];
      }
    },
    refetchOnWindowFocus: false
  });
  
  // Fetch preventative care items from the API
  const { data: preventativeCare = [], isLoading: preventativeLoading } = useQuery({
    queryKey: [`/api/patients/${patientId}/preventative-care`],
    queryFn: async () => {
      try {
        const response = await axios.get(`/api/patients/${patientId}/preventative-care`);
        return response.data;
      } catch (error) {
        console.error("Error fetching preventative care items:", error);
        return [];
      }
    },
    refetchOnWindowFocus: false
  });
  
  // Filter pending items based on the selected tab
  const filteredItems = Array.isArray(pendingItems) ? pendingItems.filter((item: PendingItem) => {
    if (activeTab === 'all') return true;
    
    const dueDate = new Date(item.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (activeTab === 'today') {
      return dueDate >= today && dueDate < tomorrow;
    }
    
    return dueDate >= tomorrow;
  }) : [];
  
  // Get icon based on item type
  const getItemIcon = (type: string, className = "h-5 w-5") => {
    switch (type) {
      case 'medication':
        return <FileText className={className} />;
      case 'followup':
        return <Calendar className={className} />;
      case 'lab':
        return <FileText className={className} />;
      case 'referral':
        return <Stethoscope className={className} />;
      case 'preventative':
        return <Heart className={className} />;
      default:
        return <Clock className={className} />;
    }
  };
  
  // Format due date (e.g., "21 avr.")
  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    // Using French locale for date formatting
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }).replace('.', '');
  };
  
  // Priority badge color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return "bg-red-500 hover:bg-red-600";
      case 'medium':
        return "bg-amber-500 hover:bg-amber-600";
      case 'low':
        return "bg-blue-500 hover:bg-blue-600";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  };
  
  // Toggle item completion
  const toggleItemCompletion = async (id: string, currentStatus: boolean) => {
    try {
      await axios.patch(`/api/pending-items/${id}`, {
        isCompleted: !currentStatus
      });
      
      // Typically would refetch data here, but we're skipping that for the example
    } catch (error) {
      console.error("Error updating item:", error);
    }
  };
  
  return (
    <div className="flex flex-col h-full bg-[#121212] text-white">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-lg font-semibold">Pending Items</h2>
        <div className="flex mt-4 gap-2">
          <Button 
            variant={activeTab === 'all' ? "default" : "outline"}
            size="sm"
            className={`rounded-full ${activeTab === 'all' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-transparent text-gray-300 hover:text-white'}`}
            onClick={() => setActiveTab('all')}
          >
            All
          </Button>
          <Button 
            variant={activeTab === 'today' ? "default" : "outline"}
            size="sm"
            className={`rounded-full ${activeTab === 'today' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-transparent text-gray-300 hover:text-white'}`}
            onClick={() => setActiveTab('today')}
          >
            Today
          </Button>
          <Button 
            variant={activeTab === 'upcoming' ? "default" : "outline"}
            size="sm"
            className={`rounded-full ${activeTab === 'upcoming' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-transparent text-gray-300 hover:text-white'}`}
            onClick={() => setActiveTab('upcoming')}
          >
            Upcoming
          </Button>
        </div>
        <div className="flex mt-4 gap-2">
          <Button 
            variant={filter === 'all' ? "default" : "outline"}
            size="sm"
            className={`${filter === 'all' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-transparent'}`}
            onClick={() => setFilter('all')}
          >
            <Clock className="h-4 w-4 mr-2" />
            All Items
          </Button>
          <Button 
            variant={filter === 'conditions' ? "default" : "outline"}
            size="sm"
            className={`${filter === 'conditions' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-transparent'}`}
            onClick={() => setFilter('conditions')}
          >
            <Activity className="h-4 w-4 mr-2" />
            Conditions
          </Button>
          <Button 
            variant={filter === 'preventative' ? "default" : "outline"}
            size="sm"
            className={`${filter === 'preventative' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-transparent'}`}
            onClick={() => setFilter('preventative')}
          >
            <Heart className="h-4 w-4 mr-2" />
            Preventative
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {pendingLoading || conditionsLoading || preventativeLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* Pending Items Section */}
            {(filter === 'all' || (!filteredItems.length && !chronicConditions.length && !preventativeCare.length)) && (
              <>
                {filteredItems.map((item: PendingItem) => (
                  <div key={item.id} className="p-4 bg-[#1a1a1a] rounded-lg border border-gray-800">
                    <div className="flex items-start">
                      <div className="mr-3 mt-1">
                        <input 
                          type="checkbox" 
                          checked={item.isCompleted}
                          onChange={() => toggleItemCompletion(item.id, item.isCompleted)}
                          className="h-5 w-5 rounded border-gray-700 bg-gray-900 text-blue-600"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center">
                          {getItemIcon(item.type, "h-5 w-5 mr-2 text-gray-400")}
                          <h3 className={`font-medium ${item.isCompleted ? 'line-through text-gray-500' : 'text-white'}`}>
                            {item.title}
                          </h3>
                        </div>
                        {item.description && (
                          <p className="text-sm text-gray-400 mt-1">{item.description}</p>
                        )}
                        <div className="mt-2 flex items-center">
                          <div className="px-2 py-1 rounded-full bg-gray-800 text-xs text-gray-300">
                            {formatDueDate(item.dueDate)}
                          </div>
                          <Badge className={`ml-2 ${getPriorityColor(item.priority)}`}>
                            {item.priority}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredItems.length === 0 && filter === 'all' && (
                  <div className="text-center p-6 bg-[#1a1a1a] rounded-lg border border-gray-800">
                    <Clock className="h-12 w-12 mx-auto text-gray-500 mb-3" />
                    <h3 className="text-lg font-medium text-gray-300">No pending items</h3>
                    <p className="text-gray-500 mt-1">
                      All tasks are complete for this time period
                    </p>
                  </div>
                )}
              </>
            )}
            
            {/* Chronic Conditions Section */}
            {filter === 'conditions' && (
              <>
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">
                  Chronic Conditions
                </h3>
                
                {chronicConditions.map((condition: ChronicCondition) => (
                  <div key={condition.id} className="p-4 bg-[#1a1a1a] rounded-lg border border-gray-800">
                    <div className="flex items-start">
                      <Activity className="h-5 w-5 mr-3 mt-1 text-red-500" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white">
                          {condition.name}
                        </h3>
                        <p className="text-sm text-gray-400 mt-1">
                          Diagnosed: {new Date(condition.diagnosisDate).toLocaleDateString()}
                        </p>
                        <div className="mt-2 flex items-center">
                          <Badge className={
                            condition.status === 'active' ? 'bg-red-500' : 
                            condition.status === 'controlled' ? 'bg-amber-500' : 
                            'bg-green-500'
                          }>
                            {condition.status.charAt(0).toUpperCase() + condition.status.slice(1)}
                          </Badge>
                        </div>
                        {condition.notes && (
                          <p className="text-sm text-gray-400 mt-2">{condition.notes}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {chronicConditions.length === 0 && (
                  <div className="text-center p-6 bg-[#1a1a1a] rounded-lg border border-gray-800">
                    <Activity className="h-12 w-12 mx-auto text-gray-500 mb-3" />
                    <h3 className="text-lg font-medium text-gray-300">No chronic conditions</h3>
                    <p className="text-gray-500 mt-1">
                      This patient has no recorded chronic conditions
                    </p>
                  </div>
                )}
              </>
            )}
            
            {/* Preventative Care Section */}
            {filter === 'preventative' && (
              <>
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">
                  Preventative Care
                </h3>
                
                {preventativeCare.map((item: PreventativeCare) => (
                  <div key={item.id} className="p-4 bg-[#1a1a1a] rounded-lg border border-gray-800">
                    <div className="flex items-start">
                      <div className="mr-3 mt-1">
                        <input 
                          type="checkbox" 
                          checked={item.isCompleted}
                          onChange={() => {
                            // Handle completion toggle
                          }}
                          className="h-5 w-5 rounded border-gray-700 bg-gray-900 text-blue-600"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center">
                          <Heart className="h-5 w-5 mr-2 text-pink-500" />
                          <h3 className={`font-medium ${item.isCompleted ? 'line-through text-gray-500' : 'text-white'}`}>
                            {item.title}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-400 mt-1">
                          Recommended: {new Date(item.recommendedDate).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          Frequency: {item.frequency}
                        </p>
                        {item.lastCompleted && (
                          <p className="text-sm text-gray-400 mt-1">
                            Last completed: {new Date(item.lastCompleted).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {preventativeCare.length === 0 && (
                  <div className="text-center p-6 bg-[#1a1a1a] rounded-lg border border-gray-800">
                    <Heart className="h-12 w-12 mx-auto text-gray-500 mb-3" />
                    <h3 className="text-lg font-medium text-gray-300">No preventative care items</h3>
                    <p className="text-gray-500 mt-1">
                      No preventative care measures are currently scheduled
                    </p>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}