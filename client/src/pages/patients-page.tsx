import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, User, Search, RefreshCw, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/use-debounce';
import AppLayoutSpruce from '@/components/layout/AppLayoutSpruce';

interface Patient {
  id: number;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  language: 'english' | 'french' | null;
  spruceId?: string | null;
}

export default function PatientsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  
  // Refresh patients data mutation
  const refreshPatientsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/spruce/refresh-patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to refresh patient data');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate queries to force a refetch
      queryClient.invalidateQueries({ queryKey: ['/api/spruce/search-patients'] });
      
      toast({
        title: 'Patient data refreshed',
        description: `Successfully refreshed ${data.count} patients from Spruce API.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Refresh failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Using the Spruce API for patient data
  const { 
    data: patientsResponse = { patients: [], source: 'spruce' }, 
    isLoading,
    error
  } = useQuery({
    queryKey: ['/api/spruce/search-patients', debouncedSearchTerm],
    queryFn: async () => {
      let url = '/api/spruce/search-patients';
      
      // Add query parameter if available
      if (debouncedSearchTerm) {
        url += `?query=${encodeURIComponent(debouncedSearchTerm)}`;
      }
      
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error('Failed to fetch patients');
      }
      
      return res.json();
    }
  });
  
  // Show error toast if patient fetching fails
  React.useEffect(() => {
    if (error) {
      toast({
        title: "Error loading patients",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  }, [error, toast]);
  
  // Extract patients array from response
  const filteredPatients = patientsResponse.patients || [];
  
  // Generate initials for patient avatars
  const getInitials = (name: string) => {
    if (!name || name === 'Unknown Name') return '??';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };
  
  // Get random color for patient avatars
  const getAvatarColor = (patientId: number) => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-red-500'];
    return colors[patientId % colors.length];
  };
  
  // Format date for display
  const formatDate = (date: string | null) => {
    if (!date) return '';
    const today = new Date().toDateString();
    const messageDate = new Date(date);
    
    if (messageDate.toDateString() === today) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return messageDate.toLocaleDateString([], { month: 'numeric', day: 'numeric', year: 'numeric' });
    }
  };
  
  // Handle patient selection and fetch their messages
  const [patientMessages, setPatientMessages] = useState<any[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  
  const handlePatientSelect = async (patient: Patient) => {
    setSelectedPatient(patient);
    
    if (patient && patient.id) {
      setIsLoadingMessages(true);
      try {
        // Use the spruceId if available, otherwise use regular id
        const patientIdForApi = patient.spruceId || `entity_${patient.id}`;
        const response = await fetch(`/api/spruce/patients/${patientIdForApi}/messages`);
        if (!response.ok) {
          throw new Error('Failed to fetch patient messages');
        }
        const messages = await response.json();
        setPatientMessages(messages);
      } catch (error) {
        console.error('Error fetching patient messages:', error);
        toast({
          title: 'Error fetching messages',
          description: 'Could not load conversation history.',
          variant: 'destructive'
        });
        setPatientMessages([]);
      } finally {
        setIsLoadingMessages(false);
      }
    }
  };
  
  return (
    <AppLayoutSpruce>
      <div className="flex h-full bg-[#121212] overflow-hidden">
        {/* Left column - Patient Details (moved from right) */}
        <div className="hidden md:block md:w-1/4 border-r border-[#333] bg-[#1a1a1a]">
          <div className="p-4 border-b border-[#333]">
            <h2 className="text-xl font-bold">Patient Orders & Commands</h2>
          </div>
          {selectedPatient ? (
            <div className="p-4">
              <div className="mb-6">
                <h3 className="text-md font-semibold mb-2 text-white">Contact Information</h3>
                <div className="space-y-2 text-sm text-gray-400">
                  <p><span className="text-gray-500">Name:</span> {selectedPatient.name}</p>
                  {selectedPatient.phone && (
                    <p><span className="text-gray-500">Phone:</span> {selectedPatient.phone}</p>
                  )}
                  {selectedPatient.email && (
                    <p><span className="text-gray-500">Email:</span> {selectedPatient.email}</p>
                  )}
                  <p>
                    <span className="text-gray-500">Gender:</span> {selectedPatient.gender}
                  </p>
                  {selectedPatient.language && (
                    <p><span className="text-gray-500">Language:</span> {selectedPatient.language}</p>
                  )}
                </div>
              </div>
              
              {/* Command Input Section */}
              <div className="mb-6">
                <h3 className="text-md font-semibold mb-2 text-white">AI Commands</h3>
                <div className="space-y-3">
                  <Button className="w-full justify-between" variant="outline">
                    <span>Generate RAMQ Request</span>
                    <span>→</span>
                  </Button>
                  <Button className="w-full justify-between" variant="outline">
                    <span>Create Prescription</span>
                    <span>→</span>
                  </Button>
                  <Button className="w-full justify-between" variant="outline">
                    <span>Draft Medical Note</span>
                    <span>→</span>
                  </Button>
                  <Button className="w-full justify-between" variant="outline">
                    <span>Schedule Follow-up</span>
                    <span>→</span>
                  </Button>
                </div>
                
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-white mb-2">Custom Command</h4>
                  <div className="flex items-start">
                    <Input 
                      placeholder="Type command for AI..." 
                      className="flex-1 bg-[#252525] border-[#444] text-white" 
                    />
                    <Button className="ml-2 bg-blue-600 hover:bg-blue-700">Send</Button>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-md font-semibold mb-2 text-white">Recent Communications</h3>
                <div className="bg-[#252525] rounded-md p-3 text-sm text-gray-400">
                  <p>No recent communications</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4">
              <p className="text-gray-400">Select a patient to view details</p>
            </div>
          )}
        </div>
        
        {/* Middle column - AI Processing (renamed from Pending Actions) */}
        <div className="hidden md:block md:w-2/4 border-r border-[#333] bg-[#1a1a1a] flex flex-col">
          <div className="p-4 border-b border-[#333] flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">AI Processing</h2>
              <Button 
                variant="outline" 
                size="sm"
                className="text-blue-400 border-blue-400 hover:bg-blue-900/20"
              >
                Add Task
              </Button>
            </div>
            
            {/* AI Controls Section */}
            <div className="bg-[#1e1e1e] border border-[#333] rounded-md p-3">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium text-white">AI Processing Controls</h3>
                <Badge className="bg-green-600 text-white">Active</Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <Button size="sm" variant="outline" className="w-full text-xs font-normal justify-start">
                  <span className="h-2 w-2 rounded-full bg-blue-500 mr-2"></span>
                  ChatGPT API
                </Button>
                <Button size="sm" variant="outline" className="w-full text-xs font-normal justify-start">
                  <span className="h-2 w-2 rounded-full bg-yellow-500 mr-2"></span>
                  FormSite Data
                </Button>
                <Button size="sm" variant="outline" className="w-full text-xs font-normal justify-start">
                  <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                  Spruce API
                </Button>
              </div>
              <div className="flex mt-2">
                <Button size="sm" variant="secondary" className="text-xs w-full">
                  Manage AI Settings
                </Button>
              </div>
            </div>
          </div>
          
          {selectedPatient ? (
            <div className="flex-1 flex flex-col">
              {/* Pending Items Section */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  <div className="bg-[#222] p-4 rounded-md border border-[#333]">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-white">Waiting for RAMQ card photo</h3>
                      <Badge className="bg-yellow-600 text-white">Pending</Badge>
                    </div>
                    <p className="text-sm text-gray-400 mb-2">Patient needs to send a photo of their RAMQ health insurance card for verification.</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Requested: May 15, 2025</span>
                      <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300">Send Reminder</Button>
                    </div>
                  </div>
                  
                  <div className="bg-[#222] p-4 rounded-md border border-[#333]">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-white">Prescription approval needed</h3>
                      <Badge className="bg-red-600 text-white">Urgent</Badge>
                    </div>
                    <p className="text-sm text-gray-400 mb-2">Patient requests refill for hypertension medication. Needs your approval.</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Requested: May 20, 2025</span>
                      <div className="space-x-2">
                        <Button variant="ghost" size="sm" className="text-green-400 hover:text-green-300">Approve</Button>
                        <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300">Deny</Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-[#222] p-4 rounded-md border border-[#333]">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-white">Lab results review</h3>
                      <Badge className="bg-blue-600 text-white">In Progress</Badge>
                    </div>
                    <p className="text-sm text-gray-400 mb-2">Blood work results received. Review and communicate findings to patient.</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Received: May 18, 2025</span>
                      <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300">View Results</Button>
                    </div>
                  </div>
                  
                  <div className="bg-[#222] p-4 rounded-md border border-[#333]">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-white">Medical note requested</h3>
                      <Badge className="bg-purple-600 text-white">To Do</Badge>
                    </div>
                    <p className="text-sm text-gray-400 mb-2">Patient needs a doctor's note for work absence due to recent illness.</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Requested: May 19, 2025</span>
                      <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300">Generate Note</Button>
                    </div>
                  </div>
                  
                  <div className="bg-[#222] p-4 rounded-md border border-[#333]">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-white">Treatment follow-up</h3>
                      <Badge className="bg-green-600 text-white">Scheduled</Badge>
                    </div>
                    <p className="text-sm text-gray-400 mb-2">Follow-up scheduled for antibiotic treatment. Check patient progress.</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Due: May 23, 2025</span>
                      <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300">Reschedule</Button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Chat Preview Section */}
              <div className="border-t border-[#333] p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium text-white">Recent Conversation</h3>
                  <Button 
                    variant="link" 
                    className="text-blue-400 hover:text-blue-300 p-0 h-auto"
                    onClick={() => {
                      // Code to switch to full conversation view
                    }}
                  >
                    View Full
                  </Button>
                </div>
                
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center h-24">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                  </div>
                ) : patientMessages.length > 0 ? (
                  <div className="space-y-3 max-h-48 overflow-y-auto border border-[#333] rounded-md p-3 bg-[#1e1e1e]">
                    {patientMessages.slice(-3).map((message) => (
                      <div key={message.id} className="flex items-start">
                        {message.isFromPatient ? (
                          <div className={`flex-shrink-0 w-6 h-6 rounded-full ${getAvatarColor(selectedPatient.id)} flex items-center justify-center mr-2`}>
                            <span className="font-medium text-white text-xs">{getInitials(selectedPatient.name)}</span>
                          </div>
                        ) : (
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-700 flex items-center justify-center mr-2">
                            <span className="font-medium text-white text-xs">Dr</span>
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <span className="text-xs font-medium text-white">{message.isFromPatient ? selectedPatient.name : 'You'}</span>
                            <span className="text-xs text-gray-500">{formatDate(message.timestamp)}</span>
                          </div>
                          <p className="text-xs text-gray-300">{message.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-24 text-gray-500 border border-[#333] rounded-md">
                    <p>No recent messages</p>
                  </div>
                )}
                
                {/* Quick Reply */}
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (!newMessage.trim() || !selectedPatient) return;
                  
                  try {
                    const response = await fetch(`/api/spruce/patients/${selectedPatient.id}/messages`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({
                        content: newMessage,
                        patientId: selectedPatient.id
                      })
                    });
                    
                    if (!response.ok) {
                      throw new Error('Failed to send message');
                    }
                    
                    // Add message to UI immediately
                    const newMessageObj = {
                      id: `temp-${Date.now()}`,
                      content: newMessage,
                      timestamp: new Date().toISOString(),
                      isFromPatient: false,
                      sender: 'Doctor',
                      patientId: selectedPatient.id
                    };
                    
                    setPatientMessages([...patientMessages, newMessageObj]);
                    setNewMessage('');
                    
                    // Fetch updated messages after sending
                    handlePatientSelect(selectedPatient);
                    
                  } catch (error) {
                    console.error('Error sending message:', error);
                    toast({
                      title: 'Error sending message',
                      description: 'Your message could not be sent.',
                      variant: 'destructive'
                    });
                  }
                }}>
                  <div className="flex items-center mt-3">
                    <Input 
                      type="text" 
                      placeholder="Type a quick message..." 
                      className="bg-[#252525] border-[#444] text-white flex-1 text-sm h-9"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <Button 
                      type="submit" 
                      className="ml-2 bg-blue-600 hover:bg-blue-700 h-9"
                      disabled={!newMessage.trim()}
                      size="sm"
                    >
                      Send
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="p-4 text-gray-400">
              <p>Select a patient to view AI processing</p>
            </div>
          )}
        </div>
        
        {/* Right column - Patient List (moved from left) */}
        <div className="w-full md:w-1/4 border-l border-[#333] flex flex-col bg-[#1a1a1a] overflow-hidden">
          <div className="flex flex-col h-full">
            {/* Top half - Patient list */}
            <div className="flex flex-col h-1/2 overflow-hidden">
              {/* Patient List Header */}
              <div className="p-3 border-b border-[#333] flex items-center justify-between">
                <div className="flex items-center">
                  <h2 className="font-semibold text-white">All Patients</h2>
                  <ChevronDown className="ml-1 h-4 w-4 text-gray-400" />
                </div>
                <div className="flex items-center">
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => refreshPatientsMutation.mutate()}
                    disabled={refreshPatientsMutation.isPending}
                    className="mr-2"
                  >
                    <RefreshCw className={`h-4 w-4 mr-1 ${refreshPatientsMutation.isPending ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    size="sm"
                  >
                    Add Patient
                  </Button>
                </div>
              </div>
              
              {/* Search Box */}
              <div className="p-3 border-b border-[#333]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input 
                    type="text"
                    placeholder="Search patients..." 
                    className="pl-10 bg-[#252525] border-[#444] text-white w-full"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              {/* Patient List - Spruce Style */}
              <div className="overflow-y-auto flex-grow">
                {isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                  </div>
                ) : filteredPatients.length > 0 ? (
                  <div>
                    {filteredPatients.map((patient: Patient) => (
                      <div 
                        key={patient.id}
                        className={`border-b border-[#333] hover:bg-[#252525] cursor-pointer transition-colors
                          ${selectedPatient?.id === patient.id ? 'bg-[#2a2a2a]' : ''}`}
                        onClick={() => handlePatientSelect(patient)}
                      >
                        <div className="p-3 flex items-start">
                          {/* Patient Avatar */}
                          <div className={`flex-shrink-0 w-10 h-10 rounded-full ${getAvatarColor(patient.id)} flex items-center justify-center mr-3`}>
                            <span className="font-medium text-white">{getInitials(patient.name)}</span>
                          </div>
                          
                          {/* Patient Info */}
                          <div className="flex-grow min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium text-white truncate">{patient.name}</h3>
                              <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                                {formatDate(new Date().toISOString())}
                              </span>
                            </div>
                            <p className="text-sm text-gray-400 truncate">
                              {patient.gender === 'male' ? 'Male' : 
                              patient.gender === 'female' ? 'Female' : 'Unknown gender'}
                              {patient.phone ? ` • ${patient.phone}` : ''}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    No patients found
                  </div>
                )}
              </div>
            </div>
            
            {/* Bottom half - Conversation history */}
            <div className="h-1/2 border-t border-[#333] flex flex-col overflow-hidden">
              <div className="p-3 border-b border-[#333] flex items-center justify-between">
                <h2 className="font-semibold text-white">Conversation History</h2>
              </div>
              <div className="overflow-y-auto flex-grow p-3">
                {!selectedPatient ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <p>Select a patient to view conversations</p>
                  </div>
                ) : isLoadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                  </div>
                ) : patientMessages.length > 0 ? (
                  <div className="space-y-3">
                    {patientMessages.map((message) => (
                      <div key={message.id} className="border-b border-[#333] pb-2 mb-2 last:border-b-0 last:mb-0 last:pb-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center">
                            {message.isFromPatient ? (
                              <div className={`flex-shrink-0 w-6 h-6 rounded-full ${getAvatarColor(selectedPatient.id)} flex items-center justify-center mr-2`}>
                                <span className="font-medium text-white text-xs">{getInitials(selectedPatient.name)}</span>
                              </div>
                            ) : (
                              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-700 flex items-center justify-center mr-2">
                                <span className="font-medium text-white text-xs">Dr</span>
                              </div>
                            )}
                            <span className="text-sm font-medium text-white">{message.isFromPatient ? selectedPatient.name : 'You'}</span>
                          </div>
                          <span className="text-xs text-gray-500">{formatDate(message.timestamp)}</span>
                        </div>
                        <p className="text-sm text-gray-300 pl-8">{message.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <p>No conversation history available</p>
                  </div>
                )}
              </div>
              
              {/* Quick message input for the conversation */}
              {selectedPatient && (
                <div className="p-3 border-t border-[#333]">
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    if (!newMessage.trim() || !selectedPatient) return;
                    
                    try {
                      const response = await fetch(`/api/spruce/patients/${selectedPatient.id}/messages`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                          content: newMessage,
                          patientId: selectedPatient.id
                        })
                      });
                      
                      if (!response.ok) {
                        throw new Error('Failed to send message');
                      }
                      
                      // Add message to UI immediately
                      const newMessageObj = {
                        id: `temp-${Date.now()}`,
                        content: newMessage,
                        timestamp: new Date().toISOString(),
                        isFromPatient: false,
                        sender: 'Doctor',
                        patientId: selectedPatient.id
                      };
                      
                      setPatientMessages([...patientMessages, newMessageObj]);
                      setNewMessage('');
                      
                    } catch (error) {
                      console.error('Error sending message:', error);
                      toast({
                        title: 'Error sending message',
                        description: 'Your message could not be sent.',
                        variant: 'destructive'
                      });
                    }
                  }}>
                    <div className="flex items-center">
                      <Input 
                        type="text" 
                        placeholder="Type a message..." 
                        className="bg-[#252525] border-[#444] text-white flex-1 text-sm h-8"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                      />
                      <Button 
                        type="submit" 
                        className="ml-2 bg-blue-600 hover:bg-blue-700 h-8 px-3"
                        disabled={!newMessage.trim()}
                        size="sm"
                      >
                        Send
                      </Button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayoutSpruce>
  );
}