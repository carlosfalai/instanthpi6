import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/lib/supabase";

export function PatientIntakeForm() {
  const [deIdentifiedId, setDeIdentifiedId] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [reasonForVisit, setReasonForVisit] = useState("");
  const [problemStartDate, setProblemStartDate] = useState("");
  const [specificTrigger, setSpecificTrigger] = useState("");
  const [symptomLocation, setSymptomLocation] = useState("");
  const [symptomDescription, setSymptomDescription] = useState("");
  const [symptomAggravators, setSymptomAggravators] = useState("");
  const [symptomRelievers, setSymptomRelievers] = useState("");
  const [symptomProgression, setSymptomProgression] = useState("");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [treatmentsAttempted, setTreatmentsAttempted] = useState("");
  const [treatmentEffectiveness, setTreatmentEffectiveness] = useState("");
  const [chronicConditions, setChronicConditions] = useState("");
  const [medicationAllergies, setMedicationAllergies] = useState("");
  const [pregnancyStatus, setPregnancyStatus] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [patientAnswers, setPatientAnswers] = useState<{[key: number]: string}>({});
  const [hpiConfirmed, setHpiConfirmed] = useState<boolean | null>(null);
  const [hpiCorrections, setHpiCorrections] = useState<string>("");
  const [enhancedSoapNote, setEnhancedSoapNote] = useState<string>("");
  const [doctorHpiSummary, setDoctorHpiSummary] = useState<string>("");
  const [triageResult, setTriageResult] = useState<any>(null);
  const [comprehensiveReport, setComprehensiveReport] = useState<any>(null);
  const [subjectivePrintHtml, setSubjectivePrintHtml] = useState<string>("");

  // Handle patient answer input
  const handleAnswerChange = (questionIndex: number, answer: string) => {
    setPatientAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
  };

  // Generate Subjective-only printable document for physician handoff
  const generateSubjectivePrintable = async () => {
    try {
      const patientId = deIdentifiedId || generateDeIdentifiedId();
      
      const response = await fetch('/api/patient-hpi-print', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patient_id: patientId,
          language: 'fr',
          demographics: {
            age: parseInt(age) || 0,
            gender: gender,
            sex: gender
          },
          hpi_summary: triageResult?.hpi_summary || "Résumé de consultation généré par l'IA",
          hpi_confirmed: hpiConfirmed,
          hpi_corrections: hpiCorrections,
          follow_up_answers: patientAnswers
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.print_html) {
          setSubjectivePrintHtml(data.print_html);
        }
      }
    } catch (error) {
      console.error('Error generating Subjective printable:', error);
    }
  };

  // Save patient answers and generate enhanced SOAP note
  const savePatientAnswers = async () => {
    try {
      const patientId = deIdentifiedId || generateDeIdentifiedId();
      
      // Save patient answers to database
      const { error: saveError } = await supabase
        .from('patient_answers')
        .insert({
          patient_id: patientId,
          answers: patientAnswers,
          hpi_confirmed: hpiConfirmed,
          hpi_corrections: hpiCorrections,
          created_at: new Date().toISOString()
        });

      if (saveError) {
        console.error('Error saving patient answers:', saveError);
        return;
      }

      // Generate enhanced SOAP note
      const soapResponse = await fetch('/api/generate-enhanced-soap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patient_id: patientId,
          hpi_summary: triageResult?.hpi_summary || "Résumé de consultation généré par l'IA",
          patient_answers: patientAnswers,
          triage_result: triageResult,
          hpi_corrections: hpiCorrections
        }),
      });

      if (soapResponse.ok) {
        const soapData = await soapResponse.json();
        setEnhancedSoapNote(soapData.enhanced_soap_note);
        setDoctorHpiSummary(soapData.doctor_hpi_summary);
      }
    } catch (error) {
      console.error('Error saving patient answers:', error);
    }
  };

  // Save comprehensive report to database for doctor access
  const saveComprehensiveReportToDatabase = async (comprehensiveData: any) => {
    try {
      const patientId = deIdentifiedId || generateDeIdentifiedId();
      
      const { error } = await supabase
        .from('comprehensive_reports')
        .insert({
          patient_id: patientId,
          report_data: comprehensiveData,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving comprehensive report:', error);
      } else {
        console.log('Comprehensive report saved successfully');
      }
    } catch (error) {
      console.error('Error saving comprehensive report:', error);
    }
  };

  const generateDeIdentifiedId = () => {
    // Letter+digit pairs × 5 (matches original InstantHPI Formsite logic)
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    let code = "";
    for (let i = 0; i < 5; i++) {
      const L = letters.charAt(Math.floor(Math.random() * letters.length));
      const D = numbers.charAt(Math.floor(Math.random() * numbers.length));
      code += L + D;
    }
    setDeIdentifiedId(code);
    return code;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const patientId = deIdentifiedId || generateDeIdentifiedId();

      // Prepare patient data
      const patientData = {
        patient_id: patientId,
        gender,
        age: parseInt(age) || 0,
        chief_complaint: reasonForVisit,
        problem_start_date: problemStartDate,
        specific_trigger: specificTrigger,
        symptom_location: symptomLocation,
        symptom_description: symptomDescription,
        symptom_aggravators: symptomAggravators,
        symptom_relievers: symptomRelievers,
        symptom_progression: symptomProgression,
        selected_symptoms: selectedSymptoms,
        treatments_attempted: treatmentsAttempted,
        treatment_effectiveness: treatmentEffectiveness,
        chronic_conditions: chronicConditions,
        medication_allergies: medicationAllergies,
        pregnancy_status: pregnancyStatus,
        additional_notes: additionalNotes,
        severity: 5, // Default severity
      };

      // Call comprehensive triage API
      const triageResponse = await fetch('/api/comprehensive-triage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patientData),
      });

      if (triageResponse.ok) {
        const triageData = await triageResponse.json();
        setTriageResult(triageData);
        
        // Store comprehensive report for doctor
        setComprehensiveReport(triageData);
        
        // Save comprehensive report to database for doctor access
        await saveComprehensiveReportToDatabase(triageData);
        
      setSubmitted(true);
          } else {
        console.error('Triage API failed');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  // Render submitted state with triage results
  if (submitted && triageResult) {
    const hpiSummary = triageResult?.hpi_summary || triageResult?.full_analysis || 
      `Niveau de triage: ${triageResult?.triage_level || 'N/A'}
Score d'urgence: ${triageResult?.urgency_score || 'N/A'}/10
Raison: ${triageResult?.reasoning || 'Analyse en cours'}
Action recommandée: ${triageResult?.recommended_action || 'Consultation médicale requise'}`;

    const followUpQuestions = triageResult?.follow_up_questions || [
      "Avez-vous des douleurs thoraciques ou des difficultés respiratoires?",
      "Avez-vous eu de la fièvre dans les dernières 24 heures?",
      "Vos symptômes vous réveillent-ils la nuit?",
      "Avez-vous voyagé récemment?",
      "Prenez-vous des médicaments actuellement?",
      "Avez-vous des antécédents familiaux pertinents?",
      "Votre appétit a-t-il changé?",
      "Avez-vous perdu du poids récemment?",
      "Avez-vous eu des étourdissements ou des pertes de conscience?",
      "Y a-t-il quelque chose d'autre que vous aimeriez mentionner?",
    ];

    return (
      <div className="max-w-4xl mx-auto p-8 print:p-0">
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-8 print:shadow-none print:border-0 print:p-4">
          {/* Patient ID, Priority Level, Consultation Location */}
          <div className="mb-6 print:mb-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3 print:gap-2">
              <div className="text-center p-4 bg-blue-50 rounded-lg print:bg-white print:border print:border-gray-400 print:p-2">
                <h3 className="font-bold text-blue-900 mb-2 print:text-sm print:mb-1">
                  🆔 ID Patient
                </h3>
                <p className="text-2xl font-mono font-bold text-blue-700 print:text-lg">
                {deIdentifiedId}
                </p>
              </div>
            </div>
          </div>

          {/* HPI Confirmation Section for Patient */}
          <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6 mb-6 print:bg-white print:border print:border-gray-400 print:p-3 print:mb-3 print:break-inside-avoid">
            <h3 className="font-bold text-lg text-blue-900 mb-4 print:text-sm print:mb-2">
              📋 Résumé de votre consultation - À CONFIRMER
            </h3>
            <div className="bg-white p-4 rounded border border-blue-200 mb-4 print:p-2 print:mb-2 print:text-xs">
              <p className="text-sm leading-relaxed whitespace-pre-line print:text-xs print:leading-tight">
                {hpiSummary}
              </p>
            </div>

            <div className="print:block">
              <p className="font-semibold text-blue-900 mb-3 print:text-xs print:mb-1">
                Cette information est-elle correcte?
              </p>
              <div className="flex gap-8 mb-4 print:gap-4 print:mb-2">
                <label className="flex items-center gap-3 print:gap-1">
                  <input
                    type="radio"
                    name="hpi-confirmation"
                    value="yes"
                    checked={hpiConfirmed === true}
                    onChange={() => setHpiConfirmed(true)}
                    className="w-5 h-5 print:w-4 print:h-4 print:border-2 print:border-black"
                  />
                  <span className="text-lg font-medium print:text-xs">✓ OUI</span>
                </label>
                <label className="flex items-center gap-3 print:gap-1">
                  <input
                    type="radio"
                    name="hpi-confirmation"
                    value="no"
                    checked={hpiConfirmed === false}
                    onChange={() => setHpiConfirmed(false)}
                    className="w-5 h-5 print:w-4 print:h-4 print:border-2 print:border-black"
                  />
                  <span className="text-lg font-medium print:text-xs">✗ NON</span>
                </label>
              </div>

              <div className="mt-4 print:mt-2">
                <p className="font-semibold text-blue-900 mb-2 print:text-xs print:mb-1">
                  Corrections:
                </p>
                <Textarea
                  value={hpiCorrections}
                  onChange={(e) => setHpiCorrections(e.target.value)}
                  placeholder="Si quelque chose n'est pas correct, veuillez le corriger ici..."
                  className="w-full p-3 border border-blue-300 rounded-lg resize-none print:p-1 print:text-xs"
                  rows={4}
                />
              </div>
            </div>
          </div>

          {/* 10 Follow-up Questions Section */}
          <div className="bg-green-50 border-2 border-green-300 rounded-lg p-6 mb-6 print:bg-white print:border print:border-gray-400 print:p-3 print:mb-2 print:break-inside-avoid">
            <h3 className="font-bold text-lg text-green-900 mb-4 print:text-sm print:mb-2">
              📝 Questions importantes
            </h3>
            <p className="text-sm text-green-800 mb-4 print:hidden">
              Veuillez répondre à ces questions. Vos réponses aideront le médecin.
            </p>

            <div className="space-y-4 print:space-y-1">
              {followUpQuestions.slice(0, 10).map((question, index) => (
                <div key={index} className="print:break-inside-avoid">
                  <p className="font-medium text-green-900 mb-2 print:text-xs print:mb-1">
                    {index + 1}. {question}
                  </p>
                  <textarea
                    value={patientAnswers[index] || ''}
                    onChange={(e) => handleAnswerChange(index, e.target.value)}
                    placeholder="Votre réponse..."
                    className="w-full p-3 border border-green-300 rounded-lg resize-none print:p-1 print:text-xs print:border print:border-gray-400"
                    rows={2}
                  />
                </div>
              ))}
            </div>

            {/* Save Answers Button */}
            <div className="mt-6 print:hidden">
              <Button
                onClick={async () => {
                  await savePatientAnswers();
                  // Generate Subjective-only printable after saving
                  await generateSubjectivePrintable();
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                Sauvegarder mes réponses et générer le rapport médical
              </Button>
            </div>

            {/* Subjective-only Printable Document for Physician */}
            {subjectivePrintHtml && (
              <div className="bg-cyan-50 border-2 border-cyan-300 rounded-lg p-6 mb-6 print:hidden">
                <h3 className="font-bold text-lg text-cyan-900 mb-4">
                  📄 Document pour le Médecin (Sujet uniquement)
                </h3>
                <p className="text-sm text-cyan-800 mb-4">
                  Ce document contient uniquement votre historique confirmé (Subjectif) pour le médecin.
                </p>
                
                <div className="flex gap-4 justify-center">
                  <Button
                    onClick={() => {
                      const w = window.open("", "_blank");
                      if (w) {
                        w.document.open();
                        w.document.write(subjectivePrintHtml);
                        w.document.close();
                      }
                    }}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2"
                  >
                    🖨️ Ouvrir et Imprimer le Document Médical
                  </Button>
                </div>
              </div>
            )}

            {/* Patient's Printable Medical Document */}
            {enhancedSoapNote && (
              <div className="bg-white border-2 border-gray-300 rounded-lg p-6 mb-6 print:border-0 print:p-4 print:mb-0 print:break-inside-avoid">
                <h3 className="font-bold text-lg text-gray-900 mb-4 print:text-sm print:mb-2">
                  📄 Document médical pour votre médecin
                </h3>
                
                {/* Enhanced SOAP Note for Doctor */}
                <div className="bg-purple-50 p-4 rounded border mb-4 print:bg-white print:border print:border-gray-400 print:p-3 print:mb-3">
                  <h4 className="font-semibold text-gray-800 mb-2 print:text-xs print:mb-1">
                    Rapport médical complet pour votre médecin:
                  </h4>
                  <pre className="text-sm leading-relaxed whitespace-pre-wrap print:text-xs print:leading-tight">
                    {enhancedSoapNote}
                  </pre>
                </div>

                {/* Instructions for Patient */}
                <div className="bg-yellow-50 border border-orange-200 p-4 rounded mb-4 print:bg-white print:border print:border-gray-400 print:p-3 print:mb-3">
                  <div className="flex items-start gap-2">
                    <span className="text-yellow-600 text-lg print:text-sm">⚠️</span>
                    <div className="text-sm print:text-xs">
                      <p className="font-semibold text-gray-800 mb-1 print:text-xs">
                        Instructions importantes:
                      </p>
                      <ol className="list-decimal list-inside space-y-1 text-gray-700 print:text-xs">
                        <li>Imprimez ce document</li>
                        <li>Apportez-le à votre rendez-vous médical</li>
                        <li>Remettez-le à l'infirmière de triage</li>
                        <li>Ce document facilite votre prise en charge mais ne remplace PAS l'évaluation médicale</li>
                        <li>En cas d'urgence, appelez le 911</li>
                      </ol>
                    </div>
                  </div>
                </div>

                {/* Print Button */}
                <div className="flex gap-4 justify-center print:hidden">
                  <Button
                    onClick={() => window.print()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                  >
                    🖨️ IMPRIMER MAINTENANT
                  </Button>
                  <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    className="px-6 py-2"
                  >
                    Nouvelle Consultation
                  </Button>
                </div>
              </div>
            )}

            {/* Enhanced SOAP Note Display */}
            {enhancedSoapNote && (
              <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-6 mb-6 print:bg-white print:border print:border-gray-400 print:p-3 print:mb-2 print:break-inside-avoid">
                <h3 className="font-bold text-lg text-purple-900 mb-4 print:text-sm print:mb-2">
                  📄 Rapport médical complet pour votre médecin
                </h3>
                <div className="bg-white p-4 rounded border border-purple-200 mb-4 print:p-2 print:mb-2 print:text-xs">
                  <pre className="text-sm leading-relaxed whitespace-pre-wrap print:text-xs print:leading-tight">
                    {enhancedSoapNote}
                  </pre>
              </div>
                <Button
                  onClick={() => window.print()}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white print:hidden"
                >
                  Imprimer ce rapport pour votre médecin
                </Button>
            </div>
            )}

            {/* Doctor HPI Summary */}
            {doctorHpiSummary && (
              <div className="bg-indigo-50 border-2 border-indigo-300 rounded-lg p-6 mb-6 print:bg-white print:border print:border-gray-400 print:p-3 print:mb-2 print:break-inside-avoid">
                <h3 className="font-bold text-lg text-indigo-900 mb-4 print:text-sm print:mb-2">
                  📋 Résumé HPI pour le médecin (copier-coller)
                </h3>
                <div className="bg-white p-4 rounded border border-indigo-200 mb-4 print:p-2 print:mb-2 print:text-xs">
                  <textarea
                    value={doctorHpiSummary}
                    readOnly
                    className="w-full h-32 p-3 border border-gray-300 rounded text-sm resize-none print:text-xs"
                    onClick={(e) => e.currentTarget.select()}
                  />
            </div>
                <p className="text-sm text-indigo-700 print:text-xs">
                  Copiez ce texte et collez-le dans votre conversation avec le médecin.
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-4 print:hidden">
            <Button
              onClick={() => {
                setSubmitted(false);
                setTriageResult(null);
                setPatientAnswers({});
                setHpiConfirmed(null);
                setHpiCorrections("");
                setEnhancedSoapNote("");
                setDoctorHpiSummary("");
              }}
              variant="outline"
              className="flex-1"
            >
              Nouveau Patient
            </Button>
            <Button
              onClick={() => window.print()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Imprimer le Document
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Render normal form
  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-8 bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        {/* Patient Identification */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Identification du Patient</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="patient-id">ID Patient (Généré automatiquement)</Label>
              <div className="flex gap-2">
              <Input
                  id="patient-id"
                value={deIdentifiedId}
                readOnly
                placeholder="Click generate to create ID"
                className="flex-1 font-mono text-lg bg-gray-50"
              />
              <Button
                type="button"
                onClick={generateDeIdentifiedId}
                  variant="outline"
                  className="px-4"
              >
                  Générer
              </Button>
            </div>
          </div>

            <div className="space-y-2">
              <Label htmlFor="age">Âge</Label>
              <Input
                id="age"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Enter your age"
                min="0"
                max="120"
                required
              />
          </div>
        </div>

          <div className="space-y-2">
            <Label>Sexe</Label>
            <RadioGroup value={gender} onValueChange={setGender} className="flex gap-6">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Male" id="male" />
                <Label htmlFor="male">Homme</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Female" id="female" />
                <Label htmlFor="female">Femme</Label>
              </div>
            </RadioGroup>
          </div>
          </div>

        {/* Chief Complaint */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Motif de Consultation</h2>
          <div className="space-y-2">
            <Label htmlFor="reason">Qu'est-ce qui vous amène à consulter aujourd'hui?</Label>
            <Textarea
              id="reason"
              value={reasonForVisit}
              onChange={(e) => setReasonForVisit(e.target.value)}
              required
              placeholder="What brings you to the clinic today?"
              rows={3}
            />
          </div>
          </div>

        {/* Symptom Details */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Détails des Symptômes</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="start-date">Quand les symptômes ont-ils commencé?</Label>
            <Input
                id="start-date"
              value={problemStartDate}
              onChange={(e) => setProblemStartDate(e.target.value)}
              placeholder="e.g., 3 days ago, last week, 2 months ago"
            />
          </div>

            <div className="space-y-2">
              <Label htmlFor="trigger">Y a-t-il eu un événement déclencheur?</Label>
            <Input
                id="trigger"
              value={specificTrigger}
              onChange={(e) => setSpecificTrigger(e.target.value)}
              placeholder="e.g., injury, stress, food, activity"
            />
          </div>

            <div className="space-y-2">
              <Label htmlFor="location">Où ressentez-vous les symptômes?</Label>
            <Input
                id="location"
              value={symptomLocation}
              onChange={(e) => setSymptomLocation(e.target.value)}
              placeholder="e.g., chest, abdomen, head, back"
            />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Décrivez vos symptômes en détail</Label>
            <Textarea
              id="description"
              value={symptomDescription}
              onChange={(e) => setSymptomDescription(e.target.value)}
              placeholder="Please describe your symptoms, how they feel, when they occur..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="aggravators">Qu'est-ce qui aggrave vos symptômes?</Label>
            <Input
                id="aggravators"
              value={symptomAggravators}
              onChange={(e) => setSymptomAggravators(e.target.value)}
              placeholder="e.g., movement, eating, stress, lying down"
            />
          </div>

            <div className="space-y-2">
              <Label htmlFor="relievers">Qu'est-ce qui soulage vos symptômes?</Label>
            <Input
                id="relievers"
              value={symptomRelievers}
              onChange={(e) => setSymptomRelievers(e.target.value)}
              placeholder="e.g., rest, medication, heat, cold"
            />
          </div>
            </div>
          </div>

        {/* Medical History */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Antécédents Médicaux</h2>
          
          <div className="space-y-2">
            <Label htmlFor="treatments">Quels traitements avez-vous essayés?</Label>
            <Textarea
              id="treatments"
              value={treatmentsAttempted}
              onChange={(e) => setTreatmentsAttempted(e.target.value)}
              placeholder="List any treatments, medications, or home remedies you have tried..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="effectiveness">Ces traitements ont-ils été efficaces?</Label>
            <Textarea
              id="effectiveness"
              value={treatmentEffectiveness}
              onChange={(e) => setTreatmentEffectiveness(e.target.value)}
              placeholder="Describe how well the treatments worked..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="chronic">Avez-vous des conditions médicales chroniques?</Label>
            <Textarea
              id="chronic"
              value={chronicConditions}
              onChange={(e) => setChronicConditions(e.target.value)}
              placeholder="e.g., diabetes, high blood pressure, asthma..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="allergies">Avez-vous des allergies médicamenteuses?</Label>
            <Textarea
              id="allergies"
              value={medicationAllergies}
              onChange={(e) => setMedicationAllergies(e.target.value)}
              placeholder="List any medications you are allergic to and the reaction..."
              rows={2}
            />
          </div>
          </div>

        {/* Additional Information */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Informations Supplémentaires</h2>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Y a-t-il autre chose que le médecin devrait savoir?</Label>
            <Textarea
              id="notes"
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Anything else you would like the doctor to know..."
              rows={3}
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center">
          <Button
            type="submit"
            disabled={loading}
            className="w-full max-w-md py-3 text-lg"
          >
            {loading ? "Traitement en cours..." : "Soumettre le Formulaire"}
          </Button>
        </div>

        {loading && (
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Analyse de vos symptômes en cours...
            </p>
        </div>
        )}
      </form>
    </div>
  );
}