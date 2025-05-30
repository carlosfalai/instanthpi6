import { storage } from "./storage";
import crypto from "crypto";
import { schedulerEducationContent, schedulerModuleMetadata } from "./modules/scheduler-education";

/**
 * Seeds the database with initial data for testing
 */
export async function seedDatabase() {
  // Check if we already have users
  const users = await storage.getAllUsers();
  const forceReseed = process.env.SEED_DB === 'force';
  
  // Always create or update the scheduler module
  await createSchedulerModule();
  
  if (users.length > 0 && !forceReseed) {
    console.log("Database already has users, skipping further seeding");
    return;
  }
  
  if (forceReseed) {
    console.log("Force reseeding the database with education modules");
    // Only create/update education modules
    await createEducationModules();
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

  // All patient data now comes exclusively from Spruce API - no local patients created

  // Patient messages, pending items, and preventative care now come exclusively from Spruce API
  
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
    isFromPatient: false
  });
  
  await storage.createMessage({
    patientId,
    senderId: patientId,
    content: "Hi Dr. Johnson, I've been doing better. The medication you prescribed has helped with my symptoms, but I still have some questions about side effects.",
    isFromPatient: true
  });
  
  await storage.createMessage({
    patientId,
    senderId: 1, // Doctor
    content: "I'm glad to hear the medication is helping. What kind of side effects are you experiencing?",
    isFromPatient: false
  });
  
  await storage.createMessage({
    patientId,
    senderId: patientId,
    content: "I've been feeling a bit dizzy in the mornings, and sometimes I have a dry mouth. I'm also wondering if I should continue taking it with meals or if I can take it on an empty stomach?",
    isFromPatient: true
  });
  
  await storage.createMessage({
    patientId,
    senderId: 1, // Doctor
    content: "Treatment Plan:\n\n1. Continue with current medication but take it with food to minimize dizziness\n2. Decrease dosage from 20mg to 15mg daily\n3. Increase water intake to address dry mouth\n4. Monitor for 7 days and report any changes\n\nFollow up in 2 weeks if symptoms persist.",
    isFromPatient: false
  });
  
  await storage.createMessage({
    patientId,
    senderId: patientId,
    content: "Thank you doctor, I understand the plan. I'll take it with food and reduce the dosage as suggested. I'll drink more water too and let you know how it goes after a week.",
    isFromPatient: true
  });
  
  await storage.createMessage({
    patientId,
    senderId: patientId,
    content: "I've been feeling a bit dizzy in the mornings, and sometimes I have a slight headache that lasts for a few hours.",
    isFromPatient: true
  });
  
  await storage.createMessage({
    patientId,
    senderId: 1, // Doctor
    content: "Those can be common side effects. Try taking the medication with food in the morning, and ensure you're staying hydrated. Let's monitor these symptoms for another week. If they persist or worsen, we might need to adjust your dosage or try a different medication.",
    isFromPatient: false
  });
  
  await storage.createMessage({
    patientId,
    senderId: patientId,
    content: "Thank you, I'll try that. Should I schedule another appointment soon?",
    isFromPatient: true
  });
  
  await storage.createMessage({
    patientId,
    senderId: 1, // Doctor
    content: "Let's schedule a follow-up in two weeks. In the meantime, please keep track of any side effects in a diary - noting when they occur and their severity. This will help us determine if we need to make any adjustments to your treatment plan.",
    isFromPatient: false
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

async function createSchedulerModule() {
  console.log("Creating/updating Scheduler module");
  
  // Check if the module already exists
  const existingModules = await storage.getAllEducationModules();
  const existingSchedulerModule = existingModules.find(m => m.title === schedulerModuleMetadata.title);
  
  if (existingSchedulerModule) {
    console.log("Scheduler module already exists, updating...");
    await storage.updateEducationModule(existingSchedulerModule.id, {
      description: schedulerModuleMetadata.description,
      content: schedulerEducationContent,
      featuresUnlocked: schedulerModuleMetadata.featuresUnlocked,
      prerequisiteModules: schedulerModuleMetadata.prerequisiteModules,
      order: schedulerModuleMetadata.order,
      estimatedMinutes: schedulerModuleMetadata.estimatedMinutes
    });
    return;
  }
  
  // Create new module
  await storage.createEducationModule({
    title: schedulerModuleMetadata.title,
    description: schedulerModuleMetadata.description,
    type: "article", // Convert from string to literal type
    content: schedulerEducationContent,
    featuresUnlocked: schedulerModuleMetadata.featuresUnlocked,
    prerequisiteModules: schedulerModuleMetadata.prerequisiteModules,
    order: schedulerModuleMetadata.order,
    estimatedMinutes: schedulerModuleMetadata.estimatedMinutes
  });
  
  console.log("Scheduler module created successfully");
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
    type: "article",
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
    featuresUnlocked: ["AI Documentation"],
    prerequisiteModules: null,
    order: 1,
    estimatedMinutes: 15
  });
  
  // Patient Communication Module
  const patientCommunicationModule = await storage.createEducationModule({
    title: "Effective Patient Communication",
    description: "Learn techniques for clear and empathetic communication with patients through digital channels.",
    type: "article",
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
    featuresUnlocked: ["Patient Messaging"],
    prerequisiteModules: [1],
    order: 2,
    estimatedMinutes: 20
  });
  
  // Form Creation Module
  const formCreationModule = await storage.createEducationModule({
    title: "Creating Custom Patient Forms",
    description: "Learn how to create and manage custom patient intake forms to replace external Formsite forms.",
    type: "article",
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
    featuresUnlocked: ["Form Creation"],
    prerequisiteModules: [1],
    order: 3,
    estimatedMinutes: 25
  });
  
  // Medical Practice Automation Module - Tier 0
  const automationTier0 = await storage.createEducationModule({
    title: "Medical Practice Automation: Tier 0",
    description: "Understanding the baseline (no automation) in medical practices",
    type: "article",
    content: `
# Medical Practice Automation: Tier 0

## Understanding Non-Automated Medical Practices

Tier 0 represents the most basic level of medical practice with virtually no automation. This tier is characterized by fully manual, paper-based processes that create significant inefficiencies in a medical practice.

## Key Characteristics of Tier 0 Practices

### Paper-Based Patient Information
- Patients fill out paper forms by hand when visiting a clinic
- No digital capture of patient information
- Forms must be manually scanned and entered into patient files
- Patient files are built and maintained manually

### Manual Documentation
- Physicians write notes by hand
- Prescriptions are written manually
- Lab requests are completed by hand
- Work notes, insurance paperwork, and other documentation are all handwritten

### Administrative Burden
- High dependency on secretarial staff
- Labor-intensive filing and retrieval of documents
- Inefficient information retrieval when needed

### Prescription Process
- Medication refill requests arrive via physical fax
- Physicians must manually write dosages and renewal information
- Forms must be physically signed
- Staff must fax completed forms to pharmacies
- High potential for errors and miscommunication

## Impact on Physician Workflow

As the complexity and volume of cases increase, the burden on the physician grows exponentially. This leads to:

- Reduced time spent with patients
- Increased administrative workload
- Higher potential for errors
- Lower overall efficiency
- Physician burnout from administrative tasks

In the following modules, we'll explore how automation can gradually transform these inefficient processes and significantly improve medical practice workflow.
    `,
    featuresUnlocked: ["Basic Automation Concepts"],
    prerequisiteModules: null,
    order: 4,
    estimatedMinutes: 15
  });
  
  // Medical Practice Automation Module - Tier 1
  const automationTier1 = await storage.createEducationModule({
    title: "Medical Practice Automation: Tier 1",
    description: "Beginning automation with templated documentation and forms",
    type: "article",
    content: `
# Medical Practice Automation: Tier 1

## Initial Steps Toward Automation

Tier 1 represents the first step toward automating a medical practice. While still partially paper-based, this tier introduces basic templating tools and early digital solutions to improve efficiency.

## Key Characteristics of Tier 1 Practices

### Using Stamps and Templates
- TRODAT stamps to create pre-formatted notes on paper
- Signature stamps that include physician name, license number, and date
- Pre-made prescription stamps for commonly prescribed medications
- Standardized form templates that can be quickly filled in

### Early Digital EMR Use
- Basic use of Electronic Medical Records (EMR) systems
- Creating and saving exam templates in the EMR
- Setting up lab work templates for common conditions
- Templates for work notes and standard forms

### Simple Automation Tools
- Saved text snippets in EMR for common diagnoses
- Pre-configured order sets for common conditions
- Basic digital prescription templates
- Standardized documentation formats

## Benefits of Tier 1 Automation

While still labor-intensive compared to more advanced automation, Tier 1 provides:
- Reduced time writing the same information repeatedly
- More consistent documentation
- Fewer errors in prescriptions
- Slightly reduced administrative burden

## Real-World Example

A physician treating patients in an urgent care setting might have TRODAT stamps for common prescriptions like Z-packs and Ventolin. This saves time when seeing multiple patients per hour who need similar prescriptions. The physician only needs to add the patient name, allowing more time for patient care rather than writing the same prescription details repeatedly.

Tier 1 automation represents the simplest form of practice optimization but still requires significant manual effort. The next tiers will introduce more substantial digital automation to further improve workflow efficiency.
    `,
    featuresUnlocked: ["Template Creation"],
    prerequisiteModules: [4],
    order: 5,
    estimatedMinutes: 15
  });
  
  // Medical Practice Automation Module - Tier 2
  const automationTier2 = await storage.createEducationModule({
    title: "Medical Practice Automation: Tier 2",
    description: "Integrated digital systems and advanced templates",
    type: "article",
    content: `
# Medical Practice Automation: Tier 2

## Digital Workflow Integration

Tier 2 automation represents a significant step forward, with comprehensive digital systems handling most documentation and clinical workflows. At this tier, practices have fully embraced electronic records and digital communication tools.

## Key Characteristics of Tier 2 Practices

### Comprehensive EMR Usage
- Full electronic medical record implementation
- Digital documentation for all patient encounters
- Electronic prescription management
- Digital lab ordering and results review

### Advanced Templates
- Extensive template libraries for different visit types
- Customized documentation templates by specialty
- Decision support templates
- Automated coding suggestions

### Digital Communication
- Secure messaging with patients
- Electronic referrals to specialists
- Digital transmission of prescriptions to pharmacies
- Online appointment scheduling

### Workflow Automation
- Automated patient reminders
- Digital check-in processes
- Electronic forms completed by patients
- Basic task routing for staff

## Benefits of Tier 2 Automation

- Significant reduction in paper usage
- Improved documentation consistency
- Better coordination between care team members
- Reduced transcription and documentation time
- Enhanced prescription safety

## Limitations

While Tier 2 represents a major improvement over Tiers 0 and 1, it still has limitations:
- Systems often operate in silos
- Templates may be rigid and time-consuming to customize
- Manual data entry is still required in many cases
- Limited intelligence in processing information

In the next module, we'll explore how Tier 3 automation introduces advanced integration and early AI capabilities to further enhance practice efficiency.
    `,
    featuresUnlocked: ["Digital Workflow Management"],
    prerequisiteModules: [5],
    order: 6,
    estimatedMinutes: 15
  });
  
  // Medical Practice Automation Module - Tier 3
  const automationTier3 = await storage.createEducationModule({
    title: "Medical Practice Automation: Tier 3",
    description: "Advanced integration with early AI implementation",
    type: "article",
    content: `
# Medical Practice Automation: Tier 3

## Intelligent Systems and Integration

Tier 3 represents a highly advanced level of medical practice automation, characterized by intelligent systems, seamless integration between platforms, and early AI implementation to enhance clinical decision-making and documentation.

## Key Characteristics of Tier 3 Practices

### Intelligent Documentation
- Voice recognition and dictation with automatic formatting
- Natural language processing to extract key clinical data
- Automated coding and billing suggestions
- Smart templates that adapt based on patient history

### System Integration
- Health information exchange with other healthcare providers
- Integration with pharmacy systems
- Connected lab and diagnostic imaging platforms
- Patient portal integration with practice management

### Early AI Implementation
- Clinical decision support with evidence-based recommendations
- Predictive analytics for population health management
- Automated triage of patient messages
- Pattern recognition for early disease detection

### Workflow Intelligence
- Smart scheduling based on visit complexity
- Automated care gap identification
- Intelligent task routing and prioritization
- Proactive medication management

## Benefits of Tier 3 Automation

- Dramatic reduction in administrative time
- Enhanced clinical decision quality
- Improved preventive care delivery
- Better population health management
- Reduced physician documentation burden

## Real-World Applications

In a Tier 3 practice, a physician might dictate notes during a patient visit while an AI assistant captures, organizes, and formats the information into a structured clinical note. The system would automatically suggest relevant codes, identify care gaps, and generate appropriate follow-up tasks without manual input.

Tier 3 represents a transformative level of automation that significantly reduces physician administrative burden while enhancing clinical care quality.
    `,
    featuresUnlocked: ["AI Assistant Features"],
    prerequisiteModules: [6],
    order: 7,
    estimatedMinutes: 15
  });
  
  // Medical Practice Automation Module - Tier 4
  const automationTier4 = await storage.createEducationModule({
    title: "Medical Practice Automation: Tier 4",
    description: "Full AI integration and autonomous systems",
    type: "article",
    content: `
# Medical Practice Automation: Tier 4

## Autonomous Healthcare Systems

Tier 4 represents the pinnacle of medical practice automation, featuring fully autonomous AI systems that work alongside physicians as true clinical partners. This tier includes advanced predictive capabilities, autonomous documentation, and intelligent patient interaction systems.

## Key Characteristics of Tier 4 Practices

### Autonomous Documentation
- Ambient clinical intelligence that listens and documents entire patient encounters
- AI systems that autonomously generate complete clinical notes
- Intelligent summarization of patient information from multiple sources
- Automated narrative creation with clinical reasoning

### Advanced AI Clinical Partnership
- Real-time clinical decision support with personalized recommendations
- Predictive analytics for individual patient outcomes
- Autonomous monitoring of patient data with alert generation
- AI-driven differential diagnosis suggestions

### Intelligent Patient Interaction
- Autonomous pre-visit data collection and analysis
- Smart triage systems that adapt to patient needs
- AI-powered patient education customized to individual circumstances
- Continuous remote monitoring with intelligent intervention recommendations

### System Autonomy
- Self-learning systems that improve with experience
- Autonomous care coordination across the healthcare ecosystem
- Intelligent resource allocation and scheduling
- Predictive staffing and resource management

## Benefits of Tier 4 Automation

- Physicians focus almost exclusively on patient care
- Documentation becomes a byproduct of patient encounters
- Significantly enhanced clinical decision quality
- Improved patient outcomes through predictive intervention
- Optimized practice resources and efficiency

## The Future of Medical Practice

In a Tier 4 practice, InstantHPI serves as an autonomous clinical partner that handles the majority of administrative tasks. The physician focuses primarily on patient relationships, complex decision-making, and care delivery, while AI systems manage documentation, routine clinical decisions, and practice operations.

This represents the future of medical practice where technology handles the administrative burden, allowing physicians to practice at the top of their license and focus on the human aspects of healthcare delivery.
    `,
    featuresUnlocked: ["Advanced AI Features", "InstantHPI Full System Access"],
    prerequisiteModules: [7],
    order: 8,
    estimatedMinutes: 15
  });
  
  // Scheduler AI Module
  const schedulerModule = await storage.createEducationModule({
    title: schedulerModuleMetadata.title,
    description: schedulerModuleMetadata.description,
    type: schedulerModuleMetadata.type,
    content: schedulerEducationContent,
    featuresUnlocked: schedulerModuleMetadata.featuresUnlocked,
    prerequisiteModules: schedulerModuleMetadata.prerequisiteModules,
    order: schedulerModuleMetadata.order,
    estimatedMinutes: schedulerModuleMetadata.estimatedMinutes
  });
  
  // Gmail Filter Module
  const gmailFilterModule = await storage.createEducationModule({
    title: "Setting Up Gmail Filters for InstantHPI Notifications",
    description: "Learn how to create Gmail filters to automatically organize InstantHPI emails",
    type: "article",
    content: `
# Setting Up Gmail Filters for InstantHPI Notifications

## Introduction

As a physician using InstantHPI, you'll receive important notifications and patient information via email from our system. To stay organized and ensure you never miss critical information, setting up a dedicated filter in Gmail will automatically sort all InstantHPI communications into a dedicated folder.

This guide will walk you through the process of creating a Gmail filter to instantly index and categorize all emails from noreply@instanthpi.ai into a dedicated InstantHPI folder.

## Benefits of Creating a Gmail Filter

- **Improved Organization**: Keep all InstantHPI notifications in one dedicated location
- **Reduced Inbox Clutter**: Your primary inbox stays focused on other important communications
- **Instant Access**: Quickly locate all patient-related notifications when needed
- **Never Miss Important Updates**: All InstantHPI communications are properly categorized and preserved

## Step-by-Step Filter Creation Process

### Step 1: Access Gmail Filter Settings

1. Log in to your Gmail account
2. Click on the gear icon ⚙️ in the top-right corner of your Gmail interface
3. Select "See all settings" from the dropdown menu
4. Navigate to the "Filters and Blocked Addresses" tab
5. Scroll down and click on "Create a new filter"

### Step 2: Define Filter Criteria

In the filter creation form:

1. In the "From" field, enter: **noreply@instanthpi.ai**
2. Alternatively, in the "Subject" field, enter: **InstantHPI note for**
3. Click "Create filter" to proceed to the next step

### Step 3: Specify Filter Actions

After clicking "Create filter," you'll see options for what Gmail should do with matching emails:

1. Check the box next to "Skip the Inbox (Archive it)"
2. Check the box next to "Apply the label"
3. Click "Choose label" or "New label" if you haven't created an InstantHPI label yet
4. If creating a new label:
   - Enter "InstantHPI" as the label name
   - Click "Create"
5. Check the box next to "Never send it to Spam"
6. Optionally, check "Always mark it as important" if you want these messages to be highlighted
7. Click "Create filter" to finalize

### Step 4: Apply Filter to Existing Messages (Optional)

If you've already received emails from InstantHPI and want to organize them:

1. Before finalizing your filter in Step 3, check the box that says "Also apply filter to X matching conversations"
2. This will categorize all existing InstantHPI emails according to your new filter rules

## Accessing Your InstantHPI Messages

After setting up the filter:

1. All new messages from InstantHPI will automatically be labeled and organized
2. To access them, click on the "InstantHPI" label in the left sidebar of Gmail
3. You can also search for them using: label:InstantHPI in the Gmail search bar

## Troubleshooting Common Issues

**Issue**: Emails from InstantHPI still appearing in the main inbox
- **Solution**: Verify that your filter includes both the sender address and subject line criteria
- **Solution**: Make sure the "Skip the Inbox" option is selected in your filter actions

**Issue**: Not seeing the InstantHPI label in the sidebar
- **Solution**: Look under the "More" dropdown in your Gmail sidebar
- **Solution**: You may need to hover over "Labels" in the sidebar and click "Manage labels" to ensure it's visible

**Issue**: Filter not applying to new messages
- **Solution**: Edit the filter and ensure all criteria are correct
- **Solution**: Try creating a new filter if the existing one isn't working properly

## Conclusion

By setting up this simple Gmail filter, you'll ensure that all communications from InstantHPI are properly organized and easily accessible. This small investment in organization will save you time and help you stay on top of important patient information.

Remember, all emails from InstantHPI with the subject line "InstantHPI note for" contain important patient information that requires your attention. With this filter in place, you'll have a dedicated location to review these notes efficiently.
    `,
    featuresUnlocked: ["Email Management"],
    prerequisiteModules: null,
    order: 9,
    estimatedMinutes: 10
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