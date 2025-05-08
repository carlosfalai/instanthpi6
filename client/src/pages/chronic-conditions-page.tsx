import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import AppLayoutSpruce from '@/components/layout/AppLayoutSpruce';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface ChronicCondition {
  id: string;
  patientId: number;
  condition: string;
  diagnosisDate: string;
  status: 'active' | 'remission' | 'resolved';
  provider: string;
  notes: string;
  lastUpdated: string;
}

export default function ChronicConditionsPage() {
  const { toast } = useToast();
  
  // Fetch chronic conditions from the API
  const { data: conditions, isLoading, error, refetch } = useQuery<ChronicCondition[]>({
    queryKey: ['/api/conditions'],
    queryFn: async () => {
      // For now, return mock data since we don't have this API endpoint yet
      // This will be replaced with real API call once the endpoint is ready
      return [];
    }
  });

  // Calculate statistics for the dashboard
  const activeConditions = conditions?.filter(c => c.status === 'active').length || 0;
  const inRemission = conditions?.filter(c => c.status === 'remission').length || 0;
  const resolved = conditions?.filter(c => c.status === 'resolved').length || 0;
  
  return (
    <AppLayoutSpruce>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Chronic Conditions</h1>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load chronic conditions. Please try again.
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-2" 
                onClick={() => refetch()}
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {/* Dashboard summary cards */}
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium">Active Conditions</CardTitle>
                  <CardDescription>Conditions requiring ongoing care</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{activeConditions}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium">In Remission</CardTitle>
                  <CardDescription>Conditions currently controlled</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-amber-500">{inRemission}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium">Resolved</CardTitle>
                  <CardDescription>Previously managed conditions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-emerald-600">{resolved}</div>
                </CardContent>
              </Card>
            </div>
            
            {/* Tabs for different condition views */}
            <Tabs defaultValue="all">
              <TabsList className="mb-6">
                <TabsTrigger value="all">All Conditions</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="remission">In Remission</TabsTrigger>
                <TabsTrigger value="resolved">Resolved</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="mt-0">
                <ConditionsTable conditions={conditions || []} />
              </TabsContent>
              
              <TabsContent value="active" className="mt-0">
                <ConditionsTable 
                  conditions={(conditions || []).filter(c => c.status === 'active')} 
                />
              </TabsContent>
              
              <TabsContent value="remission" className="mt-0">
                <ConditionsTable 
                  conditions={(conditions || []).filter(c => c.status === 'remission')} 
                />
              </TabsContent>
              
              <TabsContent value="resolved" className="mt-0">
                <ConditionsTable 
                  conditions={(conditions || []).filter(c => c.status === 'resolved')} 
                />
              </TabsContent>
            </Tabs>
            
            {conditions?.length === 0 && (
              <Card className="mt-6">
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <h3 className="text-lg font-medium mb-2">No chronic conditions found</h3>
                    <p className="text-gray-500 mb-4">
                      This page will be populated with chronic condition data as patients are added to the system.
                    </p>
                    <Button 
                      onClick={() => {
                        toast({
                          title: "Feature Coming Soon",
                          description: "The ability to manually add chronic conditions will be available in a future update."
                        });
                      }}
                    >
                      Add Condition
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </AppLayoutSpruce>
  );
}

function ConditionsTable({ conditions }: { conditions: ChronicCondition[] }) {
  if (conditions.length === 0) {
    return null;
  }
  
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Condition</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Diagnosis Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {conditions.map((condition) => (
              <TableRow key={condition.id}>
                <TableCell className="font-medium">{condition.condition}</TableCell>
                <TableCell>Patient ID: {condition.patientId}</TableCell>
                <TableCell>{new Date(condition.diagnosisDate).toLocaleDateString()}</TableCell>
                <TableCell>
                  <StatusBadge status={condition.status} />
                </TableCell>
                <TableCell>{condition.provider}</TableCell>
                <TableCell>{new Date(condition.lastUpdated).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">View</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: 'active' | 'remission' | 'resolved' }) {
  const getStatusStyles = () => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'remission':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'resolved':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyles()}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}