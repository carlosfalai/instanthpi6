import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Loader2, AlertTriangle, Clock, User, Phone, MapPin, Search, Filter, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

import AppLayoutSpruce from '@/components/layout/AppLayoutSpruce';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

// Types
interface UrgentCarePatient {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  phone: string;
  address: string;
  chiefComplaint: string;
  symptoms: string[];
  vitalSigns: {
    temperature?: number;
    bloodPressure?: string;
    heartRate?: number;
    respiratoryRate?: number;
    oxygenSaturation?: number;
  };
  triageLevel: 1 | 2 | 3 | 4 | 5; // 1 = Critical, 5 = Non-urgent
  arrivalTime: string;
  status: 'waiting' | 'in_progress' | 'completed' | 'discharged';
  assignedProvider?: string;
  estimatedWaitTime?: number;
  notes?: string;
}

const UrgentCarePage: React.FC = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<UrgentCarePatient | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterTriage, setFilterTriage] = useState<string>('all');

  // Fetch urgent care patients
  const {
    data: patients = [],
    isLoading,
    error,
    refetch
  } = useQuery<UrgentCarePatient[]>({
    queryKey: ['/api/urgent-care/patients'],
    queryFn: async () => {
      // Use authentic data from your API - replace with actual endpoint when available
      const response = await fetch('/api/urgent-care/patients');
      if (!response.ok) {
        throw new Error('Failed to fetch urgent care patients');
      }
      return await response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Update patient status mutation
  const updatePatientMutation = useMutation({
    mutationFn: async ({ 
      patientId, 
      status, 
      assignedProvider,
      notes 
    }: { 
      patientId: string; 
      status: UrgentCarePatient['status']; 
      assignedProvider?: string;
      notes?: string;
    }) => {
      const response = await fetch(`/api/urgent-care/patients/${patientId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, assignedProvider, notes }),
      });
      
      if (!response.ok) throw new Error('Failed to update patient');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/urgent-care/patients'] });
      toast({
        title: 'Patient updated',
        description: 'Patient status has been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Get triage level badge
  const getTriageBadge = (level: number) => {
    switch (level) {
      case 1:
        return <Badge variant="destructive" className="bg-red-600">Critical</Badge>;
      case 2:
        return <Badge variant="destructive" className="bg-orange-600">Urgent</Badge>;
      case 3:
        return <Badge variant="outline" className="bg-yellow-900/20 text-yellow-500 border-yellow-800">Semi-Urgent</Badge>;
      case 4:
        return <Badge variant="outline" className="bg-green-900/20 text-green-500 border-green-800">Less Urgent</Badge>;
      case 5:
        return <Badge variant="outline" className="bg-blue-900/20 text-blue-500 border-blue-800">Non-Urgent</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Get status badge
  const getStatusBadge = (status: UrgentCarePatient['status']) => {
    switch (status) {
      case 'waiting':
        return <Badge variant="outline" className="bg-yellow-900/20 text-yellow-500 border-yellow-800">Waiting</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-blue-900/20 text-blue-500 border-blue-800">In Progress</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-900/20 text-green-500 border-green-800">Completed</Badge>;
      case 'discharged':
        return <Badge variant="outline" className="bg-gray-900/20 text-gray-500 border-gray-800">Discharged</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Format time since arrival
  const getTimeSinceArrival = (arrivalTime: string) => {
    const arrival = new Date(arrivalTime);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - arrival.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else {
      const hours = Math.floor(diffInMinutes / 60);
      const minutes = diffInMinutes % 60;
      return `${hours}h ${minutes}m ago`;
    }
  };

  // Filter patients
  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         patient.chiefComplaint.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || patient.status === filterStatus;
    const matchesTriage = filterTriage === 'all' || patient.triageLevel.toString() === filterTriage;
    
    return matchesSearch && matchesStatus && matchesTriage;
  });

  // Sort patients by triage level (most urgent first) and arrival time
  const sortedPatients = [...filteredPatients].sort((a, b) => {
    if (a.triageLevel !== b.triageLevel) {
      return a.triageLevel - b.triageLevel;
    }
    return new Date(a.arrivalTime).getTime() - new Date(b.arrivalTime).getTime();
  });

  // Handle patient status update
  const handleStatusUpdate = (status: UrgentCarePatient['status'], assignedProvider?: string) => {
    if (!selectedPatient) return;
    
    updatePatientMutation.mutate({
      patientId: selectedPatient.id,
      status,
      assignedProvider
    });
  };

  if (error) {
    return (
      <AppLayoutSpruce>
        <div className="flex items-center justify-center min-h-[60vh] bg-[#121212] text-white">
          <div className="text-center text-red-400">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-3">Error Loading Urgent Care Data</h2>
            <p className="max-w-md mb-4">
              Unable to connect to the urgent care system. Please check your connection or contact support.
            </p>
            <Button onClick={() => refetch()} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </AppLayoutSpruce>
    );
  }

  return (
    <AppLayoutSpruce>
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center">
          <AlertTriangle className="h-6 w-6 mr-2 text-red-500" />
          <div>
            <h1 className="text-2xl font-bold">Urgent Care Dashboard</h1>
            <p className="text-gray-400">Real-time patient triage and management</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => refetch()}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button className="bg-red-600 hover:bg-red-700">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Emergency Alert
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-[#1A1A1A] border-[#333]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Patients</p>
                <p className="text-2xl font-bold">{patients.length}</p>
              </div>
              <User className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-[#1A1A1A] border-[#333]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Waiting</p>
                <p className="text-2xl font-bold text-yellow-500">
                  {patients.filter(p => p.status === 'waiting').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-[#1A1A1A] border-[#333]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Critical/Urgent</p>
                <p className="text-2xl font-bold text-red-500">
                  {patients.filter(p => p.triageLevel <= 2).length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-[#1A1A1A] border-[#333]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Avg Wait Time</p>
                <p className="text-2xl font-bold">
                  {Math.round(patients.reduce((acc, p) => acc + (p.estimatedWaitTime || 0), 0) / patients.length || 0)}m
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Patient Queue */}
        <div className="bg-[#1A1A1A] rounded-lg p-4 border border-[#333] h-[calc(100vh-300px)] flex flex-col">
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-3">Patient Queue</h2>
            
            {/* Search and Filters */}
            <div className="space-y-3">
              <div className="relative">
                <Input
                  placeholder="Search patients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10 bg-[#252525] border-[#444]"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              </div>
              
              <div className="flex space-x-2">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="flex-1 bg-[#252525] border-[#444]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="waiting">Waiting</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="discharged">Discharged</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={filterTriage} onValueChange={setFilterTriage}>
                  <SelectTrigger className="flex-1 bg-[#252525] border-[#444]">
                    <SelectValue placeholder="Filter by triage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Triage</SelectItem>
                    <SelectItem value="1">Critical</SelectItem>
                    <SelectItem value="2">Urgent</SelectItem>
                    <SelectItem value="3">Semi-Urgent</SelectItem>
                    <SelectItem value="4">Less Urgent</SelectItem>
                    <SelectItem value="5">Non-Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Patient List */}
          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : sortedPatients.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No patients found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sortedPatients.map((patient) => (
                  <Card 
                    key={patient.id}
                    className={`cursor-pointer transition-colors border-[#333] ${
                      selectedPatient?.id === patient.id 
                        ? 'bg-[#2A2A2A] border-blue-500' 
                        : 'bg-[#222] hover:bg-[#2A2A2A]'
                    }`}
                    onClick={() => setSelectedPatient(patient)}
                  >
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-white">{patient.name}</h3>
                          <p className="text-sm text-gray-400">
                            {patient.age}y, {patient.gender}
                          </p>
                        </div>
                        <div className="flex space-x-1">
                          {getTriageBadge(patient.triageLevel)}
                          {getStatusBadge(patient.status)}
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-300 mb-2">
                        {patient.chiefComplaint}
                      </p>
                      
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>{getTimeSinceArrival(patient.arrivalTime)}</span>
                        {patient.estimatedWaitTime && (
                          <span>Est. wait: {patient.estimatedWaitTime}m</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Right Column - Patient Details */}
        <div className="bg-[#1A1A1A] rounded-lg p-4 border border-[#333] h-[calc(100vh-300px)] flex flex-col">
          {selectedPatient ? (
            <>
              <div className="mb-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-lg font-semibold">{selectedPatient.name}</h2>
                    <p className="text-gray-400">
                      {selectedPatient.age} years old, {selectedPatient.gender}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    {getTriageBadge(selectedPatient.triageLevel)}
                    {getStatusBadge(selectedPatient.status)}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex space-x-2 mb-4">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleStatusUpdate('in_progress', 'Dr. Font')}
                    disabled={updatePatientMutation.isPending}
                  >
                    Start Treatment
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleStatusUpdate('completed')}
                    disabled={updatePatientMutation.isPending}
                  >
                    Complete
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleStatusUpdate('discharged')}
                    disabled={updatePatientMutation.isPending}
                  >
                    Discharge
                  </Button>
                </div>
              </div>

              <ScrollArea className="flex-1">
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 bg-[#2A2A2A]">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="vitals">Vitals</TabsTrigger>
                    <TabsTrigger value="notes">Notes</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="space-y-4">
                    <Card className="bg-[#222] border-[#333]">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Chief Complaint</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-white">{selectedPatient.chiefComplaint}</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-[#222] border-[#333]">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Symptoms</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-1">
                          {selectedPatient.symptoms.map((symptom, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {symptom}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-[#222] border-[#333]">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Contact Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="text-sm">{selectedPatient.phone}</span>
                        </div>
                        <div className="flex items-start">
                          <MapPin className="h-4 w-4 mr-2 text-gray-400 mt-0.5" />
                          <span className="text-sm">{selectedPatient.address}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="vitals" className="space-y-4">
                    <Card className="bg-[#222] border-[#333]">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Vital Signs</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {selectedPatient.vitalSigns.temperature && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Temperature</span>
                            <span className="text-white">{selectedPatient.vitalSigns.temperature}°F</span>
                          </div>
                        )}
                        {selectedPatient.vitalSigns.bloodPressure && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Blood Pressure</span>
                            <span className="text-white">{selectedPatient.vitalSigns.bloodPressure}</span>
                          </div>
                        )}
                        {selectedPatient.vitalSigns.heartRate && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Heart Rate</span>
                            <span className="text-white">{selectedPatient.vitalSigns.heartRate} bpm</span>
                          </div>
                        )}
                        {selectedPatient.vitalSigns.respiratoryRate && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Respiratory Rate</span>
                            <span className="text-white">{selectedPatient.vitalSigns.respiratoryRate} /min</span>
                          </div>
                        )}
                        {selectedPatient.vitalSigns.oxygenSaturation && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">O2 Saturation</span>
                            <span className="text-white">{selectedPatient.vitalSigns.oxygenSaturation}%</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="notes" className="space-y-4">
                    <Card className="bg-[#222] border-[#333]">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Clinical Notes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {selectedPatient.notes ? (
                          <p className="text-white text-sm">{selectedPatient.notes}</p>
                        ) : (
                          <p className="text-gray-500 text-sm">No notes available</p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </ScrollArea>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a patient to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayoutSpruce>
  );
};

export default UrgentCarePage;