import React, { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Link } from 'wouter';
import { 
  ChevronLeft, 
  Users, 
  UserPlus, 
  Search,
  MoreHorizontal,
  Shield,
  Edit,
  Trash,
  Mail
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface TeammateProps {
  id: number;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  status: 'active' | 'pending' | 'inactive';
}

export default function TeammatesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [addTeammateOpen, setAddTeammateOpen] = useState(false);
  const [newTeammate, setNewTeammate] = useState({
    name: '',
    email: '',
    role: 'doctor',
  });
  const [teammates, setTeammates] = useState<TeammateProps[]>([
    {
      id: 1,
      name: 'Dr. Carlos Faviel Font',
      email: 'carlos.font@centremedicalfont.ca',
      role: 'admin',
      status: 'active',
    },
    {
      id: 2,
      name: 'Dr. Sonia Font del Pino',
      email: 'sonia.font@centremedicalfont.ca',
      role: 'doctor',
      status: 'active',
    },
    {
      id: 3,
      name: 'Mme. Sonia Truchon',
      email: 'sonia.truchon@centremedicalfont.ca',
      role: 'admin',
      status: 'active',
    },
    {
      id: 4,
      name: 'Dr. Dan Kogan',
      email: 'dan.kogan@centremedicalfont.ca',
      role: 'doctor',
      status: 'active',
    },
    {
      id: 5,
      name: 'Dr. Anna Kogan',
      email: 'anna.kogan@centremedicalfont.ca',
      role: 'doctor',
      status: 'pending',
    },
  ]);

  const handleAddTeammate = () => {
    const id = teammates.length + 1;
    setTeammates([
      ...teammates,
      {
        id,
        ...newTeammate,
        status: 'pending',
      }
    ]);
    setNewTeammate({
      name: '',
      email: '',
      role: 'doctor',
    });
    setAddTeammateOpen(false);
  };

  const filteredTeammates = teammates.filter(
    teammate => 
      teammate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teammate.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeClass = (role: string) => {
    switch(role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'doctor':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'nurse':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch(status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-5xl">
        {/* Back button and title */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Link href="/settings">
              <Button variant="ghost" size="sm" className="mr-2">
                <ChevronLeft className="h-4 w-4 mr-1" /> Back to Settings
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Teammates</h1>
          </div>
          <Dialog open={addTeammateOpen} onOpenChange={setAddTeammateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <UserPlus className="h-4 w-4 mr-2" /> Add Teammate
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1e1e1e] border-[#333]">
              <DialogHeader>
                <DialogTitle>Add New Teammate</DialogTitle>
                <DialogDescription>
                  Add a teammate to your organization. They will receive an email invitation.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    placeholder="Dr. Jane Smith"
                    value={newTeammate.name}
                    onChange={(e) => setNewTeammate({...newTeammate, name: e.target.value})}
                    className="bg-[#2a2a2a] border-[#444]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email"
                    placeholder="jane.smith@example.com"
                    value={newTeammate.email}
                    onChange={(e) => setNewTeammate({...newTeammate, email: e.target.value})}
                    className="bg-[#2a2a2a] border-[#444]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select 
                    value={newTeammate.role} 
                    onValueChange={(value) => setNewTeammate({...newTeammate, role: value})}
                  >
                    <SelectTrigger id="role" className="bg-[#2a2a2a] border-[#444]">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrator</SelectItem>
                      <SelectItem value="doctor">Doctor</SelectItem>
                      <SelectItem value="nurse">Nurse</SelectItem>
                      <SelectItem value="staff">Staff Member</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddTeammateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddTeammate} className="bg-blue-600 hover:bg-blue-700">
                  Send Invitation
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filters */}
        <Card className="bg-[#1e1e1e] border-[#333] mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input 
                  placeholder="Search teammates..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-[#2a2a2a] border-[#444] w-full"
                />
              </div>
              <Select defaultValue="all">
                <SelectTrigger className="w-full md:w-[180px] bg-[#2a2a2a] border-[#444]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="all">
                <SelectTrigger className="w-full md:w-[180px] bg-[#2a2a2a] border-[#444]">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="doctor">Doctor</SelectItem>
                  <SelectItem value="nurse">Nurse</SelectItem>
                  <SelectItem value="staff">Staff Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Teammates List */}
        <Card className="bg-[#1e1e1e] border-[#333]">
          <CardContent className="p-0">
            {filteredTeammates.length > 0 ? (
              <div className="divide-y divide-[#333]">
                {filteredTeammates.map((teammate) => (
                  <div key={teammate.id} className="p-4 flex items-center justify-between hover:bg-[#252525] transition-colors">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={teammate.avatarUrl} />
                        <AvatarFallback className="bg-blue-600 text-white">
                          {getInitials(teammate.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium text-white">{teammate.name}</h3>
                        <div className="flex items-center space-x-2 text-sm text-gray-400">
                          <Mail className="h-3 w-3" />
                          <span>{teammate.email}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeClass(teammate.role)}`}>
                        {teammate.role === 'admin' ? 'Administrator' : teammate.role.charAt(0).toUpperCase() + teammate.role.slice(1)}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(teammate.status)}`}>
                        {teammate.status.charAt(0).toUpperCase() + teammate.status.slice(1)}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#2a2a2a] border-[#444]">
                          <DropdownMenuItem className="cursor-pointer">
                            <Edit className="h-4 w-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer">
                            <Shield className="h-4 w-4 mr-2" /> Change Role
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer text-red-500">
                            <Trash className="h-4 w-4 mr-2" /> Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No teammates found</h3>
                <p className="text-gray-400 mb-4">
                  {searchTerm 
                    ? `No teammates match "${searchTerm}"`
                    : "You haven't added any teammates yet."}
                </p>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <UserPlus className="h-4 w-4 mr-2" /> Add Your First Teammate
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}