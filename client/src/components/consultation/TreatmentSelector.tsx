import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface Treatment {
  id: string;
  name: string;
  type: "medication" | "test" | "procedure";
  details?: string;
}

interface TreatmentOption {
  id: string;
  category: string;
  treatments: Treatment[];
}

interface TreatmentSelectorProps {
  patientId: number;
  onSendMessage: (message: string, messageType: string) => void;
  isSending: boolean;
}

// Common treatment options that can be selected
const TREATMENT_OPTIONS: TreatmentOption[] = [
  {
    id: "pharyngitis",
    category: "Pharyngitis/Sore Throat",
    treatments: [
      { id: "naproxen", name: "Naproxen 500mg BID x 10 days PRN", type: "medication" },
      { id: "amoxicillin", name: "Amoxicillin 500mg BID x 10 days", type: "medication" },
      { id: "strep-pcr", name: "Strep Throat PCR", type: "test" },
      { id: "throat-culture", name: "Throat Culture", type: "test" },
      { id: "monospot", name: "Monospot Test", type: "test" },
    ],
  },
  {
    id: "cold-flu",
    category: "Cold & Flu",
    treatments: [
      { id: "tylenol", name: "Tylenol 500mg q4-6h PRN for fever/pain", type: "medication" },
      { id: "gelomyrtol", name: "Gelomyrtol 300mg TID x 10 days", type: "medication" },
      { id: "cough-syrup", name: "Dextromethorphan-based cough syrup PRN", type: "medication" },
      { id: "flu-test", name: "Influenza Rapid Test", type: "test" },
    ],
  },
  {
    id: "urinary",
    category: "Urinary Tract Infections",
    treatments: [
      { id: "nitrofurantoin", name: "Nitrofurantoin 100mg BID x 7 days", type: "medication" },
      { id: "ciprofloxacin", name: "Ciprofloxacin 500mg BID x 7 days", type: "medication" },
      { id: "urinalysis", name: "Urinalysis", type: "test" },
      { id: "urine-culture", name: "Urine Culture", type: "test" },
    ],
  },
  {
    id: "sti",
    category: "STI Testing & Treatment",
    treatments: [
      { id: "azithromycin", name: "Azithromycin 1g single dose", type: "medication" },
      { id: "doxycycline", name: "Doxycycline 100mg BID x 7 days", type: "medication" },
      { id: "comprehensive-sti", name: "Comprehensive STI Panel", type: "test" },
      { id: "hiv-testing", name: "HIV Testing", type: "test" },
    ],
  },
];

export default function TreatmentSelector({
  patientId,
  onSendMessage,
  isSending,
}: TreatmentSelectorProps) {
  const [selectedTreatments, setSelectedTreatments] = useState<string[]>([]);
  const [customMessage, setCustomMessage] = useState("");
  const { toast } = useToast();

  const handleTreatmentToggle = (treatmentId: string) => {
    setSelectedTreatments((prevSelected) => {
      if (prevSelected.includes(treatmentId)) {
        return prevSelected.filter((id) => id !== treatmentId);
      } else {
        return [...prevSelected, treatmentId];
      }
    });
  };

  const handleSendTreatmentMessage = () => {
    if (selectedTreatments.length === 0) {
      toast({
        title: "No treatments selected",
        description: "Please select at least one treatment option",
        variant: "destructive",
      });
      return;
    }

    // Find the full details of selected treatments
    const selectedDetails = selectedTreatments.map((id) => {
      let treatment: Treatment | undefined;

      for (const option of TREATMENT_OPTIONS) {
        treatment = option.treatments.find((t) => t.id === id);
        if (treatment) break;
      }

      return treatment?.name || id;
    });

    // Create categorized lists
    const medications = selectedDetails.filter(
      (name) =>
        name.toLowerCase().includes("mg") ||
        name.toLowerCase().includes("prn") ||
        name.toLowerCase().includes("bid") ||
        name.toLowerCase().includes("tid")
    );

    const tests = selectedDetails.filter(
      (name) =>
        name.toLowerCase().includes("test") ||
        name.toLowerCase().includes("culture") ||
        name.toLowerCase().includes("panel")
    );

    // Generate message
    let message = "";

    if (medications.length > 0) {
      message += `Je vous prescris le traitement suivant: ${medications.join(", ")}. `;

      // Special note for Gelomyrtol if prescribed
      if (selectedTreatments.includes("gelomyrtol")) {
        message += `Le Gelomyrtol est un produit naturel composé de thym, eucalyptus, menthe et myrte, qui agit comme antimucolytique et possède un léger effet anti-infectieux. `;
      }
    }

    if (tests.length > 0) {
      message += `Je recommande les tests suivants: ${tests.join(", ")}. `;
    }

    // Add pharmacy message
    message += "Vos prescriptions seront envoyées à votre pharmacie. ";

    // Add custom message if provided
    if (customMessage.trim()) {
      message += customMessage;
    } else {
      message += "Avez-vous des questions?";
    }

    // Send the message
    onSendMessage(message, "MEDICAL");
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Sélectionner les traitements</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {TREATMENT_OPTIONS.map((option) => (
          <div key={option.id} className="space-y-3">
            <h3 className="font-medium text-lg">{option.category}</h3>
            <div className="grid grid-cols-1 gap-3">
              {option.treatments.map((treatment) => (
                <div key={treatment.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={treatment.id}
                    checked={selectedTreatments.includes(treatment.id)}
                    onCheckedChange={() => handleTreatmentToggle(treatment.id)}
                  />
                  <Label
                    htmlFor={treatment.id}
                    className="cursor-pointer text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {treatment.name}
                    <span className="ml-2 text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded-full">
                      {treatment.type === "medication"
                        ? "Médicament"
                        : treatment.type === "test"
                          ? "Test"
                          : "Procédure"}
                    </span>
                  </Label>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="space-y-2">
          <Label htmlFor="custom-message">Message personnalisé (optionnel)</Label>
          <Textarea
            id="custom-message"
            placeholder="Ajoutez des instructions supplémentaires ici..."
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            className="min-h-[100px]"
          />
        </div>

        <Button className="w-full" onClick={handleSendTreatmentMessage} disabled={isSending}>
          {isSending ? "Envoi en cours..." : "Envoyer le message de traitement"}
        </Button>
      </CardContent>
    </Card>
  );
}
