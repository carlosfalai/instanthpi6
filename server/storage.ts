import { 
  users, type User, type InsertUser,
  patients, type Patient, type InsertPatient,
  messages, type Message, type InsertMessage,
  aiDocumentations, type AIDocumentation, type InsertAIDocumentation,
  formSubmissions, type FormSubmission, type InsertFormSubmission
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private patients: Map<number, Patient>;
  private messages: Map<number, Message>;
  private aiDocumentations: Map<number, AIDocumentation>;
  private formSubmissions: Map<number, FormSubmission>;
  
  private userId: number;
  private patientId: number;
  private messageId: number;
  private documentationId: number;
  private submissionId: number;

  constructor() {
    this.users = new Map();
    this.patients = new Map();
    this.messages = new Map();
    this.aiDocumentations = new Map();
    this.formSubmissions = new Map();
    
    this.userId = 1;
    this.patientId = 1;
    this.messageId = 1;
    this.documentationId = 1;
    this.submissionId = 1;
    
    // Add a default user for testing
    this.createUser({
      username: "drjohnson",
      password: "password123",
      fullName: "Dr. Sarah Johnson",
      role: "doctor",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=100&h=100&q=80"
    });
    
    // Add a sample patient
    this.createPatient({
      name: "Jessica Thompson",
      gender: "Female",
      dateOfBirth: "1991-08-15",
      email: "jessica.thompson@example.com",
      phone: "555-123-4567",
      lastVisit: new Date("2023-05-15"),
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=100&h=100&q=80"
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
    const user: User = { ...insertUser, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
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
    const patient: Patient = { ...insertPatient, id };
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
    return Array.from(this.messages.values()).filter(
      (message) => message.patientId === patientId,
    ).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }
  
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.messageId++;
    const message: Message = { ...insertMessage, id, timestamp: new Date() };
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
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return patientDocs.length > 0 ? patientDocs[0] : undefined;
  }
  
  async createDocumentation(insertDocumentation: InsertAIDocumentation): Promise<AIDocumentation> {
    const id = this.documentationId++;
    const documentation: AIDocumentation = { 
      ...insertDocumentation, 
      id, 
      createdAt: new Date(),
      isApproved: insertDocumentation.isApproved || false,
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
    return Array.from(this.formSubmissions.values()).filter(
      (submission) => submission.patientId === patientId,
    ).sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
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
}

export const storage = new MemStorage();
