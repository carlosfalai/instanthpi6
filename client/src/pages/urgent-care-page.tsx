import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader,
  TableRow 
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { AlertCircle, Clock, FileCheck, MessageSquare, RefreshCw } from "lucide-react";
import { getUrgentCareRequests, updateUrgentCareRequest } from "@/services/urgentCare";
import { UrgentCareWithDetails } from "@/services/urgentCare";

export default function UrgentCarePage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("new");
  const [timeframe, setTimeframe] = useState(24);
  const [selectedRequest, setSelectedRequest] = useState<UrgentCareWithDetails | null>(null);
  const [notes, setNotes] = useState("");
  const [isEditingWaitingFor, setIsEditingWaitingFor] = useState(false);
  const [waitingFor, setWaitingFor] = useState<string | null>(null);
  const [waitingForDetails, setWaitingForDetails] = useState<string>("");
  
  // Query for urgent care requests
  const { data: urgentRequests = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/urgent-care", activeTab, timeframe],
    queryFn: () => getUrgentCareRequests({
      status: activeTab !== "all" ? activeTab : undefined,
      timeframe: timeframe
    }),
  });
  
  // Mutation for updating a request
  const updateMutation = useMutation({
    mutationFn: (params: { id: number, status: string, notes?: string }) => 
      updateUrgentCareRequest(params.id, { 
        status: params.status,
        notes: params.notes
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/urgent-care"] });
      toast({
        title: "Request updated",
        description: "The urgent care request has been updated successfully.",
      });
      setSelectedRequest(null);
      setNotes("");
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: `Failed to update request: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Handle status change
  const handleStatusChange = (id: number, status: string) => {
    updateMutation.mutate({ id, status, notes });
  };
  
  // Handle waiting for updates
  const handleWaitingForUpdate = (id: number) => {
    if (!waitingFor) return;
    
    const waitingData = {
      waitingFor,
      waitingForDetails,
    };
    
    const updateMutationForWaiting = useMutation({
      mutationFn: () => updateUrgentCareRequest(id, waitingData),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/urgent-care"] });
        toast({
          title: "Request updated",
          description: "Waiting information has been updated successfully.",
        });
        setIsEditingWaitingFor(false);
        
        // Update selected request with new waiting info
        if (selectedRequest) {
          setSelectedRequest({
            ...selectedRequest, 
            waitingFor,
            waitingForDetails
          });
        }
      },
      onError: (error) => {
        toast({
          title: "Update failed",
          description: `Failed to update waiting info: ${error.message}`,
          variant: "destructive",
        });
      },
    });
    
    updateMutationForWaiting.mutate();
  };
  
  // Get badge color based on priority
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">High Priority</Badge>;
      case "medium":
        return <Badge variant="default">Medium Priority</Badge>;
      case "low":
        return <Badge variant="outline">Low Priority</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };
  
  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return <Badge variant="secondary">New</Badge>;
      case "in_progress":
        return <Badge variant="default">In Progress</Badge>;
      case "completed":
        // Using "secondary" as a replacement for "success" since it's not in the variant options
        return <Badge variant="secondary" className="bg-green-600">Completed</Badge>;
      case "cancelled":
        return <Badge variant="outline">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  // Format date
  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return "N/A";
    const date = dateString instanceof Date ? dateString : new Date(dateString);
    return date.toLocaleString();
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Urgent Care Requests</h1>
          <p className="text-muted-foreground">
            View and manage time-sensitive patient requests that require attention.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={timeframe.toString()}
            onValueChange={(value) => setTimeframe(parseInt(value))}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Time period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="4">Last 4 hours</SelectItem>
              <SelectItem value="8">Last 8 hours</SelectItem>
              <SelectItem value="12">Last 12 hours</SelectItem>
              <SelectItem value="24">Last 24 hours</SelectItem>
              <SelectItem value="48">Last 2 days</SelectItem>
              <SelectItem value="72">Last 3 days</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={() => refetch()} 
            variant="outline" 
            size="icon"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <Tabs 
        defaultValue="new" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="new">New</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="all">All Requests</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
            </div>
          ) : urgentRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No urgent care requests</h3>
              <p className="text-muted-foreground max-w-md mt-2">
                There are currently no {activeTab !== "all" ? activeTab : ""} urgent care requests 
                within the selected time period.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 space-y-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {urgentRequests.map((request) => (
                        <TableRow 
                          key={request.id}
                          className={`cursor-pointer ${selectedRequest?.id === request.id ? 'bg-accent' : ''}`}
                          onClick={() => {
                            setSelectedRequest(request);
                            setNotes(request.notes || '');
                          }}
                        >
                          <TableCell>
                            {request.patient?.name || `Patient #${request.patientId}`}
                          </TableCell>
                          <TableCell>
                            {request.requestType === "new_problem" ? "New Problem" :
                             request.requestType === "medication_refill" ? "Medication Refill" :
                             request.requestType === "follow_up" ? "Follow-up" :
                             request.requestType === "symptom_check" ? "Symptom Check" :
                             request.requestType}
                          </TableCell>
                          <TableCell>
                            {getPriorityBadge(request.priority)}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(request.status)}
                            {request.waitingFor && request.status === "in_progress" && (
                              <div className="flex items-center mt-1 text-xs text-amber-700 dark:text-amber-400">
                                <Clock className="h-3 w-3 mr-1" />
                                {request.waitingFor.replace('_', ' ')}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatDate(request.receivedAt).split(',')[1]}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              
              <div className="md:col-span-2">
                {selectedRequest ? (
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>
                            {selectedRequest.patient?.name || `Patient #${selectedRequest.patientId}`}
                          </CardTitle>
                          <CardDescription>
                            Received: {formatDate(selectedRequest.receivedAt)}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          {getPriorityBadge(selectedRequest.priority)}
                          {getStatusBadge(selectedRequest.status)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium">Request Type</h3>
                        <p>
                          {selectedRequest.requestType === "new_problem" ? "New Medical Problem" :
                           selectedRequest.requestType === "medication_refill" ? "Medication Refill Request" :
                           selectedRequest.requestType === "follow_up" ? "Follow-up Visit" :
                           selectedRequest.requestType === "symptom_check" ? "Symptom Check" :
                           selectedRequest.requestType}
                        </p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium">Problem Description</h3>
                        <p className="whitespace-pre-line">{selectedRequest.problemDescription}</p>
                      </div>
                      
                      {selectedRequest.messageContent && (
                        <div>
                          <h3 className="text-sm font-medium">Patient Message</h3>
                          <div className="p-3 bg-muted rounded-md mt-1">
                            <p className="whitespace-pre-line">{selectedRequest.messageContent}</p>
                          </div>
                        </div>
                      )}
                      
                      {selectedRequest.aiAnalysis && (
                        <div>
                          <h3 className="text-sm font-medium">AI Analysis</h3>
                          <div className="p-3 bg-muted rounded-md mt-1">
                            <p className="whitespace-pre-line">{selectedRequest.aiAnalysis}</p>
                          </div>
                        </div>
                      )}
                      
                      {selectedRequest.waitingFor && (
                        <div>
                          <h3 className="text-sm font-medium flex items-center gap-2">
                            <Clock className="h-4 w-4 text-amber-500" />
                            Waiting For: {selectedRequest.waitingFor.replace('_', ' ')}
                          </h3>
                          {selectedRequest.waitingForDetails && (
                            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md mt-1">
                              <p className="whitespace-pre-line text-amber-800 dark:text-amber-300">{selectedRequest.waitingForDetails}</p>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <Separator />
                      
                      <div>
                        <h3 className="text-sm font-medium mb-2">Notes</h3>
                        <Textarea
                          placeholder="Add notes about this request..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows={4}
                        />
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <div className="space-x-2">
                        {selectedRequest.status === "new" && (
                          <Button
                            variant="default"
                            onClick={() => handleStatusChange(selectedRequest.id, "in_progress")}
                            disabled={updateMutation.isPending}
                          >
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Start Consultation
                          </Button>
                        )}
                        
                        {(selectedRequest.status === "new" || selectedRequest.status === "in_progress") && (
                          <Button
                            variant="default"
                            onClick={() => handleStatusChange(selectedRequest.id, "completed")}
                            disabled={updateMutation.isPending}
                          >
                            <FileCheck className="mr-2 h-4 w-4" />
                            Mark as Completed
                          </Button>
                        )}
                      </div>
                      
                      <div>
                        {selectedRequest.status !== "cancelled" && (
                          <Button
                            variant="outline"
                            onClick={() => handleStatusChange(selectedRequest.id, "cancelled")}
                            disabled={updateMutation.isPending}
                          >
                            Cancel Request
                          </Button>
                        )}
                      </div>
                    </CardFooter>
                  </Card>
                ) : (
                  <Card>
                    <div className="flex flex-col items-center justify-center p-12 text-center">
                      <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium">No request selected</h3>
                      <p className="text-muted-foreground max-w-md mt-2">
                        Select a request from the list to view details and manage the patient's urgent care needs.
                      </p>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}