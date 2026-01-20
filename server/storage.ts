import {
  users,
  patients,
  messages,
  aiDocumentations,
  formSubmissions,
  pendingItems,
  preventativeCare,
  aiSettings,
  type User,
  type Patient,
  type Message,
  type AIDocumentation,
  type FormSubmission,
  type PendingItem,
  type PreventativeCare,
  type InsertUser,
  type InsertPatient,
  type InsertMessage,
  type InsertAIDocumentation,
  type InsertFormSubmission,
  type InsertPendingItem,
  type InsertPreventativeCare,
  type FormTemplate as SchemaFormTemplate,
  type FormResponse as SchemaFormResponse,
  type InsertFormTemplate,
  type InsertFormResponse,
} from "@shared/schema";

// Types for in-memory storage entities not in schema
interface StorageDocument {
  id: number;
  patientId: number;
  title?: string;
  content?: string;
  type?: string;
  [key: string]: unknown;
}

interface EducationModule {
  id: number;
  title: string;
  content: string;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: unknown;
}

interface PatientActivity {
  id: number;
  patientId: number;
  activityType?: string;
  type?: string;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  [key: string]: unknown;
}

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Patient methods
  getPatients(): Promise<Patient[]>;
  getPatient(id: number): Promise<Patient | undefined>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  updatePatient(id: number, data: Partial<InsertPatient>): Promise<Patient | undefined>;
  searchPatients(query: string): Promise<Patient[]>;
  getPatientBySpruceId(spruceId: string): Promise<Patient | undefined>;

  // Message methods
  getMessages(patientId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByPatientId(patientId: number): Promise<Message[]>;

  // AI Documentation methods
  getDocumentation(patientId: number): Promise<AIDocumentation[]>;
  createDocumentation(doc: InsertAIDocumentation): Promise<AIDocumentation>;
  updateDocumentation(
    id: number,
    data: Partial<InsertAIDocumentation>
  ): Promise<AIDocumentation | undefined>;

  // Form Submission methods
  getFormSubmissions(patientId?: number): Promise<FormSubmission[]>;
  createFormSubmission(submission: InsertFormSubmission): Promise<FormSubmission>;

  // Pending Items methods
  getPendingItems(patientId?: number): Promise<PendingItem[]>;
  createPendingItem(item: InsertPendingItem): Promise<PendingItem>;
  updatePendingItem(id: string, data: Partial<InsertPendingItem>): Promise<PendingItem | undefined>;

  // Preventative Care methods
  getPreventativeCare(patientId?: number): Promise<PreventativeCare[]>;
  createPreventativeCare(care: InsertPreventativeCare): Promise<PreventativeCare>;
  updatePreventativeCare(
    id: string,
    data: Partial<InsertPreventativeCare>
  ): Promise<PreventativeCare | undefined>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: User[] = [];
  private patients: Patient[] = [];
  private messages: Message[] = [];
  private aiDocumentations: AIDocumentation[] = [];
  private formSubmissions: FormSubmission[] = [];
  private pendingItems: PendingItem[] = [];
  private preventativeCare: PreventativeCare[] = [];
  // Optional in-memory docs/forms to satisfy routes typing
  private documents: StorageDocument[] = [];
  private educationModules: EducationModule[] = [];
  private formTemplates: SchemaFormTemplate[] = [];
  private formResponses: SchemaFormResponse[] = [];
  private patientActivities: PatientActivity[] = [];
  private nextId = 1;

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.find((u) => u.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find((u) => u.username === username);
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser: User = {
      id: this.nextId++,
      email: null,
      avatarUrl: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      premiumUntil: null,
      isPremium: null,
      createdAt: new Date(),
      role: user.role || "doctor",
      navPreferences: user.navPreferences || {
        showChronicConditions: true,
        showMedicationRefills: true,
        showUrgentCare: true,
      },
      ...user,
    };
    this.users.push(newUser);
    return newUser;
  }

  // Patient methods
  async getPatients(): Promise<Patient[]> {
    return this.patients;
  }

  async getPatient(id: number): Promise<Patient | undefined> {
    return this.patients.find((p) => p.id === id);
  }

  async createPatient(patient: InsertPatient): Promise<Patient> {
    const newPatient: Patient = {
      id: this.nextId++,
      lastVisit: null,
      avatarUrl: null,
      healthCardNumber: null,
      status: null,
      spruceId: patient.spruceId || null,
      language: patient.language || null,
      ...patient,
    };
    this.patients.push(newPatient);
    return newPatient;
  }

  async updatePatient(id: number, data: Partial<InsertPatient>): Promise<Patient | undefined> {
    const index = this.patients.findIndex((p) => p.id === id);
    if (index === -1) return undefined;

    this.patients[index] = { ...this.patients[index], ...data };
    return this.patients[index];
  }

  async searchPatients(query: string): Promise<Patient[]> {
    if (!query) return this.patients;

    const lowercaseQuery = query.toLowerCase();
    return this.patients.filter(
      (p) =>
        p.name.toLowerCase().includes(lowercaseQuery) ||
        p.email?.toLowerCase().includes(lowercaseQuery) ||
        p.phone?.includes(query)
    );
  }

  async getPatientBySpruceId(spruceId: string): Promise<Patient | undefined> {
    return this.patients.find((p) => p.spruceId === spruceId);
  }

  // Message methods
  async getMessages(patientId: number): Promise<Message[]> {
    return this.messages.filter((m) => m.patientId === patientId);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const newMessage: Message = {
      id: this.nextId++,
      timestamp: new Date(),
      attachmentUrl: message.attachmentUrl || null,
      spruceMessageId: message.spruceMessageId || null,
      ...message,
    };
    this.messages.push(newMessage);
    return newMessage;
  }

  async getMessagesByPatientId(patientId: number): Promise<Message[]> {
    return this.messages.filter((m) => m.patientId === patientId);
  }

  // Aliases used by routes
  async getMessageBySpruceId(spruceId: string): Promise<Message | undefined> {
    return this.messages.find((m) => m.spruceMessageId === spruceId);
  }

  // AI Documentation methods
  async getDocumentation(patientId: number): Promise<AIDocumentation[]> {
    return this.aiDocumentations.filter((d) => d.patientId === patientId);
  }

  async getDocumentationByPatientId(patientId: number): Promise<AIDocumentation[]> {
    return this.getDocumentation(patientId);
  }

  async createDocumentation(doc: InsertAIDocumentation): Promise<AIDocumentation> {
    const newDoc: AIDocumentation = {
      id: this.nextId++,
      createdAt: new Date(),
      hpi: doc.hpi || null,
      subjective: doc.subjective || null,
      objective: doc.objective || null,
      assessment: doc.assessment || null,
      plan: doc.plan || null,
      prescription: doc.prescription || null,
      followUpQuestions: doc.followUpQuestions || null,
      isApproved: doc.isApproved || false,
      ...doc,
    };
    this.aiDocumentations.push(newDoc);
    return newDoc;
  }

  async updateDocumentation(
    id: number,
    data: Partial<InsertAIDocumentation>
  ): Promise<AIDocumentation | undefined> {
    const index = this.aiDocumentations.findIndex((d) => d.id === id);
    if (index === -1) return undefined;

    this.aiDocumentations[index] = { ...this.aiDocumentations[index], ...data };
    return this.aiDocumentations[index];
  }

  // Form Submission methods
  async getFormSubmissions(patientId?: number): Promise<FormSubmission[]> {
    if (patientId) {
      return this.formSubmissions.filter((f) => f.patientId === patientId);
    }
    return this.formSubmissions;
  }

  async getFormSubmissionsByPatientId(patientId: number): Promise<FormSubmission[]> {
    return this.getFormSubmissions(patientId);
  }

  async createFormSubmission(submission: InsertFormSubmission): Promise<FormSubmission> {
    const newSubmission: FormSubmission = {
      id: this.nextId++,
      ...submission,
      submittedAt: submission.submittedAt || new Date(),
    };
    this.formSubmissions.push(newSubmission);
    return newSubmission;
  }

  // Pending Items methods
  async getPendingItems(patientId?: number): Promise<PendingItem[]> {
    if (patientId) {
      return this.pendingItems.filter((p) => p.patientId === patientId);
    }
    return this.pendingItems;
  }

  async getPendingItemsByPatientId(patientId: number): Promise<PendingItem[]> {
    return this.getPendingItems(patientId);
  }

  async getNextPreventativeCareItem(_patientId: number): Promise<PreventativeCare | undefined> {
    // Simplified: return first suggested item
    return this.preventativeCare.find((pc) => pc.status === "suggested");
  }

  async createPendingItem(item: InsertPendingItem): Promise<PendingItem> {
    const newItem: PendingItem = {
      id: crypto.randomUUID(),
      createdAt: new Date(),
      completedAt: null,
      requestedDate: item.requestedDate || null,
      dueDate: item.dueDate || null,
      priority: item.priority || "medium",
      status: item.status || "pending",
      messageId: item.messageId || null,
      notes: item.notes || null,
      ...item,
    };
    this.pendingItems.push(newItem);
    return newItem;
  }

  async updatePendingItem(
    id: string,
    data: Partial<InsertPendingItem>
  ): Promise<PendingItem | undefined> {
    const index = this.pendingItems.findIndex((p) => p.id === id);
    if (index === -1) return undefined;

    this.pendingItems[index] = { ...this.pendingItems[index], ...data };
    return this.pendingItems[index];
  }

  // Preventative Care methods
  async getPreventativeCare(patientId?: number): Promise<PreventativeCare[]> {
    if (patientId) {
      return this.preventativeCare.filter((p) => p.patientId === patientId);
    }
    return this.preventativeCare;
  }

  async getPreventativeCareByPatientId(patientId: number): Promise<PreventativeCare[]> {
    return this.getPreventativeCare(patientId);
  }

  async createPreventativeCare(care: InsertPreventativeCare): Promise<PreventativeCare> {
    const newCare: PreventativeCare = {
      id: crypto.randomUUID(),
      createdAt: new Date(),
      status: care.status || "suggested",
      relevantTo: care.relevantTo || null,
      suggestedDate: care.suggestedDate || null,
      billingCode: care.billingCode || null,
      sentDate: null,
      responseDate: null,
      responseContent: null,
      ...care,
    };
    this.preventativeCare.push(newCare);
    return newCare;
  }

  async updatePreventativeCare(
    id: string,
    data: Partial<InsertPreventativeCare>
  ): Promise<PreventativeCare | undefined> {
    const index = this.preventativeCare.findIndex((p) => p.id === id);
    if (index === -1) return undefined;

    this.preventativeCare[index] = { ...this.preventativeCare[index], ...data };
    return this.preventativeCare[index];
  }

  // Document methods
  async getDocument(documentId: string): Promise<unknown | undefined> {
    return this.documents.find((d) => String(d.id) === documentId);
  }

  async createPatientActivity(activity: Omit<PatientActivity, "id" | "createdAt">): Promise<PatientActivity> {
    const newActivity = {
      id: this.nextId++,
      createdAt: new Date(),
      ...activity,
    } as PatientActivity;
    this.patientActivities.push(newActivity);
    return newActivity;
  }

  // Form Template methods
  async getAllFormTemplates(): Promise<SchemaFormTemplate[]> {
    return this.formTemplates;
  }

  async getFormTemplatesByCategory(category: string): Promise<SchemaFormTemplate[]> {
    return this.formTemplates.filter((t) => t.category === category);
  }

  async getFormTemplate(id: number): Promise<SchemaFormTemplate | undefined> {
    return this.formTemplates.find((t) => t.id === id);
  }

  async createFormTemplate(template: InsertFormTemplate): Promise<SchemaFormTemplate> {
    const newTemplate = {
      id: this.nextId++,
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: template.isPublic ?? false,
      ...template,
    } as SchemaFormTemplate;
    this.formTemplates.push(newTemplate);
    return newTemplate;
  }

  async updateFormTemplate(id: number, data: Partial<InsertFormTemplate>): Promise<SchemaFormTemplate | undefined> {
    const index = this.formTemplates.findIndex((t) => t.id === id);
    if (index === -1) return undefined;

    this.formTemplates[index] = {
      ...this.formTemplates[index],
      ...data,
      updatedAt: new Date(),
    };
    return this.formTemplates[index];
  }

  async deleteFormTemplate(id: number): Promise<boolean> {
    const index = this.formTemplates.findIndex((t) => t.id === id);
    if (index === -1) return false;

    this.formTemplates.splice(index, 1);
    return true;
  }

  // Form Response methods
  async getFormResponsesByPatientId(patientId: number): Promise<SchemaFormResponse[]> {
    return this.formResponses.filter((r) => r.patientId === patientId);
  }

  async getFormResponsesByTemplateId(templateId: number): Promise<SchemaFormResponse[]> {
    return this.formResponses.filter((r) => r.formTemplateId === templateId);
  }

  async getFormResponse(id: number): Promise<SchemaFormResponse | undefined> {
    return this.formResponses.find((r) => r.id === id);
  }

  async createFormResponse(response: InsertFormResponse): Promise<SchemaFormResponse> {
    const newResponse = {
      id: this.nextId++,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: response.status ?? "in_progress",
      ...response,
    } as SchemaFormResponse;
    this.formResponses.push(newResponse);
    return newResponse;
  }

  async updateFormResponse(id: number, data: Partial<InsertFormResponse>): Promise<SchemaFormResponse | undefined> {
    const index = this.formResponses.findIndex((r) => r.id === id);
    if (index === -1) return undefined;

    this.formResponses[index] = {
      ...this.formResponses[index],
      ...data,
      updatedAt: new Date(),
    };
    return this.formResponses[index];
  }

  async deleteFormResponse(id: number): Promise<boolean> {
    const index = this.formResponses.findIndex((r) => r.id === id);
    if (index === -1) return false;

    this.formResponses.splice(index, 1);
    return true;
  }

  // Education Module methods
  async createEducationModule(module: Omit<EducationModule, "id" | "createdAt" | "updatedAt">): Promise<EducationModule> {
    const newModule = {
      id: this.nextId++,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...module,
    } as EducationModule;
    this.educationModules.push(newModule);
    return newModule;
  }

  async updateEducationModule(id: number, data: Partial<Omit<EducationModule, "id" | "createdAt">>): Promise<EducationModule | undefined> {
    const index = this.educationModules.findIndex((m) => m.id === id);
    if (index === -1) return undefined;

    this.educationModules[index] = {
      ...this.educationModules[index],
      ...data,
      updatedAt: new Date(),
    };
    return this.educationModules[index];
  }

  async deleteEducationModule(id: number): Promise<boolean> {
    const index = this.educationModules.findIndex((m) => m.id === id);
    if (index === -1) return false;

    this.educationModules.splice(index, 1);
    return true;
  }
}

export const storage = new MemStorage();
