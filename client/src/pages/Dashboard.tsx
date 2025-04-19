import { useState } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import Sidebar from '@/components/layout/Sidebar';
import Navbar from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarDays, Clock, UserRound, Users } from 'lucide-react';

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: patients, isLoading } = useQuery({
    queryKey: ['/api/patients'],
  });
  
  const filteredPatients = patients ? patients.filter(
    patient => patient.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <Navbar onSearch={(query) => setSearchQuery(query)} />
        
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
            </div>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {/* Stats Section */}
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardContent className="p-6 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Patients</p>
                      <p className="text-3xl font-semibold text-gray-900">
                        {isLoading ? <Skeleton className="h-9 w-16" /> : patients?.length || 0}
                      </p>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-full">
                      <Users className="h-6 w-6 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Today's Consultations</p>
                      <p className="text-3xl font-semibold text-gray-900">5</p>
                    </div>
                    <div className="bg-emerald-100 p-3 rounded-full">
                      <CalendarDays className="h-6 w-6 text-emerald-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Pending Messages</p>
                      <p className="text-3xl font-semibold text-gray-900">12</p>
                    </div>
                    <div className="bg-amber-100 p-3 rounded-full">
                      <Clock className="h-6 w-6 text-amber-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-500">New Patients</p>
                      <p className="text-3xl font-semibold text-gray-900">3</p>
                    </div>
                    <div className="bg-indigo-100 p-3 rounded-full">
                      <UserRound className="h-6 w-6 text-indigo-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Patient List */}
              <div className="mt-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Patients</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="flex items-center space-x-4">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="space-y-2">
                              <Skeleton className="h-4 w-[250px]" />
                              <Skeleton className="h-4 w-[200px]" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="divide-y">
                        {filteredPatients.map((patient) => (
                          <div key={patient.id} className="py-4 flex items-center justify-between">
                            <div className="flex items-center">
                              <img 
                                src={patient.avatarUrl} 
                                alt={patient.name} 
                                className="h-10 w-10 rounded-full mr-4"
                              />
                              <div>
                                <h3 className="text-sm font-medium">{patient.name}</h3>
                                <p className="text-xs text-gray-500">
                                  {patient.gender}, Last Visit: {new Date(patient.lastVisit).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                3 Messages
                              </Badge>
                              <Link href={`/patient/${patient.id}`}>
                                <Button size="sm" variant="outline">
                                  Consult
                                </Button>
                              </Link>
                            </div>
                          </div>
                        ))}
                        
                        {filteredPatients.length === 0 && (
                          <div className="py-6 text-center text-gray-500">
                            No patients found matching your search.
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
