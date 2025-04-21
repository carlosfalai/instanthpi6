import { 
  users, type User, type InsertUser,
  patients, type Patient, type InsertPatient,
  messages, type Message, type InsertMessage,
  aiDocumentations, type AIDocumentation, type InsertAIDocumentation,
  formSubmissions, type FormSubmission, type InsertFormSubmission,
  pendingItems, type PendingItem, type InsertPendingItem,
  preventativeCare, type PreventativeCare, type InsertPreventativeCare,
  aiPrompts, type AiPrompt, type InsertAiPrompt,
  educationModules, type EducationModule, type InsertEducationModule,
  userEducationProgress, type UserEducationProgress, type InsertUserEducationProgress,
  formTemplates, type FormTemplate, type InsertFormTemplate,
  formResponses, type FormResponse, type InsertFormResponse
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
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
  
  // Education Module operations
  getAllEducationModules(): Promise<EducationModule[]>;
  getEducationModule(id: number): Promise<EducationModule | undefined>;
  createEducationModule(module: InsertEducationModule): Promise<EducationModule>;
  updateEducationModule(id: number, module: Partial<InsertEducationModule>): Promise<EducationModule | undefined>;
  deleteEducationModule(id: number): Promise<boolean>;
  
  // User Education Progress operations
  getUserEducationProgress(userId: number): Promise<UserEducationProgress[]>;
  getModuleProgress(userId: number, moduleId: number): Promise<UserEducationProgress | undefined>;
  createUserEducationProgress(progress: InsertUserEducationProgress): Promise<UserEducationProgress>;
  updateUserEducationProgress(id: number, progress: Partial<InsertUserEducationProgress>): Promise<UserEducationProgress | undefined>;
  getUserUnlockedFeatures(userId: number): Promise<string[]>;
  
  // Form Template operations
  getAllFormTemplates(): Promise<FormTemplate[]>;
  getFormTemplatesByCategory(category: string): Promise<FormTemplate[]>;
  getFormTemplate(id: number): Promise<FormTemplate | undefined>;
  createFormTemplate(template: InsertFormTemplate): Promise<FormTemplate>;
  updateFormTemplate(id: number, template: Partial<InsertFormTemplate>): Promise<FormTemplate | undefined>;
  deleteFormTemplate(id: number): Promise<boolean>;
  
  // Form Response operations
  getFormResponsesByPatientId(patientId: number): Promise<FormResponse[]>;
  getFormResponsesByTemplateId(templateId: number): Promise<FormResponse[]>;
  getFormResponse(id: number): Promise<FormResponse | undefined>;
  createFormResponse(response: InsertFormResponse): Promise<FormResponse>;
  updateFormResponse(id: number, response: Partial<InsertFormResponse>): Promise<FormResponse | undefined>;
  deleteFormResponse(id: number): Promise<boolean>;
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
  private educationModules: Map<number, EducationModule>;
  private userEducationProgress: Map<number, UserEducationProgress>;
  private formTemplates: Map<number, FormTemplate>;
  private formResponses: Map<number, FormResponse>;
  
  private userId: number;
  private patientId: number;
  private messageId: number;
  private documentationId: number;
  private submissionId: number;
  private promptId: number;
  private moduleId: number;
  private progressId: number;
  private formTemplateId: number;
  private formResponseId: number;

  constructor() {
    this.users = new Map();
    this.patients = new Map();
    this.messages = new Map();
    this.aiDocumentations = new Map();
    this.formSubmissions = new Map();
    this.pendingItems = new Map();
    this.preventativeCare = new Map();
    this.aiPrompts = new Map();
    this.educationModules = new Map();
    this.userEducationProgress = new Map();
    this.formTemplates = new Map();
    this.formResponses = new Map();
    
    this.userId = 1;
    this.patientId = 1;
    this.messageId = 1;
    this.documentationId = 1;
    this.submissionId = 1;
    this.promptId = 1;
    this.moduleId = 1;
    this.progressId = 1;
    this.formTemplateId = 1;
    this.formResponseId = 1;
    
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
      createdAt: new Date(),
      navPreferences: insertUser.navPreferences || {
        showChronicConditions: true,
        showMedicationRefills: true,
        showUrgentCare: true
      }
    };
    this.users.set(id, user);
    return user;
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async updateUser(id: number, userUpdate: Partial<InsertUser>): Promise<User> {
    const existingUser = this.users.get(id);
    if (!existingUser) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    const updatedUser = { ...existingUser, ...userUpdate };
    this.users.set(id, updatedUser);
    return updatedUser;
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
      id,
      name: item.name,
      patientId: item.patientId,
      description: item.description,
      category: item.category,
      status: item.status,
      relevantTo: item.relevantTo || null,
      messageTemplate: item.messageTemplate,
      suggestedDate: item.suggestedDate || null,
      sentDate: null,
      responseDate: null,
      responseContent: null,
      createdAt: new Date(),
      billingCode: item.billingCode || null
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
  
  // AI Prompts operations
  async getAllAiPrompts(): Promise<AiPrompt[]> {
    return Array.from(this.aiPrompts.values());
  }
  
  async getAiPromptsByCategory(category: string): Promise<AiPrompt[]> {
    return Array.from(this.aiPrompts.values())
      .filter(prompt => prompt.category === category)
      .sort((a, b) => a.order - b.order);
  }
  
  async getAiPrompt(id: number): Promise<AiPrompt | undefined> {
    return this.aiPrompts.get(id);
  }
  
  async createAiPrompt(prompt: InsertAiPrompt): Promise<AiPrompt> {
    const id = this.promptId++;
    const now = new Date();
    
    const aiPrompt: AiPrompt = {
      id,
      name: prompt.name,
      category: prompt.category,
      order: prompt.order,
      promptText: prompt.promptText,
      userId: prompt.userId || null,
      createdAt: now,
      updatedAt: now,
      enabled: prompt.enabled || true
    };
    
    this.aiPrompts.set(id, aiPrompt);
    return aiPrompt;
  }
  
  async updateAiPrompt(id: number, promptUpdate: Partial<InsertAiPrompt>): Promise<AiPrompt | undefined> {
    const existingPrompt = this.aiPrompts.get(id);
    if (!existingPrompt) return undefined;
    
    const updatedPrompt = { 
      ...existingPrompt, 
      ...promptUpdate,
      updatedAt: new Date() 
    };
    
    this.aiPrompts.set(id, updatedPrompt);
    return updatedPrompt;
  }
  
  async deleteAiPrompt(id: number): Promise<boolean> {
    return this.aiPrompts.delete(id);
  }
  
  // Education Module operations
  async getAllEducationModules(): Promise<EducationModule[]> {
    return Array.from(this.educationModules.values())
      .sort((a, b) => a.order - b.order);
  }
  
  async getEducationModule(id: number): Promise<EducationModule | undefined> {
    return this.educationModules.get(id);
  }
  
  async createEducationModule(module: InsertEducationModule): Promise<EducationModule> {
    const id = this.moduleId++;
    const now = new Date();
    
    const educationModule: EducationModule = {
      id,
      title: module.title,
      description: module.description,
      type: module.type,
      content: module.content,
      featuresUnlocked: module.featuresUnlocked,
      prerequisiteModules: module.prerequisiteModules || null,
      order: module.order,
      estimatedMinutes: module.estimatedMinutes || 0,
      createdAt: now,
      updatedAt: now
    };
    
    this.educationModules.set(id, educationModule);
    return educationModule;
  }
  
  async updateEducationModule(id: number, moduleUpdate: Partial<InsertEducationModule>): Promise<EducationModule | undefined> {
    const existingModule = this.educationModules.get(id);
    if (!existingModule) return undefined;
    
    const updatedModule = {
      ...existingModule,
      ...moduleUpdate,
      updatedAt: new Date()
    };
    
    this.educationModules.set(id, updatedModule);
    return updatedModule;
  }
  
  async deleteEducationModule(id: number): Promise<boolean> {
    return this.educationModules.delete(id);
  }
  
  // User Education Progress operations
  async getUserEducationProgress(userId: number): Promise<UserEducationProgress[]> {
    return Array.from(this.userEducationProgress.values())
      .filter(progress => progress.userId === userId);
  }
  
  async getModuleProgress(userId: number, moduleId: number): Promise<UserEducationProgress | undefined> {
    return Array.from(this.userEducationProgress.values())
      .find(progress => progress.userId === userId && progress.moduleId === moduleId);
  }
  
  async createUserEducationProgress(progress: InsertUserEducationProgress): Promise<UserEducationProgress> {
    const id = this.progressId++;
    const now = new Date();
    
    const userProgress: UserEducationProgress = {
      ...progress,
      id,
      status: progress.status || "not_started",
      completedAt: progress.completedAt || null,
      quizScore: progress.quizScore || null,
      notes: progress.notes || null,
      createdAt: now,
      updatedAt: now
    };
    
    this.userEducationProgress.set(id, userProgress);
    return userProgress;
  }
  
  async updateUserEducationProgress(id: number, progressUpdate: Partial<InsertUserEducationProgress>): Promise<UserEducationProgress | undefined> {
    const existingProgress = this.userEducationProgress.get(id);
    if (!existingProgress) return undefined;
    
    const updatedProgress = {
      ...existingProgress,
      ...progressUpdate,
      updatedAt: new Date()
    };
    
    this.userEducationProgress.set(id, updatedProgress);
    return updatedProgress;
  }
  
  async getUserUnlockedFeatures(userId: number): Promise<string[]> {
    // Get all completed modules for the user
    const completedProgress = Array.from(this.userEducationProgress.values())
      .filter(progress => progress.userId === userId && progress.status === "completed");
    
    // Map to module IDs
    const completedModuleIds = completedProgress.map(progress => progress.moduleId);
    
    // Get the modules
    const completedModules = completedModuleIds.map(moduleId => this.educationModules.get(moduleId))
      .filter((module): module is EducationModule => module !== undefined);
    
    // Extract all features unlocked by these modules
    const unlockedFeatures = completedModules.flatMap(module => module.featuresUnlocked);
    
    // Return unique features
    return [...new Set(unlockedFeatures)];
  }
  
  // Form Template operations
  async getAllFormTemplates(): Promise<FormTemplate[]> {
    return Array.from(this.formTemplates.values())
      .sort((a, b) => a.name.localeCompare(b.name));
  }
  
  async getFormTemplatesByCategory(category: string): Promise<FormTemplate[]> {
    return Array.from(this.formTemplates.values())
      .filter(template => template.category === category)
      .sort((a, b) => a.name.localeCompare(b.name));
  }
  
  async getFormTemplate(id: number): Promise<FormTemplate | undefined> {
    return this.formTemplates.get(id);
  }
  
  async createFormTemplate(template: InsertFormTemplate): Promise<FormTemplate> {
    const id = this.formTemplateId++;
    const now = new Date();
    
    const formTemplate: FormTemplate = {
      ...template,
      id,
      createdAt: now,
      updatedAt: now
    };
    
    this.formTemplates.set(id, formTemplate);
    return formTemplate;
  }
  
  async updateFormTemplate(id: number, templateUpdate: Partial<InsertFormTemplate>): Promise<FormTemplate | undefined> {
    const existingTemplate = this.formTemplates.get(id);
    if (!existingTemplate) return undefined;
    
    const updatedTemplate = {
      ...existingTemplate,
      ...templateUpdate,
      updatedAt: new Date()
    };
    
    this.formTemplates.set(id, updatedTemplate);
    return updatedTemplate;
  }
  
  async deleteFormTemplate(id: number): Promise<boolean> {
    return this.formTemplates.delete(id);
  }
  
  // Form Response operations
  async getFormResponsesByPatientId(patientId: number): Promise<FormResponse[]> {
    return Array.from(this.formResponses.values())
      .filter(response => response.patientId === patientId)
      .sort((a, b) => {
        // Sort by most recent first
        if (!a.createdAt && !b.createdAt) return 0;
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
  }
  
  async getFormResponsesByTemplateId(templateId: number): Promise<FormResponse[]> {
    return Array.from(this.formResponses.values())
      .filter(response => response.formTemplateId === templateId)
      .sort((a, b) => {
        // Sort by most recent first
        if (!a.createdAt && !b.createdAt) return 0;
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
  }
  
  async getFormResponse(id: number): Promise<FormResponse | undefined> {
    return this.formResponses.get(id);
  }
  
  async createFormResponse(response: InsertFormResponse): Promise<FormResponse> {
    const id = this.formResponseId++;
    const now = new Date();
    
    const formResponse: FormResponse = {
      ...response,
      id,
      createdAt: now,
      updatedAt: now,
      completedAt: response.completedAt || null,
      notes: response.notes || null
    };
    
    this.formResponses.set(id, formResponse);
    return formResponse;
  }
  
  async updateFormResponse(id: number, responseUpdate: Partial<InsertFormResponse>): Promise<FormResponse | undefined> {
    const existingResponse = this.formResponses.get(id);
    if (!existingResponse) return undefined;
    
    const updatedResponse = {
      ...existingResponse,
      ...responseUpdate,
      updatedAt: new Date()
    };
    
    this.formResponses.set(id, updatedResponse);
    return updatedResponse;
  }
  
  async deleteFormResponse(id: number): Promise<boolean> {
    return this.formResponses.delete(id);
  }
}

export const storage = new MemStorage();