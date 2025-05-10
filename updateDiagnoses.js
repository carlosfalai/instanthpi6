import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the diagnoses document
const diagnosesDoc = fs.readFileSync(
  path.join(__dirname, 'attached_assets/Pasted--Comprehensive-Medical-Diagnosis-Templates-Table-of-Contents-Acute-Conditions-1-Acute-Ab-1746879151622.txt'),
  'utf-8'
);

// Function to extract protocol content
function extractProtocol(doc, diagnosisName) {
  // The protocol starts with "### {diagnosisName}" and ends with the next "###" or end of file
  const diagnosisHeader = `### ${diagnosisName}`;
  const startIndex = doc.indexOf(diagnosisHeader);
  
  if (startIndex === -1) {
    return null; // Diagnosis not found
  }
  
  // Find where the protocol content starts (skipping the header)
  const contentStart = doc.indexOf('🩺', startIndex);
  if (contentStart === -1) {
    return null; // No protocol content found
  }
  
  // Find where the protocol ends (next section header or end of file)
  let endIndex = doc.indexOf('###', contentStart);
  if (endIndex === -1) {
    endIndex = doc.length; // End of file
  }
  
  // Extract the protocol content
  const protocolContent = doc.substring(contentStart, endIndex).trim();
  return protocolContent;
}

// Map of categories
const categories = {
  // Lines 1-36 in the TOC
  'Acute Abdominal Pain': 'acute',
  'Acute Low Back Pain': 'acute',
  'Herpes Zoster (Shingles)': 'acute',
  'Conjunctivitis': 'acute',
  'Shoulder Pain': 'acute',
  'Laryngitis': 'acute',
  'Oral Herpes': 'acute',
  'Paronychia': 'acute',
  'Pharyngitis (Strep throat)': 'acute',
  'Upper Respiratory Infection': 'acute',
  'Urinary Tract Infection (UTI)': 'acute',
  'Fatigue': 'acute',
  'Headache – Tension Type': 'acute',
  'Insomnia': 'acute',
  'Irregular Periods/Amenorrhea': 'acute',
  'Knee Pain': 'acute',
  'Urgent Care': 'acute',
  'Vaginitis/Vaginosis': 'acute',
  'Urethritis': 'acute',
  'Testicular Pain': 'acute',
  'Rectal STIs': 'acute',
  'Syphilis': 'acute',
  'Dysuria': 'acute',
  'Abnormal Vaginal Discharge': 'acute',
  'Pneumonia': 'acute',
  'Bronchitis': 'acute',
  'Influenza': 'acute',
  'Otitis Media (Ear Infection)': 'acute',
  'Otitis Externa (Swimmer\'s Ear)': 'acute',
  'Allergic Rhinitis (Hay Fever)': 'acute',
  'Cellulitis': 'acute',
  'Abscess': 'acute',
  'Impetigo': 'acute',
  'Scabies': 'acute',
  'Rosacea': 'acute',
  'Acne': 'acute',
  
  // Lines 37-58 in the TOC
  'Chronic Abdominal Pain': 'chronic',
  'Asthma': 'chronic',
  'Diabetes Mellitus Type 2': 'chronic',
  'Hypertension': 'chronic',
  'COPD': 'chronic',
  'Chronic Constipation': 'chronic',
  'Chronic Cough': 'chronic',
  'Chronic Diarrhea': 'chronic',
  'Chronic Fatigue': 'chronic',
  'Chronic Low Back Pain': 'chronic',
  'GERD': 'chronic',
  'Gout': 'chronic',
  'Headache – Migraine': 'chronic',
  'Hyperlipidemia': 'chronic',
  'Hypothyroidism': 'chronic',
  'Obesity': 'chronic',
  'Osteoarthritis': 'chronic',
  'Eczema (Atopic Dermatitis)': 'chronic',
  'Psoriasis': 'chronic',
  'Hepatitis B': 'chronic',
  'Hepatitis C': 'chronic',
  'HIV': 'chronic',
  
  // Lines 59-67 in the TOC
  'ADHD in Adults (Established Diagnosis)': 'mental',
  'Anxiety': 'mental',
  'Burnout': 'mental',
  'Depression': 'mental',
  'Suspected ADHD in Adults': 'mental',
  'Adjustment Disorder': 'mental',
  'Panic Attacks/Panic Disorder': 'mental',
  'Bipolar Disorder': 'mental',
  'Shift Work Sleep Disorder': 'mental',
  
  // Lines 68-69 in the TOC
  'Preventative Care': 'preventative',
  'Asymptomatic STI Testing': 'preventative',
};

// Extract all diagnoses with protocols
const protocols = {};
Object.keys(categories).forEach(diagnosisName => {
  const protocol = extractProtocol(diagnosesDoc, diagnosisName);
  if (protocol) {
    protocols[diagnosisName] = {
      name: diagnosisName,
      category: categories[diagnosisName],
      protocol
    };
  }
});

// Write the protocols to a JSON file
fs.writeFileSync('protocols.json', JSON.stringify(protocols, null, 2));

console.log(`Extracted ${Object.keys(protocols).length} protocols`);