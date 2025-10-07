import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  User, 
  Heart, 
  Calendar, 
  FileText, 
  Stethoscope, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  Camera,
  Mic,
  Upload,
  AlertTriangle,
  Clock,
  Activity
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface FormData {
  // Step 1: Basic Information
  deIdentifiedId: string;
  gender: string;
  age: string;
  
  // Step 2: Medical History
  chronicConditions: string;
  medicationAllergies: string;
  pregnancyStatus: string;
  currentMedications: string;
  
  // Step 3: Current Symptoms
  reasonForVisit: string;
  problemStartDate: string;
  specificTrigger: string;
  symptomLocation: string;
  symptomDescription: string;
  symptomAggravators: string;
  symptomRelievers: string;
  symptomProgression: string;
  selectedSymptoms: string[];
  
  // Step 4: Treatment History
  treatmentsAttempted: string;
  treatmentEffectiveness: string;
  previousDiagnoses: string;
  
  // Step 5: Additional Information
  additionalNotes: string;
  emergencyContact: string;
  insuranceInfo: string;
}

export function EnhancedPatientIntakeForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    deIdentifiedId: "",
    gender: "",
    age: "",
    chronicConditions: "",
    medicationAllergies: "",
    pregnancyStatus: "",
    currentMedications: "",
    reasonForVisit: "",
    problemStartDate: "",
    specificTrigger: "",
    symptomLocation: "",
    symptomDescription: "",
    symptomAggravators: "",
    symptomRelievers: "",
    symptomProgression: "",
    selectedSymptoms: [],
    treatmentsAttempted: "",
    treatmentEffectiveness: "",
    previousDiagnoses: "",
    additionalNotes: "",
    emergencyContact: "",
    insuranceInfo: ""
  });
  
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [patientAnswers, setPatientAnswers] = useState<{[key: number]: string}>({});
  const [hpiConfirmed, setHpiConfirmed] = useState<boolean | null>(null);
  const [hpiCorrections, setHpiCorrections] = useState<string>("");
  const [comprehensiveReport, setComprehensiveReport] = useState<any>(null);

  const steps = [
    { id: 1, title: "Basic Information", icon: User, description: "Personal details and demographics" },
    { id: 2, title: "Medical History", icon: Heart, description: "Chronic conditions and allergies" },
    { id: 3, title: "Current Symptoms", icon: Stethoscope, description: "Describe your current condition" },
    { id: 4, title: "Treatment History", icon: FileText, description: "Previous treatments and diagnoses" },
    { id: 5, title: "Additional Info", icon: CheckCircle, description: "Emergency contacts and notes" }
  ];

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const generateDeIdentifiedId = () => {
    return `PT${Date.now().toString().slice(-6)}`;
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const patientId = formData.deIdentifiedId || generateDeIdentifiedId();
      
      const patientData = {
        patient_id: patientId,
        gender: formData.gender,
        age: formData.age,
        chief_complaint: formData.reasonForVisit,
        problem_start_date: formData.problemStartDate,
        specific_trigger: formData.specificTrigger,
        symptom_location: formData.symptomLocation,
        symptom_description: formData.symptomDescription,
        symptom_aggravators: formData.symptomAggravators,
        symptom_relievers: formData.symptomRelievers,
        symptom_progression: formData.symptomProgression,
        selected_symptoms: formData.selectedSymptoms,
        treatments_attempted: formData.treatmentsAttempted,
        treatment_effectiveness: formData.treatmentEffectiveness,
        chronic_conditions: formData.chronicConditions,
        medication_allergies: formData.medicationAllergies,
        pregnancy_status: formData.pregnancyStatus,
        current_medications: formData.currentMedications,
        previous_diagnoses: formData.previousDiagnoses,
        additional_notes: formData.additionalNotes,
        emergency_contact: formData.emergencyContact,
        insurance_info: formData.insuranceInfo,
        created_at: new Date().toISOString()
      };

      // Save to database
      const { error } = await supabase
        .from('consultations')
        .insert([patientData]);

      if (error) throw error;

      // Generate comprehensive triage
      const response = await fetch('/api/comprehensive-triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patientData)
      });

      if (!response.ok) throw new Error('Failed to generate triage');

      const triageData = await response.json();
      setComprehensiveReport(triageData);
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Error processing your consultation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="deIdentifiedId">Patient ID (Optional)</Label>
                <Input
                  id="deIdentifiedId"
                  value={formData.deIdentifiedId}
                  onChange={(e) => updateFormData('deIdentifiedId', e.target.value)}
                  placeholder="Leave blank for auto-generation"
                />
              </div>
              <div>
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => updateFormData('age', e.target.value)}
                  placeholder="Enter your age"
                />
              </div>
            </div>
            
            <div>
              <Label>Gender</Label>
              <RadioGroup
                value={formData.gender}
                onValueChange={(value) => updateFormData('gender', value)}
                className="flex gap-6 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="male" id="male" />
                  <Label htmlFor="male">Male</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="female" id="female" />
                  <Label htmlFor="female">Female</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other">Other</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="chronicConditions">Chronic Conditions</Label>
              <Textarea
                id="chronicConditions"
                value={formData.chronicConditions}
                onChange={(e) => updateFormData('chronicConditions', e.target.value)}
                placeholder="List any chronic conditions (diabetes, hypertension, etc.)"
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="medicationAllergies">Medication Allergies</Label>
              <Textarea
                id="medicationAllergies"
                value={formData.medicationAllergies}
                onChange={(e) => updateFormData('medicationAllergies', e.target.value)}
                placeholder="List any medication allergies or adverse reactions"
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="currentMedications">Current Medications</Label>
              <Textarea
                id="currentMedications"
                value={formData.currentMedications}
                onChange={(e) => updateFormData('currentMedications', e.target.value)}
                placeholder="List all current medications with dosages"
                rows={3}
              />
            </div>
            
            <div>
              <Label>Pregnancy Status (if applicable)</Label>
              <RadioGroup
                value={formData.pregnancyStatus}
                onValueChange={(value) => updateFormData('pregnancyStatus', value)}
                className="flex gap-6 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="not-applicable" id="na" />
                  <Label htmlFor="na">Not Applicable</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pregnant" id="pregnant" />
                  <Label htmlFor="pregnant">Pregnant</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="breastfeeding" id="breastfeeding" />
                  <Label htmlFor="breastfeeding">Breastfeeding</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="reasonForVisit">Reason for Visit</Label>
              <Textarea
                id="reasonForVisit"
                value={formData.reasonForVisit}
                onChange={(e) => updateFormData('reasonForVisit', e.target.value)}
                placeholder="Describe your main concern or reason for seeking medical attention"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="problemStartDate">When did this problem start?</Label>
                <Input
                  id="problemStartDate"
                  value={formData.problemStartDate}
                  onChange={(e) => updateFormData('problemStartDate', e.target.value)}
                  placeholder="e.g., 3 days ago, last week"
                />
              </div>
              <div>
                <Label htmlFor="specificTrigger">Specific Trigger</Label>
                <Input
                  id="specificTrigger"
                  value={formData.specificTrigger}
                  onChange={(e) => updateFormData('specificTrigger', e.target.value)}
                  placeholder="What triggered this problem?"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="symptomLocation">Where is the problem located?</Label>
              <Input
                id="symptomLocation"
                value={formData.symptomLocation}
                onChange={(e) => updateFormData('symptomLocation', e.target.value)}
                placeholder="e.g., chest, head, abdomen, etc."
              />
            </div>
            
            <div>
              <Label htmlFor="symptomDescription">Describe your symptoms</Label>
              <Textarea
                id="symptomDescription"
                value={formData.symptomDescription}
                onChange={(e) => updateFormData('symptomDescription', e.target.value)}
                placeholder="Detailed description of your symptoms"
                rows={4}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="symptomAggravators">What makes it worse?</Label>
                <Textarea
                  id="symptomAggravators"
                  value={formData.symptomAggravators}
                  onChange={(e) => updateFormData('symptomAggravators', e.target.value)}
                  placeholder="Activities, positions, or factors that worsen symptoms"
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="symptomRelievers">What makes it better?</Label>
                <Textarea
                  id="symptomRelievers"
                  value={formData.symptomRelievers}
                  onChange={(e) => updateFormData('symptomRelievers', e.target.value)}
                  placeholder="Activities, positions, or treatments that help"
                  rows={2}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="symptomProgression">How has it changed over time?</Label>
              <Textarea
                id="symptomProgression"
                value={formData.symptomProgression}
                onChange={(e) => updateFormData('symptomProgression', e.target.value)}
                placeholder="Describe how your symptoms have progressed"
                rows={3}
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="treatmentsAttempted">Treatments Attempted</Label>
              <Textarea
                id="treatmentsAttempted"
                value={formData.treatmentsAttempted}
                onChange={(e) => updateFormData('treatmentsAttempted', e.target.value)}
                placeholder="List any treatments, medications, or remedies you've tried"
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="treatmentEffectiveness">How effective were these treatments?</Label>
              <Textarea
                id="treatmentEffectiveness"
                value={formData.treatmentEffectiveness}
                onChange={(e) => updateFormData('treatmentEffectiveness', e.target.value)}
                placeholder="Describe the effectiveness of previous treatments"
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="previousDiagnoses">Previous Diagnoses</Label>
              <Textarea
                id="previousDiagnoses"
                value={formData.previousDiagnoses}
                onChange={(e) => updateFormData('previousDiagnoses', e.target.value)}
                placeholder="Any previous diagnoses related to this condition"
                rows={3}
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="emergencyContact">Emergency Contact</Label>
              <Input
                id="emergencyContact"
                value={formData.emergencyContact}
                onChange={(e) => updateFormData('emergencyContact', e.target.value)}
                placeholder="Name and phone number of emergency contact"
              />
            </div>
            
            <div>
              <Label htmlFor="insuranceInfo">Insurance Information</Label>
              <Input
                id="insuranceInfo"
                value={formData.insuranceInfo}
                onChange={(e) => updateFormData('insuranceInfo', e.target.value)}
                placeholder="Insurance provider and policy number"
              />
            </div>
            
            <div>
              <Label htmlFor="additionalNotes">Additional Notes</Label>
              <Textarea
                id="additionalNotes"
                value={formData.additionalNotes}
                onChange={(e) => updateFormData('additionalNotes', e.target.value)}
                placeholder="Any additional information you'd like to share"
                rows={4}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (submitted && comprehensiveReport) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-green-800 flex items-center gap-2">
              <CheckCircle className="w-6 h-6" />
              Consultation Complete
            </CardTitle>
            <p className="text-green-600">Your medical report has been generated successfully.</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-4">Enhanced SOAP Note</h3>
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded border">
                  {comprehensiveReport.enhancedSoapNote || "Report generation in progress..."}
                </pre>
              </div>
            </div>
            
            <div className="flex gap-4">
              <Button 
                onClick={() => window.print()} 
                className="bg-blue-600 hover:bg-blue-700"
              >
                <FileText className="w-4 h-4 mr-2" />
                Print Report
              </Button>
              <Button 
                onClick={() => {
                  setSubmitted(false);
                  setCurrentStep(1);
                  setFormData({
                    deIdentifiedId: "",
                    gender: "",
                    age: "",
                    chronicConditions: "",
                    medicationAllergies: "",
                    pregnancyStatus: "",
                    currentMedications: "",
                    reasonForVisit: "",
                    problemStartDate: "",
                    specificTrigger: "",
                    symptomLocation: "",
                    symptomDescription: "",
                    symptomAggravators: "",
                    symptomRelievers: "",
                    symptomProgression: "",
                    selectedSymptoms: [],
                    treatmentsAttempted: "",
                    treatmentEffectiveness: "",
                    previousDiagnoses: "",
                    additionalNotes: "",
                    emergencyContact: "",
                    insuranceInfo: ""
                  });
                }}
                variant="outline"
              >
                New Consultation
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-800">
                Enhanced Medical Intake Form
              </CardTitle>
              <p className="text-gray-600 mt-2">
                Step {currentStep} of {steps.length}: {steps[currentStep - 1].description}
              </p>
            </div>
            <Badge variant="outline" className="text-sm">
              {Math.round((currentStep / steps.length) * 100)}% Complete
            </Badge>
          </div>
          
          <Progress value={(currentStep / steps.length) * 100} className="mt-4" />
        </CardHeader>
        
        <CardContent className="p-6">
          {/* Step Navigation */}
          <div className="flex items-center justify-between mb-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`
                    flex items-center justify-center w-10 h-10 rounded-full border-2
                    ${isActive ? 'bg-blue-600 border-blue-600 text-white' : 
                      isCompleted ? 'bg-green-600 border-green-600 text-white' : 
                      'bg-gray-100 border-gray-300 text-gray-500'}
                  `}>
                    {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-0.5 mx-2 ${isCompleted ? 'bg-green-600' : 'bg-gray-300'}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Step Content */}
          <div className="mb-8">
            {renderStepContent()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button
              onClick={prevStep}
              disabled={currentStep === 1}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </Button>
            
            {currentStep < steps.length ? (
              <Button
                onClick={nextStep}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  <>
                    <Activity className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Submit Consultation
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
