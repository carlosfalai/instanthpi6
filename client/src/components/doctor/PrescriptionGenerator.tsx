import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  AlertCircle, 
  Check, 
  Clipboard, 
  FileSignature, 
  FileText, 
  Pill, 
  Printer, 
  Send, 
  Phone 
} from "lucide-react";
import SignaturePinModal from "./SignaturePinModal";
import { DocumentTemplate } from "./DocumentTemplateEditor";

interface Patient {
  id: string;
  name: string;
  dateOfBirth: string;
  phoneNumber: string;
  email: string;
  pharmacy?: {
    name: string;
    faxNumber: string;
    address: string;
  };
}

interface Medication {
  name: string;
  dosage: string;
  instructions: string;
  quantity: string;
  refills: string;
}

interface PrescriptionGeneratorProps {
  patient: Patient;
  doctorData: {
    name: string;
    licenseNumber: string;
    hasSignature: boolean;
  };
  aiGeneratedInstructions?: string;
  defaultTemplate?: DocumentTemplate;
  onSendToPatient: (prescription: PrescriptionData) => Promise<boolean>;
  onSendToPharmacy: (prescription: PrescriptionData) => Promise<boolean>;
  onRequestPharmacyInfo: () => void;
}

export interface PrescriptionData {
  patientId: string;
  patientName: string;
  patientDOB: string;
  doctorName: string;
  doctorLicense: string;
  medications: Medication[];
  notes: string;
  signatureId?: string;
  signatureTimestamp?: string;
  pharmacy?: {
    name: string;
    faxNumber: string;
    address: string;
  };
}

const PrescriptionGenerator: React.FC<PrescriptionGeneratorProps> = ({
  patient,
  doctorData,
  aiGeneratedInstructions,
  defaultTemplate,
  onSendToPatient,
  onSendToPharmacy,
  onRequestPharmacyInfo,
}) => {
  const { toast } = useToast();
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [isVerifyingPin, setIsVerifyingPin] = useState<boolean>(false);
  const [currentAction, setCurrentAction] = useState<"patient" | "pharmacy" | null>(null);
  const [notes, setNotes] = useState<string>("");
  const [medications, setMedications] = useState<Medication[]>([
    {
      name: "",
      dosage: "",
      instructions: "",
      quantity: "",
      refills: "0",
    },
  ]);

  // Check if patient has pharmacy info
  const hasPharmacy = !!patient.pharmacy?.faxNumber;

  // Initialize medication fields from AI instructions if available
  useEffect(() => {
    if (aiGeneratedInstructions) {
      // Try to extract medication information from AI instructions
      // This is a simplified example - in a real app, you'd use more sophisticated parsing
      const lines = aiGeneratedInstructions.split('\n');
      const extractedMeds: Medication[] = [];
      
      let currentMed: Partial<Medication> = {};
      
      lines.forEach(line => {
        if (line.includes('Name:') || line.includes('Medication:')) {
          // If we already have a medication being built, save it before starting a new one
          if (currentMed.name) {
            extractedMeds.push({
              name: currentMed.name || "",
              dosage: currentMed.dosage || "",
              instructions: currentMed.instructions || "",
              quantity: currentMed.quantity || "",
              refills: currentMed.refills || "0",
            });
          }
          
          // Start a new medication
          currentMed = {
            name: line.split(':')[1]?.trim() || "",
          };
        } else if (line.toLowerCase().includes('dosage:')) {
          currentMed.dosage = line.split(':')[1]?.trim() || "";
        } else if (line.toLowerCase().includes('instructions:') || line.toLowerCase().includes('sig:')) {
          currentMed.instructions = line.split(':')[1]?.trim() || "";
        } else if (line.toLowerCase().includes('quantity:') || line.toLowerCase().includes('qty:')) {
          currentMed.quantity = line.split(':')[1]?.trim() || "";
        } else if (line.toLowerCase().includes('refills:')) {
          currentMed.refills = line.split(':')[1]?.trim() || "0";
        }
      });
      
      // Add the last medication if it exists
      if (currentMed.name) {
        extractedMeds.push({
          name: currentMed.name || "",
          dosage: currentMed.dosage || "",
          instructions: currentMed.instructions || "",
          quantity: currentMed.quantity || "",
          refills: currentMed.refills || "0",
        });
      }
      
      if (extractedMeds.length > 0) {
        setMedications(extractedMeds);
      }
      
      // Set any additional notes
      const notesMatch = aiGeneratedInstructions.match(/Notes:([\s\S]+?)(?:\n\n|$)/);
      if (notesMatch) {
        setNotes(notesMatch[1].trim());
      }
    }
  }, [aiGeneratedInstructions]);

  const handleAddMedication = () => {
    setMedications([
      ...medications,
      {
        name: "",
        dosage: "",
        instructions: "",
        quantity: "",
        refills: "0",
      },
    ]);
  };

  const handleRemoveMedication = (index: number) => {
    if (medications.length > 1) {
      setMedications(medications.filter((_, i) => i !== index));
    }
  };

  const handleMedicationChange = (
    index: number,
    field: keyof Medication,
    value: string
  ) => {
    setMedications(
      medications.map((med, i) =>
        i === index ? { ...med, [field]: value } : med
      )
    );
  };

  const validatePrescription = (): boolean => {
    // Check if any medication fields are empty
    for (const med of medications) {
      if (!med.name || !med.dosage || !med.instructions || !med.quantity) {
        toast({
          variant: "destructive",
          title: "Incomplete medication",
          description: "Please fill in all medication details",
        });
        return false;
      }
    }
    
    // Check doctor license
    if (!doctorData.licenseNumber) {
      toast({
        variant: "destructive",
        title: "Missing license number",
        description: "Please add your medical license number in doctor settings",
      });
      return false;
    }
    
    return true;
  };

  const handleSign = (action: "patient" | "pharmacy") => {
    if (!validatePrescription()) return;
    
    // Check if doctor has signature
    if (!doctorData.hasSignature) {
      toast({
        variant: "destructive",
        title: "No signature found",
        description: "Please create a signature in doctor settings",
      });
      return;
    }
    
    // If sending to pharmacy but no pharmacy info
    if (action === "pharmacy" && !hasPharmacy) {
      onRequestPharmacyInfo();
      return;
    }
    
    setCurrentAction(action);
    setIsPinModalOpen(true);
  };

  const handleVerifyPin = async (pin: string) => {
    setIsVerifyingPin(true);
    
    try {
      // In a real app, you would verify the PIN against a stored hash
      // Here we simulate the verification process
      
      // Create the prescription data
      const prescriptionData: PrescriptionData = {
        patientId: patient.id,
        patientName: patient.name,
        patientDOB: patient.dateOfBirth,
        doctorName: doctorData.name,
        doctorLicense: doctorData.licenseNumber,
        medications: medications,
        notes: notes,
        signatureId: "sig_" + Date.now(), // Would be a real signature ID in production
        signatureTimestamp: new Date().toISOString(),
        pharmacy: patient.pharmacy,
      };
      
      // Send to appropriate destination
      let success = false;
      
      if (currentAction === "patient") {
        success = await onSendToPatient(prescriptionData);
      } else if (currentAction === "pharmacy") {
        success = await onSendToPharmacy(prescriptionData);
      }
      
      if (success) {
        toast({
          title: `Prescription ${currentAction === "patient" ? "sent to patient" : "faxed to pharmacy"}`,
          description: `Successfully ${currentAction === "patient" ? "sent prescription to patient" : "faxed prescription to pharmacy"}`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error sending prescription",
          description: `Failed to ${currentAction === "patient" ? "send to patient" : "fax to pharmacy"}`,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error processing signature",
        description: "There was an error processing your signature",
      });
    } finally {
      setIsVerifyingPin(false);
      setIsPinModalOpen(false);
      setCurrentAction(null);
    }
  };

  const renderMedicationForm = (medication: Medication, index: number) => {
    return (
      <Card key={index} className="bg-[#1e1e1e] border-gray-800 mb-4">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-md flex items-center">
              <Pill className="mr-2 h-4 w-4" />
              Medication #{index + 1}
            </CardTitle>
            {medications.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveMedication(index)}
                className="h-8 text-red-500 hover:text-red-700 hover:bg-red-200/10"
              >
                Remove
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pb-4 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor={`med-name-${index}`}>Medication Name</Label>
              <Input
                id={`med-name-${index}`}
                value={medication.name}
                onChange={(e) =>
                  handleMedicationChange(index, "name", e.target.value)
                }
                className="bg-[#262626] border-gray-700"
                placeholder="Medication name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`med-dosage-${index}`}>Dosage</Label>
              <Input
                id={`med-dosage-${index}`}
                value={medication.dosage}
                onChange={(e) =>
                  handleMedicationChange(index, "dosage", e.target.value)
                }
                className="bg-[#262626] border-gray-700"
                placeholder="e.g., 500mg"
              />
            </div>
          </div>
          
          <div className="space-y-2 mb-4">
            <Label htmlFor={`med-instructions-${index}`}>Instructions (Sig)</Label>
            <Textarea
              id={`med-instructions-${index}`}
              value={medication.instructions}
              onChange={(e) =>
                handleMedicationChange(index, "instructions", e.target.value)
              }
              className="bg-[#262626] border-gray-700"
              placeholder="e.g., Take 1 tablet by mouth twice daily with food"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`med-quantity-${index}`}>Quantity</Label>
              <Input
                id={`med-quantity-${index}`}
                value={medication.quantity}
                onChange={(e) =>
                  handleMedicationChange(index, "quantity", e.target.value)
                }
                className="bg-[#262626] border-gray-700"
                placeholder="e.g., 30"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`med-refills-${index}`}>Refills</Label>
              <Input
                id={`med-refills-${index}`}
                value={medication.refills}
                onChange={(e) =>
                  handleMedicationChange(index, "refills", e.target.value)
                }
                className="bg-[#262626] border-gray-700"
                type="number"
                min="0"
                placeholder="0"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="bg-[#1e1e1e] border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            Prescription Information
          </CardTitle>
          <CardDescription>
            Create a prescription for {patient.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-1">Patient Information</h3>
              <div className="p-3 bg-[#262626] rounded-md">
                <p className="mb-1"><span className="font-semibold">Name:</span> {patient.name}</p>
                <p className="mb-1"><span className="font-semibold">DOB:</span> {patient.dateOfBirth}</p>
                <p><span className="font-semibold">Phone:</span> {patient.phoneNumber}</p>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-1">Pharmacy Information</h3>
              {hasPharmacy ? (
                <div className="p-3 bg-[#262626] rounded-md">
                  <p className="mb-1"><span className="font-semibold">Name:</span> {patient.pharmacy?.name}</p>
                  <p className="mb-1"><span className="font-semibold">Fax:</span> {patient.pharmacy?.faxNumber}</p>
                  <p><span className="font-semibold">Address:</span> {patient.pharmacy?.address}</p>
                </div>
              ) : (
                <div className="p-3 bg-[#262626] rounded-md flex items-center">
                  <AlertCircle className="text-yellow-500 mr-2 h-5 w-5 flex-shrink-0" />
                  <p className="text-yellow-500 text-sm">
                    No pharmacy information available. When sending, you'll need to ask the patient for their pharmacy details.
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-md font-medium">Medications</h3>
              <Button
                onClick={handleAddMedication}
                variant="outline"
                size="sm"
                className="h-8"
              >
                Add Medication
              </Button>
            </div>
            
            {medications.map((med, index) => renderMedicationForm(med, index))}
          </div>
          
          <div className="space-y-2 mb-4">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-[#262626] border-gray-700"
              placeholder="Additional instructions or notes"
              rows={3}
            />
          </div>
          
          <div className="flex items-center p-3 bg-blue-900/20 border border-blue-800 rounded-md">
            <FileSignature className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-blue-500">Prescriber Information</h3>
              <p className="text-sm text-gray-400 mt-1">
                <span className="font-semibold">Dr. {doctorData.name}</span> • License: {doctorData.licenseNumber || "Not set"}
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t border-gray-800 pt-6 flex-wrap gap-3">
          <Button
            variant="outline"
            className="flex items-center"
            onClick={() => {
              // Create simple text representation
              const prescriptionText = `PRESCRIPTION\n\nPatient: ${patient.name}\nDOB: ${
                patient.dateOfBirth
              }\n\nMedications:\n${medications
                .map(
                  (med, i) =>
                    `${i + 1}. ${med.name} ${med.dosage}\n   Sig: ${
                      med.instructions
                    }\n   Quantity: ${med.quantity}\n   Refills: ${med.refills}`
                )
                .join("\n\n")}\n\n${notes ? `Notes: ${notes}\n\n` : ""}Prescriber: Dr. ${
                doctorData.name
              }\nLicense: ${doctorData.licenseNumber}`;
              
              navigator.clipboard.writeText(prescriptionText);
              toast({
                title: "Copied to clipboard",
                description: "Prescription text has been copied to clipboard",
              });
            }}
          >
            <Clipboard className="mr-2 h-4 w-4" />
            Copy Text
          </Button>
          
          <Button
            variant="outline"
            className="flex items-center"
            onClick={() => {
              // In a real app, this would open a print preview
              toast({
                title: "Print preview",
                description: "Print functionality would open here",
              });
            }}
          >
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          
          <div className="ml-auto flex flex-wrap gap-3">
            <Button
              className="bg-blue-600 hover:bg-blue-700 flex items-center"
              onClick={() => handleSign("patient")}
            >
              <Send className="mr-2 h-4 w-4" />
              Send to Patient
            </Button>
            
            <Button
              className="bg-green-600 hover:bg-green-700 flex items-center"
              onClick={() => handleSign("pharmacy")}
              disabled={!hasPharmacy}
            >
              <Phone className="mr-2 h-4 w-4" />
              Send to Pharmacy
            </Button>
          </div>
        </CardFooter>
      </Card>
      
      {isPinModalOpen && (
        <SignaturePinModal
          isOpen={isPinModalOpen}
          isVerifying={true}
          onClose={() => {
            setIsPinModalOpen(false);
            setCurrentAction(null);
          }}
          onCreatePin={() => {}} // Not used in verify mode
          onVerifyPin={handleVerifyPin}
          isProcessing={isVerifyingPin}
        />
      )}
    </div>
  );
};

export default PrescriptionGenerator;