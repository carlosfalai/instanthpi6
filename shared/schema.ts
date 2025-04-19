import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
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
