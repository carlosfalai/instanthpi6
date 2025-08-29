import React, { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Stethoscope, ChevronRight, UserRound, Calendar } from "lucide-react";
import PatientSearchPanel from "@/components/patients/PatientSearchPanel";

// Import the Patient interface
interface Patient {
  id: number;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  language: "english" | "french" | null;
  spruceId: string | null;
}

export default function PatientDashboardPage() {
  const [, setLocation] = useLocation();

  // Handle patient selection
  const handlePatientSelect = (patient: Patient) => {
    setLocation(`/patients/${patient.id}`);
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white p-4">
      <header className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Telemedicine Dashboard</h1>
        <p className="text-gray-400">Select a patient to start a consultation</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Patient Search Panel */}
        <div className="md:col-span-2 bg-[#1e1e1e] rounded-lg overflow-hidden border border-gray-800 shadow-lg h-[600px]">
          <PatientSearchPanel onSelectPatient={handlePatientSelect} selectedPatientId={null} />
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <Card className="bg-[#1e1e1e] border-gray-800 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-between bg-[#262626] hover:bg-[#333] border-gray-700"
                onClick={() => setLocation("/")}
              >
                <div className="flex items-center">
                  <Stethoscope className="h-4 w-4 mr-2" />
                  <span>Patient Consultation</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                className="w-full justify-between bg-[#262626] hover:bg-[#333] border-gray-700"
                onClick={() => window.open("https://spruce.care", "_blank")}
              >
                <div className="flex items-center">
                  <UserRound className="h-4 w-4 mr-2" />
                  <span>Spruce Dashboard</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                className="w-full justify-between bg-[#262626] hover:bg-[#333] border-gray-700"
              >
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Schedule Appointment</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Recent Patients Section */}
          <Card className="bg-[#1e1e1e] border-gray-800 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Recent Patients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-500 text-center py-6">Recent patients will appear here</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
