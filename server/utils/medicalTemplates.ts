/**
 * Medical transcription templates and utilities
 * These functions help process patient form data into structured medical documents
 */

/**
 * Standard HPI confirmation template with variable placeholders
 * Variables should be surrounded by {{variable_name}} in the template
 */
export const HPI_CONFIRMATION_TEMPLATE = `
<h3>HPI Confirmation Summary</h3>
<p>Just to verify this with you beforehand, you are a {{Age}}-year-old {{Gender}} experiencing {{Description}} located in the {{Location}} that began on {{Symptom Onset}}. The symptom is rated {{Severity (0-10)}} out of 10, worsens with {{Aggravating Factors}}, and is relieved by {{Relieving Factors}}. You also report {{Associated Symptoms}}. {{Treatments Tried}}. You have the following chronic conditions: {{Chronic Conditions}}. {{Medication Allergies}}.</p>

<h3>Super Spartan SOAP Note</h3>
<p><strong>S:</strong> {{Age}} {{Gender}} with {{Description}} at {{Location}} since {{Symptom Onset}}; {{Severity (0-10)}}/10; ↑ {{Aggravating Factors}}, ↓ {{Relieving Factors}}; reports {{Associated Symptoms}}; {{Treatments Tried}}; hx of {{Chronic Conditions}}; {{Medication Allergies}}.</p>
<p><strong>A:</strong> Suspect {{Chief Complaint}}; ddx includes musculoskeletal cause, infection, or systemic pathology based on associated symptoms.</p>
<p><strong>P:</strong> In-person eval, imaging if needed, NSAIDs if tolerated, labs if fever or red flags present, monitor and reassess.</p>

<h3>Plan – Bullet Points</h3>
<ul>
  <li><strong>Medications:</strong> Trial NSAID (e.g., ibuprofen) ± acetaminophen; consider muscle relaxant if spasms</li>
  <li><strong>Imaging:</strong> Lumbar MRI with and without IV contrast if red flags or persistent severe pain</li>
  <li><strong>Labs:</strong> CBC, ESR, CRP to evaluate for infection/inflammation given fever or systemic concern</li>
  <li><strong>Referrals:</strong> Physio for core/postural support; ortho/neurosurg if imaging abnormal</li>
  <li><strong>Other:</strong> Patient education: avoid exacerbating activities, re-eval in 7 days or sooner if worsening</li>
</ul>

<h3 style="color: purple;">In case this is a telemedicine consultation</h3>
<p>I understand the pain is severe and accompanied by fever or chills, which may signal a more serious issue such as spinal infection, epidural abscess, or inflammatory discitis. Telemedicine cannot provide hands-on evaluation, neurological exam, reflex testing, or vital sign measurement. These are necessary to rule out emergent causes. An in-person clinician would conduct a physical exam, order urgent imaging (e.g., lumbar MRI with/without contrast), and run labs to check for systemic issues. Given your symptoms, I recommend seeking in-person evaluation at an urgent care or emergency department today.</p>

<h3>Follow-Up Questions</h3>
<p><strong>{{Chief Complaint}}</strong></p>
<ul>
  <li>Does the pain radiate into your legs, groin, or buttocks?</li>
  <li>Have you noticed numbness, tingling, or weakness in either leg?</li>
  <li>Do coughing, sneezing, or straining worsen the pain?</li>
  <li>Have you experienced any loss of bowel or bladder control?</li>
  <li>What positions or activities (e.g., sitting, bending) most affect the pain?</li>
  <li>Have you had prior episodes of similar {{Chief Complaint}}?</li>
  <li>Have you taken your temperature to confirm a fever? If so, what was it?</li>
  <li>Have you seen a doctor for this before?</li>
  <li>Have you been treated for this before?</li>
  <li>What diagnosis were you given?</li>
</ul>

<h3>Diagnostic Strategy & Reasoning</h3>
<p>Based on your current symptoms, the leading differentials include: 1) mechanical low-back strain or sprain, 2) lumbar disc herniation with possible nerve impingement, and 3) spinal infection such as osteomyelitis or epidural abscess. The strategy for diagnosis involves:</p>
<ul>
  <li><strong>Initial Exam:</strong> In-person neuro exam to assess strength, reflexes, and sensation</li>
  <li><strong>Labs:</strong> CBC, ESR, CRP to evaluate systemic inflammation</li>
  <li><strong>Imaging Requisition Text:</strong> 
    <em>
      "Lumbar MRI with and without IV contrast requested for rule out osteomyelitis, epidural abscess, or discitis. Patient has severe lower back pain, 8/10 intensity, associated with fever and no prior treatment. Red-flag symptoms under investigation."
    </em>
  </li>
  <li><strong>Treatment Plan:</strong> Once urgent pathology excluded, initiate conservative care with medication, posture rehab, and monitoring</li>
</ul>
<p>This structured process ensures the clinician can confirm or exclude urgent causes early, while creating a roadmap for long-term resolution and recovery.</p>
`;

/**
 * Map values from form submission to template variables
 * @param formData The form submission data
 * @returns A map of template variables to their values
 */
export function mapFormDataToTemplateVariables(
  formData: Record<string, any>
): Record<string, string> {
  // Initialize the variables with default values
  const variables: Record<string, string> = {
    Age: extractFieldValue(formData, "7") || "N/A",
    Gender: getGenderText(formData) || "N/A",
    "Chief Complaint": extractFieldValue(formData, "8") || "N/A",
    "Symptom Onset": extractFieldValue(formData, "9") || "N/A",
    Trigger: extractFieldValue(formData, "10") || "N/A",
    Location: extractFieldValue(formData, "11") || "N/A",
    Description: extractFieldValue(formData, "12") || "N/A",
    "Aggravating Factors": extractFieldValue(formData, "13") || "N/A",
    "Relieving Factors": extractFieldValue(formData, "14") || "N/A",
    "Severity (0-10)": extractFieldValue(formData, "15") || "N/A",
    "Associated Symptoms": extractFieldValue(formData, "17") || "N/A",
    "Treatments Tried": getTreatmentsTriedText(formData),
    "Chronic Conditions": extractFieldValue(formData, "20") || "none",
    "Medication Allergies": getMedicationAllergiesText(formData),
    Pregnancy: getPregnancyText(formData),
    "Additional Info": extractFieldValue(formData, "25") || "None provided",
  };

  // Log the extracted variables for debugging
  console.log("Extracted variables from form data:", variables);

  return variables;
}

/**
 * Get formatted text for gender
 * @param formData The form data object
 * @returns Formatted text about gender
 */
function getGenderText(formData: Record<string, any>): string {
  const gender = extractFieldValue(formData, "6");

  if (!gender) return "not specified";

  if (gender.toLowerCase().includes("fem") || gender.toLowerCase() === "f") {
    return "female";
  } else if (gender.toLowerCase().includes("male") || gender.toLowerCase() === "m") {
    return "male";
  } else {
    return gender;
  }
}

/**
 * Get formatted text about pregnancy
 * @param formData The form data object
 * @returns Formatted text about pregnancy status
 */
function getPregnancyText(formData: Record<string, any>): string {
  const pregnancy = extractFieldValue(formData, "23");

  if (!pregnancy) return "Pregnancy status not provided";

  if (pregnancy.toLowerCase().includes("yes")) {
    return "Patient is pregnant or breastfeeding";
  } else if (pregnancy.toLowerCase().includes("no")) {
    return "Patient is not pregnant or breastfeeding";
  } else {
    return `Pregnancy status: ${pregnancy}`;
  }
}

/**
 * Fill a template with values from a variables map
 * @param template The template string with {{variable}} placeholders
 * @param variables The map of variable names to values
 * @returns The filled template
 */
export function fillTemplate(template: string, variables: Record<string, string>): string {
  let result = template;

  // Replace all variables in the template
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, "g");
    result = result.replace(regex, value);
  }

  // Remove any remaining variable placeholders
  result = result.replace(/{{[^}]+}}/g, "N/A");

  return result;
}

/**
 * Extract a value from form data
 * @param formData The form data object
 * @param fieldId The ID of the field to extract
 * @returns The extracted value or undefined if not found
 */
function extractFieldValue(formData: Record<string, any>, fieldId: string): string | undefined {
  // Check direct field ID match
  if (formData[fieldId] !== undefined) {
    return formatValueForDisplay(formData[fieldId]);
  }

  // Check for field ID in various format patterns
  for (const key in formData) {
    // Check if the key contains the field ID (could be in format like "items[0][id]:5")
    if (key.includes(`:${fieldId}`) || key.includes(`[${fieldId}]`)) {
      return formatValueForDisplay(formData[key]);
    }

    // Handle nested objects with ID and value properties
    if (typeof formData[key] === "object" && formData[key] !== null) {
      const item = formData[key];
      if (item.id === fieldId && item.value !== undefined) {
        return formatValueForDisplay(item.value);
      }
    }
  }

  return undefined;
}

/**
 * Format a value for display in the template
 * @param value The value to format
 * @returns The formatted value as a string
 */
function formatValueForDisplay(value: any): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "object") {
    // If the value has a 'value' property, use that
    if (value.value !== undefined) {
      return String(value.value);
    }

    // Otherwise convert the object to a string
    return JSON.stringify(value);
  }

  return String(value);
}

/**
 * Get formatted text about treatments tried
 * @param formData The form data object
 * @returns Formatted text about treatments tried
 */
function getTreatmentsTriedText(formData: Record<string, any>): string {
  const treatmentsTried = extractFieldValue(formData, "18");
  const treatmentsEffective = extractFieldValue(formData, "19");

  if (
    !treatmentsTried ||
    treatmentsTried === "No" ||
    treatmentsTried.toLowerCase().includes("no")
  ) {
    return "No treatments have been tried yet";
  }

  if (treatmentsEffective === "Yes" || treatmentsEffective?.toLowerCase().includes("yes")) {
    return `The patient has tried ${treatmentsTried}, which was effective`;
  } else if (treatmentsEffective === "No" || treatmentsEffective?.toLowerCase().includes("no")) {
    return `The patient has tried ${treatmentsTried}, which was not effective`;
  } else {
    return `The patient has tried ${treatmentsTried}`;
  }
}

/**
 * Get formatted text about medication allergies
 * @param formData The form data object
 * @returns Formatted text about medication allergies
 */
function getMedicationAllergiesText(formData: Record<string, any>): string {
  const allergies = extractFieldValue(formData, "21");

  if (!allergies || allergies === "No" || allergies.toLowerCase().includes("no")) {
    return "No medication allergies";
  }

  return `Allergic to ${allergies}`;
}
