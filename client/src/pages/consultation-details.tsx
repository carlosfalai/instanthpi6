import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, User, Calendar, AlertCircle, FileText, Pill, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";

interface ConsultationDetails {
  id: string;
  patient_id: string;
  chief_complaint: string;
  symptoms: string;
  duration: string;
  severity: number;
  pain_level?: number;
  current_medications?: string;
  allergies?: string;
  medical_history?: string;
  chronic_conditions?: string;
  pregnancy_status?: string;
  treatments_attempted?: string;
  treatment_effectiveness?: string;
  additional_notes?: string;
  triage_level?: string;
  triage_reasoning?: string;
  recommended_action?: string;
  urgency_score?: number;
  ai_analysis?: string;
  status: string;
  created_at: string;
  age?: number;
  gender?: string;
  provider_notes?: string;
  diagnosis?: string;
  treatment_plan?: string;
}

export default function ConsultationDetailsPage() {
  const params = useParams();
  const [, navigate] = useLocation();
  const consultationId = params.id;

  const [consultation, setConsultation] = useState<ConsultationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [providerNotes, setProviderNotes] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [treatmentPlan, setTreatmentPlan] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (consultationId) {
      loadConsultation();
    }
  }, [consultationId]);

  const loadConsultation = async () => {
    try {
      const { data, error } = await supabase
        .from("consultations")
        .select("*")
        .eq("id", consultationId)
        .single();

      if (error) throw error;

      if (data) {
        setConsultation(data);
        setProviderNotes(data.provider_notes || "");
        setDiagnosis(data.diagnosis || "");
        setTreatmentPlan(data.treatment_plan || "");
      }
    } catch (error) {
      console.error("Error loading consultation:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveProviderNotes = async () => {
    if (!consultation) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("consultations")
        .update({
          provider_notes: providerNotes,
          diagnosis: diagnosis,
          treatment_plan: treatmentPlan,
          status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", consultation.id);

      if (error) throw error;

      // Reload consultation
      await loadConsultation();
    } catch (error) {
      console.error("Error saving notes:", error);
    } finally {
      setSaving(false);
    }
  };

  const getTriageColor = (level: string) => {
    switch (level?.toUpperCase()) {
      case "EMERGENCY":
        return "bg-red-100 text-red-800 border-red-200";
      case "URGENT":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "SEMI-URGENT":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "NON-URGENT":
        return "bg-green-100 text-green-800 border-green-200";
      case "SELF-CARE":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading consultation details...</p>
        </div>
      </div>
    );
  }

  if (!consultation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Consultation not found</p>
          <Button onClick={() => navigate("/doctor-dashboard")} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/doctor-dashboard")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
              <div className="border-l pl-4">
                <h1 className="text-lg font-semibold">Patient Consultation</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xl font-bold">{consultation.patient_id}</span>
              <Badge className={getTriageColor(consultation.triage_level || "")}>
                {consultation.triage_level || "PENDING"}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Patient Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Patient Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Patient ID</p>
                    <p className="font-mono font-semibold text-lg">{consultation.patient_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Submission Date</p>
                    <p className="font-medium">
                      {format(new Date(consultation.created_at), "PPpp")}
                    </p>
                  </div>
                  {consultation.age && (
                    <div>
                      <p className="text-sm text-gray-500">Age</p>
                      <p className="font-medium">{consultation.age} years</p>
                    </div>
                  )}
                  {consultation.gender && (
                    <div>
                      <p className="text-sm text-gray-500">Gender</p>
                      <p className="font-medium capitalize">{consultation.gender}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Chief Complaint & Symptoms */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Chief Complaint & Symptoms
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Chief Complaint</p>
                  <p className="p-3 bg-gray-50 rounded-lg">{consultation.chief_complaint}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Symptoms</p>
                  <div className="flex flex-wrap gap-2">
                    {consultation.symptoms?.split(",").map((symptom, index) => (
                      <Badge key={index} variant="secondary">
                        {symptom.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Duration</p>
                    <p className="p-2 bg-gray-50 rounded">{consultation.duration}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Pain Level</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            (consultation.pain_level || 0) >= 7
                              ? "bg-red-500"
                              : (consultation.pain_level || 0) >= 4
                                ? "bg-yellow-500"
                                : "bg-green-500"
                          }`}
                          style={{ width: `${(consultation.pain_level || 0) * 10}%` }}
                        />
                      </div>
                      <span className="font-semibold">{consultation.pain_level || 0}/10</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Medical History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Medical History
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {consultation.medical_history && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Past Medical History</p>
                    <p className="p-3 bg-gray-50 rounded-lg">{consultation.medical_history}</p>
                  </div>
                )}

                {consultation.chronic_conditions && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Chronic Conditions</p>
                    <p className="p-3 bg-gray-50 rounded-lg">{consultation.chronic_conditions}</p>
                  </div>
                )}

                {consultation.current_medications && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Current Medications</p>
                    <p className="p-3 bg-gray-50 rounded-lg">{consultation.current_medications}</p>
                  </div>
                )}

                {consultation.allergies && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Allergies</p>
                    <p className="p-3 bg-gray-50 rounded-lg">{consultation.allergies}</p>
                  </div>
                )}

                {consultation.pregnancy_status && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Pregnancy Status</p>
                    <p className="p-3 bg-gray-50 rounded-lg">{consultation.pregnancy_status}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Treatment History */}
            {(consultation.treatments_attempted || consultation.treatment_effectiveness) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Pill className="h-5 w-5" />
                    Treatment History
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {consultation.treatments_attempted && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Treatments Attempted</p>
                      <p className="p-3 bg-gray-50 rounded-lg">
                        {consultation.treatments_attempted}
                      </p>
                    </div>
                  )}

                  {consultation.treatment_effectiveness && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Treatment Effectiveness
                      </p>
                      <p className="p-3 bg-gray-50 rounded-lg">
                        {consultation.treatment_effectiveness}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Additional Notes */}
            {consultation.additional_notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Additional Patient Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="p-3 bg-gray-50 rounded-lg">{consultation.additional_notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - AI Triage & Provider Notes */}
          <div className="space-y-6">
            {/* AI Triage Results */}
            <Card className={`border-2 ${getTriageColor(consultation.triage_level || "")}`}>
              <CardHeader>
                <CardTitle>AI Triage Assessment</CardTitle>
                <CardDescription>Automated medical triage analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Triage Level</p>
                  <Badge
                    className={`${getTriageColor(consultation.triage_level || "")} text-lg px-3 py-1`}
                  >
                    {consultation.triage_level || "PENDING"}
                  </Badge>
                </div>

                {consultation.urgency_score && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Urgency Score</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full ${
                            consultation.urgency_score >= 8
                              ? "bg-red-500"
                              : consultation.urgency_score >= 6
                                ? "bg-orange-500"
                                : consultation.urgency_score >= 4
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                          }`}
                          style={{ width: `${consultation.urgency_score * 10}%` }}
                        />
                      </div>
                      <span className="font-bold">{consultation.urgency_score}/10</span>
                    </div>
                  </div>
                )}

                {consultation.recommended_action && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Recommended Action</p>
                    <p className="p-3 bg-white rounded-lg text-sm">
                      {consultation.recommended_action}
                    </p>
                  </div>
                )}

                {consultation.triage_reasoning && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">AI Analysis</p>
                    <p className="p-3 bg-white rounded-lg text-sm whitespace-pre-line">
                      {consultation.triage_reasoning}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Provider Notes & Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Provider Notes & Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Provider Notes</label>
                  <Textarea
                    value={providerNotes}
                    onChange={(e) => setProviderNotes(e.target.value)}
                    placeholder="Enter your clinical notes..."
                    className="mt-1"
                    rows={4}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Diagnosis</label>
                  <Textarea
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    placeholder="Enter diagnosis..."
                    className="mt-1"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Treatment Plan</label>
                  <Textarea
                    value={treatmentPlan}
                    onChange={(e) => setTreatmentPlan(e.target.value)}
                    placeholder="Enter treatment plan..."
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <Button onClick={saveProviderNotes} disabled={saving} className="w-full">
                  {saving ? "Saving..." : "Save & Complete Consultation"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
