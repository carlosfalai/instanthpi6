import Anthropic from "@anthropic-ai/sdk";
import type { IntakeForm, IntakeFormSubmission } from "@shared/schema";

const MODEL = process.env.ANTHROPIC_HAIKU_MODEL || "claude-3-5-haiku-20241022";

const anthropicClient = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

const SYSTEM_PROMPT = `You are the InstantHPI medical automation engine. Generate complete French medical documentation in professional language.

Rules:
- Always produce natural French paragraphs (no bullet spam unless explicitly required)
- Include SOAP logic, patient-facing summary, work leave summary, referrals, lab and imaging requisitions when the context suggests it
- Highlight red flags and next steps using concise sentences
- Never expose PHI other than what is provided
- Close with a patient-friendly paragraph in French referencing the plan`;

const formatValue = (value: unknown): string => {
  if (value === null || value === undefined) return "Non précisé";
  if (Array.isArray(value)) {
    return value.map((entry) => formatValue(entry)).join(", ");
  }
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, val]) => `${key}: ${formatValue(val)}`)
      .join(" | ");
  }
  return String(value);
};

const buildAnswerSummary = (form: IntakeForm, submission: IntakeFormSubmission) => {
  const answers = submission.answers || {};
  if (!form.schema?.questions?.length) {
    return Object.entries(answers)
      .map(([key, value]) => `${key}: ${formatValue(value)}`)
      .join("\n");
  }

  return form.schema.questions
    .map((question) => `${question.label}: ${formatValue((answers as any)[question.id])}`)
    .join("\n");
};

type HaikuParams = {
  form: IntakeForm;
  submission: IntakeFormSubmission;
  preferredTemplates?: string | null;
};

export async function runHaikuWorkflow(params: HaikuParams) {
  if (!anthropicClient) {
    return {
      status: "skipped" as const,
      reason: "Missing ANTHROPIC_API_KEY",
    };
  }

  const answerSummary = buildAnswerSummary(params.form, params.submission);
  const templateSummary =
    params.preferredTemplates?.trim() ||
    `Prépare des notes selon les style SOAP et messages patients fournis par InstantHPI (voir exemples de gastro-entérite, toux chronique, cystite, congés de travail, messages patient, références et requêtes d'imagerie).`;

  const userMessage = [
    `Formulaire: ${params.form.title}`,
    params.form.description ? `Description: ${params.form.description}` : null,
    `Soumission: ${params.submission.id}`,
    params.submission.patientName
      ? `Patient: ${params.submission.patientName} (${params.submission.patientEmail ?? "email inconnu"})`
      : "Patient non identifié (soumission publique)",
    "",
    "Résumé des réponses:",
    answerSummary,
    "",
    "Préférences stylistiques / templates à respecter:",
    templateSummary,
    "",
    "Produit un document complet en HTML simple avec:",
    "- Stratégie clinique (diagnostic principal, différentiel, red flags)",
    "- SOAP ultra spartan en français",
    "- Plan et ordonnances inspirés des modèles fournis",
    "- Requêtes de labos / imagerie / références si pertinent",
    "- Arrêt de travail si nécessaire",
    "- Message patient clair et chaleureux en un paragraphe final",
  ]
    .filter(Boolean)
    .join("\n");

  const response = await anthropicClient.messages.create({
    model: MODEL,
    max_tokens: 4000,
    temperature: 0.1,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: userMessage,
      },
    ],
  });

  const textPart = response.content.find((part) => part.type === "text");
  const content = textPart && "text" in textPart ? textPart.text : "";

  return {
    status: "completed" as const,
    content,
    model: MODEL,
  };
}
