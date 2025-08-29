import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertCircle,
  ArrowLeft,
  Clipboard,
  FileText,
  MessageSquare,
  SendHorizontal,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import BaseLayout from "@/components/layout/BaseLayout";

export default function PatientTreatmentPage() {
  const { id: patientId } = useParams();
  const { toast } = useToast();
  const [selectedCondition, setSelectedCondition] = useState<string>("migraine");
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [customNotes, setCustomNotes] = useState<string>("");

  // Treatment protocols
  const treatmentProtocols = {
    migraine: {
      title: "🩺 Headache – Migraine",
      sections: [
        {
          title: "General",
          options: [
            "Prepare message to patient in their language (language considered the one used in the SMS-based secure messaging system)",
            "Prepare Spartan SOAP note (essential interventions, one line, no fluff, no unnecessary details)",
            "This is a complex case: put all details in subjective",
          ],
        },
        {
          title: "Investigations",
          options: ["CT scan head without contrast", "MRI brain without contrast"],
        },
        {
          title: "Abortive therapy",
          options: [
            "Sumatriptan 50 mg PO, repeat once in 2 hours PRN, max 200 mg/day, #9, REN: Ø",
            "Sumatriptan 100 mg PO, repeat once in 2 hours PRN, max 200 mg/day, #9, REN: Ø",
            "Rizatriptan 10 mg PO, repeat once in 2 hours PRN, max 30 mg/day, #9, REN: Ø",
            "Zolmitriptan 2.5 mg PO, repeat once in 2 hours PRN, max 10 mg/day, #9, REN: Ø",
            "Zolmitriptan 5 mg PO, repeat once in 2 hours PRN, max 10 mg/day, #9, REN: Ø",
            "Acetaminophen 1000 mg PO QID PRN x 14 days, #56, REN: Ø",
          ],
        },
        {
          title: "Preventive therapy",
          options: [
            "Magnesium citrate 400 mg PO daily, #30, REN: Ø",
            "Riboflavin (Vitamin B2) 400 mg PO daily, #30, REN: Ø",
            "Propranolol 40 mg PO BID daily, #60, REN: Ø",
          ],
        },
        {
          title: "Referrals",
          options: ["Referral to Neurology for management"],
        },
        {
          title: "Counseling and hydration",
          options: [
            "Counseling and hydration: Discuss avoidance of known migraine triggers (stress, caffeine, foods), regular sleep pattern, stress management, hydration ≥2 liters/day",
          ],
        },
        {
          title: "Follow-up options",
          options: [
            "• Follow-up options: 1 week",
            "• Follow-up options: 2 weeks",
            "• Follow-up options: 3 weeks",
            "• Follow-up options: 1 month",
            "• Follow-up options: 2 months",
            "• Follow-up options: 3 months",
            "• Follow-up options: 6 months",
            "• Follow-up options: after results arrive at clinic, we will reach out to you",
          ],
        },
        {
          title: "Work leave",
          options: [
            "I will prepare a work leave for you for: 1 day",
            "I will prepare a work leave for you for: 2 days",
            "I will prepare a work leave for you for: 3 days",
            "I will prepare a work leave for you for: 4 days",
            "I will prepare a work leave for you for: 5 days",
            "I will prepare a work leave for you for: 1 week",
            "I will prepare a work leave for you for: 2 weeks",
            "I will prepare a work leave for you for: 3 weeks",
          ],
        },
      ],
    },
    tension: {
      title: "🩺 Headache – Tension Type",
      sections: [
        {
          title: "General",
          options: [
            "Prepare message to patient in their language (language considered the one used in the SMS-based secure messaging system)",
            "Prepare Spartan SOAP note (essential interventions, one line, no fluff, no unnecessary details)",
            "This is a complex case: put all details in subjective",
          ],
        },
        {
          title: "Pain management (14 days)",
          options: [
            "Acetaminophen 500 mg PO QID PRN x 14 days, #56, REN: Ø",
            "Acetaminophen 1000 mg PO QID PRN x 14 days, #56, REN: Ø",
            "Ibuprofen 400 mg PO QID PRN x 14 days, #56, REN: Ø",
            "Naproxen 500 mg PO BID PRN x 14 days, #28, REN: Ø",
          ],
        },
        {
          title: "Treatment options",
          options: [
            "Physiotherapy referral for relaxation and postural techniques",
            "Massage therapy",
            "Referral to chronic pain specialist for evaluation and management",
          ],
        },
        {
          title: "Counseling and hydration",
          options: [
            "Counseling and hydration: Stress management techniques, posture improvement, regular sleep schedule, adequate hydration (≥2 liters/day)",
          ],
        },
        {
          title: "Follow-up options",
          options: [
            "• Follow-up options: 1 week",
            "• Follow-up options: 2 weeks",
            "• Follow-up options: 3 weeks",
            "• Follow-up options: 1 month",
            "• Follow-up options: 2 months",
            "• Follow-up options: 3 months",
            "• Follow-up options: 6 months",
            "• Follow-up options: after results arrive at clinic, we will reach out to you",
          ],
        },
        {
          title: "Work leave",
          options: [
            "I will prepare a work leave for you for: 1 day",
            "I will prepare a work leave for you for: 2 days",
            "I will prepare a work leave for you for: 3 days",
            "I will prepare a work leave for you for: 4 days",
            "I will prepare a work leave for you for: 5 days",
            "I will prepare a work leave for you for: 1 week",
            "I will prepare a work leave for you for: 2 weeks",
            "I will prepare a work leave for you for: 3 weeks",
          ],
        },
      ],
    },
    lowBackPain: {
      title: "🩺 Acute Low Back Pain",
      sections: [
        {
          title: "General",
          options: [
            "Prepare message to patient in their language (language considered the one used in the SMS-based secure messaging system)",
            "Prepare Spartan SOAP note (essential interventions, one line, no fluff, no unnecessary details)",
            "This is a complex case: put all details in subjective",
          ],
        },
        {
          title: "Investigations",
          options: [
            "X-ray lumbar spine (AP and lateral views)",
            "MRI lumbar spine without contrast if severe pain, neurologic deficits, or symptoms >6 weeks",
          ],
        },
        {
          title: "Pain management (14 days)",
          options: [
            "Acetaminophen 500 mg PO QID PRN x 14 days, #56, REN: Ø",
            "Acetaminophen 1000 mg PO QID PRN x 14 days, #56, REN: Ø",
            "Ibuprofen 400 mg PO QID PRN x 14 days, #56, REN: Ø",
            "Cyclobenzaprine 10 mg PO QHS PRN x 14 days, #14, REN: Ø",
            "Tramadol 50 mg PO QID PRN x 14 days, #56, REN: Ø",
            "Pregabalin 75 mg PO BID x 14 days, #28, REN: Ø",
            "Duloxetine 30 mg PO daily x 14 days, #14, REN: Ø",
            "Morphine IR 5 mg PO QID PRN x 14 days, #56, REN: Ø",
            "Oxycodone/Acetaminophen (Percocet) 5mg/325mg PO QID PRN x 14 days, #56, REN: Ø",
          ],
        },
        {
          title: "Planning",
          options: [
            "Physical therapy referral",
            "Cold laser therapy",
            "Massage therapy",
            "Kinesiology",
            "Referral to chronic pain specialist for evaluation and management",
          ],
        },
        {
          title: "Counseling and hydration",
          options: [
            "Counseling and hydration: Gentle stretching exercises, avoid prolonged sitting or heavy lifting, adequate hydration (≥2 liters water/day)",
          ],
        },
        {
          title: "Follow-up options",
          options: [
            "• Follow-up options: 1 week",
            "• Follow-up options: 2 weeks",
            "• Follow-up options: 3 weeks",
            "• Follow-up options: 1 month",
            "• Follow-up options: 2 months",
            "• Follow-up options: 3 months",
            "• Follow-up options: 6 months",
            "• Follow-up options: after results arrive at clinic, we will reach out to you",
          ],
        },
        {
          title: "Work leave",
          options: [
            "I will prepare a work leave for you for: 1 day",
            "I will prepare a work leave for you for: 2 days",
            "I will prepare a work leave for you for: 3 days",
            "I will prepare a work leave for you for: 4 days",
            "I will prepare a work leave for you for: 5 days",
            "I will prepare a work leave for you for: 1 week",
            "I will prepare a work leave for you for: 2 weeks",
            "I will prepare a work leave for you for: 3 weeks",
          ],
        },
      ],
    },
    shoulderPain: {
      title: "🩺 Shoulder Pain",
      sections: [
        {
          title: "General",
          options: [
            "Prepare message to the patient in their language (language considered to be the one used in the SMS-based secure messaging system to communicate with us)",
            "Prepare Spartan SOAP note (Make a super spartan note, no unnecessary details, no formatting, no fluff. Strict minimum like a real doctor would write. No stating 'Examen: Non réalisé'. Keep the plan to only essential interventions, ideally in one line.)",
            "This is a complex case: put all the details in the subjective part, so that we can find it in the final SOAP note.",
          ],
        },
        {
          title: "Investigations and initial evaluation",
          options: [
            "Shoulder X-ray AP, lateral, axillary views",
            "Echo-guided examination of the shoulder",
            "MRI of shoulder without contrast if persistent pain or suspicion of rotator cuff tear, labral tear, or instability",
          ],
        },
        {
          title: "Pain management (prescriptions for 14 days)",
          options: [
            "Acetaminophen 500–1000 mg PO QID PRN x 14 days",
            "Ibuprofen 400 mg PO QID PRN x 14 days",
          ],
        },
        {
          title: "Planning",
          options: [
            "Physical therapy referral for rotator cuff strengthening and stabilization",
            "Subacromial corticosteroid injection if persistent bursitis",
            "Cold laser therapy",
            "Laser therapy",
            "Short-term sling use if acute trauma (limit immobilization)",
          ],
        },
        {
          title: "Referrals",
          options: [
            "Referral to orthopedics if rotator cuff tear, labral injury, or refractory symptoms",
          ],
        },
        {
          title: "Counseling and hydration",
          options: [
            "Counseling and hydration: Counsel on maintaining gentle shoulder mobilization to avoid adhesive capsulitis, avoiding heavy lifting, maintaining hydration by drinking approximately 2–3 liters of water daily adjusted to thirst and body size.",
          ],
        },
        {
          title: "Follow-up options",
          options: [
            "• Follow-up options: 1 week",
            "• Follow-up options: 2 weeks",
            "• Follow-up options: 3 weeks",
            "• Follow-up options: 1 month",
            "• Follow-up options: 2 months",
            "• Follow-up options: 3 months",
            "• Follow-up options: 6 months",
            "• Follow-up options: after results arrive at clinic, we will reach out to you",
          ],
        },
        {
          title: "Work leave",
          options: [
            "I will prepare a work leave for you for: 1 day",
            "I will prepare a work leave for you for: 2 days",
            "I will prepare a work leave for you for: 3 days",
            "I will prepare a work leave for you for: 4 days",
            "I will prepare a work leave for you for: 5 days",
            "I will prepare a work leave for you for: 1 week",
            "I will prepare a work leave for you for: 2 weeks",
            "I will prepare a work leave for you for: 3 weeks",
          ],
        },
      ],
    },
  };

  // Initialize selected options for each condition with first two checkboxes selected by default
  useEffect(() => {
    const initialSelected: Record<string, string[]> = {};
    Object.keys(treatmentProtocols).forEach((condition) => {
      // Get the first two options for each condition (prepare message and SOAP note)
      const defaultOptions = treatmentProtocols[
        condition as keyof typeof treatmentProtocols
      ].sections[0].options.slice(0, 2);
      initialSelected[condition] = defaultOptions;
    });
    setSelectedOptions(initialSelected);
  }, []);

  const handleCheckboxChange = (condition: string, option: string) => {
    setSelectedOptions((prev) => {
      const updatedOptions = { ...prev };

      if (updatedOptions[condition].includes(option)) {
        updatedOptions[condition] = updatedOptions[condition].filter((o) => o !== option);
      } else {
        updatedOptions[condition] = [...updatedOptions[condition], option];
      }

      return updatedOptions;
    });
  };

  const handleSubmit = () => {
    // In a real app, this would send the data to the backend
    const selectedTreatments = selectedOptions[selectedCondition];

    // Show success toast
    toast({
      title: "Treatment protocol sent",
      description: `Selected ${selectedTreatments.length} options for the patient`,
    });

    // For demo purposes, log what was selected
    console.log("Selected condition:", selectedCondition);
    console.log("Selected treatments:", selectedTreatments);
    console.log("Custom notes:", customNotes);
  };

  const handleCopyToClipboard = () => {
    const selectedTreatments = selectedOptions[selectedCondition];
    const protocol = treatmentProtocols[selectedCondition as keyof typeof treatmentProtocols];

    let clipboardText = `${protocol.title}\n\n`;

    // Group selected options by their sections
    protocol.sections.forEach((section) => {
      const sectionOptions = section.options.filter((option) =>
        selectedTreatments.includes(option)
      );

      if (sectionOptions.length > 0) {
        clipboardText += `${section.title}:\n`;
        sectionOptions.forEach((option) => {
          clipboardText += `- ${option}\n`;
        });
        clipboardText += "\n";
      }
    });

    if (customNotes) {
      clipboardText += `Additional Notes:\n${customNotes}\n`;
    }

    navigator.clipboard.writeText(clipboardText);

    toast({
      title: "Copied to clipboard",
      description: "Treatment protocol has been copied to your clipboard",
    });
  };

  return (
    <BaseLayout>
      <div className="container mx-auto py-6 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Patient Treatment Protocol</h1>
            <p className="text-gray-500">
              Select recommended treatments and options for the current patient
            </p>
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft size={16} />
            Back to Patient
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Card className="bg-[#1e1e1e] border-gray-800">
            <CardHeader>
              <CardTitle>Medical Condition</CardTitle>
              <CardDescription>
                Select the medical condition to generate a treatment protocol
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="migraine" onValueChange={setSelectedCondition} className="w-full">
                <TabsList className="grid grid-cols-4 w-full bg-[#262626]">
                  <TabsTrigger value="migraine">Migraine</TabsTrigger>
                  <TabsTrigger value="tension">Tension Headache</TabsTrigger>
                  <TabsTrigger value="lowBackPain">Low Back Pain</TabsTrigger>
                  <TabsTrigger value="shoulderPain">Shoulder Pain</TabsTrigger>
                </TabsList>

                {Object.entries(treatmentProtocols).map(([key, protocol]) => (
                  <TabsContent key={key} value={key} className="mt-6">
                    <div className="space-y-8">
                      <h2 className="text-xl font-bold">{protocol.title}</h2>

                      {protocol.sections.map((section, idx) => (
                        <div key={idx} className="space-y-3">
                          <h3 className="text-lg font-medium border-b border-gray-800 pb-1">
                            {section.title}
                          </h3>
                          <div className="space-y-2 pl-2">
                            {section.options.map((option, optIdx) => (
                              <div key={optIdx} className="flex items-start space-x-2">
                                <Checkbox
                                  id={`${key}-${idx}-${optIdx}`}
                                  checked={selectedOptions[key]?.includes(option)}
                                  onCheckedChange={() => handleCheckboxChange(key, option)}
                                  className="mt-1"
                                />
                                <Label
                                  htmlFor={`${key}-${idx}-${optIdx}`}
                                  className="text-sm text-gray-300 cursor-pointer"
                                >
                                  {option}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}

                      <div className="space-y-3">
                        <h3 className="text-lg font-medium border-b border-gray-800 pb-1">
                          Additional Notes
                        </h3>
                        <Textarea
                          placeholder="Add any custom instructions or notes here..."
                          className="bg-[#262626] border-gray-700 text-white min-h-[120px]"
                          value={customNotes}
                          onChange={(e) => setCustomNotes(e.target.value)}
                        />
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-between pt-6 border-t border-gray-800">
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={handleCopyToClipboard}
              >
                <Clipboard size={16} />
                Copy to Clipboard
              </Button>

              <div className="flex gap-2">
                <Button variant="outline" className="flex items-center gap-2">
                  <FileText size={16} />
                  Save to Chart
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
                  onClick={handleSubmit}
                >
                  <SendHorizontal size={16} />
                  Send to AI Assistant
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </BaseLayout>
  );
}
