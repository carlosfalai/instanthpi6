// Form Templates - sorted by usage popularity
// Templates are ordered by usageCount (most popular first)

export interface FormTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  usageCount: number;
  questions: {
    id: string;
    type: "text" | "long" | "select" | "checkbox" | "date" | "rating";
    label: string;
    placeholder?: string;
    options?: string[];
    required?: boolean;
  }[];
}

export const formTemplates: FormTemplate[] = [
  {
    id: "follow-up",
    name: "Follow-up Visit",
    description: "Standard follow-up appointment form",
    category: "General",
    usageCount: 2100,
    questions: [
      {
        id: "1",
        type: "text",
        label: "How are you feeling since last visit?",
        placeholder: "Describe any changes...",
        required: true,
      },
      {
        id: "2",
        type: "select",
        label: "Medication Compliance",
        options: ["Taking as prescribed", "Missed some doses", "Not taking"],
        required: true,
      },
      { id: "3", type: "rating", label: "Overall symptom improvement (1-10)" },
      {
        id: "4",
        type: "long",
        label: "Any new concerns or symptoms?",
        placeholder: "Please describe...",
      },
    ],
  },
  {
    id: "general-initial",
    name: "Initial Consultation - General Medicine",
    description: "Comprehensive first visit intake form",
    category: "General Medicine",
    usageCount: 1250,
    questions: [
      {
        id: "1",
        type: "text",
        label: "Chief Complaint",
        placeholder: "What brings you in today?",
        required: true,
      },
      {
        id: "2",
        type: "long",
        label: "History of Present Illness",
        placeholder: "Describe your symptoms, when they started, severity...",
      },
      {
        id: "3",
        type: "text",
        label: "Current Medications",
        placeholder: "List all medications and dosages...",
      },
      {
        id: "4",
        type: "checkbox",
        label: "Allergies",
        options: ["None", "Penicillin", "Sulfa", "NSAIDs", "Other"],
      },
      {
        id: "5",
        type: "text",
        label: "Past Medical History",
        placeholder: "Previous diagnoses, surgeries...",
      },
      {
        id: "6",
        type: "text",
        label: "Family History",
        placeholder: "Relevant family medical history...",
      },
    ],
  },
  {
    id: "psychiatry-intake",
    name: "Mental Health Intake",
    description: "Initial psychiatric evaluation form",
    category: "Psychiatry",
    usageCount: 890,
    questions: [
      {
        id: "1",
        type: "text",
        label: "Reason for Visit",
        placeholder: "What brings you here today?",
        required: true,
      },
      { id: "2", type: "rating", label: "Current Mood (1-10)", required: true },
      { id: "3", type: "rating", label: "Anxiety Level (1-10)" },
      {
        id: "4",
        type: "long",
        label: "Recent Stressors",
        placeholder: "Describe any recent life changes or stressors...",
      },
      {
        id: "5",
        type: "select",
        label: "Sleep Quality",
        options: ["Good (7-9 hours)", "Fair (5-7 hours)", "Poor (less than 5 hours)", "Variable"],
      },
      {
        id: "6",
        type: "checkbox",
        label: "Current Symptoms",
        options: [
          "Sadness",
          "Anxiety",
          "Irritability",
          "Sleep issues",
          "Appetite changes",
          "Concentration problems",
        ],
      },
    ],
  },
  {
    id: "urgent-triage",
    name: "Urgent Care Triage",
    description: "Quick assessment for urgent care visits",
    category: "Urgent Care",
    usageCount: 780,
    questions: [
      {
        id: "1",
        type: "text",
        label: "Main Concern",
        placeholder: "What is your primary concern today?",
        required: true,
      },
      { id: "2", type: "rating", label: "Pain Level (1-10)" },
      { id: "3", type: "date", label: "When did symptoms start?", required: true },
      {
        id: "4",
        type: "select",
        label: "Symptom Severity",
        options: ["Mild", "Moderate", "Severe", "Very Severe"],
        required: true,
      },
      {
        id: "5",
        type: "checkbox",
        label: "Associated Symptoms",
        options: ["Fever", "Nausea", "Vomiting", "Dizziness", "Shortness of breath"],
      },
    ],
  },
  {
    id: "chronic-management",
    name: "Chronic Condition Management",
    description: "Regular check-in for chronic conditions",
    category: "Chronic Care",
    usageCount: 650,
    questions: [
      {
        id: "1",
        type: "select",
        label: "Condition Being Managed",
        options: ["Diabetes", "Hypertension", "Asthma", "COPD", "Heart Disease", "Other"],
        required: true,
      },
      { id: "2", type: "rating", label: "How well controlled is your condition? (1-10)" },
      {
        id: "3",
        type: "select",
        label: "Medication Adherence",
        options: [
          "100% compliant",
          "Missed 1-2 doses",
          "Missed several doses",
          "Not taking medications",
        ],
      },
      {
        id: "4",
        type: "text",
        label: "Recent vital signs (if available)",
        placeholder: "e.g., BP 120/80, Blood sugar 110",
      },
      {
        id: "5",
        type: "long",
        label: "Any changes or concerns?",
        placeholder: "Describe any new symptoms or issues...",
      },
    ],
  },
];

// Get templates sorted by popularity (most used first)
export const getTemplatesByPopularity = (): FormTemplate[] => {
  return [...formTemplates].sort((a, b) => b.usageCount - a.usageCount);
};

// Get templates by category
export const getTemplatesByCategory = (category: string): FormTemplate[] => {
  return formTemplates
    .filter((t) => t.category === category)
    .sort((a, b) => b.usageCount - a.usageCount);
};

// Get all unique categories
export const getCategories = (): string[] => {
  return [...new Set(formTemplates.map((t) => t.category))];
};
