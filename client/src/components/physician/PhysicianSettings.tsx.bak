import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

interface OutputPreferences {
  // Core sections
  showClinicalStrategy: boolean;
  showHPI: boolean;
  showSOAP: boolean;
  showFollowUpQuestions: boolean;

  // Plan sections
  showMedications: boolean;
  showLaboratory: boolean;
  showImaging: boolean;
  showReferrals: boolean;

  // Administrative sections
  showWorkLeave: boolean;
  showWorkModifications: boolean;
  showInsuranceDeclaration: boolean;

  // Formatting preferences
  includeRationale: boolean;
  includeDifferentialDiagnosis: boolean;
  includeRedFlags: boolean;
  medicationWarnings: boolean;

  // Language settings
  language: "fr" | "en";
  medicalTerminology: "standard" | "simplified";
}

export function PhysicianSettings() {
  const [preferences, setPreferences] = useState<OutputPreferences>({
    showClinicalStrategy: true,
    showHPI: true,
    showSOAP: true,
    showFollowUpQuestions: true,
    showMedications: true,
    showLaboratory: true,
    showImaging: true,
    showReferrals: true,
    showWorkLeave: true,
    showWorkModifications: true,
    showInsuranceDeclaration: true,
    includeRationale: true,
    includeDifferentialDiagnosis: true,
    includeRedFlags: true,
    medicationWarnings: true,
    language: "fr",
    medicalTerminology: "standard",
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("physician_preferences")
        .select("output_preferences")
        .eq("physician_id", user.id)
        .single();

      if (data?.output_preferences) {
        setPreferences(data.output_preferences);
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    setSaved(false);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("physician_preferences").upsert({
        physician_id: user.id,
        output_preferences: preferences,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Error saving preferences:", error);
      alert("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const togglePreference = (key: keyof OutputPreferences) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const presetTemplates = [
    {
      name: "Complet",
      description: "Tous les éléments activés",
      settings: () =>
        Object.keys(preferences).reduce(
          (acc, key) => {
            if (typeof preferences[key as keyof OutputPreferences] === "boolean") {
              acc[key as keyof OutputPreferences] = true as any;
            }
            return acc;
          },
          { ...preferences }
        ),
    },
    {
      name: "Minimal",
      description: "Essentiel seulement",
      settings: () => ({
        ...preferences,
        showClinicalStrategy: false,
        showFollowUpQuestions: false,
        showWorkLeave: false,
        showWorkModifications: false,
        showInsuranceDeclaration: false,
        includeRationale: false,
        includeRedFlags: false,
      }),
    },
    {
      name: "Consultation Rapide",
      description: "Pour les cas simples",
      settings: () => ({
        ...preferences,
        showClinicalStrategy: false,
        showHPI: true,
        showSOAP: true,
        showFollowUpQuestions: false,
        showMedications: true,
        showLaboratory: false,
        showImaging: false,
        showReferrals: false,
        showWorkLeave: true,
        showWorkModifications: false,
        showInsuranceDeclaration: false,
      }),
    },
    {
      name: "Urgence",
      description: "Focus sur l'essentiel urgent",
      settings: () => ({
        ...preferences,
        showClinicalStrategy: true,
        showHPI: true,
        showSOAP: true,
        showFollowUpQuestions: false,
        showMedications: true,
        showLaboratory: true,
        showImaging: true,
        showReferrals: true,
        showWorkLeave: false,
        showWorkModifications: false,
        showInsuranceDeclaration: false,
        includeRationale: false,
      }),
    },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Paramètres de Sortie Clinique</h1>

        {/* Preset Templates */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Modèles Rapides</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {presetTemplates.map((template) => (
              <button
                key={template.name}
                onClick={() => setPreferences(template.settings())}
                className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
              >
                <p className="font-semibold text-sm">{template.name}</p>
                <p className="text-xs text-gray-600">{template.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Core Sections */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Sections Principales</h2>
          <div className="space-y-3">
            <ToggleOption
              label="1. Stratégie Clinique Spartan"
              description="Diagnostic principal, différentiels, drapeaux rouges"
              checked={preferences.showClinicalStrategy}
              onChange={() => togglePreference("showClinicalStrategy")}
            />
            <ToggleOption
              label="2. Histoire de la Maladie Actuelle (HPI)"
              description="Résumé de confirmation avec le patient"
              checked={preferences.showHPI}
              onChange={() => togglePreference("showHPI")}
            />
            <ToggleOption
              label="3. Note SOAP"
              description="Subjectif, Objectif, Appréciation, Plan"
              checked={preferences.showSOAP}
              onChange={() => togglePreference("showSOAP")}
            />
            <ToggleOption
              label="4. Questions de Suivi"
              description="10 questions cliniques pertinentes"
              checked={preferences.showFollowUpQuestions}
              onChange={() => togglePreference("showFollowUpQuestions")}
            />
          </div>
        </div>

        {/* Plan Sections */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Sections du Plan</h2>
          <div className="space-y-3">
            <ToggleOption
              label="5.1 Médicaments"
              description="Prescriptions organisées par diagnostic"
              checked={preferences.showMedications}
              onChange={() => togglePreference("showMedications")}
            />
            <ToggleOption
              label="5.2 Analyses de Laboratoire"
              description="Tests sanguins et autres analyses"
              checked={preferences.showLaboratory}
              onChange={() => togglePreference("showLaboratory")}
            />
            <ToggleOption
              label="5.3 Imagerie Médicale"
              description="Radiographies, CT, IRM, échographies"
              checked={preferences.showImaging}
              onChange={() => togglePreference("showImaging")}
            />
            <ToggleOption
              label="5.4 Références aux Spécialistes"
              description="Consultations spécialisées"
              checked={preferences.showReferrals}
              onChange={() => togglePreference("showReferrals")}
            />
          </div>
        </div>

        {/* Administrative Sections */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Sections Administratives</h2>
          <div className="space-y-3">
            <ToggleOption
              label="6. Déclaration d'Arrêt de Travail"
              description="Certificat médical pour absence"
              checked={preferences.showWorkLeave}
              onChange={() => togglePreference("showWorkLeave")}
            />
            <ToggleOption
              label="7. Recommandations de Modification de Travail"
              description="Restrictions et accommodements"
              checked={preferences.showWorkModifications}
              onChange={() => togglePreference("showWorkModifications")}
            />
            <ToggleOption
              label="8. Déclaration d'Assurance"
              description="Documentation pour assurances"
              checked={preferences.showInsuranceDeclaration}
              onChange={() => togglePreference("showInsuranceDeclaration")}
            />
          </div>
        </div>

        {/* Additional Options */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Options Supplémentaires</h2>
          <div className="space-y-3">
            <ToggleOption
              label="Inclure les justifications cliniques"
              description="Rationale pour chaque traitement"
              checked={preferences.includeRationale}
              onChange={() => togglePreference("includeRationale")}
            />
            <ToggleOption
              label="Diagnostics différentiels détaillés"
              description="DDx avec probabilités"
              checked={preferences.includeDifferentialDiagnosis}
              onChange={() => togglePreference("includeDifferentialDiagnosis")}
            />
            <ToggleOption
              label="Drapeaux rouges"
              description="Signes d'alarme à surveiller"
              checked={preferences.includeRedFlags}
              onChange={() => togglePreference("includeRedFlags")}
            />
            <ToggleOption
              label="Avertissements médicamenteux"
              description="Mises en garde pour les prescriptions"
              checked={preferences.medicationWarnings}
              onChange={() => togglePreference("medicationWarnings")}
            />
          </div>
        </div>

        {/* Language Settings */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Paramètres de Langue</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Langue</label>
              <select
                value={preferences.language}
                onChange={(e) =>
                  setPreferences((prev) => ({
                    ...prev,
                    language: e.target.value as "fr" | "en",
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Terminologie</label>
              <select
                value={preferences.medicalTerminology}
                onChange={(e) =>
                  setPreferences((prev) => ({
                    ...prev,
                    medicalTerminology: e.target.value as "standard" | "simplified",
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="standard">Médicale standard</option>
                <option value="simplified">Simplifiée</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={savePreferences}
            disabled={saving}
            className={`px-6 py-3 rounded-md font-semibold transition-colors ${
              saved ? "bg-green-600 text-white" : "bg-indigo-600 text-white hover:bg-indigo-700"
            } disabled:opacity-50`}
          >
            {saving ? "Sauvegarde..." : saved ? "✓ Sauvegardé" : "Sauvegarder les préférences"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ToggleOption({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-start space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="mt-1 h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
      />
      <div className="flex-1">
        <p className="font-medium text-gray-900">{label}</p>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </label>
  );
}
