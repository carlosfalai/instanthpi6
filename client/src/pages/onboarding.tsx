import React, { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Label } from "../components/ui/label";
import {
  Stethoscope,
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  Brain,
  Users,
  ShieldCheck,
  Briefcase,
} from "lucide-react";

const specialties = [
  { id: "general", name: "Médecine Générale", icon: Stethoscope },
  { id: "psychiatry", name: "Psychiatrie", icon: Brain },
  { id: "specialist", name: "Spécialiste (Autre)", icon: ShieldCheck },
  { id: "consultant", name: "Consultant Professionnel", icon: Briefcase },
];

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [specialty, setSpecialty] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [professionalNumber, setProfessionalNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, navigate] = useLocation();

  const completeOnboarding = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/clinician-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          specialty,
          clinicName,
          professionalNumber,
          onboardingCompleted: true,
        }),
      });

      if (!res.ok) {
        throw new Error("Impossible d'enregistrer votre profil.");
      }

      const profile = await res.json();
      localStorage.setItem("clinician_profile_id", profile.id);
      navigate("/form-builder");
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Erreur inattendue");
    } finally {
      setSaving(false);
    }
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      void completeOnboarding();
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const canProceed =
    (step === 1 && specialty) ||
    (step === 2 && clinicName.trim().length > 1 && professionalNumber.trim().length > 1) ||
    step === 3;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 overflow-hidden relative">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-aura" />
      <div
        className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px] animate-aura"
        style={{ animationDelay: "-2s" }}
      />

      <div className="w-full max-w-2xl relative z-10">
        {/* Progress Bar */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                s <= step ? "bg-primary" : "bg-white/10"
              }`}
            />
          ))}
        </div>

        <Card className="glass-dark border-primary/20 shadow-2xl shadow-primary/5">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 animate-warp">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-3xl font-black tracking-tighter">
              {step === 1 && "Quelle est votre spécialité ?"}
              {step === 2 && "Configurez votre pratique"}
              {step === 3 && "Finalisez votre profil Elite"}
            </CardTitle>
            <CardDescription className="text-muted-foreground text-lg italic">
              {step === 1 && "Personnalisez InstantConsult pour votre domaine."}
              {step === 2 && "Dites-nous en plus sur votre cabinet."}
              {step === 3 && "Vérifiez vos informations avant de commencer."}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-8 px-8 pb-10">
            {step === 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {specialties.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSpecialty(s.id)}
                    className={`flex flex-col items-start p-6 rounded-2xl border transition-all duration-300 text-left group ${
                      specialty === s.id
                        ? "bg-primary/10 border-primary neon-glow-primary"
                        : "bg-white/5 border-white/10 hover:border-primary/40 hover:bg-white/10"
                    }`}
                  >
                    <div
                      className={`p-3 rounded-xl mb-4 transition-colors ${
                        specialty === s.id
                          ? "bg-primary/20 text-primary"
                          : "bg-white/10 text-muted-foreground group-hover:text-primary"
                      }`}
                    >
                      <s.icon className="h-6 w-6" />
                    </div>
                    <span className="font-bold text-lg">{s.name}</span>
                    <span className="text-sm text-muted-foreground mt-1">
                      Sélectionner ce domaine
                    </span>
                  </button>
                ))}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm uppercase tracking-widest font-bold text-muted-foreground">
                    Nom du Cabinet / Structure
                  </Label>
                  <Input
                    value={clinicName}
                    onChange={(event) => setClinicName(event.target.value)}
                    placeholder="ex: Centre Médical Elite"
                    className="glass border-white/10 h-14 text-lg focus:border-primary/50 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm uppercase tracking-widest font-bold text-muted-foreground">
                    Numéro Professionnel
                  </Label>
                  <Input
                    value={professionalNumber}
                    onChange={(event) => setProfessionalNumber(event.target.value)}
                    placeholder="RPPS / ADELI"
                    className="glass border-white/10 h-14 text-lg focus:border-primary/50 transition-all"
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="text-center space-y-6 py-4">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 border border-green-500/20 mb-2">
                  <Check className="h-10 w-10 text-green-500" />
                </div>
                <h3 className="text-2xl font-bold">Résumé de votre configuration</h3>
                <div className="text-left bg-white/5 rounded-2xl p-6 space-y-2">
                  <p>
                    <span className="text-muted-foreground">Spécialité :</span>{" "}
                    <span className="font-semibold uppercase">
                      {specialties.find((s) => s.id === specialty)?.name}
                    </span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Cabinet :</span>{" "}
                    <span className="font-semibold">{clinicName || "Non précisé"}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Numéro :</span>{" "}
                    <span className="font-semibold">{professionalNumber || "Non précisé"}</span>
                  </p>
                </div>
                <p className="text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  Une fois validé, InstantConsult générera automatiquement vos formulaires, vos
                  modèles d'IA et préparera l'URL à partager avec vos patients.
                </p>
                {error && <p className="text-destructive text-sm">{error}</p>}
              </div>
            )}

            <div className="flex gap-4 mt-12">
              {step > 1 && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleBack}
                  disabled={saving}
                  className="flex-1 glass h-14 text-lg font-bold hover:bg-white/5"
                >
                  <ArrowLeft className="mr-2 h-5 w-5" /> Retour
                </Button>
              )}
              <Button
                size="lg"
                onClick={handleNext}
                disabled={!canProceed || saving}
                className="flex-[2] bg-primary hover:bg-primary/90 h-14 text-lg font-black text-primary-foreground transition-all duration-300 hover:scale-[1.02] hover:neon-glow-primary uppercase tracking-wider"
              >
                {step === 3 ? (saving ? "Configuration..." : "Créer mon espace") : "Continuer"}{" "}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center mt-8 text-muted-foreground text-sm tracking-widest uppercase">
          Propulsé par <span className="text-primary font-black">InstantHPI Engine</span>
        </p>
      </div>
    </div>
  );
}
