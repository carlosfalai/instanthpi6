import { storage } from "./storage";
import crypto from "crypto";

/**
 * Seeds the database with initial data for testing
 */
export async function seedDatabase() {
  // Check if we already have users
  const users = await storage.getAllUsers();
  if (users.length > 0) {
    console.log("Database already has users, skipping seed");
    return;
  }

  // Add a default doctor
  const doctor = await storage.createUser({
    username: "drjohnson",
    password: "password123",
    fullName: "Dr. Sarah Johnson",
    role: "doctor",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=100&h=100&q=80"
  });

  // Create sample patients
  const patient1 = await storage.createPatient({
    name: "Jessica Thompson",
    gender: "Female",
    dateOfBirth: "1991-08-15",
    email: "jessica.thompson@example.com",
    phone: "555-123-4567",
    lastVisit: new Date("2023-05-15"),
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=100&h=100&q=80"
  });
  
  await storage.createPatient({
    name: "Nicolas Girard",
    gender: "Male",
    dateOfBirth: "1982-04-15",
    email: "nicolas.girard@example.com",
    phone: "555-234-5678",
    healthCardNumber: "GIRN12345678"
  });
  
  await storage.createPatient({
    name: "Marie Tremblay",
    gender: "Female",
    dateOfBirth: "1990-06-22",
    email: "marie.t@example.com",
    phone: "555-345-6789",
    healthCardNumber: "TREM98765432"
  });
  
  await storage.createPatient({
    name: "Robert Johnson",
    gender: "Male",
    dateOfBirth: "1975-11-30",
    email: "robert.j@example.com",
    phone: "555-456-7890"
  });
  
  await storage.createPatient({
    name: "Sophie Chen",
    gender: "Female",
    dateOfBirth: "1988-03-10",
    email: "sophie.chen@example.com",
    phone: "555-567-8901",
    lastVisit: new Date("2023-04-01")
  });

  // Create messages for a patient
  await createMessagesForPatient(patient1.id);
  
  // Create pending items for a patient
  await createPendingItems(patient1.id);
  
  // Create preventative care items
  await createPreventativeCare(patient1.id);
  
  // Create education modules
  await createEducationModules();
  
  // Create form templates
  await createSampleFormTemplates();
  
  console.log("Database seeded successfully");
}

async function createMessagesForPatient(patientId: number) {
  // Create a conversation thread
  await storage.createMessage({
    patientId,
    senderId: 1, // Doctor
    content: "Hello Jessica, how are you feeling today? I noticed it's been a few weeks since your last check-up.",
    isFromPatient: false,
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
  });
  
  await storage.createMessage({
    patientId,
    senderId: patientId,
    content: "Hi Dr. Johnson, I've been doing better. The medication you prescribed has helped with my symptoms, but I still have some questions about side effects.",
    isFromPatient: true,
    timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) // 6 days ago
  });
  
  await storage.createMessage({
    patientId,
    senderId: 1, // Doctor
    content: "I'm glad to hear the medication is helping. What kind of side effects are you experiencing?",
    isFromPatient: false,
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
  });
  
  await storage.createMessage({
    patientId,
    senderId: patientId,
    content: "I've been feeling a bit dizzy in the mornings, and sometimes I have a slight headache that lasts for a few hours.",
    isFromPatient: true,
    timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) // 4 days ago
  });
  
  await storage.createMessage({
    patientId,
    senderId: 1, // Doctor
    content: "Those can be common side effects. Try taking the medication with food in the morning, and ensure you're staying hydrated. Let's monitor these symptoms for another week. If they persist or worsen, we might need to adjust your dosage or try a different medication.",
    isFromPatient: false,
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
  });
  
  await storage.createMessage({
    patientId,
    senderId: patientId,
    content: "Thank you, I'll try that. Should I schedule another appointment soon?",
    isFromPatient: true,
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
  });
  
  await storage.createMessage({
    patientId,
    senderId: 1, // Doctor
    content: "Let's schedule a follow-up in two weeks. In the meantime, please keep track of any side effects in a diary - noting when they occur and their severity. This will help us determine if we need to make any adjustments to your treatment plan.",
    isFromPatient: false,
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
  });
}

async function createPendingItems(patientId: number) {
  await storage.createPendingItem({
    patientId,
    name: "Blood Test",
    description: "Complete blood count to check iron levels",
    status: "pending",
    requestedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    priority: "high",
    category: "test"
  });
  
  await storage.createPendingItem({
    patientId,
    name: "Medication Renewal",
    description: "Renew prescription for allergy medication",
    status: "in_progress",
    requestedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
    priority: "medium",
    category: "prescription"
  });
  
  await storage.createPendingItem({
    patientId,
    name: "Follow-up Appointment",
    description: "Schedule follow-up to discuss blood test results",
    status: "pending",
    requestedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
    priority: "low",
    category: "appointment"
  });
}

async function createPreventativeCare(patientId: number) {
  await storage.createPreventativeCare({
    patientId,
    name: "Annual Physical Exam",
    description: "Comprehensive yearly physical examination",
    category: "examination",
    status: "scheduled",
    messageTemplate: "It's time for your annual physical exam. Please schedule an appointment at your convenience.",
    suggestedDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    relevantTo: "general health"
  });
  
  await storage.createPreventativeCare({
    patientId,
    name: "Flu Vaccination",
    description: "Annual flu shot",
    category: "vaccination",
    status: "due",
    messageTemplate: "Flu season is approaching. We recommend getting your annual flu shot to stay protected.",
    suggestedDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    relevantTo: "immune health"
  });
  
  await storage.createPreventativeCare({
    patientId,
    name: "Cholesterol Screening",
    description: "Blood test to check cholesterol levels",
    category: "screening",
    status: "upcoming",
    messageTemplate: "It's time for your routine cholesterol screening. Please schedule a blood test at your convenience.",
    suggestedDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
    relevantTo: "cardiovascular health"
  });
}

async function createEducationModules() {
  // Using AI Assistants Module
  const aiAssistantModule = await storage.createEducationModule({
    title: "Using AI Assistants",
    description: "Learn how to effectively use AI assistants to improve patient care and streamline documentation.",
    content: `
# Using AI Assistants in Clinical Practice

AI assistants can significantly enhance your clinical workflow by helping with documentation, patient communication, and medical decision support.

## Benefits

- Reduce documentation time
- Improve accuracy of medical records
- Provide evidence-based recommendations
- Enhance patient communication

## Best Practices

1. Always review AI-generated content before approving
2. Provide clear and specific prompts
3. Use AI for initial drafts, then personalize
4. Keep patient privacy in mind
5. Regularly update your AI prompts based on feedback

## Practical Application

When a patient conversation occurs, the AI can help generate:
- HPI (History of Present Illness) summaries
- SOAP notes
- Follow-up recommendations
- Treatment plan documentation

## Conclusion

AI assistants are powerful tools that can save you time and improve care, but they require human oversight and clinical judgment.
    `,
    moduleType: "tutorial",
    durationMinutes: 15,
    difficulty: "beginner",
    prerequisites: [],
    featuresUnlocked: ["ai_documentation"],
    quizQuestions: [
      {
        question: "What should you always do before approving AI-generated content?",
        options: ["Delete it", "Review it", "Share it with patients", "Ignore it"],
        correctAnswer: "Review it"
      },
      {
        question: "Which of the following can AI help generate?",
        options: ["Medical licenses", "HPI summaries", "Billing codes", "Scheduling"],
        correctAnswer: "HPI summaries"
      }
    ]
  });
  
  // Patient Communication Module
  const patientCommunicationModule = await storage.createEducationModule({
    title: "Effective Patient Communication",
    description: "Learn techniques for clear and empathetic communication with patients through digital channels.",
    content: `
# Effective Digital Patient Communication

Clear, empathetic communication is essential for building trust and ensuring quality care, especially when interacting through digital channels.

## Key Principles

1. Use clear, jargon-free language
2. Express empathy and understanding
3. Be concise but thorough
4. Respect patient privacy
5. Follow up appropriately

## Digital Communication Channels

Different channels require different approaches:
- **Secure messaging**: Professional, clear, and concise
- **Video consultations**: Maintain eye contact, minimize distractions
- **Phone calls**: Speak clearly, confirm understanding

## Templates and Efficiency

While templates can improve efficiency, always personalize your communication to the individual patient's needs and concerns.

## Documentation

Ensure all digital communications are properly documented in the patient's medical record.
    `,
    moduleType: "tutorial",
    durationMinutes: 20,
    difficulty: "intermediate",
    prerequisites: [],
    featuresUnlocked: ["patient_messaging"],
    quizQuestions: [
      {
        question: "What type of language should be used when communicating with patients?",
        options: ["Technical medical jargon", "Clear, jargon-free language", "Formal academic writing", "Brief abbreviations"],
        correctAnswer: "Clear, jargon-free language"
      },
      {
        question: "What should you do with digital communications with patients?",
        options: ["Delete them after reading", "Share them with colleagues", "Document them in medical records", "Print and file them"],
        correctAnswer: "Document them in medical records"
      }
    ]
  });
  
  // Form Creation Module
  const formCreationModule = await storage.createEducationModule({
    title: "Creating Custom Patient Forms",
    description: "Learn how to create and manage custom patient intake forms to replace external Formsite forms.",
    content: `
# Creating Custom Patient Forms

This module teaches you how to create and manage custom patient forms directly in the application, eliminating the need for external Formsite forms.

## Benefits of Internal Forms

- **Data Security**: All patient data stays within your secure system
- **Seamless Integration**: Form responses automatically link to patient records
- **Customization**: Create forms tailored to your specific practice needs
- **Efficient Workflow**: No need to manage external accounts or switch between systems

## Creating Your First Form

1. Navigate to the Forms page
2. Click "Create New Form"
3. Add a descriptive name and category
4. Build your form with various question types:
   - Text fields
   - Multiple choice questions
   - Checkboxes
   - Date fields
   - Numeric fields

## Best Practices

- Keep forms concise and focused
- Group related questions together
- Use clear, specific language
- Include instructions where needed
- Test your forms before distributing

## Form Distribution

Forms can be sent to patients via:
- Secure messaging
- Email links
- QR codes
- During intake process

## Reviewing Responses

Form responses are automatically saved to the patient's record and can be reviewed in their profile.

## Special Use Cases

### STD Testing Forms

Create comprehensive forms that collect relevant sexual health history while maintaining patient privacy and dignity.

### Urgent Care Walk-ins

Design forms that quickly capture essential information for urgent care scenarios, focusing on current symptoms, severity, and relevant medical history.
    `,
    moduleType: "tutorial",
    durationMinutes: 25,
    difficulty: "beginner",
    prerequisites: [],
    featuresUnlocked: ["form_creation"],
    quizQuestions: [
      {
        question: "What is a benefit of using internal forms instead of external Formsite forms?",
        options: [
          "They cost less money", 
          "They're automatically translated to multiple languages", 
          "Form responses automatically link to patient records", 
          "They work without internet connection"
        ],
        correctAnswer: "Form responses automatically link to patient records"
      },
      {
        question: "Which of these is a best practice for form creation?",
        options: [
          "Make forms as long as possible", 
          "Use technical medical terminology for precision", 
          "Keep forms concise and focused", 
          "Collect as much data as possible regardless of relevance"
        ],
        correctAnswer: "Keep forms concise and focused"
      }
    ]
  });
  
  // Create some progress for the first user
  await storage.createUserEducationProgress({
    userId: 1,
    moduleId: aiAssistantModule.id,
    status: "completed",
    completedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // Completed 14 days ago
    quizScore: 100
  });
  
  await storage.createUserEducationProgress({
    userId: 1,
    moduleId: patientCommunicationModule.id,
    status: "in_progress",
    completedAt: null,
    quizScore: null
  });
}

async function createSampleFormTemplates() {
  // STD Testing Form Template
  await storage.createFormTemplate({
    name: "STD Testing Intake Form",
    description: "Comprehensive intake form for patients seeking STD testing",
    category: "STD Testing",
    userId: 1,
    isPublic: true,
    questions: [
      {
        id: crypto.randomUUID(),
        type: "radio",
        label: "Have you ever been tested for STDs before?",
        required: true,
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" }
        ]
      },
      {
        id: crypto.randomUUID(),
        type: "date",
        label: "If yes, when was your last STD test?",
        required: false
      },
      {
        id: crypto.randomUUID(),
        type: "checkbox",
        label: "Which tests are you interested in today? (Select all that apply)",
        required: true,
        options: [
          { value: "hiv", label: "HIV" },
          { value: "chlamydia", label: "Chlamydia" },
          { value: "gonorrhea", label: "Gonorrhea" },
          { value: "syphilis", label: "Syphilis" },
          { value: "herpes", label: "Herpes" },
          { value: "hpv", label: "HPV" },
          { value: "hepatitis", label: "Hepatitis" },
          { value: "trichomoniasis", label: "Trichomoniasis" },
          { value: "other", label: "Other (please specify)" }
        ]
      },
      {
        id: crypto.randomUUID(),
        type: "textarea",
        label: "If you selected 'Other' above, please specify which tests you're interested in:",
        required: false,
        placeholder: "Enter other tests you'd like to have"
      },
      {
        id: crypto.randomUUID(),
        type: "radio",
        label: "Are you currently experiencing any symptoms?",
        required: true,
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
          { value: "unsure", label: "Unsure" }
        ]
      },
      {
        id: crypto.randomUUID(),
        type: "textarea",
        label: "If you're experiencing symptoms, please describe them:",
        required: false,
        placeholder: "Describe any symptoms you're experiencing"
      },
      {
        id: crypto.randomUUID(),
        type: "radio",
        label: "Have you had unprotected sexual contact since your last STD test or in the last 6 months?",
        required: true,
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" }
        ]
      },
      {
        id: crypto.randomUUID(),
        type: "number",
        label: "How many sexual partners have you had in the last 6 months?",
        required: true,
        placeholder: "Enter a number"
      },
      {
        id: crypto.randomUUID(),
        type: "checkbox",
        label: "What types of sexual contact have you had in the past 6 months? (Select all that apply)",
        required: true,
        options: [
          { value: "vaginal", label: "Vaginal" },
          { value: "oral", label: "Oral" },
          { value: "anal", label: "Anal" },
          { value: "none", label: "None" }
        ]
      },
      {
        id: crypto.randomUUID(),
        type: "radio",
        label: "Have you ever been diagnosed with an STD in the past?",
        required: true,
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" }
        ]
      },
      {
        id: crypto.randomUUID(),
        type: "textarea",
        label: "If yes, which STD(s) and when were you diagnosed?",
        required: false,
        placeholder: "Enter details of previous STD diagnoses"
      }
    ]
  });
  
  // Urgent Care Intake Form Template
  await storage.createFormTemplate({
    name: "Urgent Care Walk-in Intake Form",
    description: "Quick intake form for urgent care walk-in patients",
    category: "Urgent Care",
    userId: 1,
    isPublic: true,
    questions: [
      {
        id: crypto.randomUUID(),
        type: "text",
        label: "What is your main reason for visiting today?",
        required: true,
        placeholder: "Briefly describe your main complaint"
      },
      {
        id: crypto.randomUUID(),
        type: "radio",
        label: "How long have you been experiencing these symptoms?",
        required: true,
        options: [
          { value: "less_than_24h", label: "Less than 24 hours" },
          { value: "1_3_days", label: "1-3 days" },
          { value: "4_7_days", label: "4-7 days" },
          { value: "1_2_weeks", label: "1-2 weeks" },
          { value: "more_than_2_weeks", label: "More than 2 weeks" }
        ]
      },
      {
        id: crypto.randomUUID(),
        type: "radio",
        label: "On a scale of 1-10, how would you rate your pain or discomfort?",
        required: true,
        options: [
          { value: "1", label: "1 (Minimal)" },
          { value: "2", label: "2" },
          { value: "3", label: "3" },
          { value: "4", label: "4" },
          { value: "5", label: "5 (Moderate)" },
          { value: "6", label: "6" },
          { value: "7", label: "7" },
          { value: "8", label: "8" },
          { value: "9", label: "9" },
          { value: "10", label: "10 (Severe)" }
        ]
      },
      {
        id: crypto.randomUUID(),
        type: "checkbox",
        label: "Are you experiencing any of the following symptoms? (Select all that apply)",
        required: false,
        options: [
          { value: "fever", label: "Fever" },
          { value: "chills", label: "Chills" },
          { value: "headache", label: "Headache" },
          { value: "nausea", label: "Nausea" },
          { value: "vomiting", label: "Vomiting" },
          { value: "diarrhea", label: "Diarrhea" },
          { value: "cough", label: "Cough" },
          { value: "shortness_of_breath", label: "Shortness of breath" },
          { value: "chest_pain", label: "Chest pain" },
          { value: "sore_throat", label: "Sore throat" },
          { value: "rash", label: "Rash" },
          { value: "dizziness", label: "Dizziness" }
        ]
      },
      {
        id: crypto.randomUUID(),
        type: "radio",
        label: "Have you tried any treatment or medication for your current condition?",
        required: true,
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" }
        ]
      },
      {
        id: crypto.randomUUID(),
        type: "textarea",
        label: "If yes, what treatments or medications have you tried and were they effective?",
        required: false,
        placeholder: "Enter treatments or medications tried"
      },
      {
        id: crypto.randomUUID(),
        type: "radio",
        label: "Do you have any allergies to medications?",
        required: true,
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" }
        ]
      },
      {
        id: crypto.randomUUID(),
        type: "textarea",
        label: "If yes, please list your medication allergies and reactions:",
        required: false,
        placeholder: "Enter medication allergies and reactions"
      },
      {
        id: crypto.randomUUID(),
        type: "textarea",
        label: "Are you currently taking any medications? If so, please list them:",
        required: false,
        placeholder: "Enter current medications"
      },
      {
        id: crypto.randomUUID(),
        type: "textarea",
        label: "Is there anything else you'd like us to know about your condition?",
        required: false,
        placeholder: "Enter any additional information"
      }
    ]
  });
}