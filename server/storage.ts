import { 
  users, type User, type InsertUser,
  patients, type Patient, type InsertPatient,
  messages, type Message, type InsertMessage,
  aiDocumentations, type AIDocumentation, type InsertAIDocumentation,
  formSubmissions, type FormSubmission, type InsertFormSubmission,
  pendingItems, type PendingItem, type InsertPendingItem,
  preventativeCare, type PreventativeCare, type InsertPreventativeCare,
  aiPrompts, type AiPrompt, type InsertAiPrompt
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // Patient operations
  getPatient(id: number): Promise<Patient | undefined>;
  getPatientByEmail(email: string): Promise<Patient | undefined>;
  getAllPatients(): Promise<Patient[]>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  updatePatient(id: number, patient: Partial<InsertPatient>): Promise<Patient | undefined>;
  
  // Message operations
  getMessagesByPatientId(patientId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  getMessageBySpruceId(spruceMessageId: string): Promise<Message | undefined>;
  
  // AI Documentation operations
  getDocumentationByPatientId(patientId: number): Promise<AIDocumentation | undefined>;
  createDocumentation(documentation: InsertAIDocumentation): Promise<AIDocumentation>;
  updateDocumentation(id: number, documentation: Partial<InsertAIDocumentation>): Promise<AIDocumentation | undefined>;
  
  // Form Submission operations
  getFormSubmissionsByPatientId(patientId: number): Promise<FormSubmission[]>;
  getFormSubmissionById(id: number): Promise<FormSubmission | undefined>;
  createFormSubmission(submission: InsertFormSubmission): Promise<FormSubmission>;
  
  // Pending Items operations
  getPendingItemsByPatientId(patientId: number): Promise<PendingItem[]>;
  getAllPendingItems(): Promise<PendingItem[]>;
  getPendingItemById(id: string): Promise<PendingItem | undefined>;
  createPendingItem(item: InsertPendingItem): Promise<PendingItem>;
  updatePendingItem(id: string, item: Partial<InsertPendingItem>): Promise<PendingItem | undefined>;
  deletePendingItem(id: string): Promise<boolean>;
  
  // Preventative Care operations
  getPreventativeCareByPatientId(patientId: number): Promise<PreventativeCare[]>;
  getPreventativeCareById(id: string): Promise<PreventativeCare | undefined>;
  createPreventativeCare(item: InsertPreventativeCare): Promise<PreventativeCare>;
  updatePreventativeCare(id: string, item: Partial<InsertPreventativeCare>): Promise<PreventativeCare | undefined>;
  deletePreventativeCare(id: string): Promise<boolean>;
  getNextPreventativeCareItem(patientId: number): Promise<PreventativeCare | undefined>;
  
  // AI Prompts operations
  getAllAiPrompts(): Promise<AiPrompt[]>;
  getAiPromptsByCategory(category: string): Promise<AiPrompt[]>;
  getAiPrompt(id: number): Promise<AiPrompt | undefined>;
  createAiPrompt(prompt: InsertAiPrompt): Promise<AiPrompt>;
  updateAiPrompt(id: number, prompt: Partial<InsertAiPrompt>): Promise<AiPrompt | undefined>;
  deleteAiPrompt(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private patients: Map<number, Patient>;
  private messages: Map<number, Message>;
  private aiDocumentations: Map<number, AIDocumentation>;
  private formSubmissions: Map<number, FormSubmission>;
  private pendingItems: Map<string, PendingItem>;
  private preventativeCare: Map<string, PreventativeCare>;
  private aiPrompts: Map<number, AiPrompt>;
  
  private userId: number;
  private patientId: number;
  private messageId: number;
  private documentationId: number;
  private submissionId: number;
  private promptId: number;

  constructor() {
    this.users = new Map();
    this.patients = new Map();
    this.messages = new Map();
    this.aiDocumentations = new Map();
    this.formSubmissions = new Map();
    this.pendingItems = new Map();
    this.preventativeCare = new Map();
    this.aiPrompts = new Map();
    
    this.userId = 1;
    this.patientId = 1;
    this.messageId = 1;
    this.documentationId = 1;
    this.submissionId = 1;
    this.promptId = 1;
    
    // Add a default user for testing
    this.createUser({
      username: "drjohnson",
      password: "password123",
      fullName: "Dr. Sarah Johnson",
      role: "doctor",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=100&h=100&q=80"
    });
    
    // Add sample patients for testing
    this.createPatient({
      name: "Jessica Thompson",
      gender: "Female",
      dateOfBirth: "1991-08-15",
      email: "jessica.thompson@example.com",
      phone: "555-123-4567",
      lastVisit: new Date("2023-05-15"),
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=100&h=100&q=80"
    });
    
    // Add more patients for search testing
    this.createPatient({
      name: "Nicolas Girard",
      gender: "Male",
      dateOfBirth: "1982-04-15",
      email: "nicolas.girard@example.com",
      phone: "555-234-5678",
      healthCardNumber: "GIRN12345678"
    });
    
    this.createPatient({
      name: "Marie Tremblay",
      gender: "Female",
      dateOfBirth: "1990-06-22",
      email: "marie.t@example.com",
      phone: "555-345-6789",
      healthCardNumber: "TREM98765432"
    });
    
    this.createPatient({
      name: "Robert Johnson",
      gender: "Male",
      dateOfBirth: "1975-11-30",
      email: "robert.j@example.com",
      phone: "555-456-7890"
    });
    
    this.createPatient({
      name: "Sophie Chen",
      gender: "Female",
      dateOfBirth: "1988-03-10",
      email: "sophie.chen@example.com",
      phone: "555-567-8901",
      lastVisit: new Date("2023-04-01")
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    // Create user with defaults for nullable fields
    const user: User = { 
      ...insertUser, 
      id, 
      role: insertUser.role || "doctor", 
      avatarUrl: insertUser.avatarUrl || null,
      createdAt: new Date() 
    };
    this.users.set(id, user);
    return user;
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  // Patient operations
  async getPatient(id: number): Promise<Patient | undefined> {
    return this.patients.get(id);
  }
  
  async getPatientByEmail(email: string): Promise<Patient | undefined> {
    return Array.from(this.patients.values()).find(
      (patient) => patient.email === email,
    );
  }
  
  async getAllPatients(): Promise<Patient[]> {
    return Array.from(this.patients.values());
  }
  
  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    const id = this.patientId++;
    const patient: Patient = { 
      ...insertPatient, 
      id,
      avatarUrl: insertPatient.avatarUrl || null,
      status: insertPatient.status || "active",
      lastVisit: insertPatient.lastVisit || null,
      healthCardNumber: insertPatient.healthCardNumber || null,
      spruceId: insertPatient.spruceId || null,
      language: insertPatient.language || "english"
    };
    this.patients.set(id, patient);
    return patient;
  }
  
  async updatePatient(id: number, patientUpdate: Partial<InsertPatient>): Promise<Patient | undefined> {
    const existingPatient = this.patients.get(id);
    if (!existingPatient) return undefined;
    
    const updatedPatient = { ...existingPatient, ...patientUpdate };
    this.patients.set(id, updatedPatient);
    return updatedPatient;
  }
  
  // Message operations
  async getMessagesByPatientId(patientId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter((message) => message.patientId === patientId)
      .sort((a, b) => {
        // Handle null timestamps
        if (!a.timestamp && !b.timestamp) return 0;
        if (!a.timestamp) return 1;
        if (!b.timestamp) return -1;
        return a.timestamp.getTime() - b.timestamp.getTime();
      });
  }
  
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.messageId++;
    const message: Message = { 
      ...insertMessage, 
      id, 
      timestamp: new Date(),
      attachmentUrl: insertMessage.attachmentUrl || null,
      spruceMessageId: insertMessage.spruceMessageId || null
    };
    this.messages.set(id, message);
    return message;
  }
  
  async getMessageBySpruceId(spruceMessageId: string): Promise<Message | undefined> {
    return Array.from(this.messages.values()).find(
      (message) => message.spruceMessageId === spruceMessageId,
    );
  }
  
  // AI Documentation operations
  async getDocumentationByPatientId(patientId: number): Promise<AIDocumentation | undefined> {
    // Return the most recent documentation for a patient
    const patientDocs = Array.from(this.aiDocumentations.values())
      .filter(doc => doc.patientId === patientId)
      .sort((a, b) => {
        // Handle null createdAt
        if (!a.createdAt && !b.createdAt) return 0;
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
    
    return patientDocs.length > 0 ? patientDocs[0] : undefined;
  }
  
  async createDocumentation(insertDocumentation: InsertAIDocumentation): Promise<AIDocumentation> {
    const id = this.documentationId++;
    const documentation: AIDocumentation = { 
      ...insertDocumentation, 
      id, 
      createdAt: new Date(),
      isApproved: insertDocumentation.isApproved || false,
      hpi: insertDocumentation.hpi || null,
      subjective: insertDocumentation.subjective || null,
      objective: insertDocumentation.objective || null,
      assessment: insertDocumentation.assessment || null,
      plan: insertDocumentation.plan || null,
      prescription: insertDocumentation.prescription || null,
      followUpQuestions: insertDocumentation.followUpQuestions || null
    };
    this.aiDocumentations.set(id, documentation);
    return documentation;
  }
  
  async updateDocumentation(id: number, documentationUpdate: Partial<InsertAIDocumentation>): Promise<AIDocumentation | undefined> {
    const existingDoc = this.aiDocumentations.get(id);
    if (!existingDoc) return undefined;
    
    const updatedDoc = { ...existingDoc, ...documentationUpdate };
    this.aiDocumentations.set(id, updatedDoc);
    return updatedDoc;
  }
  
  // Form Submission operations
  async getFormSubmissionsByPatientId(patientId: number): Promise<FormSubmission[]> {
    return Array.from(this.formSubmissions.values())
      .filter((submission) => submission.patientId === patientId)
      .sort((a, b) => {
        // Handle null submittedAt
        if (!a.submittedAt && !b.submittedAt) return 0;
        if (!a.submittedAt) return 1;
        if (!b.submittedAt) return -1;
        return b.submittedAt.getTime() - a.submittedAt.getTime();
      });
  }
  
  async getFormSubmissionById(id: number): Promise<FormSubmission | undefined> {
    return this.formSubmissions.get(id);
  }
  
  async createFormSubmission(insertSubmission: InsertFormSubmission): Promise<FormSubmission> {
    const id = this.submissionId++;
    const submission: FormSubmission = { 
      ...insertSubmission, 
      id, 
      submittedAt: new Date() 
    };
    this.formSubmissions.set(id, submission);
    return submission;
  }

  // Pending Items operations
  async getPendingItemsByPatientId(patientId: number): Promise<PendingItem[]> {
    return Array.from(this.pendingItems.values())
      .filter(item => item.patientId === patientId)
      .sort((a, b) => {
        // Sort by priority (high, medium, low)
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const priorityDiff = priorityOrder[a.priority as keyof typeof priorityOrder] - 
                            priorityOrder[b.priority as keyof typeof priorityOrder];
        
        if (priorityDiff !== 0) return priorityDiff;
        
        // Then by due date if available
        if (a.dueDate && b.dueDate) {
          return a.dueDate.getTime() - b.dueDate.getTime();
        }
        
        return 0;
      });
  }
  
  async getAllPendingItems(): Promise<PendingItem[]> {
    return Array.from(this.pendingItems.values());
  }
  
  async getPendingItemById(id: string): Promise<PendingItem | undefined> {
    return this.pendingItems.get(id);
  }
  
  async createPendingItem(item: InsertPendingItem): Promise<PendingItem> {
    const id = crypto.randomUUID();
    const pendingItem: PendingItem = {
      ...item,
      id,
      createdAt: new Date(),
      status: item.status || "pending",
      requestedDate: item.requestedDate || null,
      dueDate: item.dueDate || null,
      priority: item.priority || "medium",
      messageId: item.messageId || null,
      completedAt: null,
      notes: item.notes || null
    };
    this.pendingItems.set(id, pendingItem);
    return pendingItem;
  }
  
  async updatePendingItem(id: string, itemUpdate: Partial<InsertPendingItem>): Promise<PendingItem | undefined> {
    const existingItem = this.pendingItems.get(id);
    if (!existingItem) return undefined;
    
    const updatedItem = { ...existingItem, ...itemUpdate };
    this.pendingItems.set(id, updatedItem);
    return updatedItem;
  }
  
  async deletePendingItem(id: string): Promise<boolean> {
    return this.pendingItems.delete(id);
  }
  
  // Preventative Care operations
  async getPreventativeCareByPatientId(patientId: number): Promise<PreventativeCare[]> {
    return Array.from(this.preventativeCare.values())
      .filter(item => item.patientId === patientId)
      .sort((a, b) => {
        if (a.suggestedDate && b.suggestedDate) {
          return a.suggestedDate.getTime() - b.suggestedDate.getTime();
        }
        return 0;
      });
  }
  
  async getPreventativeCareById(id: string): Promise<PreventativeCare | undefined> {
    return this.preventativeCare.get(id);
  }
  
  async createPreventativeCare(item: InsertPreventativeCare): Promise<PreventativeCare> {
    const id = crypto.randomUUID();
    const preventativeCareItem: PreventativeCare = {
      ...item,
      id,
      sentDate: null,
      responseDate: null,
      responseContent: null,
      createdAt: new Date(),
    };
    this.preventativeCare.set(id, preventativeCareItem);
    return preventativeCareItem;
  }
  
  async updatePreventativeCare(id: string, itemUpdate: Partial<InsertPreventativeCare>): Promise<PreventativeCare | undefined> {
    const existingItem = this.preventativeCare.get(id);
    if (!existingItem) return undefined;
    
    const updatedItem = { ...existingItem, ...itemUpdate };
    this.preventativeCare.set(id, updatedItem);
    return updatedItem;
  }
  
  async deletePreventativeCare(id: string): Promise<boolean> {
    return this.preventativeCare.delete(id);
  }
  
  async getNextPreventativeCareItem(patientId: number): Promise<PreventativeCare | undefined> {
    const items = await this.getPreventativeCareByPatientId(patientId);
    // Get the next suggested item that hasn't been sent yet
    return items.find(item => item.status === "suggested");
  }
}

export const storage = new MemStorage();
