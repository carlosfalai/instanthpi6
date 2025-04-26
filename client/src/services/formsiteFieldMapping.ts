/**
 * Mapping of FormSite field IDs to human-readable labels
 */
export const FORMSITE_FIELD_LABELS: Record<string, string> = {
  '2': 'Email: (Note: In the actual patient-facing version, email is not requested)',
  '5': 'Generated Patient ID',
  '6': 'Gender',
  '7': 'Age',
  '8': 'What brings you to the clinic today?',
  '9': 'When did this problem start?',
  '10': 'Was there a specific trigger?',
  '11': 'Where is the symptom located?',
  '12': 'How would you describe your symptom?',
  '13': 'What makes the symptom worse?',
  '14': 'What relieves the symptom?',
  '15': 'On a scale of 0 to 10, how severe is your symptom?',
  '16': 'How has the symptom evolved over time?',
  '17': 'Are you experiencing any of the following symptoms?',
  '18': 'Have you tried any treatments or remedies for this problem?',
  '19': 'Were the treatments effective?',
  '20': 'Do you have any chronic conditions?',
  '21': 'Do you have any known medication allergies?',
  '23': 'Are you pregnant or breastfeeding?',
  '25': 'Is there anything else we should know about your current condition?'
};

/**
 * Get a human-readable label for a FormSite field ID
 * @param fieldId The field ID to get a label for
 * @returns A human-readable label for the field
 */
export function getFieldLabel(fieldId: string): string {
  return FORMSITE_FIELD_LABELS[fieldId] || `Field ${fieldId}`;
}

/**
 * Format a complex form field object for display
 * This handles nested structures in the form data
 */
export function formatFieldValue(value: any): string {
  if (value === null || value === undefined) {
    return 'No response';
  }
  
  if (typeof value === 'object') {
    // Special handling for complex objects
    if (value.id && value.value) {
      return value.value;
    }
    return JSON.stringify(value, null, 2);
  }
  
  return String(value);
}