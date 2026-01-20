import React, { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";

type PublicQuestion = {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  options?: string[];
  required?: boolean;
};

type PublicForm = {
  id: string;
  title: string;
  description?: string | null;
  questions: PublicQuestion[];
};

export default function PublicFormPage() {
  const [, params] = useRoute("/f/:slug");
  const slug = params?.slug;
  const [form, setForm] = useState<PublicForm | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [patientName, setPatientName] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let ignore = false;
    const fetchForm = async () => {
      if (!slug) return;
      try {
        const res = await fetch(`/api/intake-forms/public/${slug}`);
        if (!res.ok) {
          throw new Error("Formulaire introuvable");
        }
        const data = await res.json();
        if (!ignore) {
          setForm(data);
        }
      } catch (err) {
        console.error(err);
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Formulaire indisponible");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchForm();
    return () => {
      ignore = true;
    };
  }, [slug]);

  const updateAnswer = (id: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!slug) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/intake-forms/public/${slug}/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientName,
          patientEmail,
          patientPhone,
          answers,
        }),
      });

      if (!res.ok) {
        throw new Error("Impossible d'envoyer le formulaire");
      }

      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!form || error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white p-6">
        <Card className="max-w-lg w-full">
          <CardHeader>
            <CardTitle>Formulaire indisponible</CardTitle>
            <CardDescription>{error || "Ce lien n'est plus actif."}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white p-6">
        <Card className="max-w-lg w-full text-center">
          <CardHeader>
            <CardTitle>Merci 🎉</CardTitle>
            <CardDescription>
              Votre questionnaire a été transmis à l'équipe InstantHPI. Vous recevrez un message dès
              que le médecin aura traité votre dossier.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <p className="text-sm uppercase tracking-[0.3em] text-primary/80">InstantHPI Intake</p>
          <h1 className="text-4xl font-black">{form.title}</h1>
          {form.description && (
            <p className="text-muted-foreground max-w-2xl mx-auto">{form.description}</p>
          )}
        </div>

        <Card className="bg-[#0D0D0D] border-white/5">
          <CardContent className="space-y-6 py-8">
            <form className="space-y-6" onSubmit={submit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Votre nom complet</Label>
                  <Input
                    value={patientName}
                    required
                    onChange={(event) => setPatientName(event.target.value)}
                    placeholder="Nom et prénom"
                    className="bg-black/40 border-white/10"
                  />
                </div>
                <div>
                  <Label>Courriel</Label>
                  <Input
                    type="email"
                    required
                    value={patientEmail}
                    onChange={(event) => setPatientEmail(event.target.value)}
                    placeholder="vous@example.com"
                    className="bg-black/40 border-white/10"
                  />
                </div>
                <div>
                  <Label>Téléphone</Label>
                  <Input
                    value={patientPhone}
                    onChange={(event) => setPatientPhone(event.target.value)}
                    placeholder="+1 514 ..."
                    className="bg-black/40 border-white/10"
                  />
                </div>
              </div>

              <div className="space-y-6">
                {form.questions.map((question) => (
                  <div key={question.id} className="space-y-2">
                    <Label className="font-semibold">{question.label}</Label>
                    {question.type === "long" ? (
                      <Textarea
                        value={answers[question.id] ?? ""}
                        onChange={(event) => updateAnswer(question.id, event.target.value)}
                        placeholder={question.placeholder}
                        className="bg-black/40 border-white/10"
                        rows={4}
                        required={question.required}
                      />
                    ) : question.type === "checkbox" && question.options ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {question.options.map((option) => (
                          <label
                            key={option}
                            className="flex items-center gap-2 text-sm text-muted-foreground"
                          >
                            <Checkbox
                              checked={(answers[question.id] || []).includes(option)}
                              onCheckedChange={(checked) => {
                                const current = Array.isArray(answers[question.id])
                                  ? answers[question.id]
                                  : [];
                                updateAnswer(
                                  question.id,
                                  checked
                                    ? [...current, option]
                                    : current.filter((val: string) => val !== option)
                                );
                              }}
                            />
                            {option}
                          </label>
                        ))}
                      </div>
                    ) : (
                      <Input
                        value={answers[question.id] ?? ""}
                        onChange={(event) => updateAnswer(question.id, event.target.value)}
                        placeholder={question.placeholder}
                        className="bg-black/40 border-white/10"
                        required={question.required}
                      />
                    )}
                  </div>
                ))}
              </div>

              {error && <p className="text-destructive text-sm">{error}</p>}

              <Button
                type="submit"
                className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90"
                disabled={submitting}
              >
                {submitting ? "Envoi en cours..." : "Envoyer mes réponses"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
