// Clinical Transcription System based on IH Transcriptioner Enhanced
// Transforms structured clinical variables into 5 text sections in French

interface ClinicalData {
  patientId: string;
  gender: string;
  age: string;
  chiefComplaint: string;
  symptomOnset: string;
  trigger: string;
  location: string;
  description: string;
  aggravatingFactors: string;
  relievingFactors: string;
  severity: number;
  evolution: string;
  associatedSymptoms: string;
  treatmentsTried: string;
  treatmentResponse: string;
  chronicConditions: string;
  medicationAllergies: string;
  pregnancyBreastfeeding: string;
  otherNotes: string;
}

interface ClinicalTranscription {
  confirmationMessage: string;
  soapNote: string;
  planBullets: string;
  telemedicine?: string;
  followUpQuestions: string;
}

export async function generateClinicalTranscription(
  data: ClinicalData
): Promise<ClinicalTranscription> {
  // 1. Generate Confirmation Message
  const confirmationMessage = generateConfirmationMessage(data);

  // 2. Generate SOAP Note
  const soapNote = generateSOAPNote(data);

  // 3. Generate Plan Bullets
  const planBullets = generatePlanBullets(data);

  // 4. Generate Telemedicine Section (if applicable)
  const telemedicine = isTelemedicineCase(data) ? generateTelemedicineSection(data) : undefined;

  // 5. Generate Follow-up Questions
  const followUpQuestions = generateFollowUpQuestions(data);

  return {
    confirmationMessage,
    soapNote,
    planBullets,
    telemedicine,
    followUpQuestions,
  };
}

function generateConfirmationMessage(data: ClinicalData): string {
  let message = "Juste pour confirmer avec vous avant de continuer;\n\n";

  // Add chief complaint
  if (data.chiefComplaint) {
    message += `Vous consultez pour: ${data.chiefComplaint}. `;
  }

  // Add symptom details
  if (data.description) {
    message += `Vous décrivez ${data.description}. `;
  }

  // Add onset
  if (data.symptomOnset) {
    message += `Ces symptômes ont commencé ${data.symptomOnset}. `;
  }

  // Add severity
  if (data.severity) {
    message += `La sévérité est de ${data.severity}/10. `;
  }

  // Add location if present
  if (data.location) {
    message += `La douleur/symptôme est localisé(e) au niveau de: ${data.location}. `;
  }

  // Add evolution
  if (data.evolution) {
    const evolutionText =
      {
        improving: "Les symptômes s'améliorent",
        stable: "Les symptômes sont stables",
        worsening: "Les symptômes s'aggravent",
        fluctuating: "Les symptômes fluctuent",
      }[data.evolution] || data.evolution;
    message += `${evolutionText}. `;
  }

  // Add treatments tried
  if (data.treatmentsTried) {
    message += `Vous avez essayé: ${data.treatmentsTried}. `;
  }

  // Add chronic conditions
  if (data.chronicConditions) {
    message += `Antécédents médicaux: ${data.chronicConditions}. `;
  }

  // Add allergies
  if (data.medicationAllergies) {
    message += `Allergies: ${data.medicationAllergies}. `;
  }

  // Add pregnancy/breastfeeding for females only
  if (data.gender === "female" && data.pregnancyBreastfeeding) {
    const pregnancyText = {
      pregnant: "Vous êtes enceinte",
      breastfeeding: "Vous allaitez",
      both: "Vous êtes enceinte et vous allaitez",
    }[data.pregnancyBreastfeeding];
    if (pregnancyText) {
      message += `${pregnancyText}. `;
    }
  }

  message += "\n\nEst-ce que ce résumé est exact ?";

  return message;
}

function generateSOAPNote(data: ClinicalData): string {
  let soap = "";

  // S - Subjective
  soap += "S: ";
  if (data.age && data.gender) {
    const genderText =
      data.gender === "male" ? "Homme" : data.gender === "female" ? "Femme" : "Personne";
    soap += `${genderText} de ${data.age} `;
  }
  soap += `présente avec ${data.chiefComplaint || "plainte principale"}`;

  if (data.symptomOnset) {
    soap += ` depuis ${data.symptomOnset}`;
  }

  if (data.description) {
    soap += `. Pt décrit: ${data.description}`;
  }

  if (data.severity) {
    soap += `. Sévérité: ${data.severity}/10`;
  }

  if (data.location) {
    soap += `. Localisation: ${data.location}`;
  }

  if (data.aggravatingFactors) {
    soap += `. Facteurs aggravants: ${data.aggravatingFactors}`;
  }

  if (data.relievingFactors) {
    soap += `. Facteurs de soulagement: ${data.relievingFactors}`;
  }

  if (data.associatedSymptoms) {
    soap += `. Symptômes associés: ${data.associatedSymptoms}`;
  }

  soap += ".\n\n";

  // O - Objective (would be filled by physician)
  soap += "O: [À compléter lors de l'examen]\n\n";

  // A - Assessment
  soap += "A: ";
  soap += generateAssessment(data);
  soap += "\n\n";

  // P - Plan
  soap += "P: ";
  soap += generatePlanSummary(data);

  return soap;
}

function generateAssessment(data: ClinicalData): string {
  // Generate assessment based on symptoms
  let assessment = "Évaluation clinique suggère ";

  // Pattern matching for common conditions
  const lowerComplaint = (data.chiefComplaint || "").toLowerCase();
  const lowerDescription = (data.description || "").toLowerCase();

  if (lowerComplaint.includes("toux") || lowerDescription.includes("toux")) {
    if (data.associatedSymptoms?.includes("fièvre")) {
      assessment += "possible infection respiratoire";
    } else {
      assessment += "toux d'étiologie à déterminer";
    }
  } else if (lowerComplaint.includes("douleur") || lowerDescription.includes("douleur")) {
    assessment += `douleur ${data.location || "non spécifiée"} d'étiologie à préciser`;
  } else if (lowerComplaint.includes("fatigue")) {
    assessment += "fatigue à investiguer";
  } else {
    assessment += "condition nécessitant évaluation approfondie";
  }

  if (data.chronicConditions) {
    assessment += ` dans le contexte de: ${data.chronicConditions}`;
  }

  return assessment + ".";
}

function generatePlanSummary(data: ClinicalData): string {
  let plan = "";

  // Add treatment recommendations based on severity
  if (data.severity >= 7) {
    plan += "Évaluation urgente recommandée. ";
  }

  // Add medication considerations
  if (data.medicationAllergies) {
    plan += `Éviter: ${data.medicationAllergies}. `;
  }

  // Add pregnancy considerations
  if (data.gender === "female" && data.pregnancyBreastfeeding) {
    plan += "Considérations spéciales pour grossesse/allaitement. ";
  }

  plan += "Plan détaillé à suivre.";

  return plan;
}

function generatePlanBullets(data: ClinicalData): string {
  const bullets: string[] = [];

  // Generate plan based on symptoms and severity
  if (data.severity >= 7) {
    bullets.push("• Évaluation médicale urgente recommandée");
  }

  // Symptomatic relief
  bullets.push("• Repos et hydratation adéquate");

  if (data.chiefComplaint?.toLowerCase().includes("douleur")) {
    bullets.push("• Analgésie selon tolérance et allergies");
  }

  if (data.chiefComplaint?.toLowerCase().includes("toux")) {
    bullets.push("• Mesures de confort pour la toux");
    bullets.push("• Surveillance des signes d'aggravation");
  }

  // Follow-up
  if (data.evolution === "worsening") {
    bullets.push("• Suivi rapproché dans 24-48h");
  } else {
    bullets.push("• Suivi si absence d'amélioration dans 3-5 jours");
  }

  // Red flags
  bullets.push("• Retour immédiat si: détresse respiratoire, douleur thoracique, confusion");

  // Preventive measures
  bullets.push("• Mesures préventives: hygiène des mains, repos suffisant");

  // Referrals if needed
  if (data.chronicConditions) {
    bullets.push("• Considérer référence spécialisée selon évolution");
  }

  return bullets.join("\n");
}

function isTelemedicineCase(data: ClinicalData): boolean {
  // Determine if this is suitable for telemedicine
  return data.severity < 8 && !data.chiefComplaint?.toLowerCase().includes("urgence");
}

function generateTelemedicineSection(data: ClinicalData): string {
  return `Consultation de télémédecine appropriée pour ce cas.
  
Modalités:
- Consultation vidéo recommandée pour évaluation visuelle
- Suivi par messagerie sécurisée disponible
- Prescription électronique possible si indiquée
- Documentation photo peut être utile pour: ${data.location || "zone affectée"}

Instructions pour le patient:
- Assurer connexion internet stable
- Environnement calme et bien éclairé
- Avoir liste de médicaments à portée de main
- Préparer questions spécifiques`;
}

function generateFollowUpQuestions(data: ClinicalData): string {
  const questions: string[] = [];

  // Generate 10 follow-up questions based on the case
  questions.push("Avez-vous pris votre température récemment? Si oui, quelle était-elle?");

  if (data.chiefComplaint) {
    questions.push(`Depuis combien de temps exactement ressentez-vous ${data.chiefComplaint}?`);
  }

  questions.push("Y a-t-il des moments de la journée où les symptômes sont pires?");
  questions.push("Avez-vous voyagé récemment?");
  questions.push("Avez-vous été en contact avec quelqu'un de malade?");

  if (!data.treatmentsTried) {
    questions.push("Avez-vous pris des médicaments en vente libre?");
  }

  questions.push("Comment est votre appétit?");
  questions.push("Avez-vous des troubles du sommeil liés à vos symptômes?");
  questions.push("Y a-t-il des antécédents familiaux pertinents?");
  questions.push("Avez-vous consulté pour des symptômes similaires dans le passé?");

  // Ensure we have exactly 10 questions
  while (questions.length < 10) {
    questions.push("Avez-vous d'autres symptômes non mentionnés?");
  }

  return questions.slice(0, 10).join("\n");
}

// Export for API processing
export function processAICommand(command: string, consultation: any, template: string): string {
  const data = consultation.form_data || {};

  if (template === "referral_pt") {
    return generatePTReferral(data);
  } else if (template === "referral_ot") {
    return generateOTReferral(data);
  } else if (template === "referral_social") {
    return generateSocialWorkReferral(data);
  } else if (template === "imaging") {
    return generateImagingRequest(data);
  }

  return "Commande non reconnue";
}

function generatePTReferral(data: ClinicalData): string {
  const gender = data.gender === "male" ? "Homme" : "Femme";
  return `**Référence en Physiothérapie - NON URGENT**

${gender}, ${data.age || "âge non spécifié"}, présente ${data.chiefComplaint} depuis ${data.symptomOnset || "durée non spécifiée"}.

Localisation: ${data.location || "non spécifiée"}
Sévérité: ${data.severity}/10
Facteurs aggravants: ${data.aggravatingFactors || "aucun identifié"}
Facteurs de soulagement: ${data.relievingFactors || "aucun identifié"}

Antécédents: ${data.chronicConditions || "aucun"}
Traitements essayés: ${data.treatmentsTried || "aucun"}

Référé(e) pour: Évaluation et traitement en physiothérapie

Objectifs:
- Réduction de la douleur
- Amélioration de la mobilité
- Renforcement musculaire
- Éducation posturale

Délai recommandé: 2-4 semaines`;
}

function generateOTReferral(data: ClinicalData): string {
  const gender = data.gender === "male" ? "Homme" : "Femme";
  return `**Référence en Ergothérapie - NON URGENT**

${gender}, ${data.age || "âge non spécifié"}, présente ${data.chiefComplaint} affectant les activités quotidiennes.

Impact fonctionnel: ${data.description || "à évaluer"}
Sévérité: ${data.severity}/10

Antécédents: ${data.chronicConditions || "aucun"}

Référé(e) pour: Évaluation ergothérapique et adaptation

Objectifs:
- Évaluation fonctionnelle complète
- Adaptation de l'environnement
- Techniques compensatoires
- Amélioration de l'autonomie

Délai recommandé: 3-4 semaines`;
}

function generateSocialWorkReferral(data: ClinicalData): string {
  return `**Référence au Travail Social**

Patient présentant ${data.chiefComplaint} avec possible impact psychosocial.

Situation actuelle: ${data.otherNotes || "à évaluer"}
Conditions chroniques: ${data.chronicConditions || "aucune"}

Référé(e) pour:
- Évaluation psychosociale
- Soutien et ressources communautaires
- Coordination des services
- Support familial si nécessaire

Délai recommandé: 1-2 semaines`;
}

function generateImagingRequest(data: ClinicalData): string {
  const gender = data.gender === "male" ? "Homme" : "Femme";
  const imagingType = determineImagingType(data);

  return `**Demande d'Imagerie Médicale**

Type: ${imagingType}

${gender}, ${data.age || "âge non spécifié"}, ${data.chiefComplaint}
Localisation: ${data.location || "à préciser"}
Début: ${data.symptomOnset || "non spécifié"}
Sévérité: ${data.severity}/10

Symptômes associés: ${data.associatedSymptoms || "aucun"}
Conditions chroniques: ${data.chronicConditions || "aucune"}

Indication: Évaluation diagnostique pour ${data.chiefComplaint}

${data.severity >= 7 ? "URGENT - Dans les 24-48h" : "Routine - Dans les 2-4 semaines"}`;
}

function determineImagingType(data: ClinicalData): string {
  const complaint = (data.chiefComplaint || "").toLowerCase();
  const location = (data.location || "").toLowerCase();

  if (complaint.includes("thorax") || complaint.includes("poumon") || complaint.includes("toux")) {
    return "Radiographie pulmonaire";
  } else if (location.includes("tête") || complaint.includes("céphalée")) {
    return "TDM cérébral";
  } else if (location.includes("abdomen")) {
    return "Échographie abdominale";
  } else if (location.includes("dos") || location.includes("colonne")) {
    return "IRM rachidienne";
  }

  return "Radiographie standard";
}
