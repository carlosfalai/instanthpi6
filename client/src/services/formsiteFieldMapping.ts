/**
 * Mapping of FormSite field IDs to human-readable labels
 */
export const FORMSITE_FIELD_LABELS: Record<string, string> = {
  '2': 'Email',
  '5': 'Patient ID',
  '6': 'Gender',
  '7': 'Age',
  '8': 'Chief Complaint',
  '9': 'Symptom Onset',
  '10': 'Trigger',
  '11': 'Symptom Location',
  '12': 'Symptom Description',
  '13': 'Aggravating Factors',
  '14': 'Relieving Factors',
  '15': 'Symptom Severity (0-10)',
  '16': 'Symptom Evolution',
  '17': 'Associated Symptoms',
  '18': 'Previous Treatments',
  '19': 'Treatment Effectiveness',
  '20': 'Chronic Conditions',
  '21': 'Medication Allergies',
  '23': 'Pregnancy/Breastfeeding Status',
  '25': 'Additional Information'
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