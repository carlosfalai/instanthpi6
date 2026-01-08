import React, { useState } from "react";
import ModernLayout from "@/components/layout/ModernLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Search, Mail, Trash2, Edit, MoveUp, AlertTriangle } from "lucide-react";
import { Separator } from "@/components/ui/separator";

// Mock data for teammates
const initialTeammates = [
  {
    id: 1,
    name: "Dr. Carlos Font",
    email: "carlos.font@centremfont.com",
    role: "Admin",
    department: "Family Medicine",
    status: "Active",
    avatar: null,
  },
  {
    id: 2,
    name: "Dr. Sonia Font del Pino",
    email: "sonia.font@centremfont.com",
    role: "Doctor",
    department: "Anesthesiology",
    status: "Active",
    avatar: null,
  },
  {
    id: 3,
    name: "Mme Sonia Truchon",
    email: "sonia.truchon@centremfont.com",
    role: "Staff",
    department: "Marketing",
    status: "Invited",
    avatar: null,
  },
  {
    id: 4,
    name: "Dr. James Smith",
    email: "james.smith@centremfont.com",
    role: "Doctor",
    department: "General Practice",
    status: "Active",
    avatar: null,
  },
  {
    id: 5,
    name: "Marie Johnson",
    email: "marie.johnson@centremfont.com",
    role: "Nurse",
    department: "Family Medicine",
    status: "Active",
    avatar: null,
  },
];

export default function TeammatesPage() {
  const [teammates, setTeammates] = useState(initialTeammates);
  const [searchTerm, setSearchTerm] = useState("");
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentTeammate, setCurrentTeammate] = useState<any>(null);

  // Filter teammates based on search term
  const filteredTeammates = teammates.filter(
    (teammate) =>
      teammate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teammate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teammate.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle inviting a new teammate
  const handleInvite = (data: any) => {
    // In a real app, this would send an invitation and then add the user to the list
    const newTeammate = {
      id: teammates.length + 1,
      name: data.name,
      email: data.email,
      role: data.role,
      department: data.department,
      status: "Invited",
      avatar: null,
    };

    setTeammates([...teammates, newTeammate]);
    setInviteDialogOpen(false);
  };

  // Handle editing a teammate
  const handleEdit = (teammate: any) => {
    setCurrentTeammate(teammate);
    setEditDialogOpen(true);
  };

  // Handle saving edited teammate
  const handleSaveEdit = (data: any) => {
    const updatedTeammates = teammates.map((t) =>
      t.id === currentTeammate.id ? { ...t, ...data } : t
    );

    setTeammates(updatedTeammates);
    setEditDialogOpen(false);
    setCurrentTeammate(null);
  };

  // Handle deleting a teammate
  const handleDelete = (id: number) => {
    const updatedTeammates = teammates.filter((teammate) => teammate.id !== id);
    setTeammates(updatedTeammates);
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    let color = "";

    switch (status) {
      case "Active":
        color = "bg-green-500/20 text-green-500 border-green-500/20";
        break;
      case "Invited":
        color = "bg-yellow-500/20 text-yellow-500 border-yellow-500/20";
        break;
      case "Inactive":
        color = "bg-gray-500/20 text-gray-400 border-gray-500/20";
        break;
      default:
        color = "bg-blue-500/20 text-blue-500 border-blue-500/20";
    }

    return (
      <Badge variant="outline" className={`${color}`}>
        {status}
      </Badge>
    );
  };

  return (
    <ModernLayout title="Teammates" description="Manage your team and collaborators">
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Teammates</h1>
            <p className="text-gray-400 mt-1">Manage your team members and their permissions</p>
          </div>
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" /> Invite Teammate
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1e1e1e] border-[#333]">
              <DialogHeader>
                <DialogTitle>Invite New Teammate</DialogTitle>
                <DialogDescription>
                  Send an invitation to join your team. They'll receive an email with instructions.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" className="bg-[#252525] border-[#444]" placeholder="Full name" />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    className="bg-[#252525] border-[#444]"
                    placeholder="email@example.com"
                    type="email"
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select>
                    <SelectTrigger className="bg-[#252525] border-[#444]">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#252525] border-[#444]">
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="doctor">Doctor</SelectItem>
                      <SelectItem value="nurse">Nurse</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    className="bg-[#252525] border-[#444]"
                    placeholder="e.g., Family Medicine"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() =>
                    handleInvite({
                      name: (document.getElementById("name") as HTMLInputElement).value,
                      email: (document.getElementById("email") as HTMLInputElement).value,
                      role: "Doctor", // This would be from the select in a real implementation
                      department: (document.getElementById("department") as HTMLInputElement).value,
                    })
                  }
                >
                  Send Invitation
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="bg-[#1e1e1e] border-[#333] mb-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Team Members</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search members..."
                  className="pl-10 py-1 h-9 bg-[#252525] border-[#444] rounded-md text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <CardDescription>{filteredTeammates.length} team members</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredTeammates.length > 0 ? (
                filteredTeammates.map((teammate) => (
                  <div
                    key={teammate.id}
                    className="flex items-center justify-between p-4 bg-[#252525] rounded-lg"
                  >
                    <div className="flex items-center">
                      <Avatar className="h-10 w-10 mr-4">
                        <AvatarImage src={teammate.avatar || ""} alt={teammate.name} />
                        <AvatarFallback className="bg-blue-700">
                          {teammate.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{teammate.name}</h3>
                        <div className="flex items-center text-gray-400 text-sm">
                          <Mail className="h-3 w-3 mr-1" />
                          {teammate.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right mr-4">
                        <div className="text-sm font-medium">{teammate.role}</div>
                        <div className="text-sm text-gray-400">{teammate.department}</div>
                      </div>
                      <StatusBadge status={teammate.status} />
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(teammate)}>
                          <Edit className="h-4 w-4 text-gray-400" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(teammate.id)}
                        >
                          <Trash2 className="h-4 w-4 text-gray-400" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <AlertTriangle className="h-10 w-10 text-gray-400 mb-4" />
                  <h3 className="text-xl font-medium mb-2">No results found</h3>
                  <p className="text-gray-400 text-center">
                    No team members match your search criteria. Try different keywords or invite a
                    new teammate.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1e1e1e] border-[#333]">
          <CardHeader>
            <CardTitle>User Permissions</CardTitle>
            <CardDescription>Configure default permissions for each user role</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Admin</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="admin-all-access">Full access to all features</Label>
                    <Switch id="admin-all-access" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="admin-billing">Manage billing and payments</Label>
                    <Switch id="admin-billing" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="admin-team">Invite and remove team members</Label>
                    <Switch id="admin-team" defaultChecked />
                  </div>
                </div>
              </div>

              <Separator className="my-6 bg-[#333]" />

              <div>
                <h3 className="text-lg font-medium mb-4">Doctor</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="doctor-patients">Manage patients</Label>
                    <Switch id="doctor-patients" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="doctor-prescriptions">Write prescriptions</Label>
                    <Switch id="doctor-prescriptions" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="doctor-billing">Update billing codes</Label>
                    <Switch id="doctor-billing" defaultChecked />
                  </div>
                </div>
              </div>

              <Separator className="my-6 bg-[#333]" />

              <div>
                <h3 className="text-lg font-medium mb-4">Nurse</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="nurse-patients">View patients</Label>
                    <Switch id="nurse-patients" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="nurse-vitals">Record vitals</Label>
                    <Switch id="nurse-vitals" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="nurse-prescriptions">View prescriptions</Label>
                    <Switch id="nurse-prescriptions" defaultChecked />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="bg-[#1e1e1e] border-[#333]">
            <DialogHeader>
              <DialogTitle>Edit Team Member</DialogTitle>
              <DialogDescription>Update team member information and permissions</DialogDescription>
            </DialogHeader>
            {currentTeammate && (
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    className="bg-[#252525] border-[#444]"
                    defaultValue={currentTeammate.name}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    className="bg-[#252525] border-[#444]"
                    defaultValue={currentTeammate.email}
                    type="email"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-role">Role</Label>
                  <Select defaultValue={currentTeammate.role.toLowerCase()}>
                    <SelectTrigger className="bg-[#252525] border-[#444]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#252525] border-[#444]">
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="doctor">Doctor</SelectItem>
                      <SelectItem value="nurse">Nurse</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-department">Department</Label>
                  <Input
                    id="edit-department"
                    className="bg-[#252525] border-[#444]"
                    defaultValue={currentTeammate.department}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-status">Status</Label>
                  <Select defaultValue={currentTeammate.status.toLowerCase()}>
                    <SelectTrigger className="bg-[#252525] border-[#444]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#252525] border-[#444]">
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="invited">Invited</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() =>
                  handleSaveEdit({
                    name: (document.getElementById("edit-name") as HTMLInputElement).value,
                    email: (document.getElementById("edit-email") as HTMLInputElement).value,
                    department: (document.getElementById("edit-department") as HTMLInputElement)
                      .value,
                    // Role and status would come from the select in a real implementation
                  })
                }
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ModernLayout>
  );
}
