import { pgTable, text, serial, integer, boolean, timestamp, jsonb, uuid } from "drizzle-orm/pg-core";
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
});

export const insertPatientSchema = createInsertSchema(patients).pick({
  name: true,
  gender: true,
  dateOfBirth: true,
  email: true,
  phone: true,
  lastVisit: true,
  avatarUrl: true,
  healthCardNumber: true, // Added to schema
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
