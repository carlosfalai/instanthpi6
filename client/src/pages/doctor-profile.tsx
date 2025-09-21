import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  BookOpen,
  Settings,
  Camera,
  Edit3,
  Save,
  X,
  Shield,
  Clock,
  FileText,
  Users,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface DoctorProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  title: string;
  specialty: string;
  subSpecialty?: string;
  licenseNumber: string;
  licenseState: string;
  phoneNumber: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  medicalSchool: string;
  residency: string;
  fellowship?: string;
  boardCertifications: string[];
  languages: string[];
  hospitalAffiliations: string[];
  yearsExperience: number;
  bio: string;
  profileImageUrl?: string;
  workingHours: {
    monday: { start: string; end: string; available: boolean };
    tuesday: { start: string; end: string; available: boolean };
    wednesday: { start: string; end: string; available: boolean };
    thursday: { start: string; end: string; available: boolean };
    friday: { start: string; end: string; available: boolean };
    saturday: { start: string; end: string; available: boolean };
    sunday: { start: string; end: string; available: boolean };
  };
  preferences: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    autoAcceptConsults: boolean;
    allowTelemedicine: boolean;
    emergencyAvailable: boolean;
  };
}

export default function DoctorProfile() {
  const [, navigate] = useLocation();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [profile, setProfile] = useState<DoctorProfile>({
    id: "",
    email: "",
    firstName: "",
    lastName: "",
    title: "",
    specialty: "",
    subSpecialty: "",
    licenseNumber: "",
    licenseState: "",
    phoneNumber: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    medicalSchool: "",
    residency: "",
    fellowship: "",
    boardCertifications: [],
    languages: [],
    hospitalAffiliations: [],
    yearsExperience: 0,
    bio: "",
    workingHours: {
      monday: { start: "09:00", end: "17:00", available: true },
      tuesday: { start: "09:00", end: "17:00", available: true },
      wednesday: { start: "09:00", end: "17:00", available: true },
      thursday: { start: "09:00", end: "17:00", available: true },
      friday: { start: "09:00", end: "17:00", available: true },
      saturday: { start: "09:00", end: "13:00", available: false },
      sunday: { start: "09:00", end: "13:00", available: false },
    },
    preferences: {
      emailNotifications: true,
      smsNotifications: false,
      autoAcceptConsults: false,
      allowTelemedicine: false,
      emergencyAvailable: false,
    },
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load profile data on mount
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/doctor-login");
        return;
      }

      // Load from Supabase physician_profiles first
      const { data, error } = await supabase
        .from("physician_profiles")
        .select("email, specialty, profile_image_url, profile_data")
        .eq("physician_id", user.id)
        .limit(1);

      if (error) {
        console.warn("Supabase profile fetch error:", error.message);
      }

      const row = Array.isArray(data) && data.length > 0 ? data[0] : null;
      if (row && row.profile_data) {
        const db = row.profile_data as any;
        setProfile((prev) => ({
          ...prev,
          ...db,
          id: user.id,
          email: row.email ?? db.email ?? user.email ?? "",
          specialty: row.specialty ?? db.specialty ?? "",
          profileImageUrl: row.profile_image_url ?? db.profileImageUrl,
          firstName: db.firstName ?? user.user_metadata?.given_name ?? "",
          lastName: db.lastName ?? user.user_metadata?.family_name ?? "",
        }));
        return;
      }

      // Fallback: try local storage cache
      const savedProfile = localStorage.getItem(`doctor_profile_${user.id}`);
      if (savedProfile) {
        setProfile(JSON.parse(savedProfile));
      } else {
        setProfile((prev) => ({
          ...prev,
          id: user.id,
          email: user.email || "",
          firstName: user.user_metadata?.given_name || "",
          lastName: user.user_metadata?.family_name || "",
        }));
      }
    } catch (error: any) {
      console.error("Error loading profile:", error);
      setMessage("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/doctor-login");
        return;
      }

      // Persist to Supabase (upsert)
      const payload = {
        physician_id: user.id,
        email: profile.email,
        specialty: profile.specialty,
        profile_image_url: (profile as any).profileImageUrl || undefined,
        profile_data: profile,
      } as any;

      const { error } = await supabase
        .from("physician_profiles")
        .upsert(payload, { onConflict: "physician_id" });
      if (error) throw error;

      // Cache locally for offline
      localStorage.setItem(`doctor_profile_${user.id}`, JSON.stringify(profile));

      setEditing(false);
      setMessage("Profile updated successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error: any) {
      console.error(error);
      setMessage("Failed to update profile: " + (error?.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    loadProfile(); // Reset changes
  };

  const updateProfile = (field: keyof DoctorProfile, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const triggerImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage("Image too large (max 5MB)");
      return;
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/doctor-login");
        return;
      }
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const filePath = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const url = pub?.publicUrl;
      if (url) {
        setProfile(prev => ({ ...prev, profileImageUrl: url }));
        await supabase.from("physician_profiles").upsert({ physician_id: user.id, profile_image_url: url }, { onConflict: "physician_id" });
      }
      setMessage("Profile image updated");
      setTimeout(() => setMessage(""), 2000);
    } catch (err: any) {
      console.error(err);
      setMessage("Failed to upload image: " + (err?.message || ""));
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-lg">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/doctor-dashboard")}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">Doctor Profile</h1>
            </div>
            <div className="flex items-center gap-2">
              {editing ? (
                <>
                  <Button variant="outline" size="sm" onClick={handleCancel}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? "Saving..." : "Save Changes"}
                  </Button>
                </>
              ) : (
                <Button size="sm" onClick={() => setEditing(true)}>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && (
          <div className={`mb-6 p-4 rounded-md ${message.includes("success") ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
            {message}
          </div>
        )}

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white border">
            <TabsTrigger value="profile" className="data-[state=active]:bg-blue-50">Profile</TabsTrigger>
            <TabsTrigger value="credentials" className="data-[state=active]:bg-blue-50">Credentials</TabsTrigger>
            <TabsTrigger value="schedule" className="data-[state=active]:bg-blue-50">Schedule</TabsTrigger>
            <TabsTrigger value="preferences" className="data-[state=active]:bg-blue-50">Preferences</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Image & Basic Info */}
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col items-center">
                    <div className="relative">
                      {profile.profileImageUrl ? (
                        <img
                          src={profile.profileImageUrl}
                          alt="Profile"
                          className="w-24 h-24 rounded-full object-cover border"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-2xl font-bold text-blue-600">
                          {profile.firstName.charAt(0) || 'D'}{profile.lastName.charAt(0) || 'r'}
                        </div>
                      )}
                      {editing && (
                        <Button size="sm" className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0" onClick={triggerImageUpload}>
                          <Camera className="h-4 w-4" />
                        </Button>
                      )}
                      <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleImageChange} />
                    </div>
                    <div className="text-center mt-4 space-y-2">
                      {editing ? (
                        <div className="space-y-2 w-full">
                          <Input
                            placeholder="First Name"
                            value={profile.firstName}
                            onChange={(e) => updateProfile('firstName', e.target.value)}
                          />
                          <Input
                            placeholder="Last Name"
                            value={profile.lastName}
                            onChange={(e) => updateProfile('lastName', e.target.value)}
                          />
                          <Input
                            placeholder="Title (MD, FRCPC)"
                            value={profile.title}
                            onChange={(e) => updateProfile('title', e.target.value)}
                          />
                          <Input
                            placeholder="Specialty"
                            value={profile.specialty}
                            onChange={(e) => updateProfile('specialty', e.target.value)}
                          />
                        </div>
                      ) : (
                        <>
                          <h3 className="text-lg font-semibold">{profile.firstName} {profile.lastName}</h3>
                          <p className="text-gray-600">{profile.title}</p>
                          <Badge variant="secondary" className="mt-2">{profile.specialty || 'Not specified'}</Badge>
                          {profile.subSpecialty && (
                            <Badge variant="outline" className="mt-1 ml-2">{profile.subSpecialty}</Badge>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 pt-4">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      {editing ? (
                        <Input
                          type="email"
                          placeholder="Email"
                          value={profile.email}
                          onChange={(e) => updateProfile('email', e.target.value)}
                        />
                      ) : (
                        <span className="text-sm">{profile.email || 'Not provided'}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      {editing ? (
                        <Input
                          placeholder="Phone Number"
                          value={profile.phoneNumber}
                          onChange={(e) => updateProfile('phoneNumber', e.target.value)}
                        />
                      ) : (
                        <span className="text-sm">{profile.phoneNumber || 'Not provided'}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      {editing ? (
                        <div className="flex-1 space-y-1">
                          <Input
                            placeholder="City"
                            value={profile.city}
                            onChange={(e) => updateProfile('city', e.target.value)}
                          />
                          <Input
                            placeholder="State/Province"
                            value={profile.state}
                            onChange={(e) => updateProfile('state', e.target.value)}
                          />
                        </div>
                      ) : (
                        <span className="text-sm">{profile.city && profile.state ? `${profile.city}, ${profile.state}` : 'Not provided'}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <Award className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      {editing ? (
                        <Input
                          placeholder="Years Experience"
                          type="number"
                          value={profile.yearsExperience}
                          onChange={(e) => updateProfile('yearsExperience', parseInt(e.target.value) || 0)}
                        />
                      ) : (
                        <span className="text-sm">{profile.yearsExperience || 0} years experience</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact & Location */}
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    Practice Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editing ? (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="address">Address</Label>
                        <Input
                          id="address"
                          value={profile.address}
                          onChange={(e) => updateProfile('address', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="zipCode">Zip Code</Label>
                        <Input
                          id="zipCode"
                          value={profile.zipCode}
                          onChange={(e) => updateProfile('zipCode', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="licenseNumber">License Number</Label>
                        <Input
                          id="licenseNumber"
                          value={profile.licenseNumber}
                          onChange={(e) => updateProfile('licenseNumber', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="licenseState">License State</Label>
                        <Input
                          id="licenseState"
                          value={profile.licenseState}
                          onChange={(e) => updateProfile('licenseState', e.target.value)}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Address</Label>
                        <p>{profile.address || 'Not provided'}</p>
                        <p>{profile.city && profile.state && profile.zipCode ? `${profile.city}, ${profile.state} ${profile.zipCode}` : ''}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Medical License</Label>
                        <p>{profile.licenseNumber || 'Not provided'}</p>
                        <p className="text-sm text-gray-600">{profile.licenseState || 'State not specified'}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Education & Languages */}
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    Education & Skills
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editing ? (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="medicalSchool">Medical School</Label>
                        <Input
                          id="medicalSchool"
                          value={profile.medicalSchool}
                          onChange={(e) => updateProfile('medicalSchool', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="residency">Residency</Label>
                        <Input
                          id="residency"
                          value={profile.residency}
                          onChange={(e) => updateProfile('residency', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="fellowship">Fellowship (Optional)</Label>
                        <Input
                          id="fellowship"
                          value={profile.fellowship || ''}
                          onChange={(e) => updateProfile('fellowship', e.target.value)}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Medical School</Label>
                        <p className="text-sm">{profile.medicalSchool || 'Not provided'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Residency</Label>
                        <p className="text-sm">{profile.residency || 'Not provided'}</p>
                      </div>
                      {profile.fellowship && (
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Fellowship</Label>
                          <p className="text-sm">{profile.fellowship}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Bio Section */}
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle>Professional Biography</CardTitle>
                <CardDescription>
                  Tell patients about your experience, specialties, and approach to care.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {editing ? (
                  <Textarea
                    value={profile.bio}
                    onChange={(e) => updateProfile('bio', e.target.value)}
                    rows={5}
                    placeholder="Write about your medical background, experience, and approach to patient care..."
                  />
                ) : (
                  <p className="text-gray-700 leading-relaxed">{profile.bio || 'No biography provided yet.'}</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="credentials" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    Medical License
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editing ? (
                    <>
                      <div>
                        <Label htmlFor="licenseNumber">License Number</Label>
                        <Input
                          id="licenseNumber"
                          value={profile.licenseNumber}
                          onChange={(e) => updateProfile('licenseNumber', e.target.value)}
                          placeholder="Enter license number"
                        />
                      </div>
                      <div>
                        <Label htmlFor="licenseState">State/Province</Label>
                        <Input
                          id="licenseState"
                          value={profile.licenseState}
                          onChange={(e) => updateProfile('licenseState', e.target.value)}
                          placeholder="Enter state/province"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">License Number</Label>
                        <p className="font-mono">{profile.licenseNumber || 'Not provided'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">State/Province</Label>
                        <p>{profile.licenseState || 'Not specified'}</p>
                      </div>
                    </>
                  )}
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    Education
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editing ? (
                    <>
                      <div>
                        <Label htmlFor="medicalSchool">Medical School</Label>
                        <Input
                          id="medicalSchool"
                          value={profile.medicalSchool}
                          onChange={(e) => updateProfile('medicalSchool', e.target.value)}
                          placeholder="Enter medical school"
                        />
                      </div>
                      <div>
                        <Label htmlFor="residency">Residency</Label>
                        <Input
                          id="residency"
                          value={profile.residency}
                          onChange={(e) => updateProfile('residency', e.target.value)}
                          placeholder="Enter residency program"
                        />
                      </div>
                      <div>
                        <Label htmlFor="fellowship">Fellowship (Optional)</Label>
                        <Input
                          id="fellowship"
                          value={profile.fellowship || ''}
                          onChange={(e) => updateProfile('fellowship', e.target.value)}
                          placeholder="Enter fellowship (optional)"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Medical School</Label>
                        <p>{profile.medicalSchool || 'Not provided'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Residency</Label>
                        <p>{profile.residency || 'Not provided'}</p>
                      </div>
                      {profile.fellowship && (
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Fellowship</Label>
                          <p>{profile.fellowship}</p>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6">
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Working Hours
                </CardTitle>
                <CardDescription>
                  Set your availability for patient consultations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(profile.workingHours).map(([day, hours]) => (
                    <div key={day} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                      <div className="flex items-center gap-4">
                        <div className="w-24 font-medium capitalize">{day}</div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={hours.available}
                            onChange={(e) => updateProfile('workingHours', {
                              ...profile.workingHours,
                              [day]: { ...hours, available: e.target.checked }
                            })}
                            disabled={!editing}
                            className="rounded"
                          />
                          <span className="text-sm text-gray-600">Available</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={hours.start}
                          onChange={(e) => updateProfile('workingHours', {
                            ...profile.workingHours,
                            [day]: { ...hours, start: e.target.value }
                          })}
                          className="w-28"
                          disabled={!editing || !hours.available}
                        />
                        <span>to</span>
                        <Input
                          type="time"
                          value={hours.end}
                          onChange={(e) => updateProfile('workingHours', {
                            ...profile.workingHours,
                            [day]: { ...hours, end: e.target.value }
                          })}
                          className="w-28"
                          disabled={!editing || !hours.available}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-blue-600" />
                    Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-gray-600">Receive email updates</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={profile.preferences.emailNotifications}
                      onChange={(e) => updateProfile('preferences', {
                        ...profile.preferences,
                        emailNotifications: e.target.checked
                      })}
                      disabled={!editing}
                      className="rounded"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>SMS Notifications</Label>
                      <p className="text-sm text-gray-600">Receive text messages</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={profile.preferences.smsNotifications}
                      onChange={(e) => updateProfile('preferences', {
                        ...profile.preferences,
                        smsNotifications: e.target.checked
                      })}
                      disabled={!editing}
                      className="rounded"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle>Consultation Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auto-Accept Consults</Label>
                      <p className="text-sm text-gray-600">Automatically accept new consultations</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={profile.preferences.autoAcceptConsults}
                      onChange={(e) => updateProfile('preferences', {
                        ...profile.preferences,
                        autoAcceptConsults: e.target.checked
                      })}
                      disabled={!editing}
                      className="rounded"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Allow Telemedicine</Label>
                      <p className="text-sm text-gray-600">Accept virtual consultations</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={profile.preferences.allowTelemedicine}
                      onChange={(e) => updateProfile('preferences', {
                        ...profile.preferences,
                        allowTelemedicine: e.target.checked
                      })}
                      disabled={!editing}
                      className="rounded"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Emergency Available</Label>
                      <p className="text-sm text-gray-600">Available for emergency cases</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={profile.preferences.emergencyAvailable}
                      onChange={(e) => updateProfile('preferences', {
                        ...profile.preferences,
                        emergencyAvailable: e.target.checked
                      })}
                      disabled={!editing}
                      className="rounded"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}