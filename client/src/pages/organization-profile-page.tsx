import React, { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Link } from 'wouter';
import { 
  ChevronLeft, 
  Building, 
  MapPin, 
  Clock, 
  Phone, 
  Globe, 
  Mail,
  Image,
  Save
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TimeSlot {
  day: string;
  open: string;
  close: string;
  enabled: boolean;
}

export default function OrganizationProfilePage() {
  const [organizationName, setOrganizationName] = useState('Centre Médical Font');
  const [description, setDescription] = useState('Centre Médical Font est une clinique médicale offrant des services de consultation médicale, de suivi de santé et de services spécialisés.');
  const [address, setAddress] = useState('123 Boulevard Taschereau, La Prairie, QC J5R 1V1');
  const [phone, setPhone] = useState('(450) 444-1234');
  const [email, setEmail] = useState('info@centremedicalfont.ca');
  const [website, setWebsite] = useState('https://www.centremedicalfont.ca');
  const [fax, setFax] = useState('(450) 444-5678');
  const [logo, setLogo] = useState<File | null>(null);
  const [timezone, setTimezone] = useState('America/Montreal');
  const [hours, setHours] = useState<TimeSlot[]>([
    { day: 'Monday', open: '09:00', close: '17:00', enabled: true },
    { day: 'Tuesday', open: '09:00', close: '17:00', enabled: true },
    { day: 'Wednesday', open: '09:00', close: '17:00', enabled: true },
    { day: 'Thursday', open: '09:00', close: '17:00', enabled: true },
    { day: 'Friday', open: '09:00', close: '17:00', enabled: true },
    { day: 'Saturday', open: '10:00', close: '14:00', enabled: false },
    { day: 'Sunday', open: '00:00', close: '00:00', enabled: false },
  ]);

  const handleHoursChange = (index: number, field: keyof TimeSlot, value: string | boolean) => {
    const newHours = [...hours];
    newHours[index] = { ...newHours[index], [field]: value };
    setHours(newHours);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLogo(e.target.files[0]);
    }
  };

  const handleSave = () => {
    // Save organization profile
    console.log('Saving organization profile');
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Back button and title */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Link href="/settings">
              <Button variant="ghost" size="sm" className="mr-2">
                <ChevronLeft className="h-4 w-4 mr-1" /> Back to Settings
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Organization Profile</h1>
          </div>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
            <Save className="h-4 w-4 mr-2" /> Save Changes
          </Button>
        </div>

        {/* Main content */}
        <div className="space-y-6">
          {/* Basic Info Card */}
          <Card className="bg-[#1e1e1e] border-[#333]">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="h-5 w-5 mr-2 text-blue-500" /> Basic Information
              </CardTitle>
              <CardDescription>
                This information will be displayed to patients when they view your organization profile.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="organizationName">Organization Name</Label>
                <Input 
                  id="organizationName" 
                  value={organizationName} 
                  onChange={(e) => setOrganizationName(e.target.value)} 
                  className="bg-[#2a2a2a] border-[#444]"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  className="bg-[#2a2a2a] border-[#444] min-h-[100px]"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="logo">Organization Logo</Label>
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-[#2a2a2a] border border-[#444] rounded-md flex items-center justify-center">
                    {logo ? (
                      <img 
                        src={URL.createObjectURL(logo)} 
                        alt="Logo" 
                        className="w-full h-full object-contain rounded-md" 
                      />
                    ) : (
                      <Image className="h-8 w-8 text-gray-500" />
                    )}
                  </div>
                  <Button variant="outline" className="relative overflow-hidden">
                    <input 
                      type="file" 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                      onChange={handleLogoChange}
                      accept="image/*"
                    />
                    Upload Logo
                  </Button>
                </div>
                <p className="text-sm text-gray-400">Recommended size: 512x512 pixels</p>
              </div>
            </CardContent>
          </Card>
          
          {/* Contact Information Card */}
          <Card className="bg-[#1e1e1e] border-[#333]">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Phone className="h-5 w-5 mr-2 text-blue-500" /> Contact Information
              </CardTitle>
              <CardDescription>
                Patients will use this information to contact your organization.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input 
                  id="address" 
                  value={address} 
                  onChange={(e) => setAddress(e.target.value)} 
                  className="bg-[#2a2a2a] border-[#444]"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    className="bg-[#2a2a2a] border-[#444]"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fax">Fax Number</Label>
                  <Input 
                    id="fax" 
                    value={fax} 
                    onChange={(e) => setFax(e.target.value)} 
                    className="bg-[#2a2a2a] border-[#444]"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email"
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="bg-[#2a2a2a] border-[#444]"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input 
                    id="website" 
                    value={website} 
                    onChange={(e) => setWebsite(e.target.value)} 
                    className="bg-[#2a2a2a] border-[#444]"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Hours of Operation Card */}
          <Card className="bg-[#1e1e1e] border-[#333]">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-blue-500" /> Hours of Operation
              </CardTitle>
              <CardDescription>
                Set your organization's business hours.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 mb-4">
                <Label htmlFor="timezone">Timezone</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger className="bg-[#2a2a2a] border-[#444]">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/Montreal">Eastern Time (Montreal)</SelectItem>
                    <SelectItem value="America/Toronto">Eastern Time (Toronto)</SelectItem>
                    <SelectItem value="America/New_York">Eastern Time (New York)</SelectItem>
                    <SelectItem value="America/Chicago">Central Time</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-4">
                {hours.map((slot, index) => (
                  <div key={slot.day} className="flex items-center space-x-4">
                    <div className="w-24">
                      <Label>{slot.day}</Label>
                    </div>
                    
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        checked={slot.enabled}
                        onChange={(e) => handleHoursChange(index, 'enabled', e.target.checked)}
                        className="mr-2 h-4 w-4"
                      />
                      <span className="text-sm text-gray-400">Open</span>
                    </div>
                    
                    {slot.enabled ? (
                      <>
                        <div className="flex-1">
                          <Input 
                            type="time" 
                            value={slot.open}
                            onChange={(e) => handleHoursChange(index, 'open', e.target.value)}
                            className="bg-[#2a2a2a] border-[#444]"
                          />
                        </div>
                        <span className="text-gray-400">to</span>
                        <div className="flex-1">
                          <Input 
                            type="time" 
                            value={slot.close}
                            onChange={(e) => handleHoursChange(index, 'close', e.target.value)}
                            className="bg-[#2a2a2a] border-[#444]"
                          />
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 text-gray-400 ml-4">Closed</div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}