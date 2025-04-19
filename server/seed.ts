import { storage } from "./storage";

/**
 * Seeds the database with initial data for testing
 */
export async function seedDatabase() {
  console.log("Seeding database with initial data...");
  
  // Check if we already have users
  const existingUsers = await storage.getAllUsers();
  if (existingUsers.length > 0) {
    console.log("Database already has users, skipping seed");
    return;
  }
  
  // Create a doctor user
  const doctor = await storage.createUser({
    username: "doctor",
    password: "password123", // In production, this would be hashed
    fullName: "Dr. Smith",
    role: "doctor"
  });
  
  console.log("Created doctor user:", doctor.fullName);
  
  // Create some patients
  const patients = [
    {
      name: "Robert Johnson",
      gender: "Male",
      dateOfBirth: "1985-05-15",
      email: "robert.johnson@example.com",
      phone: "555-123-4567",
      language: "english",
      spruceId: "spruce-1001",
      status: "active",
      avatarUrl: null,
      lastVisit: null,
      healthCardNumber: null
    },
    {
      name: "Marie Dupont",
      gender: "Female",
      dateOfBirth: "1990-10-22",
      email: "marie.dupont@example.com",
      phone: "555-234-5678",
      language: "french",
      spruceId: "spruce-1002",
      status: "active",
      avatarUrl: null,
      lastVisit: null,
      healthCardNumber: null
    },
    {
      name: "Jessica Thompson",
      gender: "Female",
      dateOfBirth: "1978-03-08",
      email: "jessica.thompson@example.com",
      phone: "555-345-6789",
      language: "english",
      spruceId: "spruce-1003",
      status: "active",
      avatarUrl: null,
      lastVisit: null,
      healthCardNumber: null
    },
    {
      name: "Carlos Rodriguez",
      gender: "Male",
      dateOfBirth: "1982-12-30",
      email: "carlos.rodriguez@example.com",
      phone: "555-456-7890",
      language: "english",
      spruceId: "spruce-1004",
      status: "active",
      avatarUrl: null,
      lastVisit: null,
      healthCardNumber: null
    }
  ];
  
  for (const patientData of patients) {
    const patient = await storage.createPatient(patientData);
    console.log("Created patient:", patient.name);
    
    // Create some messages for this patient
    if (patient.id === 1) { // Robert Johnson
      await createMessagesForPatient(patient.id);
    }
    
    // Create some pending items for this patient
    await createPendingItems(patient.id);
    
    // Create preventative care items
    await createPreventativeCare(patient.id);
  }
  
  console.log("Database seeding completed");
}

async function createMessagesForPatient(patientId: number) {
  const messages = [
    {
      patientId,
      senderId: patientId,
      content: "Hello doctor, I've been having some abdominal pain for the past few days. It's mostly on my right side.",
      isFromPatient: true,
      spruceMessageId: `mock-${Date.now()}-1`,
      attachmentUrl: null
    },
    {
      patientId,
      senderId: 1, // doctor
      content: "I'm sorry to hear that. Can you describe the pain? Is it sharp or dull, and does it come and go or is it constant?",
      isFromPatient: false,
      spruceMessageId: `mock-${Date.now()}-2`,
      attachmentUrl: null
    },
    {
      patientId,
      senderId: patientId,
      content: "It's a dull pain, but sometimes it gets sharper, especially after eating. It's not constant but happens several times a day.",
      isFromPatient: true,
      spruceMessageId: `mock-${Date.now()}-3`,
      attachmentUrl: null
    },
    {
      patientId,
      senderId: 1, // doctor
      content: "Thank you for the details. Have you noticed any changes in your bowel movements or appetite? Any nausea or vomiting?",
      isFromPatient: false,
      spruceMessageId: `mock-${Date.now()}-4`,
      attachmentUrl: null
    },
    {
      patientId,
      senderId: patientId,
      content: "Yes, I've had some nausea but no vomiting. My appetite is lower than usual, and I've been having some constipation.",
      isFromPatient: true,
      spruceMessageId: `mock-${Date.now()}-5`,
      attachmentUrl: null
    }
  ];
  
  for (const messageData of messages) {
    await storage.createMessage(messageData);
    console.log("Created message for patient", patientId);
  }
}

async function createPendingItems(patientId: number) {
  const pendingItems = [
    {
      patientId,
      type: "lab",
      description: "CBC Blood Test Results",
      status: "pending",
      priority: "medium",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      requestedDate: new Date(),
      notes: null,
      messageId: null
    },
    {
      patientId,
      type: "medication",
      description: "Verify Prescription Renewal",
      status: "pending",
      priority: "high",
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      requestedDate: new Date(),
      notes: null,
      messageId: null
    },
    {
      patientId,
      type: "followup",
      description: "Schedule Follow-up Appointment",
      status: "completed",
      priority: "low",
      dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      requestedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      notes: "Patient followed up as requested",
      messageId: null
    }
  ];
  
  for (const itemData of pendingItems) {
    await storage.createPendingItem(itemData);
    console.log("Created pending item for patient", patientId);
  }
}

async function createPreventativeCare(patientId: number) {
  const preventativeCareItems = [
    {
      patientId,
      name: "Annual Physical Examination",
      category: "screening",
      description: "Routine yearly physical examination",
      status: "suggested",
      messageTemplate: "It's time for your annual physical examination. Please schedule an appointment at your earliest convenience.",
      suggestedDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      relevantTo: ["general health", "preventative care"],
      billingCode: "99395"
    },
    {
      patientId,
      name: "Flu Vaccine",
      category: "vaccination",
      description: "Annual influenza vaccination",
      status: "suggested",
      messageTemplate: "Flu season is approaching. Consider getting your flu vaccine to stay protected.",
      suggestedDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      relevantTo: ["immunization", "respiratory health"],
      billingCode: "90686"
    }
  ];
  
  for (const itemData of preventativeCareItems) {
    await storage.createPreventativeCare(itemData);
    console.log("Created preventative care item for patient", patientId);
  }
}