import {
  users, patients, messages, aiDocumentations, formSubmissions, 
  pendingItems, preventativeCare, aiSettings,
  type User, type Patient, type Message, type AIDocumentation,
  type FormSubmission, type PendingItem, type PreventativeCare,
  type InsertUser, type InsertPatient, type InsertMessage, 
  type InsertAIDocumentation, type InsertFormSubmission,
  type InsertPendingItem, type InsertPreventativeCare
} from "@shared/schema";

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
  updateDocumentation(id: number, data: Partial<InsertAIDocumentation>): Promise<AIDocumentation | undefined>;
  
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
  updatePreventativeCare(id: string, data: Partial<InsertPreventativeCare>): Promise<PreventativeCare | undefined>;
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
  private nextId = 1;

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.find(u => u.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find(u => u.username === username);
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
        showUrgentCare: true
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
    return this.patients.find(p => p.id === id);
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
    const index = this.patients.findIndex(p => p.id === id);
    if (index === -1) return undefined;
    
    this.patients[index] = { ...this.patients[index], ...data };
    return this.patients[index];
  }

  async searchPatients(query: string): Promise<Patient[]> {
    if (!query) return this.patients;
    
    const lowercaseQuery = query.toLowerCase();
    return this.patients.filter(p => 
      p.name.toLowerCase().includes(lowercaseQuery) ||
      p.email?.toLowerCase().includes(lowercaseQuery) ||
      p.phone?.includes(query)
    );
  }

  async getPatientBySpruceId(spruceId: string): Promise<Patient | undefined> {
    return this.patients.find(p => p.spruceId === spruceId);
  }

  // Message methods
  async getMessages(patientId: number): Promise<Message[]> {
    return this.messages.filter(m => m.patientId === patientId);
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
    return this.messages.filter(m => m.patientId === patientId);
  }

  // AI Documentation methods
  async getDocumentation(patientId: number): Promise<AIDocumentation[]> {
    return this.aiDocumentations.filter(d => d.patientId === patientId);
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

  async updateDocumentation(id: number, data: Partial<InsertAIDocumentation>): Promise<AIDocumentation | undefined> {
    const index = this.aiDocumentations.findIndex(d => d.id === id);
    if (index === -1) return undefined;
    
    this.aiDocumentations[index] = { ...this.aiDocumentations[index], ...data };
    return this.aiDocumentations[index];
  }

  // Form Submission methods
  async getFormSubmissions(patientId?: number): Promise<FormSubmission[]> {
    if (patientId) {
      return this.formSubmissions.filter(f => f.patientId === patientId);
    }
    return this.formSubmissions;
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
      return this.pendingItems.filter(p => p.patientId === patientId);
    }
    return this.pendingItems;
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

  async updatePendingItem(id: string, data: Partial<InsertPendingItem>): Promise<PendingItem | undefined> {
    const index = this.pendingItems.findIndex(p => p.id === id);
    if (index === -1) return undefined;
    
    this.pendingItems[index] = { ...this.pendingItems[index], ...data };
    return this.pendingItems[index];
  }

  // Preventative Care methods
  async getPreventativeCare(patientId?: number): Promise<PreventativeCare[]> {
    if (patientId) {
      return this.preventativeCare.filter(p => p.patientId === patientId);
    }
    return this.preventativeCare;
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

  async updatePreventativeCare(id: string, data: Partial<InsertPreventativeCare>): Promise<PreventativeCare | undefined> {
    const index = this.preventativeCare.findIndex(p => p.id === id);
    if (index === -1) return undefined;
    
    this.preventativeCare[index] = { ...this.preventativeCare[index], ...data };
    return this.preventativeCare[index];
  }
}

export const storage = new MemStorage();