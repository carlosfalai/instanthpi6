import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

interface Specialist {
  id: string;
  name: string;
  specialty: string;
  subSpecialty?: string;
  availability: "available" | "busy" | "offline";
  responseTime: string;
  languages: string[];
  expertise: string[];
  preferredTemplate?: any;
}

interface ReferralTemplate {
  id: string;
  name: string;
  requiredSections: any;
  customQuestions: string[];
  preferredFormat: "structured" | "narrative" | "soap";
}

export function InterconsultationHub() {
  const [activeTab, setActiveTab] = useState<"refer" | "inbox" | "templates" | "network">("refer");
  const [selectedSpecialist, setSelectedSpecialist] = useState<Specialist | null>(null);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [referralData, setReferralData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [showTemplateBuilder, setShowTemplateBuilder] = useState(false);

  // Mock specialists data (would come from database)
  useEffect(() => {
    setSpecialists([
      {
        id: "1",
        name: "Dr. Marie Laroche",
        specialty: "Cardiology",
        subSpecialty: "Interventional",
        availability: "available",
        responseTime: "< 2 hours",
        languages: ["French", "English"],
        expertise: ["Coronary Disease", "Heart Failure", "Arrhythmias"],
        preferredTemplate: {
          requiredSections: {
            chief_complaint: true,
            hpi: true,
            cardiac_risk_factors: true,
            recent_ecg: true,
            medications: true,
          },
          customQuestions: [
            "Chest pain characteristics?",
            "Exercise tolerance?",
            "Previous cardiac interventions?",
          ],
        },
      },
      {
        id: "2",
        name: "Dr. Jean-Paul Dubois",
        specialty: "Dermatology",
        availability: "available",
        responseTime: "< 24 hours",
        languages: ["French"],
        expertise: ["Melanoma", "Psoriasis", "Acne"],
        preferredTemplate: {
          requiredSections: {
            chief_complaint: true,
            lesion_description: true,
            photos_required: true,
            duration: true,
          },
          customQuestions: ["Lesion evolution?", "Associated symptoms?", "Sun exposure history?"],
        },
      },
      {
        id: "3",
        name: "Dr. Sarah Mitchell",
        specialty: "Psychiatry",
        availability: "busy",
        responseTime: "< 48 hours",
        languages: ["English", "French"],
        expertise: ["Depression", "Anxiety", "ADHD"],
        preferredTemplate: {
          requiredSections: {
            chief_complaint: true,
            psychiatric_history: true,
            current_medications: true,
            suicide_risk_assessment: true,
          },
          customQuestions: ["Sleep patterns?", "Current stressors?", "Support system?"],
        },
      },
    ]);
  }, []);

  const handleSendReferral = async () => {
    if (!selectedSpecialist || !patientId) {
      alert("Please select a specialist and enter patient ID");
      return;
    }

    setLoading(true);
    try {
      // Generate formatted referral based on specialist's template
      const formattedReferral = generateFormattedReferral(
        referralData,
        selectedSpecialist.preferredTemplate
      );

      // Save to database
      const { error } = await supabase.from("interconsultations").insert({
        patient_id: patientId,
        consulting_specialist_id: selectedSpecialist.id,
        reason_for_referral: referralData.reason,
        urgency: referralData.urgency || "routine",
        formatted_referral: formattedReferral,
        specific_questions: referralData.questions || [],
      });

      if (error) throw error;

      alert(`Referral sent to ${selectedSpecialist.name}`);
      setReferralData({});
      setSelectedSpecialist(null);
      setPatientId("");
    } catch (error) {
      console.error("Error sending referral:", error);
      alert("Failed to send referral");
    } finally {
      setLoading(false);
    }
  };

  const generateFormattedReferral = (data: any, template: any) => {
    const formatted: any = {};

    // Include only the sections the specialist wants
    if (template?.requiredSections) {
      Object.keys(template.requiredSections).forEach((section) => {
        if (template.requiredSections[section] && data[section]) {
          formatted[section] = data[section];
        }
      });
    }

    // Add responses to custom questions
    if (template?.customQuestions) {
      formatted.customResponses = template.customQuestions.map((q: string, i: number) => ({
        question: q,
        answer: data.customAnswers?.[i] || "Not provided",
      }));
    }

    return formatted;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-white">InstantHPI Interconsultation Network</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-400">
                Connected Specialists:{" "}
                {specialists.filter((s) => s.availability === "available").length}
              </span>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {["refer", "inbox", "templates", "network"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`py-3 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                  activeTab === tab
                    ? "border-blue-400 text-blue-400"
                    : "border-transparent text-gray-400 hover:text-gray-300"
                }`}
              >
                {tab === "refer" && "New Referral"}
                {tab === "inbox" && "Consultations"}
                {tab === "templates" && "My Templates"}
                {tab === "network" && "Specialist Network"}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "refer" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Specialist Selection */}
            <div className="lg:col-span-1">
              <h2 className="text-lg font-semibold mb-4 text-gray-300">Select Specialist</h2>
              <div className="space-y-3">
                {specialists.map((specialist) => (
                  <button
                    key={specialist.id}
                    onClick={() => setSelectedSpecialist(specialist)}
                    className={`w-full text-left p-4 rounded-lg border transition-all ${
                      selectedSpecialist?.id === specialist.id
                        ? "bg-blue-900/30 border-blue-500"
                        : "bg-gray-800 border-gray-700 hover:border-gray-600"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-white">{specialist.name}</p>
                        <p className="text-sm text-gray-400">{specialist.specialty}</p>
                        {specialist.subSpecialty && (
                          <p className="text-xs text-gray-500">{specialist.subSpecialty}</p>
                        )}
                      </div>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          specialist.availability === "available"
                            ? "bg-green-900/50 text-green-400"
                            : specialist.availability === "busy"
                              ? "bg-yellow-900/50 text-yellow-400"
                              : "bg-gray-700 text-gray-400"
                        }`}
                      >
                        {specialist.availability}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                      <span>⏱ {specialist.responseTime}</span>
                      <span>🌐 {specialist.languages.join(", ")}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Referral Form */}
            <div className="lg:col-span-2">
              {selectedSpecialist ? (
                <div className="bg-gray-800 rounded-lg p-6">
                  <h2 className="text-lg font-semibold mb-4 text-gray-300">
                    Referral to {selectedSpecialist.name}
                  </h2>

                  {/* Template Requirements Notice */}
                  <div className="mb-6 p-4 bg-blue-900/20 border border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-400 font-medium mb-2">
                      This specialist requires:
                    </p>
                    <ul className="text-sm text-gray-400 space-y-1">
                      {Object.entries(selectedSpecialist.preferredTemplate?.requiredSections || {})
                        .filter(([_, required]) => required)
                        .map(([section]) => (
                          <li key={section}>
                            • {section.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                          </li>
                        ))}
                    </ul>
                  </div>

                  {/* Patient ID */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Patient ID
                    </label>
                    <input
                      type="text"
                      value={patientId}
                      onChange={(e) => setPatientId(e.target.value.toUpperCase())}
                      placeholder="Ex: A1B2C3D4E5"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      maxLength={10}
                    />
                  </div>

                  {/* Urgency */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Urgency</label>
                    <select
                      value={referralData.urgency || "routine"}
                      onChange={(e) =>
                        setReferralData({ ...referralData, urgency: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:border-blue-500"
                    >
                      <option value="routine">Routine</option>
                      <option value="semi-urgent">Semi-Urgent</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  {/* Reason for Referral */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Reason for Referral
                    </label>
                    <textarea
                      value={referralData.reason || ""}
                      onChange={(e) => setReferralData({ ...referralData, reason: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:border-blue-500"
                      placeholder="Brief description of why you're referring this patient..."
                    />
                  </div>

                  {/* Custom Questions from Specialist */}
                  {selectedSpecialist.preferredTemplate?.customQuestions && (
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-400 mb-3">
                        Specialist's Specific Questions
                      </h3>
                      <div className="space-y-3">
                        {selectedSpecialist.preferredTemplate.customQuestions.map(
                          (question, idx) => (
                            <div key={idx}>
                              <label className="block text-sm text-gray-500 mb-1">{question}</label>
                              <input
                                type="text"
                                value={referralData.customAnswers?.[idx] || ""}
                                onChange={(e) => {
                                  const answers = [...(referralData.customAnswers || [])];
                                  answers[idx] = e.target.value;
                                  setReferralData({ ...referralData, customAnswers: answers });
                                }}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:border-blue-500"
                              />
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {/* Dynamic Sections Based on Template */}
                  {selectedSpecialist.preferredTemplate?.requiredSections.chief_complaint && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Chief Complaint
                      </label>
                      <input
                        type="text"
                        value={referralData.chief_complaint || ""}
                        onChange={(e) =>
                          setReferralData({ ...referralData, chief_complaint: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:border-blue-500"
                        placeholder="Patient's main concern..."
                      />
                    </div>
                  )}

                  {/* Send Button */}
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setSelectedSpecialist(null);
                        setReferralData({});
                      }}
                      className="px-4 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSendReferral}
                      disabled={loading || !patientId || !referralData.reason}
                      className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? "Sending..." : "Send Referral"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-800 rounded-lg p-12 text-center">
                  <p className="text-gray-500">Select a specialist to begin the referral process</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "templates" && (
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-300">My Referral Templates</h2>
              <button
                onClick={() => setShowTemplateBuilder(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Create Template
              </button>
            </div>

            {showTemplateBuilder && (
              <TemplateBuilder onClose={() => setShowTemplateBuilder(false)} />
            )}

            <div className="text-gray-500 text-center py-8">
              Your custom referral templates will appear here
            </div>
          </div>
        )}

        {activeTab === "inbox" && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-300 mb-4">Consultation Requests</h2>
            <div className="text-gray-500 text-center py-8">No pending consultations</div>
          </div>
        )}

        {activeTab === "network" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {specialists.map((specialist) => (
              <div key={specialist.id} className="bg-gray-800 rounded-lg p-6">
                <h3 className="font-semibold text-white mb-2">{specialist.name}</h3>
                <p className="text-sm text-gray-400 mb-3">{specialist.specialty}</p>
                <div className="space-y-2 text-xs text-gray-500">
                  <p>📍 {specialist.expertise.join(", ")}</p>
                  <p>⏱ Response: {specialist.responseTime}</p>
                  <p>🌐 {specialist.languages.join(", ")}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Template Builder Component
function TemplateBuilder({ onClose }: { onClose: () => void }) {
  const [templateName, setTemplateName] = useState("");
  const [requiredSections, setRequiredSections] = useState<any>({
    chief_complaint: true,
    hpi: true,
    medications: true,
    allergies: true,
  });
  const [customQuestions, setCustomQuestions] = useState<string[]>([""]);

  const sections = [
    "chief_complaint",
    "hpi",
    "medications",
    "allergies",
    "past_medical_history",
    "family_history",
    "social_history",
    "review_of_systems",
    "physical_exam",
    "labs",
    "imaging",
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-white mb-4">Create Referral Template</h3>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-400 mb-2">Template Name</label>
          <input
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
            placeholder="e.g., Cardiology Standard"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-400 mb-2">Required Sections</label>
          <div className="space-y-2">
            {sections.map((section) => (
              <label key={section} className="flex items-center text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={requiredSections[section] || false}
                  onChange={(e) =>
                    setRequiredSections({
                      ...requiredSections,
                      [section]: e.target.checked,
                    })
                  }
                  className="mr-2"
                />
                {section.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </label>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-400 mb-2">Custom Questions</label>
          {customQuestions.map((q, idx) => (
            <input
              key={idx}
              type="text"
              value={q}
              onChange={(e) => {
                const newQuestions = [...customQuestions];
                newQuestions[idx] = e.target.value;
                setCustomQuestions(newQuestions);
              }}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white mb-2"
              placeholder="Enter a question..."
            />
          ))}
          <button
            onClick={() => setCustomQuestions([...customQuestions, ""])}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            + Add Question
          </button>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              // Save template logic here
              onClose();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Save Template
          </button>
        </div>
      </div>
    </div>
  );
}
