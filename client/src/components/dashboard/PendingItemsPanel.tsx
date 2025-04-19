import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  ArrowRight, 
  Calendar, 
  FileText, 
  Syringe, 
  RefreshCw,
  MoreHorizontal, 
  CalendarClock
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface PendingItemsPanelProps {
  patientId: number;
  onTogglePanel?: () => void;
  darkMode?: boolean;
}

interface PendingItem {
  id: string;
  patientId: number;
  patientName?: string;
  type: 'test' | 'imaging' | 'bloodwork' | 'referral' | 'other';
  description: string;
  requestedDate?: Date;
  dueDate?: Date;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'completed' | 'cancelled';
  messageId?: number;
  notes?: string;
  createdAt: Date;
  completedAt?: Date;
}

interface PreventativeCare {
  id: string;
  patientId: number;
  patientName?: string;
  category: 'vaccine' | 'screening' | 'counseling' | 'checkup' | 'other';
  name: string;
  description: string;
  relevantTo: string[];
  messageTemplate: string;
  suggestedDate?: Date;
  status: 'suggested' | 'sent' | 'completed' | 'declined';
  sentDate?: Date;
  responseDate?: Date;
  responseContent?: string;
  billingCode?: string;
  createdAt: Date;
}

export default function PendingItemsPanel({ 
  patientId, 
  onTogglePanel,
  darkMode = false
}: PendingItemsPanelProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("pending");
  
  // Colors based on theme
  const bgColor = darkMode ? 'bg-[#1a1a1a]' : 'bg-white';
  const textColor = darkMode ? 'text-white' : 'text-gray-900';
  const secondaryTextColor = darkMode ? 'text-gray-400' : 'text-gray-500';
  const borderColor = darkMode ? 'border-gray-800' : 'border-gray-200';
  const buttonHoverColor = darkMode ? 'hover:bg-[#2a2a2a]' : 'hover:bg-gray-100';
  
  // Fetch pending items for the patient
  const { 
    data: pendingItems = [],
    isLoading: pendingLoading,
    refetch: refreshPendingItems
  } = useQuery<PendingItem[]>({
    queryKey: [`/api/patients/${patientId}/pending-items`],
    enabled: !!patientId
  });
  
  // Fetch preventative care items for the patient
  const {
    data: preventativeCare = [],
    isLoading: preventativeLoading,
    refetch: refreshPreventativeCare
  } = useQuery<PreventativeCare[]>({
    queryKey: [`/api/patients/${patientId}/preventative-care`],
    enabled: !!patientId
  });
  
  // Complete pending item mutation
  const completePendingItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await fetch(`/api/pending-items/${itemId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to complete item');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/pending-items`] });
      toast({
        title: "Item Completed",
        description: "The pending item has been marked as completed",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Schedule preventative care item mutation
  const schedulePreventativeCareItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await fetch(`/api/preventative-care/${itemId}/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to schedule item');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/preventative-care`] });
      toast({
        title: "Item Scheduled",
        description: "The patient will be notified about this preventative care item",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Handle pending item completion
  const handleCompleteItem = (itemId: string) => {
    completePendingItemMutation.mutate(itemId);
  };
  
  // Handle preventative care scheduling
  const handleSchedulePreventativeCare = (itemId: string) => {
    schedulePreventativeCareItemMutation.mutate(itemId);
  };
  
  // Get the count of items
  const pendingCount = pendingItems.filter(item => item.status === 'pending').length;
  const completedCount = pendingItems.filter(item => item.status === 'completed').length;
  const preventativeCount = preventativeCare.filter(item => item.status === 'suggested').length;
  
  // Get the icon for a specific item type
  const getItemTypeIcon = (type: string) => {
    switch (type) {
      case 'test':
        return <FileText className="h-4 w-4 text-orange-500" />;
      case 'imaging':
        return <FileText className="h-4 w-4 text-purple-500" />;
      case 'bloodwork':
        return <Syringe className="h-4 w-4 text-red-500" />;
      case 'referral':
        return <ArrowRight className="h-4 w-4 text-green-500" />;
      default:
        return <FileText className="h-4 w-4 text-blue-500" />;
    }
  };
  
  // Get the priority badge color
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge className="bg-red-100 text-red-800 border-red-200">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Medium</Badge>;
      case 'low':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Low</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Normal</Badge>;
    }
  };
  
  // Format date for display
  const formatDate = (date?: Date) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString();
  };
  
  return (
    <div className={`h-full flex flex-col ${bgColor}`}>
      <div className={`p-4 border-b ${borderColor} flex items-center justify-between`}>
        <div>
          <h2 className={`text-lg font-medium ${textColor}`}>Patient Tasks</h2>
          <p className={`text-sm ${secondaryTextColor}`}>
            Pending items and preventative care
          </p>
        </div>
        
        {onTogglePanel && (
          <Button 
            variant="outline" 
            size="sm" 
            className="md:hidden"
            onClick={onTogglePanel}
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
        
        <Button 
          variant="outline" 
          size="sm" 
          className="hidden md:flex items-center gap-1"
          onClick={() => {
            refreshPendingItems();
            refreshPreventativeCare();
          }}
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="px-4 pt-2 pb-0 border-b">
          <TabsTrigger value="pending" className="relative">
            Pending
            {pendingCount > 0 && (
              <Badge className="ml-1 bg-blue-500 text-white">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="preventative">
            Preventative
            {preventativeCount > 0 && (
              <Badge className="ml-1 bg-green-500 text-white">
                {preventativeCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed
            {completedCount > 0 && (
              <Badge className="ml-1 bg-gray-500 text-white">
                {completedCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending" className="flex-1 p-0 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {pendingLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="animate-pulse">
                      <CardHeader className="p-4 pb-2">
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      </CardHeader>
                      <CardContent className="p-4 pt-2">
                        <div className="h-3 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : pendingItems.filter(item => item.status === 'pending').length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className={`h-12 w-12 mx-auto mb-4 ${secondaryTextColor}`} />
                  <h3 className={`text-lg font-medium mb-1 ${textColor}`}>All caught up!</h3>
                  <p className={`text-sm ${secondaryTextColor}`}>
                    No pending items for this patient
                  </p>
                </div>
              ) : (
                pendingItems
                  .filter(item => item.status === 'pending')
                  .sort((a, b) => {
                    // Sort by priority first
                    const priorityOrder = { high: 0, medium: 1, low: 2 };
                    const priorityDiff = 
                      priorityOrder[a.priority as keyof typeof priorityOrder] - 
                      priorityOrder[b.priority as keyof typeof priorityOrder];
                    
                    if (priorityDiff !== 0) return priorityDiff;
                    
                    // Then by due date if available
                    if (a.dueDate && b.dueDate) {
                      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                    }
                    
                    return 0;
                  })
                  .map(item => (
                    <Card key={item.id} className={`overflow-hidden ${borderColor}`}>
                      <CardHeader className={`p-3 pb-2 flex flex-row justify-between items-start`}>
                        <div className="flex items-center space-x-2">
                          {getItemTypeIcon(item.type)}
                          <CardTitle className={`text-sm font-medium ${textColor}`}>{item.description}</CardTitle>
                        </div>
                        {getPriorityBadge(item.priority)}
                      </CardHeader>
                      <CardContent className="p-3 pt-0">
                        <div className="text-xs space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className={secondaryTextColor}>Requested:</span>
                            <span>{formatDate(item.requestedDate)}</span>
                          </div>
                          {item.dueDate && (
                            <div className="flex justify-between text-xs">
                              <span className={secondaryTextColor}>Due:</span>
                              <span className={`${
                                new Date(item.dueDate) < new Date() ? 'text-red-500 font-medium' : ''
                              }`}>
                                {formatDate(item.dueDate)}
                              </span>
                            </div>
                          )}
                          {item.notes && (
                            <div className="mt-2 pt-2 border-t text-xs">
                              <p className={secondaryTextColor}>{item.notes}</p>
                            </div>
                          )}
                        </div>
                        <div className="mt-3 flex justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 px-2">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleCompleteItem(item.id)}>
                                <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                                Mark as Completed
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Clock className="h-4 w-4 mr-2 text-orange-500" />
                                Reschedule
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
                                Cancel Item
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-7 ml-1 text-xs"
                            onClick={() => handleCompleteItem(item.id)}
                          >
                            Complete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="preventative" className="flex-1 p-0 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {preventativeLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="animate-pulse">
                      <CardHeader className="p-4 pb-2">
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      </CardHeader>
                      <CardContent className="p-4 pt-2">
                        <div className="h-3 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : preventativeCare.filter(item => item.status === 'suggested').length === 0 ? (
                <div className="text-center py-12">
                  <CalendarClock className={`h-12 w-12 mx-auto mb-4 ${secondaryTextColor}`} />
                  <h3 className={`text-lg font-medium mb-1 ${textColor}`}>Up to date!</h3>
                  <p className={`text-sm ${secondaryTextColor}`}>
                    No preventative care items needed at this time
                  </p>
                </div>
              ) : (
                preventativeCare
                  .filter(item => item.status === 'suggested')
                  .sort((a, b) => {
                    // Sort by suggested date
                    if (a.suggestedDate && b.suggestedDate) {
                      return new Date(a.suggestedDate).getTime() - new Date(b.suggestedDate).getTime();
                    }
                    return 0;
                  })
                  .map(item => (
                    <Card key={item.id} className={`overflow-hidden ${borderColor}`}>
                      <CardHeader className={`p-3 pb-1 flex flex-row justify-between items-start bg-green-50`}>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-green-600" />
                          <CardTitle className="text-sm font-medium text-green-800">{item.name}</CardTitle>
                        </div>
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          {item.category}
                        </Badge>
                      </CardHeader>
                      <CardContent className="p-3">
                        <p className="text-xs mb-2">{item.description}</p>
                        
                        <div className="text-xs space-y-1 mt-2">
                          <div className="flex justify-between text-xs">
                            <span className={secondaryTextColor}>Suggested Date:</span>
                            <span>{formatDate(item.suggestedDate)}</span>
                          </div>
                          
                          {item.billingCode && (
                            <div className="flex justify-between text-xs">
                              <span className={secondaryTextColor}>Billing Code:</span>
                              <span className="font-mono">{item.billingCode}</span>
                            </div>
                          )}
                        </div>
                        
                        <Separator className="my-2" />
                        
                        <div className="mt-1">
                          <div className="font-medium text-xs mb-1">Message Template:</div>
                          <div className="text-xs bg-gray-50 p-2 rounded border text-gray-700">
                            {item.messageTemplate}
                          </div>
                        </div>
                        
                        <div className="mt-3 flex justify-end">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-7 text-xs"
                            onClick={() => handleSchedulePreventativeCare(item.id)}
                          >
                            Schedule & Notify
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="completed" className="flex-1 p-0 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {pendingLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="animate-pulse">
                      <CardHeader className="p-4 pb-2">
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      </CardHeader>
                      <CardContent className="p-4 pt-2">
                        <div className="h-3 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : pendingItems.filter(item => item.status === 'completed').length === 0 ? (
                <div className="text-center py-12">
                  <Clock className={`h-12 w-12 mx-auto mb-4 ${secondaryTextColor}`} />
                  <h3 className={`text-lg font-medium mb-1 ${textColor}`}>No history yet</h3>
                  <p className={`text-sm ${secondaryTextColor}`}>
                    No completed items for this patient
                  </p>
                </div>
              ) : (
                pendingItems
                  .filter(item => item.status === 'completed')
                  .sort((a, b) => {
                    // Sort by completion date, newest first
                    if (a.completedAt && b.completedAt) {
                      return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
                    }
                    return 0;
                  })
                  .map(item => (
                    <Card key={item.id} className={`overflow-hidden border-gray-200 bg-gray-50`}>
                      <CardHeader className="p-3 pb-2 flex flex-row justify-between items-start">
                        <div className="flex items-center space-x-2">
                          {getItemTypeIcon(item.type)}
                          <CardTitle className="text-sm font-medium text-gray-500 line-through">
                            {item.description}
                          </CardTitle>
                        </div>
                        <Badge variant="outline" className="bg-gray-100 text-gray-500">
                          Completed
                        </Badge>
                      </CardHeader>
                      <CardContent className="p-3 pt-0">
                        <div className="text-xs text-gray-500">
                          {item.completedAt && (
                            <div className="flex justify-between text-xs">
                              <span>Completed:</span>
                              <span>{formatDate(item.completedAt)}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}