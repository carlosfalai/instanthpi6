import React, { useState } from "react";
import { supabase } from "../../lib/supabase";
import { generateClinicalTranscription } from "../../lib/clinicalTranscription";

interface FormData {
  // De-identified ID
  patientId: string;

  // Demographics
  gender: "male" | "female" | "other" | "";
  age: string;

  // Chief Complaint
  chiefComplaint: string;
  symptomOnset: string;
  trigger: string;

  // Symptom Details
  location: string;
  description: string;
  aggravatingFactors: string;
  relievingFactors: string;
  severity: number;
  evolution: string;
  associatedSymptoms: string;

  // Medical History
  treatmentsTried: string;
  treatmentResponse: string;
  chronicConditions: string;
  medicationAllergies: string;
  pregnancyBreastfeeding: string;

  // Additional
  otherNotes: string;
}

export function MedicalIntakeForm() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [transcription, setTranscription] = useState<any>(null);

  const [formData, setFormData] = useState<FormData>({
    patientId: "",
    gender: "",
    age: "",
    chiefComplaint: "",
    symptomOnset: "",
    trigger: "",
    location: "",
    description: "",
    aggravatingFactors: "",
    relievingFactors: "",
    severity: 5,
    evolution: "",
    associatedSymptoms: "",
    treatmentsTried: "",
    treatmentResponse: "",
    chronicConditions: "",
    medicationAllergies: "",
    pregnancyBreastfeeding: "",
    otherNotes: "",
  });

  // Generate de-identified ID
  const generatePatientId = () => {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    let code = "";

    for (let i = 0; i < 5; i++) {
      code += letters.charAt(Math.floor(Math.random() * letters.length));
      code += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }

    setFormData((prev) => ({ ...prev, patientId: code }));
    return code;
  };

  const updateField = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Generate clinical transcription
      const clinicalNotes = await generateClinicalTranscription(formData);
      setTranscription(clinicalNotes);

      // Store in Supabase with enhanced data
      const { error } = await supabase.from("consultations").insert({
        patient_id: formData.patientId,
        chief_complaint: formData.chiefComplaint,
        symptoms: formData.description,
        duration: formData.symptomOnset,
        severity: formData.severity,
        status: "pending",

        // Store complete form data as JSON
        form_data: formData,

        // Store generated clinical notes
        clinical_notes: clinicalNotes,

        // Additional medical fields
        location: formData.location,
        trigger: formData.trigger,
        aggravating_factors: formData.aggravatingFactors,
        relieving_factors: formData.relievingFactors,
        evolution: formData.evolution,
        associated_symptoms: formData.associatedSymptoms,
        treatments_tried: formData.treatmentsTried,
        treatment_response: formData.treatmentResponse,
        chronic_conditions: formData.chronicConditions,
        current_medications: formData.treatmentsTried,
        allergies: formData.medicationAllergies,
        pregnancy_breastfeeding: formData.pregnancyBreastfeeding,
        other_notes: formData.otherNotes,
      });

      if (error) throw error;
      setSubmitted(true);
    } catch (error) {
      console.error("Error:", error);
      alert("Error submitting form. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted && transcription) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-green-800 mb-4">
            Consultation soumise avec succès
          </h2>
          <div className="bg-white rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600 mb-2">Votre ID Patient Dé-identifié:</p>
            <div className="text-3xl font-mono font-bold text-indigo-600 bg-indigo-50 p-4 rounded text-center">
              {formData.patientId}
            </div>
          </div>
        </div>

        {/* Display Clinical Transcription */}
        <div className="space-y-4">
          {transcription.confirmationMessage && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Message de Confirmation:</h3>
              <pre className="whitespace-pre-wrap font-sans">
                {transcription.confirmationMessage}
              </pre>
            </div>
          )}

          {transcription.soapNote && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Note SOAP:</h3>
              <pre className="whitespace-pre-wrap font-sans">{transcription.soapNote}</pre>
            </div>
          )}

          {transcription.planBullets && (
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Plan de Traitement:</h3>
              <pre className="whitespace-pre-wrap font-sans">{transcription.planBullets}</pre>
            </div>
          )}
        </div>

        <button
          onClick={() => {
            setSubmitted(false);
            setStep(1);
            setFormData({
              patientId: "",
              gender: "",
              age: "",
              chiefComplaint: "",
              symptomOnset: "",
              trigger: "",
              location: "",
              description: "",
              aggravatingFactors: "",
              relievingFactors: "",
              severity: 5,
              evolution: "",
              associatedSymptoms: "",
              treatmentsTried: "",
              treatmentResponse: "",
              chronicConditions: "",
              medicationAllergies: "",
              pregnancyBreastfeeding: "",
              otherNotes: "",
            });
          }}
          className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Nouvelle Consultation
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-8">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Formulaire de Consultation Médicale
          </h1>
          <div className="flex justify-between items-center mt-4">
            <span className="text-sm text-gray-600">Étape {step} sur 4</span>
            <div className="flex space-x-2">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`h-2 w-16 rounded ${s <= step ? "bg-indigo-600" : "bg-gray-200"}`}
                />
              ))}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Step 1: Identification & Demographics */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">Identification & Informations de base</h2>

              {/* Patient ID Generator */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID Patient Dé-identifié <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={formData.patientId}
                    readOnly
                    placeholder="Cliquez pour générer"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-mono text-lg"
                  />
                  <button
                    type="button"
                    onClick={generatePatientId}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    Générer ID
                  </button>
                </div>
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sexe <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => updateField("gender", e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Sélectionner</option>
                  <option value="male">Masculin</option>
                  <option value="female">Féminin</option>
                  <option value="other">Autre</option>
                </select>
              </div>

              {/* Age */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Âge <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.age}
                  onChange={(e) => updateField("age", e.target.value)}
                  required
                  placeholder="ex: 35 ans"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              {/* Chief Complaint */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plainte principale <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.chiefComplaint}
                  onChange={(e) => updateField("chiefComplaint", e.target.value)}
                  required
                  placeholder="Quelle est votre préoccupation principale?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          )}

          {/* Step 2: Symptom Details */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">Détails des symptômes</h2>

              {/* Symptom Onset */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Début des symptômes <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.symptomOnset}
                  onChange={(e) => updateField("symptomOnset", e.target.value)}
                  required
                  placeholder="ex: Il y a 3 jours"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              {/* Trigger */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Déclencheur</label>
                <input
                  type="text"
                  value={formData.trigger}
                  onChange={(e) => updateField("trigger", e.target.value)}
                  placeholder="Qu'est-ce qui a déclenché les symptômes?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Localisation</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => updateField("location", e.target.value)}
                  placeholder="Où ressentez-vous les symptômes?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description détaillée <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  required
                  rows={4}
                  placeholder="Décrivez vos symptômes en détail..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              {/* Severity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sévérité de la douleur (0-10)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={formData.severity}
                    onChange={(e) => updateField("severity", parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-2xl font-bold text-indigo-600 w-12 text-center">
                    {formData.severity}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Aucune</span>
                  <span>Modérée</span>
                  <span>Sévère</span>
                </div>
              </div>

              {/* Evolution */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Évolution</label>
                <select
                  value={formData.evolution}
                  onChange={(e) => updateField("evolution", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Sélectionner</option>
                  <option value="improving">S'améliore</option>
                  <option value="stable">Stable</option>
                  <option value="worsening">S'aggrave</option>
                  <option value="fluctuating">Fluctuant</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 3: Factors & Associated Symptoms */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">Facteurs et symptômes associés</h2>

              {/* Aggravating Factors */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Facteurs aggravants
                </label>
                <textarea
                  value={formData.aggravatingFactors}
                  onChange={(e) => updateField("aggravatingFactors", e.target.value)}
                  rows={3}
                  placeholder="Qu'est-ce qui aggrave vos symptômes?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              {/* Relieving Factors */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Facteurs de soulagement
                </label>
                <textarea
                  value={formData.relievingFactors}
                  onChange={(e) => updateField("relievingFactors", e.target.value)}
                  rows={3}
                  placeholder="Qu'est-ce qui soulage vos symptômes?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              {/* Associated Symptoms */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Symptômes associés
                </label>
                <textarea
                  value={formData.associatedSymptoms}
                  onChange={(e) => updateField("associatedSymptoms", e.target.value)}
                  rows={3}
                  placeholder="Autres symptômes présents..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              {/* Treatments Tried */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Traitements essayés
                </label>
                <textarea
                  value={formData.treatmentsTried}
                  onChange={(e) => updateField("treatmentsTried", e.target.value)}
                  rows={3}
                  placeholder="Quels traitements avez-vous essayés?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              {/* Treatment Response */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Réponse aux traitements
                </label>
                <textarea
                  value={formData.treatmentResponse}
                  onChange={(e) => updateField("treatmentResponse", e.target.value)}
                  rows={3}
                  placeholder="Comment avez-vous répondu aux traitements?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          )}

          {/* Step 4: Medical History */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">Antécédents médicaux</h2>

              {/* Chronic Conditions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Conditions chroniques
                </label>
                <textarea
                  value={formData.chronicConditions}
                  onChange={(e) => updateField("chronicConditions", e.target.value)}
                  rows={3}
                  placeholder="Listez vos conditions médicales chroniques..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              {/* Medication Allergies */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Allergies médicamenteuses
                </label>
                <textarea
                  value={formData.medicationAllergies}
                  onChange={(e) => updateField("medicationAllergies", e.target.value)}
                  rows={3}
                  placeholder="Listez vos allergies aux médicaments..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              {/* Pregnancy/Breastfeeding (conditional) */}
              {formData.gender === "female" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grossesse/Allaitement
                  </label>
                  <select
                    value={formData.pregnancyBreastfeeding}
                    onChange={(e) => updateField("pregnancyBreastfeeding", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Non applicable</option>
                    <option value="pregnant">Enceinte</option>
                    <option value="breastfeeding">Allaitement</option>
                    <option value="both">Enceinte et allaitement</option>
                  </select>
                </div>
              )}

              {/* Other Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes supplémentaires
                </label>
                <textarea
                  value={formData.otherNotes}
                  onChange={(e) => updateField("otherNotes", e.target.value)}
                  rows={4}
                  placeholder="Autres informations importantes..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Précédent
              </button>
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                disabled={!formData.patientId}
                className="ml-auto px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                Suivant
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading || !formData.patientId}
                className="ml-auto px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? "Soumission..." : "Soumettre la consultation"}
              </button>
            )}
          </div>

          {!formData.patientId && step === 1 && (
            <p className="text-sm text-amber-600 text-center mt-4">
              Veuillez générer un ID patient avant de continuer
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
