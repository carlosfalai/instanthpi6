#!/usr/bin/env node

// Example of what the HPI confirmation summary should look like now
// This demonstrates the paragraph format instead of bullet points

function generateHPISummaryExample() {
  // Sample patient data
  const patientData = {
    gender: "male",
    age: 45,
    reasonForVisit: "Sharp chest pain that started this morning, feeling short of breath",
    problemStartDate: "This morning around 8 AM",
    symptomLocation: "Left side of chest, radiating to left arm",
    symptomDescription: "Sharp, stabbing pain",
    symptomAggravators: "Deep breathing, movement, lying flat",
    symptomRelievers: "Sitting upright, staying still",
    severity: 8,
    selectedSymptoms: ["Chest pain", "Shortness of breath", "Nausea", "Dizziness", "Heart palpitations"],
    chronicConditions: "High blood pressure, family history of heart disease",
    medicationAllergies: "Penicillin - causes rash"
  };

  // Generate HPI confirmation summary (paragraph format)
  const genderLabel = patientData.gender === "female" ? "Femme" : patientData.gender === "male" ? "Homme" : "Non précisé";
  let hpiSummary = `Patient: ${genderLabel}, ${patientData.age ? `${patientData.age} ans` : "Âge non précisé"}. `;
  hpiSummary += `Plainte principale: ${patientData.reasonForVisit || "Non spécifié"}`;
  
  if (patientData.problemStartDate && patientData.problemStartDate !== "Non spécifié") {
    hpiSummary += ` apparu ${patientData.problemStartDate.toLowerCase()}`;
  }
  
  if (patientData.symptomLocation && patientData.symptomLocation !== "Non spécifié") {
    hpiSummary += `, localisé ${patientData.symptomLocation.toLowerCase()}`;
  }
  
  if (patientData.symptomDescription && patientData.symptomDescription !== "Non spécifié") {
    hpiSummary += `, ${patientData.symptomDescription.toLowerCase()}`;
  }
  
  if (patientData.symptomAggravators && patientData.symptomAggravators !== "Non spécifié") {
    hpiSummary += ` aggravé par ${patientData.symptomAggravators.toLowerCase()}`;
  }
  
  if (patientData.symptomRelievers && patientData.symptomRelievers !== "Non spécifié") {
    hpiSummary += `, soulagé par ${patientData.symptomRelievers.toLowerCase()}`;
  }
  
  if (patientData.severity && patientData.severity !== "Non spécifié") {
    hpiSummary += `, sévérité ${patientData.severity}/10`;
  }
  
  if (patientData.selectedSymptoms.length > 0) {
    hpiSummary += `. Symptômes associés: ${patientData.selectedSymptoms.join(", ")}`;
  }
  
  if (patientData.chronicConditions && patientData.chronicConditions !== "Non spécifié") {
    hpiSummary += `. Conditions chroniques: ${patientData.chronicConditions}`;
  }
  
  if (patientData.medicationAllergies && patientData.medicationAllergies !== "Non spécifié") {
    hpiSummary += `. Allergies: ${patientData.medicationAllergies}`;
  }
  
  hpiSummary += ". Cette information est-elle correcte?";

  return hpiSummary;
}

console.log("=== HPI CONFIRMATION SUMMARY EXAMPLE ===");
console.log("(This is what it should look like now - paragraph format)");
console.log("");
console.log(generateHPISummaryExample());
console.log("");
console.log("=== COMPARISON ===");
console.log("OLD FORMAT (bullet points - WRONG):");
console.log("Patient: Homme, 45 ans");
console.log("• Plainte principale: Sharp chest pain...");
console.log("• Début: This morning around 8 AM");
console.log("• Localisation: Left side of chest...");
console.log("• Sévérité: 8/10");
console.log("• Facteurs aggravants: Deep breathing...");
console.log("• Facteurs soulageants: Sitting upright...");
console.log("• Symptômes associés: Chest pain, Shortness of breath...");
console.log("• Conditions chroniques: High blood pressure...");
console.log("• Allergies: Penicillin - causes rash");
console.log("");
console.log("NEW FORMAT (paragraph - CORRECT):");
console.log("(See the generated example above)");
