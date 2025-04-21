import { pgTable, text, serial, integer, boolean, timestamp, jsonb, uuid, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("doctor"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  role: true,
  avatarUrl: true,
});

// Patient model for storing patient information
export const patients = pgTable("patients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  gender: text("gender").notNull(),
  dateOfBirth: text("date_of_birth").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  lastVisit: timestamp("last_visit"),
  avatarUrl: text("avatar_url"),
  healthCardNumber: text("health_card_number"), // Added for RAMQ card verification
  spruceId: text("spruce_id"), // External ID for Spruce Health API integration
  language: text("language").default("english"), // Patient's preferred language
  status: text("status").default("active"), // Status of the patient (active, archived, etc.)
});

export const insertPatientSchema = createInsertSchema(patients).pick({
  name: true,
  gender: true,
  dateOfBirth: true,
  email: true,
  phone: true,
  lastVisit: true,
  avatarUrl: true,
  healthCardNumber: true,
  spruceId: true,
  language: true,
  status: true,
});

// Message model for patient communications
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  senderId: integer("sender_id").notNull(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  isFromPatient: boolean("is_from_patient").notNull(),
  attachmentUrl: text("attachment_url"),
  spruceMessageId: text("spruce_message_id"),
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  patientId: true,
  senderId: true,
  content: true,
  isFromPatient: true,
  attachmentUrl: true,
  spruceMessageId: true,
});

// AI Documentation model
export const aiDocumentations = pgTable("ai_documentations", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  hpi: text("hpi"),
  subjective: text("subjective"),
  objective: text("objective"),
  assessment: text("assessment"),
  plan: text("plan"),
  prescription: jsonb("prescription"),
  followUpQuestions: jsonb("follow_up_questions"),
  createdAt: timestamp("created_at").defaultNow(),
  isApproved: boolean("is_approved").default(false),
});

export const insertAiDocumentationSchema = createInsertSchema(aiDocumentations).pick({
  patientId: true,
  hpi: true,
  subjective: true,
  objective: true,
  assessment: true,
  plan: true,
  prescription: true,
  followUpQuestions: true,
  isApproved: true,
});

// Form Submission model for Formsite data
export const formSubmissions = pgTable("form_submissions", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  formType: text("form_type").notNull(), // 'urgent_care' or 'std_checkup'
  formData: jsonb("form_data").notNull(),
  submissionId: text("submission_id").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow(),
});

export const insertFormSubmissionSchema = createInsertSchema(formSubmissions).pick({
  patientId: true,
  formType: true,
  formData: true,
  submissionId: true,
  submittedAt: true,
});

// Pending Items model for tracking medical tasks
export const pendingItems = pgTable("pending_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientId: integer("patient_id").notNull(),
  type: text("type").notNull(), // 'test', 'imaging', 'bloodwork', 'referral', 'other'
  description: text("description").notNull(),
  requestedDate: timestamp("requested_date"),
  dueDate: timestamp("due_date"),
  priority: text("priority").notNull().default("medium"), // 'high', 'medium', 'low'
  status: text("status").notNull().default("pending"), // 'pending', 'completed', 'cancelled'
  messageId: integer("message_id"), // Optional link to the message where this was mentioned
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
});

// Preventative Care Suggestions model for billing optimization and patient follow-up
export const preventativeCare = pgTable("preventative_care", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientId: integer("patient_id").notNull(),
  category: text("category").notNull(), // 'vaccine', 'screening', 'counseling', 'checkup', 'other'
  name: text("name").notNull(), // e.g., 'Hepatitis B Vaccine', 'Gardasil Shot', 'Pap Test'
  description: text("description").notNull(),
  relevantTo: text("relevant_to").array(), // array of conditions this is relevant to (e.g., ['STI', 'sexual health'])
  messageTemplate: text("message_template").notNull(), // template message to send to patient
  suggestedDate: timestamp("suggested_date"), // when AI suggests this should be scheduled
  status: text("status").notNull().default("suggested"), // 'suggested', 'sent', 'completed', 'declined'
  sentDate: timestamp("sent_date"), // when message was sent to patient
  responseDate: timestamp("response_date"), // when patient responded
  responseContent: text("response_content"), // patient's response
  billingCode: text("billing_code"), // optional billing code for the service
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPendingItemSchema = createInsertSchema(pendingItems).pick({
  patientId: true,
  type: true,
  description: true,
  requestedDate: true,
  dueDate: true,
  priority: true,
  status: true,
  messageId: true,
  notes: true,
});

export const insertPreventativeCareSchema = createInsertSchema(preventativeCare).pick({
  patientId: true,
  category: true,
  name: true,
  description: true,
  relevantTo: true,
  messageTemplate: true, 
  suggestedDate: true,
  status: true,
  billingCode: true,
});

// Export types for use in the application
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Patient = typeof patients.$inferSelect;
export type InsertPatient = z.infer<typeof insertPatientSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type AIDocumentation = typeof aiDocumentations.$inferSelect;
export type InsertAIDocumentation = z.infer<typeof insertAiDocumentationSchema>;

export type FormSubmission = typeof formSubmissions.$inferSelect;
export type InsertFormSubmission = z.infer<typeof insertFormSubmissionSchema>;

export type PendingItem = typeof pendingItems.$inferSelect;
export type InsertPendingItem = z.infer<typeof insertPendingItemSchema>;

export type PreventativeCare = typeof preventativeCare.$inferSelect;
export type InsertPreventativeCare = z.infer<typeof insertPreventativeCareSchema>;

// AI Settings model
export const aiSettings = pgTable("ai_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // The doctor who owns these settings
  hpiConfirmationEnabled: boolean("hpi_confirmation_enabled").default(true),
  differentialDiagnosisEnabled: boolean("differential_diagnosis_enabled").default(true),
  followUpQuestionsEnabled: boolean("follow_up_questions_enabled").default(true),
  preventativeCareEnabled: boolean("preventative_care_enabled").default(true),
  labworkSuggestionsEnabled: boolean("labwork_suggestions_enabled").default(true),
  inPersonReferralEnabled: boolean("in_person_referral_enabled").default(true),
  prescriptionSuggestionsEnabled: boolean("prescription_suggestions_enabled").default(true),
  medicalNotesDraftEnabled: boolean("medical_notes_draft_enabled").default(true),
  pendingItemsTrackingEnabled: boolean("pending_items_tracking_enabled").default(true),
  billingOptimizationEnabled: boolean("billing_optimization_enabled").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAiSettingsSchema = createInsertSchema(aiSettings).pick({
  userId: true,
  hpiConfirmationEnabled: true,
  differentialDiagnosisEnabled: true,
  followUpQuestionsEnabled: true,
  preventativeCareEnabled: true,
  labworkSuggestionsEnabled: true,
  inPersonReferralEnabled: true,
  prescriptionSuggestionsEnabled: true,
  medicalNotesDraftEnabled: true,
  pendingItemsTrackingEnabled: true,
  billingOptimizationEnabled: true,
});

export type AiSettings = typeof aiSettings.$inferSelect;
export type InsertAiSettings = z.infer<typeof insertAiSettingsSchema>;

// Chronic Conditions model
export const chronicConditions = pgTable("chronic_conditions", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patients.id),
  name: text("name").notNull(),
  status: text("status", { enum: ["active", "resolved", "managed"] }).notNull().default("active"),
  diagnosisDate: timestamp("diagnosis_date"),
  lastReviewDate: timestamp("last_review_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertChronicConditionSchema = createInsertSchema(chronicConditions).pick({
  patientId: true,
  name: true,
  status: true,
  diagnosisDate: true,
  lastReviewDate: true,
  notes: true,
});

export type ChronicCondition = typeof chronicConditions.$inferSelect;
export type InsertChronicCondition = z.infer<typeof insertChronicConditionSchema>;

// Medications model
export const medications = pgTable("medications", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patients.id),
  name: text("name").notNull(),
  dosage: text("dosage").notNull(),
  frequency: text("frequency").notNull(),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  isActive: boolean("is_active").default(true),
  renewalDate: timestamp("renewal_date"),
  prescribedBy: text("prescribed_by"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMedicationSchema = createInsertSchema(medications).pick({
  patientId: true,
  name: true,
  dosage: true,
  frequency: true,
  startDate: true,
  endDate: true,
  isActive: true,
  renewalDate: true,
  prescribedBy: true,
  notes: true,
});

export type Medication = typeof medications.$inferSelect;
export type InsertMedication = z.infer<typeof insertMedicationSchema>;

// Patient Documents model
export const patientDocuments = pgTable("patient_documents", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patients.id),
  title: text("title").notNull(),
  documentType: text("document_type", { 
    enum: ["lab_result", "imaging", "consultation", "prescription", "other"] 
  }).notNull(),
  fileUrl: text("file_url").notNull(),
  fileContentType: text("file_content_type"),
  uploadDate: timestamp("upload_date").defaultNow(),
  documentDate: timestamp("document_date"),
  sourceSystem: text("source_system"),
  // AI-processed fields
  interpretationSummary: text("interpretation_summary"),
  verificationStatus: text("verification_status", { 
    enum: ["unverified", "in_progress", "verified", "conflict"] 
  }).default("unverified"),
  keyFindings: text("key_findings"),
  actionNeeded: boolean("action_needed").default(false),
  aiProcessedAt: timestamp("ai_processed_at"),
});

export const insertPatientDocumentSchema = createInsertSchema(patientDocuments).pick({
  patientId: true,
  title: true,
  documentType: true,
  fileUrl: true,
  fileContentType: true,
  documentDate: true,
  sourceSystem: true,
  interpretationSummary: true,
  verificationStatus: true,
  keyFindings: true,
  actionNeeded: true,
});

export type PatientDocument = typeof patientDocuments.$inferSelect;
export type InsertPatientDocument = z.infer<typeof insertPatientDocumentSchema>;

// AI Document Verification model
export const aiDocumentVerifications = pgTable("ai_document_verifications", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull().references(() => patientDocuments.id),
  modelName: text("model_name").notNull(), // "openai", "anthropic", "xai"
  modelVersion: text("model_version").notNull(),
  interpretationSummary: text("interpretation_summary"),
  keyFindings: text("key_findings"),
  confidenceScore: text("confidence_score"),
  actionRecommended: boolean("action_recommended").default(false),
  processingTime: text("processing_time"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAiDocumentVerificationSchema = createInsertSchema(aiDocumentVerifications).pick({
  documentId: true,
  modelName: true,
  modelVersion: true,
  interpretationSummary: true,
  keyFindings: true,
  confidenceScore: true,
  actionRecommended: true,
  processingTime: true,
});

export type AiDocumentVerification = typeof aiDocumentVerifications.$inferSelect;
export type InsertAiDocumentVerification = z.infer<typeof insertAiDocumentVerificationSchema>;

// AI Prompts model for customizing AI behavior
export const aiPrompts = pgTable("ai_prompts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category", { enum: ["documentation", "response", "analysis"] }).notNull(),
  promptText: text("prompt_text").notNull(),
  enabled: boolean("enabled").default(true),
  order: integer("order").notNull(),
  userId: integer("user_id").references(() => users.id), // Optional reference to user who created it
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAiPromptSchema = createInsertSchema(aiPrompts).pick({
  name: true,
  category: true,
  promptText: true,
  enabled: true,
  order: true,
  userId: true,
});

export type AiPrompt = typeof aiPrompts.$inferSelect;
export type InsertAiPrompt = z.infer<typeof insertAiPromptSchema>;

// Education Modules model for feature unlocking
export const educationModules = pgTable("education_modules", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type", { enum: ["video", "article", "quiz", "interactive"] }).notNull(),
  content: text("content").notNull(), // Could be a URL or markdown content
  featuresUnlocked: text("features_unlocked").array().notNull(), // Which features this module unlocks
  prerequisiteModules: integer("prerequisite_modules").array(), // IDs of modules that must be completed first
  order: integer("order").notNull(), // Display order in the learning path
  estimatedMinutes: integer("estimated_minutes").notNull().default(10),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEducationModuleSchema = createInsertSchema(educationModules).pick({
  title: true,
  description: true,
  type: true,
  content: true,
  featuresUnlocked: true,
  prerequisiteModules: true,
  order: true,
  estimatedMinutes: true,
});

export type EducationModule = typeof educationModules.$inferSelect;
export type InsertEducationModule = z.infer<typeof insertEducationModuleSchema>;

// User Education Progress model for tracking user progress
export const userEducationProgress = pgTable("user_education_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  moduleId: integer("module_id").notNull().references(() => educationModules.id),
  status: text("status", { enum: ["not_started", "in_progress", "completed"] }).notNull().default("not_started"),
  completedAt: timestamp("completed_at"),
  quizScore: integer("quiz_score"), // If applicable
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserEducationProgressSchema = createInsertSchema(userEducationProgress).pick({
  userId: true,
  moduleId: true,
  status: true,
  completedAt: true,
  quizScore: true,
  notes: true,
});

export type UserEducationProgress = typeof userEducationProgress.$inferSelect;
export type InsertUserEducationProgress = z.infer<typeof insertUserEducationProgressSchema>;

// Form templates
export const formTemplates = pgTable("form_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  userId: integer("user_id").references(() => users.id),
  isPublic: boolean("is_public").default(false).notNull(),
  category: text("category").notNull(),
  questions: jsonb("questions").notNull()
});

export const insertFormTemplateSchema = createInsertSchema(formTemplates).pick({
  name: true,
  description: true,
  userId: true,
  isPublic: true,
  category: true,
  questions: true
});

export type FormTemplate = typeof formTemplates.$inferSelect;
export type InsertFormTemplate = z.infer<typeof insertFormTemplateSchema>;

// Form responses
export const formResponses = pgTable("form_responses", {
  id: serial("id").primaryKey(),
  formTemplateId: integer("form_template_id").references(() => formTemplates.id).notNull(),
  patientId: integer("patient_id").references(() => patients.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  answers: jsonb("answers").notNull(),
  status: text("status").default("in_progress").notNull(), // in_progress, completed
  notes: text("notes")
});

export const insertFormResponseSchema = createInsertSchema(formResponses).pick({
  formTemplateId: true,
  patientId: true,
  completedAt: true,
  answers: true,
  status: true,
  notes: true
});

export type FormResponse = typeof formResponses.$inferSelect;
export type InsertFormResponse = z.infer<typeof insertFormResponseSchema>;
