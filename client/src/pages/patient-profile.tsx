import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

interface PatientProfile {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email: string;
  emergencyContact: string;
  emergencyPhone: string;
  medicalHistory: string;
  medications: string;
  allergies: string;
  clinicId: string;
  physicianId: string;
  createdAt: string;
}

interface Clinic {
  id: string;
  name: string;
  address: string;
  phone: string;
  physicians: Physician[];
}

interface Physician {
  id: string;
  name: string;
  specialty: string;
  clinicId: string;
}

export default function PatientProfile() {
  const [, navigate] = useLocation();
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [selectedClinic, setSelectedClinic] = useState<string>("");
  const [selectedPhysician, setSelectedPhysician] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    phone: "",
    email: "",
    emergencyContact: "",
    emergencyPhone: "",
    medicalHistory: "",
    medications: "",
    allergies: "",
  });

  useEffect(() => {
    loadProfile();
    loadClinics();
  }, []);

  const loadProfile = async () => {
    try {
      const patientId = localStorage.getItem("patient_id");
      if (patientId) {
        const response = await fetch(`/api/patient-profile/${patientId}`);
        if (response.ok) {
          const data = await response.json();
          setProfile(data);
          setFormData({
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            dateOfBirth: data.dateOfBirth || "",
            gender: data.gender || "",
            phone: data.phone || "",
            email: data.email || "",
            emergencyContact: data.emergencyContact || "",
            emergencyPhone: data.emergencyPhone || "",
            medicalHistory: data.medicalHistory || "",
            medications: data.medications || "",
            allergies: data.allergies || "",
          });
          setSelectedClinic(data.clinicId || "");
          setSelectedPhysician(data.physicianId || "");
        }
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const loadClinics = async () => {
    try {
      const response = await fetch("/api/clinics");
      if (response.ok) {
        const data = await response.json();
        setClinics(data);
      }
    } catch (error) {
      console.error("Error loading clinics:", error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const patientId = localStorage.getItem("patient_id") || generatePatientId();
      localStorage.setItem("patient_id", patientId);

      const profileData = {
        ...formData,
        clinicId: selectedClinic,
        physicianId: selectedPhysician,
        id: patientId,
      };

      const response = await fetch("/api/patient-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });

      if (response.ok) {
        setProfile(profileData);
        alert("Profile saved successfully!");
      } else {
        throw new Error("Failed to save profile");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const generatePatientId = () => {
    return "PAT-" + Math.random().toString(36).substr(2, 9).toUpperCase();
  };

  const handleClinicChange = (clinicId: string) => {
    setSelectedClinic(clinicId);
    setSelectedPhysician(""); // Reset physician selection
  };

  const selectedClinicData = clinics.find((c) => c.id === selectedClinic);
  const availablePhysicians = selectedClinicData?.physicians || [];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Patient Profile</h1>
          <p className="text-slate-600 mt-2">
            Complete your medical profile and select your clinic
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Your basic personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => setFormData({ ...formData, gender: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Emergency Contact</CardTitle>
              <CardDescription>Someone to contact in case of emergency</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="emergencyContact">Emergency Contact Name</Label>
                <Input
                  id="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="emergencyPhone">Emergency Contact Phone</Label>
                <Input
                  id="emergencyPhone"
                  value={formData.emergencyPhone}
                  onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Medical Information */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Medical Information</CardTitle>
              <CardDescription>Your medical history and current medications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="medicalHistory">Medical History</Label>
                <Textarea
                  id="medicalHistory"
                  value={formData.medicalHistory}
                  onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                  placeholder="Describe your medical history, surgeries, chronic conditions, etc."
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="medications">Current Medications</Label>
                <Textarea
                  id="medications"
                  value={formData.medications}
                  onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
                  placeholder="List all current medications, dosages, and frequency"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="allergies">Allergies</Label>
                <Textarea
                  id="allergies"
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  placeholder="List all known allergies (medications, foods, environmental, etc.)"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Clinic Selection */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Clinic & Physician Selection</CardTitle>
              <CardDescription>Select your preferred clinic and physician</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="clinic">Select Clinic</Label>
                <Select value={selectedClinic} onValueChange={handleClinicChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a clinic" />
                  </SelectTrigger>
                  <SelectContent>
                    {clinics.map((clinic) => (
                      <SelectItem key={clinic.id} value={clinic.id}>
                        {clinic.name} - {clinic.address}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedClinic && (
                <div>
                  <Label htmlFor="physician">Select Physician</Label>
                  <Select value={selectedPhysician} onValueChange={setSelectedPhysician}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a physician" />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePhysicians.map((physician) => (
                        <SelectItem key={physician.id} value={physician.id}>
                          Dr. {physician.name} - {physician.specialty}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedClinic && selectedPhysician && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-semibold text-green-800">Selected Care Team</h4>
                  <p className="text-green-700">
                    <strong>Clinic:</strong> {selectedClinicData?.name}
                    <br />
                    <strong>Physician:</strong> Dr.{" "}
                    {availablePhysicians.find((p) => p.id === selectedPhysician)?.name} -{" "}
                    {availablePhysicians.find((p) => p.id === selectedPhysician)?.specialty}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 flex justify-end space-x-4">
          <Button variant="outline" onClick={() => navigate("/")}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Profile"}
          </Button>
        </div>
      </div>
    </div>
  );
}
