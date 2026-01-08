import { nanoid } from "nanoid";
import { and, desc, eq } from "drizzle-orm";
import {
  intakeForms,
  intakeFormSubmissions,
  submissionOutputs,
  type IntakeForm,
  type IntakeFormSchema,
  type IntakeFormSubmission,
  type SubmissionOutput,
} from "@shared/schema";
import { db } from "../db";

type FormPayload = {
  title: string;
  description?: string;
  questions: IntakeFormSchema["questions"];
  settings?: Record<string, unknown>;
  status?: "draft" | "published";
  slug?: string | null;
  profileId?: number | null;
};

type SubmissionPayload = {
  patientName?: string;
  patientEmail?: string;
  patientPhone?: string;
  answers: Record<string, unknown>;
  meta?: Record<string, unknown>;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

async function ensureUniqueSlug(base: string, formId?: string): Promise<string> {
  let slug = base;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const [existing] = await db
      .select({ id: intakeForms.id })
      .from(intakeForms)
      .where(eq(intakeForms.slug, slug));

    if (!existing || (formId && existing.id === formId)) {
      return slug;
    }

    slug = `${base}-${nanoid(4)}`;
  }
}

export async function listForms(ownerId: number) {
  return db
    .select()
    .from(intakeForms)
    .where(eq(intakeForms.ownerId, ownerId))
    .orderBy(desc(intakeForms.updatedAt));
}

export async function getFormById(id: string, ownerId?: number) {
  const where = ownerId
    ? and(eq(intakeForms.id, id), eq(intakeForms.ownerId, ownerId))
    : eq(intakeForms.id, id);
  const [form] = await db.select().from(intakeForms).where(where);
  return form;
}

export async function getFormBySlug(slug: string) {
  const [form] = await db.select().from(intakeForms).where(eq(intakeForms.slug, slug));
  return form;
}

export async function createForm(ownerId: number, payload: FormPayload): Promise<IntakeForm> {
  const baseSlug = payload.slug || slugify(payload.title);
  const shouldPublish = payload.status === "published";
  const slug = shouldPublish ? await ensureUniqueSlug(`${baseSlug}-${nanoid(4)}`) : null;

  const [created] = await db
    .insert(intakeForms)
    .values({
      ownerId,
      profileId: payload.profileId ?? null,
      title: payload.title,
      description: payload.description ?? null,
      status: payload.status ?? "draft",
      slug,
      schema: { questions: payload.questions },
      settings: payload.settings ?? {},
      publishedAt: shouldPublish ? new Date() : null,
    })
    .returning();

  return created;
}

export async function updateForm(
  id: string,
  ownerId: number,
  payload: Partial<FormPayload>
): Promise<IntakeForm | undefined> {
  const form = await getFormById(id, ownerId);
  if (!form) return undefined;

  const shouldPublish = payload.status === "published";
  let slug = form.slug;

  if (shouldPublish && !slug) {
    const baseSlug = payload.slug || slugify(payload.title || form.title);
    slug = await ensureUniqueSlug(`${baseSlug}-${nanoid(4)}`, form.id);
  }

  const [updated] = await db
    .update(intakeForms)
    .set({
      title: payload.title ?? form.title,
      description: payload.description ?? form.description,
      status: payload.status ?? form.status,
      slug: slug ?? null,
      schema: payload.questions ? { questions: payload.questions } : form.schema,
      settings: payload.settings ?? form.settings,
      profileId: payload.profileId ?? form.profileId,
      publishedAt: shouldPublish ? new Date() : form.publishedAt,
      updatedAt: new Date(),
    })
    .where(and(eq(intakeForms.id, id), eq(intakeForms.ownerId, ownerId)))
    .returning();

  return updated;
}

export async function createSubmission(
  form: IntakeForm,
  payload: SubmissionPayload
): Promise<IntakeFormSubmission> {
  const [submission] = await db
    .insert(intakeFormSubmissions)
    .values({
      formId: form.id,
      formTitleSnapshot: form.title,
      patientName: payload.patientName ?? null,
      patientEmail: payload.patientEmail ?? null,
      patientPhone: payload.patientPhone ?? null,
      answers: payload.answers,
      meta: payload.meta ?? {},
      status: "received",
      submittedAt: new Date(),
    })
    .returning();

  return submission;
}

export async function listSubmissions(formId: string, ownerId: number) {
  const form = await getFormById(formId, ownerId);
  if (!form) return [];

  return db
    .select({
      submission: intakeFormSubmissions,
      output: submissionOutputs,
    })
    .from(intakeFormSubmissions)
    .leftJoin(
      submissionOutputs,
      eq(submissionOutputs.submissionId, intakeFormSubmissions.id)
    )
    .where(eq(intakeFormSubmissions.formId, formId))
    .orderBy(desc(intakeFormSubmissions.submittedAt));
}

export async function getSubmission(
  submissionId: string,
  ownerId: number
): Promise<{ submission: IntakeFormSubmission; output?: SubmissionOutput } | undefined> {
  const [result] = await db
    .select({
      submission: intakeFormSubmissions,
      form: intakeForms,
      output: submissionOutputs,
    })
    .from(intakeFormSubmissions)
    .innerJoin(intakeForms, eq(intakeForms.id, intakeFormSubmissions.formId))
    .leftJoin(
      submissionOutputs,
      eq(submissionOutputs.submissionId, intakeFormSubmissions.id)
    )
    .where(eq(intakeFormSubmissions.id, submissionId));

  if (!result || result.form.ownerId !== ownerId) return undefined;

  return {
    submission: result.submission,
    output: result.output ?? undefined,
  };
}

export async function recordSubmissionOutput(params: {
  submissionId: string;
  outputType: string;
  content?: string;
  model?: string;
  status: "pending" | "completed" | "error";
  error?: string | null;
}) {
  const [output] = await db
    .insert(submissionOutputs)
    .values({
      submissionId: params.submissionId,
      outputType: params.outputType,
      content: params.content ?? null,
      model: params.model ?? null,
      status: params.status,
      error: params.error ?? null,
    })
    .returning();

  return output;
}
