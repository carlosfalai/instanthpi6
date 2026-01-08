import { Router } from "express";
import { z } from "zod";
import {
  createForm,
  updateForm,
  listForms,
  getFormById,
  getFormBySlug,
  createSubmission,
  listSubmissions,
  getSubmission,
  recordSubmissionOutput,
} from "../services/intakeFormsService";
import { runHaikuWorkflow } from "../services/ai/haikuWorkflow";

const router = Router();
const DEFAULT_USER_ID = 1;

const questionSchema = z.object({
  id: z.string(),
  type: z.string(),
  label: z.string(),
  placeholder: z.string().optional(),
  required: z.boolean().optional(),
  options: z.array(z.string()).optional(),
});

const formPayloadSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  questions: z.array(questionSchema),
  settings: z.record(z.any()).optional(),
  status: z.enum(["draft", "published"]).optional(),
  slug: z.string().optional(),
  profileId: z.number().optional(),
});

const submissionPayloadSchema = z.object({
  patientName: z.string().optional(),
  patientEmail: z.string().optional(),
  patientPhone: z.string().optional(),
  answers: z.record(z.any()),
  meta: z.record(z.any()).optional(),
});

router.get("/", async (_req, res) => {
  try {
    const forms = await listForms(DEFAULT_USER_ID);
    res.json(forms);
  } catch (error) {
    console.error("Error listing forms:", error);
    res.status(500).json({ message: "Failed to load forms" });
  }
});

router.post("/", async (req, res) => {
  try {
    const payload = formPayloadSchema.parse(req.body);
    const form = await createForm(DEFAULT_USER_ID, {
      title: payload.title,
      description: payload.description,
      questions: payload.questions,
      settings: payload.settings,
      status: payload.status,
      slug: payload.slug,
      profileId: payload.profileId ?? null,
    });
    res.status(201).json(form);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid payload", errors: error.errors });
    }
    console.error("Error creating form:", error);
    res.status(500).json({ message: "Failed to create form" });
  }
});

router.get("/public/:slug", async (req, res) => {
  try {
    const form = await getFormBySlug(req.params.slug);
    if (!form || form.status !== "published") {
      return res.status(404).json({ message: "Form not found" });
    }

    res.json({
      id: form.id,
      title: form.title,
      description: form.description,
      questions: form.schema.questions,
    });
  } catch (error) {
    console.error("Error fetching public form:", error);
    res.status(500).json({ message: "Failed to load form" });
  }
});

router.post("/public/:slug/submissions", async (req, res) => {
  try {
    const payload = submissionPayloadSchema.parse(req.body);
    const form = await getFormBySlug(req.params.slug);

    if (!form || form.status !== "published") {
      return res.status(404).json({ message: "Form not found" });
    }

    const submission = await createSubmission(form, payload);
    let output = null;

    try {
      const aiResult = await runHaikuWorkflow({
        form,
        submission,
        preferredTemplates:
          typeof form.settings?.preferredTemplates === "string"
            ? (form.settings.preferredTemplates as string)
            : undefined,
      });

      if (aiResult.status === "completed") {
        output = await recordSubmissionOutput({
          submissionId: submission.id,
          outputType: "clinical_summary",
          content: aiResult.content,
          model: aiResult.model,
          status: "completed",
        });
      } else {
        output = await recordSubmissionOutput({
          submissionId: submission.id,
          outputType: "clinical_summary",
          status: "error",
          error: aiResult.reason ?? "Unknown error",
        });
      }
    } catch (generationError) {
      console.error("AI generation error:", generationError);
      await recordSubmissionOutput({
        submissionId: submission.id,
        outputType: "clinical_summary",
        status: "error",
        error: generationError instanceof Error ? generationError.message : "Unknown error",
      });
    }

    res.status(201).json({ submission, output });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid submission payload", errors: error.errors });
    }
    console.error("Error saving submission:", error);
    res.status(500).json({ message: "Failed to submit form" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const form = await getFormById(req.params.id, DEFAULT_USER_ID);
    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }
    res.json(form);
  } catch (error) {
    console.error("Error fetching form:", error);
    res.status(500).json({ message: "Failed to load form" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const payload = formPayloadSchema.parse(req.body);
    const form = await updateForm(req.params.id, DEFAULT_USER_ID, {
      title: payload.title,
      description: payload.description,
      questions: payload.questions,
      settings: payload.settings,
      status: payload.status,
      slug: payload.slug,
      profileId: payload.profileId ?? null,
    });

    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }

    res.json(form);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid payload", errors: error.errors });
    }
    console.error("Error updating form:", error);
    res.status(500).json({ message: "Failed to update form" });
  }
});

router.get("/:id/submissions", async (req, res) => {
  try {
    const submissions = await listSubmissions(req.params.id, DEFAULT_USER_ID);
    res.json(submissions);
  } catch (error) {
    console.error("Error listing submissions:", error);
    res.status(500).json({ message: "Failed to load submissions" });
  }
});

router.get("/submissions/:submissionId", async (req, res) => {
  try {
    const submission = await getSubmission(req.params.submissionId, DEFAULT_USER_ID);
    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }
    res.json(submission);
  } catch (error) {
    console.error("Error fetching submission:", error);
    res.status(500).json({ message: "Failed to load submission" });
  }
});

export default router;
