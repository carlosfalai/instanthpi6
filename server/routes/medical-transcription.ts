import { Router, Request, Response } from "express";
import { createUserAIClient } from "../utils/aiClient";

const router = Router();

// Medical transcription AI endpoint - generates comprehensive French medical blocks
router.post("/medical-transcription", async (req: Request, res: Response) => {
  try {
    const { patientId, variables, customRequest } = req.body;

    if (!patientId || !variables) {
      return res.status(400).json({ error: "Missing patientId or variables" });
    }

    // Extract variables
    const {
      Gender,
      Age,
      ChiefComplaint,
      SymptomOnset,
      Trigger,
      Location,
      Description,
      AggravatingFactors,
      RelievingFactors,
      Severity,
      Evolution,
      AssociatedSymptoms,
      TreatmentsTried,
      TreatmentResponse,
      ChronicConditions,
      MedicationAllergies,
      PregnancyBreastfeeding,
      OtherNotes,
    } = variables;

    // Get user-specific AI client (default to user 1 for now)
    const userId = 1; // TODO: Get from authentication
    const aiClient = await createUserAIClient(userId);
    
    if (!aiClient) {
      return res.status(500).json({ error: "No AI client available" });
    }

    // Create the comprehensive medical transcription prompt based on instanthpi-medical structure
    const systemPrompt = `You are a medical transcription AI that generates structured French medical outputs with copy-to-clipboard blocks. Every section must be enclosed in a fenced code block with the section name given as the code-fence language identifier. Labels must be written in full, reliées par des underscores (pas d'espaces), pour s'afficher dans l'UI **mais ne pas être copiées** avec le texte. Tout le contenu à l'intérieur des blocs est en français, langage clinique naturel.

Toujours produire **tous** les blocs ci-dessous, dans l'ordre exact, quelle que soit l'indication. Si un bloc n'est pas indiqué à ce stade selon les données disponibles, produire une seule ligne concise et neutre indiquant que ce n'est pas indiqué à ce stade (sans remplissage, sans spéculation). Respecter strictement les formats. Ne pas ajouter de lignes vides en tête ou en fin de bloc. Ne pas répéter le nom de l'étiquette (p. ex. « Imagerie_Medicale ») à l'intérieur du contenu du bloc.

Correctifs obligatoires (à appliquer à chaque sortie):
- **HPI_Confirmation_Summary** : un **seul paragraphe** (aucun saut de ligne). Commencer **exactement** par « Juste pour confirmer avec vous avant de continuer; », puis enchaîner **dans la même phrase** avec « …; vous êtes [une femme/un homme] de [x] ans … » (**vous** en minuscule après le point-virgule). Terminer **exactement** par « Est-ce que ce résumé est exact ? ». Aucune ligne vide ou paragraphe séparé.
- **10_FollowUpQuestions_BasedOn_3Differentials** : **exactement 10** questions cliniques, **10 lignes de texte brut**, **sans numérotation, sans puces, sans tirets, sans balises de liste**. Une question par ligne, terminée par « ? ».
- **Imagerie_Medicale** et **Reference_aux_Specialistes_[Specialty]** : produire dans leurs propres fences, avec les formats internes exacts exigés ci-dessous. **Ne jamais inclure le nom d'étiquette** (p. ex. « Imagerie_Medicale ») à l'intérieur du contenu. Si plusieurs examens/références sont nécessaires, produire plusieurs fences successifs. Si aucune imagerie/référence n'est indiquée, utiliser les versions factices décrites.
- **Lab_Works** : à l'intérieur du fence, **uniquement** les abréviations (une par ligne, sans doublons, sans noms complets). L'explication s'écrit **hors fence** en paragraphe séparé.
- **Arrêt de travail** : début = aujourd'hui; fin = aujourd'hui + durée; si non précisée, **+72 h** (afficher les dates précises).
- **Patient_Message** : tout message destiné au patient doit être rendu dans un bloc avec l'étiquette \`\`\`Patient_Message, sans répéter le mot Patient_Message à l'intérieur. Le contenu interne commence directement par le texte du message, en français naturel, sans métadonnées, sans date ni signature.
- Aucune mention de données manquantes ni de valeurs « non précisées ». Omettre simplement les informations absentes. Pas de crochets vides ou d'indications placeholder.

Ordre et étiquettes (respecter mot à mot):

\`\`\`HPI_Confirmation_Summary\`\`\`
Message de confirmation **en un seul paragraphe**, français, avec sexe/âge explicites. Grossesse/allaitement uniquement si fourni (patiente). Terminer par la phrase exacte.

\`\`\`10_FollowUpQuestions_BasedOn_3Differentials\`\`\`
10 lignes = 10 questions cliniques (aucun numéro/puce/tiret/liste), dérivées de 3 diagnostics différentiels.

\`\`\`Super_Spartan_SAP_Note\`\`\`
S: résumé subjectif.
A: impression diagnostique.
P: plan et prochaines étapes. Style clinique spartiate.

\`\`\`Medications_ReadyToUse_Prescriptions\`\`\`
Prescriptions prêtes à l'emploi : nom, forme, dose, voie, fréquence, durée, quantité, renouvellements, instructions. Aucune formulation conditionnelle.

\`\`\`Lab_Works\`\`\`
Dans le fence: abréviations pertinentes (une par ligne). Sous le bloc (hors fence), fournir un paragraphe explicatif en français sur le rôle de chaque examen et comment il guide la prise en charge. Si aucun bilan n'est indiqué: « Aucun_bilan_indiqué_à_ce_stade » (ligne unique). Le paragraphe justifie brièvement l'absence d'indication.

\`\`\`Imagerie_Medicale\`\`\`
Texte interne exactement:
5.3. Imagerie Médicale
[Type d'imagerie avec vues/incidences] [Sexe, âge si disponibles], [symptômes (lieu, début/date, sévérité, symptômes associés, conditions chroniques)]
Indication: [raison de l'examen]
Délai recommandé: [délai]
Si aucune imagerie: examen « Aucune imagerie indiquée » avec vues « — », Indication: Non indiqué à ce stade selon données disponibles, Délai recommandé: —. Une demande par fence si plusieurs examens.

\`\`\`Reference_aux_Specialistes_[Specialty]\`\`\`
Texte interne exactement:
5.4. Références aux Spécialistes
[Spécialité] [Sexe, âge si disponibles], [symptômes et durée], [antécédents pertinents], [traitements en cours], référé(e) pour: [objectif]
Délai recommandé: [délai]
Toujours au moins un bloc; sinon utiliser l'étiquette \`Reference_aux_Specialistes_Aucune\` avec le format ci-dessus et « Aucune référence indiquée à ce stade » ; Délai: —.

\`\`\`Work_Leave_Certificate\`\`\`
Dates spécifiques: début = aujourd'hui; fin = aujourd'hui + durée; si non fourni: +72h (afficher les dates). Justification médicale concise.

\`\`\`Workplace_Modifications\`\`\`
Recommandations concrètes d'aménagement du poste.

\`\`\`Insurance_Documentation\`\`\`
Diagnostic/mécanisme, impact fonctionnel, traitement en place, dates d'arrêt, pronostic.

\`\`\`Telemedicine_NeedsInPersonEvaluation\`\`\`
1) Ouvrir par la phrase imposée sur la limite de la téléconsultation.
2) Expliquer ce qui ne peut pas être fait à distance (examen, signes vitaux, imagerie, bilans).
3) Citer des **catégories** d'examens (neurologique, infectieux, organique, métabolique, mécanique, circulatoire, etc.) sans nommer de diagnostics.
4) Terminer par la phrase imposée pour la préparation du résumé de triage.

\`\`\`Patient_Message\`\`\`
Message destiné directement au patient, contenu uniquement (aucune date, aucun nom, aucune signature, aucune mention de l'étiquette). Le texte est en français naturel, prêt à être copié-collé.

Lignes directrices:
- Français uniquement. Utiliser seulement les variables fournies. Pas d'indication de manque.
- Chaque bloc est autonome, propre, prêt à copier.
- Imagerie et références: ne jamais utiliser URGENT/NON URGENT; toujours « Délai recommandé ».
- Les prescriptions sont complètes et prêtes à l'emploi.
- L'arrêt de travail calcule automatiquement la fin par défaut à 72h avec dates précises.
- Ton clinique, naturel, concis; télémedecine empathique et explicative.
- Pour Patient_Message: toujours en bloc unique avec label uniquement dans le fence, texte direct à l'intérieur.`;

    const userPrompt = `Transcris cette consultation médicale avec les informations suivantes:

Patient ID: ${patientId}
Sexe: ${Gender}
Âge: ${Age}
Motif de consultation: ${ChiefComplaint}
Début des symptômes: ${SymptomOnset}
Déclencheur: ${Trigger}
Localisation: ${Location}
Description: ${Description}
Facteurs aggravants: ${AggravatingFactors}
Facteurs soulageants: ${RelievingFactors}
Sévérité: ${Severity}
Évolution: ${Evolution}
Symptômes associés: ${AssociatedSymptoms}
Traitements tentés: ${TreatmentsTried}
Réponse au traitement: ${TreatmentResponse}
Conditions chroniques: ${ChronicConditions}
Allergies médicamenteuses: ${MedicationAllergies}
Grossesse/Allaitement: ${PregnancyBreastfeeding}
Autres notes: ${OtherNotes}

Génère tous les blocs médicaux en français selon les spécifications exactes.`;

    // Handle custom request if provided
    if (customRequest) {
      const customSystemPrompt = `You are a medical AI assistant. The doctor has made a specific request regarding a patient case. Please fulfill this request using the patient information provided. Respond in French with professional medical language. Be specific and actionable in your response.`;

      const customUserPrompt = `Demande du médecin: "${customRequest}"

Informations du patient:
Patient ID: ${patientId}
Sexe: ${Gender}
Âge: ${Age}
Motif de consultation: ${ChiefComplaint}
Début des symptômes: ${SymptomOnset}
Déclencheur: ${Trigger}
Localisation: ${Location}
Description: ${Description}
Facteurs aggravants: ${AggravatingFactors}
Facteurs soulageants: ${RelievingFactors}
Sévérité: ${Severity}
Évolution: ${Evolution}
Symptômes associés: ${AssociatedSymptoms}
Traitements tentés: ${TreatmentsTried}
Réponse au traitement: ${TreatmentResponse}
Conditions chroniques: ${ChronicConditions}
Allergies médicamenteuses: ${MedicationAllergies}
Grossesse/Allaitement: ${PregnancyBreastfeeding}
Autres notes: ${OtherNotes}

Réponds à la demande du médecin de manière professionnelle et complète.`;

      const customResponse = await aiClient.generateCompletion([
        { role: "user", content: customUserPrompt }
      ], customSystemPrompt);

      return res.json({
        customResponse: customResponse
      });
    }

    // Generate the comprehensive medical transcription
    const aiResponse = await aiClient.generateCompletion([
      { role: "user", content: userPrompt }
    ], systemPrompt);

    // Parse the AI response to extract each medical block
    const blocks = parseMedicalBlocks(aiResponse);

    res.json({
      hpiConfirmationSummary: blocks.hpiConfirmationSummary,
      followUpQuestions: blocks.followUpQuestions,
      superSpartanSAP: blocks.superSpartanSAP,
      medicationsReadyToUse: blocks.medicationsReadyToUse,
      labWorks: blocks.labWorks,
      imagerieMedicale: blocks.imagerieMedicale,
      referenceSpecialistes: blocks.referenceSpecialistes,
      workLeaveCertificate: blocks.workLeaveCertificate,
      workplaceModifications: blocks.workplaceModifications,
      insuranceDocumentation: blocks.insuranceDocumentation,
      telemedicineNeedsInPerson: blocks.telemedicineNeedsInPerson,
      patientMessage: blocks.patientMessage,
    });

  } catch (error: any) {
    console.error("Error generating medical transcription:", error);
    res.status(500).json({ error: "Failed to generate medical transcription" });
  }
});

// Parse the AI response to extract each medical block
function parseMedicalBlocks(response: string) {
  const blocks: any = {};

  // Extract HPI Confirmation Summary
  const hpiMatch = response.match(/```HPI_Confirmation_Summary```\s*([\s\S]*?)(?=```|$)/);
  if (hpiMatch) {
    blocks.hpiConfirmationSummary = hpiMatch[1].trim();
  }

  // Extract Follow-up Questions
  const followUpMatch = response.match(/```10_FollowUpQuestions_BasedOn_3Differentials```\s*([\s\S]*?)(?=```|$)/);
  if (followUpMatch) {
    blocks.followUpQuestions = followUpMatch[1].trim();
  }

  // Extract Super Spartan SAP Note
  const sapMatch = response.match(/```Super_Spartan_SAP_Note```\s*([\s\S]*?)(?=```|$)/);
  if (sapMatch) {
    blocks.superSpartanSAP = sapMatch[1].trim();
  }

  // Extract Medications Ready to Use
  const medMatch = response.match(/```Medications_ReadyToUse_Prescriptions```\s*([\s\S]*?)(?=```|$)/);
  if (medMatch) {
    blocks.medicationsReadyToUse = medMatch[1].trim();
  }

  // Extract Lab Works
  const labMatch = response.match(/```Lab_Works```\s*([\s\S]*?)(?=```|$)/);
  if (labMatch) {
    blocks.labWorks = labMatch[1].trim();
  }

  // Extract Imagerie Medicale
  const imgMatch = response.match(/```Imagerie_Medicale```\s*([\s\S]*?)(?=```|$)/);
  if (imgMatch) {
    blocks.imagerieMedicale = imgMatch[1].trim();
  }

  // Extract Reference aux Specialistes
  const refMatch = response.match(/```Reference_aux_Specialistes_[^`]*```\s*([\s\S]*?)(?=```|$)/);
  if (refMatch) {
    blocks.referenceSpecialistes = refMatch[1].trim();
  }

  // Extract Work Leave Certificate
  const workMatch = response.match(/```Work_Leave_Certificate```\s*([\s\S]*?)(?=```|$)/);
  if (workMatch) {
    blocks.workLeaveCertificate = workMatch[1].trim();
  }

  // Extract Workplace Modifications
  const workplaceMatch = response.match(/```Workplace_Modifications```\s*([\s\S]*?)(?=```|$)/);
  if (workplaceMatch) {
    blocks.workplaceModifications = workplaceMatch[1].trim();
  }

  // Extract Insurance Documentation
  const insuranceMatch = response.match(/```Insurance_Documentation```\s*([\s\S]*?)(?=```|$)/);
  if (insuranceMatch) {
    blocks.insuranceDocumentation = insuranceMatch[1].trim();
  }

  // Extract Telemedicine Needs In Person Evaluation
  const teleMatch = response.match(/```Telemedicine_NeedsInPersonEvaluation```\s*([\s\S]*?)(?=```|$)/);
  if (teleMatch) {
    blocks.telemedicineNeedsInPerson = teleMatch[1].trim();
  }

  // Extract Patient Message
  const patientMatch = response.match(/```Patient_Message```\s*([\s\S]*?)(?=```|$)/);
  if (patientMatch) {
    blocks.patientMessage = patientMatch[1].trim();
  }

  return blocks;
}

// Generate comprehensive HTML report (inspired by instanthpi-medical)
router.post("/medical-transcription/html-report", async (req: Request, res: Response) => {
  try {
    const { patientId, variables } = req.body;

    if (!patientId || !variables) {
      return res.status(400).json({ error: "Missing patientId or variables" });
    }

    // Extract variables
    const {
      Gender,
      Age,
      ChiefComplaint,
      SymptomOnset,
      Trigger,
      Location,
      Description,
      AggravatingFactors,
      RelievingFactors,
      Severity,
      Evolution,
      AssociatedSymptoms,
      TreatmentsTried,
      TreatmentResponse,
      ChronicConditions,
      MedicationAllergies,
      PregnancyBreastfeeding,
      OtherNotes,
    } = variables;

    // Get user-specific AI client
    const userId = 1; // TODO: Get from authentication
    const aiClient = await createUserAIClient(userId);
    
    if (!aiClient) {
      return res.status(500).json({ error: "No AI client available" });
    }

    // Generate the medical transcription first
    const systemPrompt = `You are a medical transcription AI that generates structured French medical outputs with copy-to-clipboard blocks. Every section must be enclosed in a fenced code block with the section name given as the code-fence language identifier. Labels must be written in full, reliées par des underscores (pas d'espaces), pour s'afficher dans l'UI **mais ne pas être copiées** avec le texte. Tout le contenu à l'intérieur des blocs est en français, langage clinique naturel.

Toujours produire **tous** les blocs ci-dessous, dans l'ordre exact, quelle que soit l'indication. Si un bloc n'est pas indiqué à ce stade selon les données disponibles, produire une seule ligne concise et neutre indiquant que ce n'est pas indiqué à ce stade (sans remplissage, sans spéculation). Respecter strictement les formats. Ne pas ajouter de lignes vides en tête ou en fin de bloc. Ne pas répéter le nom de l'étiquette (p. ex. « Imagerie_Medicale ») à l'intérieur du contenu du bloc.

Correctifs obligatoires (à appliquer à chaque sortie):
- **HPI_Confirmation_Summary** : un **seul paragraphe** (aucun saut de ligne). Commencer **exactement** par « Juste pour confirmer avec vous avant de continuer; », puis enchaîner **dans la même phrase** avec « …; vous êtes [une femme/un homme] de [x] ans … » (**vous** en minuscule après le point-virgule). Terminer **exactement** par « Est-ce que ce résumé est exact ? ». Aucune ligne vide ou paragraphe séparé.
- **10_FollowUpQuestions_BasedOn_3Differentials** : **exactement 10** questions cliniques, **10 lignes de texte brut**, **sans numérotation, sans puces, sans tirets, sans balises de liste**. Une question par ligne, terminée par « ? ».

Ordre et étiquettes (respecter mot à mot):

\`\`\`HPI_Confirmation_Summary\`\`\`
Message de confirmation **en un seul paragraphe**, français, avec sexe/âge explicites. Grossesse/allaitement uniquement si fourni (patiente). Terminer par la phrase exacte.

\`\`\`10_FollowUpQuestions_BasedOn_3Differentials\`\`\`
10 lignes = 10 questions cliniques (aucun numéro/puce/tiret/liste), dérivées de 3 diagnostics différentiels.

\`\`\`Super_Spartan_SAP_Note\`\`\`
S: résumé subjectif.
A: impression diagnostique.
P: plan et prochaines étapes. Style clinique spartiate.

\`\`\`Medications_ReadyToUse_Prescriptions\`\`\`
Prescriptions prêtes à l'emploi : nom, forme, dose, voie, fréquence, durée, quantité, renouvellements, instructions. Aucune formulation conditionnelle.

\`\`\`Lab_Works\`\`\`
Dans le fence: abréviations pertinentes (une par ligne). Sous le bloc (hors fence), fournir un paragraphe explicatif en français sur le rôle de chaque examen et comment il guide la prise en charge. Si aucun bilan n'est indiqué: « Aucun_bilan_indiqué_à_ce_stade » (ligne unique). Le paragraphe justifie brièvement l'absence d'indication.

\`\`\`Imagerie_Medicale\`\`\`
Texte interne exactement:
5.3. Imagerie Médicale
[Type d'imagerie avec vues/incidences] [Sexe, âge si disponibles], [symptômes (lieu, début/date, sévérité, symptômes associés, conditions chroniques)]
Indication: [raison de l'examen]
Délai recommandé: [délai]
Si aucune imagerie: examen « Aucune imagerie indiquée » avec vues « — », Indication: Non indiqué à ce stade selon données disponibles, Délai recommandé: —. Une demande par fence si plusieurs examens.

\`\`\`Reference_aux_Specialistes_[Specialty]\`\`\`
Texte interne exactement:
5.4. Références aux Spécialistes
[Spécialité] [Sexe, âge si disponibles], [symptômes et durée], [antécédents pertinents], [traitements en cours], référé(e) pour: [objectif]
Délai recommandé: [délai]
Toujours au moins un bloc; sinon utiliser l'étiquette \`Reference_aux_Specialistes_Aucune\` avec le format ci-dessus et « Aucune référence indiquée à ce stade » ; Délai: —.

\`\`\`Work_Leave_Certificate\`\`\`
Dates spécifiques: début = aujourd'hui; fin = aujourd'hui + durée; si non fourni: +72h (afficher les dates). Justification médicale concise.

\`\`\`Workplace_Modifications\`\`\`
Recommandations concrètes d'aménagement du poste.

\`\`\`Insurance_Documentation\`\`\`
Diagnostic/mécanisme, impact fonctionnel, traitement en place, dates d'arrêt, pronostic.

\`\`\`Telemedicine_NeedsInPersonEvaluation\`\`\`
1) Ouvrir par la phrase imposée sur la limite de la téléconsultation.
2) Expliquer ce qui ne peut pas être fait à distance (examen, signes vitaux, imagerie, bilans).
3) Citer des **catégories** d'examens (neurologique, infectieux, organique, métabolique, mécanique, circulatoire, etc.) sans nommer de diagnostics.
4) Terminer par la phrase imposée pour la préparation du résumé de triage.

\`\`\`Patient_Message\`\`\`
Message destiné directement au patient, contenu uniquement (aucune date, aucun nom, aucune signature, aucune mention de l'étiquette). Le texte est en français naturel, prêt à être copié-collé.

Lignes directrices:
- Français uniquement. Utiliser seulement les variables fournies. Pas d'indication de manque.
- Chaque bloc est autonome, propre, prêt à copier.
- Imagerie et références: ne jamais utiliser URGENT/NON URGENT; toujours « Délai recommandé ».
- Les prescriptions sont complètes et prêtes à l'emploi.
- L'arrêt de travail calcule automatiquement la fin par défaut à 72h avec dates précises.
- Ton clinique, naturel, concis; télémedecine empathique et explicative.
- Pour Patient_Message: toujours en bloc unique avec label uniquement dans le fence, texte direct à l'intérieur.`;

    const userPrompt = `Transcris cette consultation médicale avec les informations suivantes:

Patient ID: ${patientId}
Sexe: ${Gender}
Âge: ${Age}
Motif de consultation: ${ChiefComplaint}
Début des symptômes: ${SymptomOnset}
Déclencheur: ${Trigger}
Localisation: ${Location}
Description: ${Description}
Facteurs aggravants: ${AggravatingFactors}
Facteurs soulageants: ${RelievingFactors}
Sévérité: ${Severity}
Évolution: ${Evolution}
Symptômes associés: ${AssociatedSymptoms}
Traitements tentés: ${TreatmentsTried}
Réponse au traitement: ${TreatmentResponse}
Conditions chroniques: ${ChronicConditions}
Allergies médicamenteuses: ${MedicationAllergies}
Grossesse/Allaitement: ${PregnancyBreastfeeding}
Autres notes: ${OtherNotes}

Génère tous les blocs médicaux en français selon les spécifications exactes.`;

    // Generate the comprehensive medical transcription
    const aiResponse = await aiClient.generateCompletion([
      { role: "user", content: userPrompt }
    ], systemPrompt);

    // Parse the AI response to extract each medical block
    const blocks = parseMedicalBlocks(aiResponse);

    // Generate HTML report similar to instanthpi-medical
    const currentDate = new Date().toLocaleDateString('fr-CA');
    const htmlReport = generateHTMLReport(patientId, variables, blocks, currentDate);

    res.json({
      htmlReport,
      blocks: {
        hpiConfirmationSummary: blocks.hpiConfirmationSummary,
        followUpQuestions: blocks.followUpQuestions,
        superSpartanSAP: blocks.superSpartanSAP,
        medicationsReadyToUse: blocks.medicationsReadyToUse,
        labWorks: blocks.labWorks,
        imagerieMedicale: blocks.imagerieMedicale,
        referenceSpecialistes: blocks.referenceSpecialistes,
        workLeaveCertificate: blocks.workLeaveCertificate,
        workplaceModifications: blocks.workplaceModifications,
        insuranceDocumentation: blocks.insuranceDocumentation,
        telemedicineNeedsInPerson: blocks.telemedicineNeedsInPerson,
        patientMessage: blocks.patientMessage,
      }
    });

  } catch (error: any) {
    console.error("Error generating HTML report:", error);
    res.status(500).json({ error: "Failed to generate HTML report" });
  }
});

// Generate HTML report similar to instanthpi-medical structure
function generateHTMLReport(patientId: string, variables: any, blocks: any, currentDate: string) {
  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>instantHPI Note - ${patientId}</title>
    <style>
        .copy-btn {
            background-color: #3498db;
            color: white;
            border: none;
            padding: 5px 12px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 12px;
            margin-left: 10px;
            transition: all 0.3s;
            position: relative;
            top: -2px;
        }
        
        .copy-btn:hover {
            background-color: #2980b9;
        }
        
        .copy-btn.copied {
            background-color: #27ae60;
        }
        
        .section-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        
        .section-title {
            flex-grow: 1;
        }
    </style>
    <script>
        function copySection(sectionId) {
            const section = document.getElementById(sectionId);
            const textToCopy = section.innerText || section.textContent;
            
            // Create a temporary textarea
            const textarea = document.createElement('textarea');
            textarea.value = textToCopy;
            textarea.style.position = 'fixed';
            textarea.style.left = '-9999px';
            document.body.appendChild(textarea);
            
            // Select and copy
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            
            // Update button text
            const button = event.target;
            const originalText = button.innerHTML;
            button.innerHTML = '✓ Copié!';
            button.classList.add('copied');
            
            setTimeout(() => {
                button.innerHTML = originalText;
                button.classList.remove('copied');
            }, 2000);
        }
    </script>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">

<h2 style="color: #2c3e50; text-align: center;">instantHPI Note - ${patientId}</h2>
<h3 style="color: #34495e; text-align: center;">${variables.Age} ans · ${variables.Gender} · ${currentDate}</h3>

<hr style="border: 2px solid #3498db; margin: 20px 0;">

${blocks.hpiConfirmationSummary ? `
<div class="section-header">
    <h3 class="section-title" style="color: #34495e;">1. HPI Confirmation Summary</h3>
    <button class="copy-btn" onclick="copySection('hpi')">📋 Copier</button>
</div>
<div id="hpi">
<p>${blocks.hpiConfirmationSummary}</p>
</div>
<hr style="border: 1px solid #ddd; margin: 20px 0;">
` : ''}

${blocks.followUpQuestions ? `
<div class="section-header">
    <h3 class="section-title" style="color: #34495e;">2. Questions de Suivi</h3>
    <button class="copy-btn" onclick="copySection('questions')">📋 Copier</button>
</div>
<div id="questions">
<pre style="white-space: pre-line; font-family: inherit;">${blocks.followUpQuestions}</pre>
</div>
<hr style="border: 1px solid #ddd; margin: 20px 0;">
` : ''}

${blocks.superSpartanSAP ? `
<div class="section-header">
    <h3 class="section-title" style="color: #34495e;">3. Super Spartan SAP</h3>
    <button class="copy-btn" onclick="copySection('sap')">📋 Copier</button>
</div>
<div id="sap">
<pre style="white-space: pre-line; font-family: inherit;">${blocks.superSpartanSAP}</pre>
</div>
<hr style="border: 1px solid #ddd; margin: 20px 0;">
` : ''}

${blocks.medicationsReadyToUse ? `
<div class="section-header">
    <h3 class="section-title" style="color: #34495e;">4. Médicaments Prêts à l'Emploi</h3>
    <button class="copy-btn" onclick="copySection('medications')">📋 Copier</button>
</div>
<div id="medications">
<pre style="white-space: pre-line; font-family: inherit;">${blocks.medicationsReadyToUse}</pre>
</div>
<hr style="border: 1px solid #ddd; margin: 20px 0;">
` : ''}

${blocks.labWorks ? `
<div class="section-header">
    <h3 class="section-title" style="color: #34495e;">5. Analyses de Laboratoire</h3>
    <button class="copy-btn" onclick="copySection('lab')">📋 Copier</button>
</div>
<div id="lab">
<pre style="white-space: pre-line; font-family: inherit;">${blocks.labWorks}</pre>
</div>
<hr style="border: 1px solid #ddd; margin: 20px 0;">
` : ''}

${blocks.imagerieMedicale ? `
<div class="section-header">
    <h3 class="section-title" style="color: #34495e;">6. Imagerie Médicale</h3>
    <button class="copy-btn" onclick="copySection('imagerie')">📋 Copier</button>
</div>
<div id="imagerie">
<pre style="white-space: pre-line; font-family: inherit;">${blocks.imagerieMedicale}</pre>
</div>
<hr style="border: 1px solid #ddd; margin: 20px 0;">
` : ''}

${blocks.referenceSpecialistes ? `
<div class="section-header">
    <h3 class="section-title" style="color: #34495e;">7. Références aux Spécialistes</h3>
    <button class="copy-btn" onclick="copySection('references')">📋 Copier</button>
</div>
<div id="references">
<pre style="white-space: pre-line; font-family: inherit;">${blocks.referenceSpecialistes}</pre>
</div>
<hr style="border: 1px solid #ddd; margin: 20px 0;">
` : ''}

${blocks.workLeaveCertificate ? `
<div class="section-header">
    <h3 class="section-title" style="color: #34495e;">8. Certificat d'Arrêt de Travail</h3>
    <button class="copy-btn" onclick="copySection('workleave')">📋 Copier</button>
</div>
<div id="workleave">
<pre style="white-space: pre-line; font-family: inherit;">${blocks.workLeaveCertificate}</pre>
</div>
<hr style="border: 1px solid #ddd; margin: 20px 0;">
` : ''}

${blocks.workplaceModifications ? `
<div class="section-header">
    <h3 class="section-title" style="color: #34495e;">9. Modifications du Lieu de Travail</h3>
    <button class="copy-btn" onclick="copySection('workplace')">📋 Copier</button>
</div>
<div id="workplace">
<pre style="white-space: pre-line; font-family: inherit;">${blocks.workplaceModifications}</pre>
</div>
<hr style="border: 1px solid #ddd; margin: 20px 0;">
` : ''}

${blocks.insuranceDocumentation ? `
<div class="section-header">
    <h3 class="section-title" style="color: #34495e;">10. Documentation d'Assurance</h3>
    <button class="copy-btn" onclick="copySection('insurance')">📋 Copier</button>
</div>
<div id="insurance">
<pre style="white-space: pre-line; font-family: inherit;">${blocks.insuranceDocumentation}</pre>
</div>
<hr style="border: 1px solid #ddd; margin: 20px 0;">
` : ''}

${blocks.telemedicineNeedsInPerson ? `
<div class="section-header">
    <h3 class="section-title" style="color: #34495e;">11. Télémédecine - Besoin d'Évaluation en Personne</h3>
    <button class="copy-btn" onclick="copySection('telemedicine')">📋 Copier</button>
</div>
<div id="telemedicine">
<pre style="white-space: pre-line; font-family: inherit;">${blocks.telemedicineNeedsInPerson}</pre>
</div>
<hr style="border: 1px solid #ddd; margin: 20px 0;">
` : ''}

${blocks.patientMessage ? `
<div class="section-header">
    <h3 class="section-title" style="color: #34495e;">12. Message au Patient</h3>
    <button class="copy-btn" onclick="copySection('patient')">📋 Copier</button>
</div>
<div id="patient">
<pre style="white-space: pre-line; font-family: inherit;">${blocks.patientMessage}</pre>
</div>
` : ''}

</body>
</html>`;
}

export default router;
