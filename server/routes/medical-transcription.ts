import { Router, Request, Response } from "express";

const router = Router();

// Medical transcription AI endpoint - generates 5 French sections
router.post("/medical-transcription", async (req: Request, res: Response) => {
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

    // Generate the 5 sections matching the provided examples exactly

    // 1. HPI confirmation message to the patient in French (matching example format)
    let confirmation = "Juste pour confirmer avec vous avant de continuer; vous consultez pour ";
    confirmation += ChiefComplaint ? ChiefComplaint.toLowerCase() : "[symptôme]";

    if (SymptomOnset && SymptomOnset !== "Non spécifié") {
      confirmation += ` apparu ${SymptomOnset.toLowerCase()}`;
    }

    if (Location && Location !== "Non spécifié") {
      confirmation += `, localisé ${Location.toLowerCase()}`;
    }

    if (Description && Description !== "Non spécifié") {
      confirmation += `, ${Description.toLowerCase()}`;
    }

    if (AggravatingFactors && AggravatingFactors !== "Non spécifié") {
      confirmation += ` aggravé par ${AggravatingFactors.toLowerCase()}`;
    }

    if (RelievingFactors && RelievingFactors !== "Non spécifié") {
      confirmation += `, soulagé par ${RelievingFactors.toLowerCase()}`;
    }

    if (Severity && Severity !== "Non spécifié") {
      confirmation += `, sévérité ${Severity}/10`;
    }

    if (Evolution && Evolution !== "Non spécifié") {
      confirmation += `, évolution ${Evolution.toLowerCase()}`;
    }

    if (AssociatedSymptoms && AssociatedSymptoms !== "Non spécifié") {
      confirmation += `, symptômes associés: ${AssociatedSymptoms.toLowerCase()}`;
    }

    if (TreatmentsTried && TreatmentsTried !== "Non spécifié") {
      confirmation += `, traitements essayés: ${TreatmentsTried.toLowerCase()}`;
    }

    if (TreatmentResponse && TreatmentResponse !== "Non spécifié") {
      confirmation += `, réponse: ${TreatmentResponse.toLowerCase()}`;
    }

    if (ChronicConditions && ChronicConditions !== "Non spécifié") {
      confirmation += `, antécédents: ${ChronicConditions.toLowerCase()}`;
    }

    if (MedicationAllergies && MedicationAllergies !== "Non spécifié") {
      confirmation += `, allergies: ${MedicationAllergies.toLowerCase()}`;
    }

    // Only mention pregnancy/breastfeeding if Gender is female and status is provided
    if (
      Gender &&
      Gender.toLowerCase().includes("f") &&
      PregnancyBreastfeeding &&
      PregnancyBreastfeeding !== "Non spécifié"
    ) {
      confirmation += `, grossesse/allaitement: ${PregnancyBreastfeeding.toLowerCase()}`;
    }

    confirmation += ". Est-ce que ce résumé est exact ?";

    // 2. SOAP Note in streamlined format matching examples
    let soap = "S : Pt consulte pour ";
    soap += ChiefComplaint ? ChiefComplaint.toLowerCase() : "[symptôme]";

    if (SymptomOnset && SymptomOnset !== "Non spécifié") {
      soap += `; début ${SymptomOnset.toLowerCase()}`;
    }

    if (Location && Location !== "Non spécifié") {
      soap += `; localisation ${Location.toLowerCase()}`;
    }

    if (Description && Description !== "Non spécifié") {
      soap += `; ${Description.toLowerCase()}`;
    }

    if (Trigger && Trigger !== "Non spécifié") {
      soap += `; déclenché par ${Trigger.toLowerCase()}`;
    }

    if (AggravatingFactors && AggravatingFactors !== "Non spécifié") {
      soap += `; aggravé par ${AggravatingFactors.toLowerCase()}`;
    }

    if (RelievingFactors && RelievingFactors !== "Non spécifié") {
      soap += `; soulagé par ${RelievingFactors.toLowerCase()}`;
    }

    if (Severity && Severity !== "Non spécifié") {
      soap += `; sévérité ${Severity}/10`;
    }

    if (Evolution && Evolution !== "Non spécifié") {
      soap += `; évolution ${Evolution.toLowerCase()}`;
    }

    if (AssociatedSymptoms && AssociatedSymptoms !== "Non spécifié") {
      soap += `; assoc: ${AssociatedSymptoms.toLowerCase()}`;
    }

    if (TreatmentsTried && TreatmentsTried !== "Non spécifié") {
      soap += `; traitements: ${TreatmentsTried.toLowerCase()}`;
    }

    if (TreatmentResponse && TreatmentResponse !== "Non spécifié") {
      soap += `; réponse: ${TreatmentResponse.toLowerCase()}`;
    }

    if (Gender && Gender !== "Non spécifié") {
      const genderText = Gender.toLowerCase().includes("f") ? "Femme" : "Homme";
      soap += `; ${genderText}`;
      if (Age && Age !== "Non spécifié") {
        soap += `, ${Age} ans`;
      }
    }

    if (ChronicConditions && ChronicConditions !== "Non spécifié") {
      soap += `; antécédents: ${ChronicConditions.toLowerCase()}`;
    }

    if (MedicationAllergies && MedicationAllergies !== "Non spécifié") {
      soap += `; allergies: ${MedicationAllergies.toLowerCase()}`;
    }

    soap += "\nA : ";
    if (Severity && Severity !== "Non spécifié") {
      soap += `douleur ${Severity}/10, `;
    }
    if (Evolution && Evolution !== "Non spécifié") {
      soap += `évolution ${Evolution.toLowerCase()}, `;
    }
    if (AssociatedSymptoms && AssociatedSymptoms !== "Non spécifié") {
      soap += `assoc: ${AssociatedSymptoms.toLowerCase()}`;
    }

    soap += "\nP : poursuivre/ajuster selon réponse";
    if (TreatmentResponse && TreatmentResponse !== "Non spécifié") {
      soap += ` (« ${TreatmentResponse.toLowerCase()} »)`;
    }
    if (ChronicConditions && ChronicConditions !== "Non spécifié") {
      soap += `; tenir compte des antécédents (${ChronicConditions.toLowerCase()})`;
    }
    if (MedicationAllergies && MedicationAllergies !== "Non spécifié") {
      soap += `; éviter molécules allergènes (${MedicationAllergies.toLowerCase()})`;
    }

    // 3. Plan – Bullet Points matching example format
    let plan = "• Mesures: privilégier repos.\n";

    if (AggravatingFactors && AggravatingFactors !== "Non spécifié") {
      plan += `• Éviter: ${AggravatingFactors.toLowerCase()}.\n`;
    }

    if (TreatmentsTried && TreatmentsTried !== "Non spécifié") {
      plan += `• Traitements en cours/essayés: ${TreatmentsTried.toLowerCase()}.\n`;
    }

    if (TreatmentResponse && TreatmentResponse !== "Non spécifié") {
      plan += `• Réévaluer selon réponse: ${TreatmentResponse.toLowerCase()}.\n`;
    }

    if (ChronicConditions && ChronicConditions !== "Non spécifié") {
      plan += `• Adapter aux antécédents: ${ChronicConditions.toLowerCase()}.\n`;
    }

    if (MedicationAllergies && MedicationAllergies !== "Non spécifié") {
      plan += `• Allergies: éviter ${MedicationAllergies.toLowerCase()}.\n`;
    }

    // Add alert threshold based on severity
    const currentSeverity = Severity && Severity !== "Non spécifié" ? parseInt(Severity) : 5;
    const alertThreshold = Math.min(currentSeverity + 2, 10);
    plan += `• Seuil d'alerte: aggravation de la douleur (> ${alertThreshold}/10) ou nouveaux symptômes.`;

    // 4. Telemedicine note (matching the exact format from examples)
    const telemedicine =
      "Consultation réalisée en télémedecine avec votre accord : identité et localisation vérifiées au début de l'échange. L'examen clinique est limité à l'observation et à vos réponses, sans palpation, auscultation ni examens complémentaires immédiats. Certains motifs (douleurs intenses d'apparition brutale, détresse respiratoire, signes neurologiques aigus, traumatisme sévère, douleur thoracique avec malaise, saignements abondants, fièvre élevée persistante chez nourrisson, etc.) ne peuvent pas être pris en charge entièrement à distance. En cas de signes d'alerte ou d'aggravation, rendez-vous aux urgences ou appelez les services d'urgence. Sinon, une consultation présentielle vous sera proposée si nécessaire pour examen physique, imagerie ou bilans.";

    // 5. Follow-Up Questions – exactly 10 matching the examples
    const followup =
      "Depuis le début, la douleur ou le symptôme est-il constant ou par épisodes ?\nLa durée typique de chaque épisode et le moment de la journée où c'est pire ?\nUn lien clair avec un effort, un mouvement, la respiration, un repas ou une position ?\nY a-t-il une irradiation, engourdissement, faiblesse, ou étourdissements associés ?\nFièvre, frissons, perte de poids, ou sueurs nocturnes récemment ?\nAntécédents familiaux pertinents en lien avec ces symptômes ?\nQuelles médications ou produits prenez-vous actuellement (dose/fréquence) ?\nDes examens récents (prise de sang, imagerie) en rapport avec ce problème ?\nQu'est-ce qui vous inquiète le plus concernant ce symptôme ?\nVotre objectif principal pour la prise en charge aujourd'hui ?";

    return res.json({
      confirmation,
      soap,
      plan,
      telemedicine,
      followup,
    });
  } catch (error) {
    console.error("Medical transcription error:", error);
    return res.status(500).json({ error: "Failed to generate medical transcription" });
  }
});

export { router };
