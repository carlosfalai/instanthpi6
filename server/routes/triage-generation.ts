import { Router, Request, Response } from "express";
import axios from "axios";
import { db } from "../db";

const router = Router();

// Care locations mapping - EXACTLY as specified
const careLocations = {
  P1: "911 (Transport en ambulance requis)",
  P2: "Urgence hospitalière (Transport personnel ou ambulance)",
  P3: "Urgence hospitalière ou urgence mineure",
  P4: "Clinique sans rendez-vous",
  P5: "Clinique avec rendez-vous ou télémédecine",
};

// Generate full triage assessment with P1-P5 priority
router.post("/generate-triage", async (req: Request, res: Response) => {
  try {
    const {
      patientId,
      email,
      age,
      gender,
      chiefComplaint,
      onset,
      trigger,
      location,
      quality,
      aggravatingFactors,
      relievingFactors,
      severity,
      timePattern,
      associatedSymptoms,
      treatmentsTried,
      treatmentResponse,
      chronicConditions,
      allergies,
      pregnancyBreastfeeding,
      otherNotes,
    } = req.body;

    // Check if we already have a cached triage for this patient
    const existingTriage = await checkCachedTriage(patientId);
    if (existingTriage) {
      return res.json(existingTriage);
    }

    const isMinor = age < 18;
    const addressee = isMinor ? "parent/tuteur" : "patient";

    // Build the prompt for Llama
    const prompt = buildTriagePrompt({
      age,
      gender,
      chiefComplaint,
      onset,
      trigger,
      location,
      quality,
      aggravatingFactors,
      relievingFactors,
      severity,
      timePattern,
      associatedSymptoms,
      treatmentsTried,
      treatmentResponse,
      chronicConditions,
      allergies,
      pregnancyBreastfeeding,
      otherNotes,
      isMinor,
    });

    // Call local Llama server through Cloudflare tunnel
    const llamaResponse = await callLlamaServer(prompt);

    // Parse the response and extract sections
    const triageResult = parseTriageResponse(llamaResponse, {
      age,
      gender,
      chiefComplaint,
      severity,
      isMinor,
    });

    // Cache the result
    await cacheTriageResult(patientId, triageResult);

    res.json(triageResult);
  } catch (error) {
    console.error("Error generating triage:", error);
    // Fallback to basic triage
    const fallbackTriage = generateFallbackTriage(req.body);
    res.json(fallbackTriage);
  }
});

// Build the comprehensive triage prompt
function buildTriagePrompt(data: any): string {
  const {
    age,
    gender,
    chiefComplaint,
    onset,
    trigger,
    location,
    quality,
    aggravatingFactors,
    relievingFactors,
    severity,
    timePattern,
    associatedSymptoms,
    treatmentsTried,
    treatmentResponse,
    chronicConditions,
    allergies,
    pregnancyBreastfeeding,
    otherNotes,
    isMinor,
  } = data;

  return `Tu es un système de triage médical québécois. Tu dois créer un document complet pour aider ${
    isMinor ? "les parents d'un enfant" : "un patient"
  } qui se présentera aux soins.

IMPORTANT: 
- Tu ne dois JAMAIS donner de diagnostic ou de plan de traitement
- TOUT le document doit être en FRANÇAIS uniquement
- Génère les sections suivantes EXACTEMENT:

Données patient:
- Âge: ${age} ans ${isMinor ? "(PATIENT MINEUR - s'adresser aux parents)" : ""}
- Sexe: ${gender}
- Motif de consultation: ${chiefComplaint}

OPQRST:
- Début: ${onset || "Non spécifié"}
- Déclencheur: ${trigger || "Non spécifié"}
- Qualité: ${quality || "Non spécifié"}
- Région/Radiation: ${location || "Non spécifié"}
- Sévérité: ${severity}/10
- Évolution temporelle: ${timePattern || "Non spécifié"}

Informations supplémentaires:
- Facteurs aggravants: ${aggravatingFactors || "Non spécifié"}
- Facteurs soulageants: ${relievingFactors || "Non spécifié"}
- Symptômes associés: ${associatedSymptoms || "Non spécifié"}
- Tentatives de traitement: ${treatmentsTried || "Non spécifié"}
- Efficacité des traitements: ${treatmentResponse || "Non spécifié"}
- Conditions chroniques: ${chronicConditions || "Non spécifié"}
- Allergies: ${allergies || "Non spécifié"}
- Grossesse/Allaitement: ${pregnancyBreastfeeding || "Non spécifié"}
- Autres informations: ${otherNotes || "Non spécifié"}

GÉNÈRE EN FORMAT JSON avec ces sections EXACTES:

1. "soapNote": Note médicale concise en français
   Format: "S: Pt [âge]a [H/F] se plaint de [plainte]. Dlr [qualité] région [région] depuis [début]. Intensité [X]/10. [facteurs]. Évolution: [temporel]. [symptômes associés]. [Tx essayé si applicable]."

2. "priorityLevel": Un niveau entre P1 et P5 basé sur:
   - P1: Urgences vitales (douleur thoracique, détresse respiratoire, etc.)
   - P2: Urgences graves (fractures, douleur intense 8-10/10, etc.)
   - P3: Urgences modérées (nécessite évaluation aujourd'hui)
   - P4: Non urgent (peut attendre 24-48h)
   - P5: Consultation régulière

3. "whereToConsult": Où consulter selon le niveau (utilise EXACTEMENT ces textes):
   - P1: "911 (Transport en ambulance requis)"
   - P2: "Urgence hospitalière (Transport personnel ou ambulance)"
   - P3: "Urgence hospitalière ou urgence mineure"
   - P4: "Clinique sans rendez-vous"
   - P5: "Clinique avec rendez-vous ou télémédecine"

4. "priorityExplanation": Explication détaillée pourquoi ce niveau pour ce cas

5. "followupQuestions": Tableau de EXACTEMENT 10 questions pertinentes à préparer

6. "warningSignals": Liste des signaux d'alarme à surveiller

7. "careAdvice": Conseils en attendant les soins (sans traitement médical)

8. "hpiConfirmation": Message de confirmation du résumé pour le patient commençant par "Juste pour confirmer avec vous avant de continuer..."

Retourne UNIQUEMENT un objet JSON valide.`;
}

// Call local Llama server
async function callLlamaServer(prompt: string): Promise<any> {
  try {
    // Call through Cloudflare tunnel to local Llama server
    const response = await axios.post(
      process.env.LLAMA_SERVER_URL || "http://192.168.2.219:3003/api/generate",
      {
        model: "llama3:18b",
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          max_tokens: 4000,
        },
      },
      {
        timeout: 30000,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.response || response.data;
  } catch (error) {
    console.error("Error calling Llama server:", error);
    throw error;
  }
}

// Parse the triage response
function parseTriageResponse(response: any, patientData: any): any {
  try {
    // If response is already JSON
    if (typeof response === "object") {
      return formatTriageResult(response, patientData);
    }

    // Try to parse JSON from string response
    let jsonStr = response;
    if (typeof response === "string") {
      // Extract JSON if embedded in text
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }

      const parsed = JSON.parse(jsonStr);
      return formatTriageResult(parsed, patientData);
    }
  } catch (error) {
    console.error("Error parsing triage response:", error);
    // Return fallback
    return generateFallbackTriage(patientData);
  }
}

// Format the triage result with HTML
function formatTriageResult(triageData: any, patientData: any): any {
  const priorityLevel = triageData.priorityLevel || "P3";
  const priorityClass = priorityLevel.toLowerCase();

  // Generate the full HTML document
  const htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document de Préparation aux Soins - ${priorityLevel}</title>
    <style>
        body { 
            font-family: Arial, sans-serif;
            line-height: 1.6; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px;
            color: #333;
        }
        .priority-badge {
            display: inline-block;
            padding: 10px 20px;
            border-radius: 5px;
            font-weight: bold;
            font-size: 24px;
            margin: 10px 0;
        }
        .p1 { background-color: #dc3545; color: white; }
        .p2 { background-color: #fd7e14; color: white; }
        .p3 { background-color: #ffc107; color: black; }
        .p4 { background-color: #28a745; color: white; }
        .p5 { background-color: #17a2b8; color: white; }
        .warning-box {
            background-color: #f8d7da;
            border: 1px solid #f5c6cb;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
        }
        .info-box {
            background-color: #d1ecf1;
            border: 1px solid #bee5eb;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
        }
        .hpi-box {
            background-color: #e8f4f8;
            border-left: 4px solid #17a2b8;
            padding: 15px;
            margin: 20px 0;
        }
        .question-item {
            margin: 15px 0;
            padding: 10px;
            background-color: #f8f9fa;
            border-radius: 5px;
        }
        .answer-space {
            width: 100%;
            min-height: 40px;
            border-bottom: 1px solid #333;
            margin: 10px 0 30px 0;
        }
        .care-explanation {
            background-color: #fff3cd;
            border: 2px solid #ffeaa7;
            border-radius: 5px;
            padding: 20px;
            margin: 20px 0;
        }
        .donation-box {
            background-color: #e8f5e9;
            border: 2px solid #4caf50;
            border-radius: 5px;
            padding: 20px;
            margin: 30px 0;
            text-align: center;
        }
        h1, h2, h3 { color: #2c3e50; }
        .red-flags {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 10px;
            margin: 10px 0;
        }
        ul { margin: 10px 0; padding-left: 25px; }
        li { margin: 5px 0; }
    </style>
</head>
<body>
    <div class="warning-box">
        <h2>⚠️ AVERTISSEMENT IMPORTANT</h2>
        <p>Ce document ne remplace pas une consultation médicale. Il s'agit uniquement d'un outil de préparation pour faciliter votre rencontre avec un professionnel de santé. En cas d'urgence ou si vos symptômes s'aggravent, consultez immédiatement un médecin ou composez le 911.</p>
    </div>
    
    <h1>Document de Préparation aux Soins Médicaux</h1>
    
    <div class="info-box">
        <h3>Introduction</h3>
        <p>Ce document a été préparé pour faciliter votre consultation médicale. Il contient un résumé structuré de vos symptômes et des questions importantes que l'équipe médicale pourrait vous poser.</p>
        <p><strong>Confirmation du résumé de votre cas:</strong> ${triageData.hpiConfirmation || ""}</p>
    </div>
    
    <div class="hpi-box">
        <h2>Histoire de la Maladie Actuelle (HPI)</h2>
        <p><strong>Note médicale:</strong></p>
        <p>${triageData.soapNote || ""}</p>
        
        <h3>Questions à compléter avant la consultation:</h3>
        ${(triageData.followupQuestions || [])
          .map(
            (q: string, i: number) => `
            <div class="question-item">
                <p><strong>Question ${i + 1}:</strong> ${q}</p>
                <div class="answer-space"></div>
            </div>
        `
          )
          .join("")}
    </div>
    
    <div class="info-box">
        <h2>Niveau de Priorité: ${priorityLevel}</h2>
        <div class="priority-badge ${priorityClass}">${priorityLevel}</div>
        <p><strong>Où consulter:</strong> ${triageData.whereToConsult || careLocations[priorityLevel]}</p>
    </div>
    
    <div class="care-explanation">
        <h2>Explication des niveaux de priorité:</h2>
        <ul>
            <li><strong>P1:</strong> ${careLocations["P1"]}</li>
            <li><strong>P2:</strong> ${careLocations["P2"]}</li>
            <li><strong>P3:</strong> ${careLocations["P3"]}</li>
            <li><strong>P4:</strong> ${careLocations["P4"]}</li>
            <li><strong>P5:</strong> ${careLocations["P5"]}</li>
        </ul>
        <h3>Pourquoi ${priorityLevel} pour votre cas:</h3>
        <p>${triageData.priorityExplanation || ""}</p>
    </div>
    
    <div class="red-flags">
        <h2>⚠️ Signaux d'Alarme - Consultez Immédiatement</h2>
        <ul>
            ${(triageData.warningSignals || []).map((signal: string) => `<li>${signal}</li>`).join("")}
        </ul>
    </div>
    
    <div class="info-box">
        <h2>Conseils en Attendant les Soins</h2>
        <ul>
            ${(triageData.careAdvice || []).map((advice: string) => `<li>${advice}</li>`).join("")}
        </ul>
    </div>
    
    <div class="donation-box">
        <h3>💙 Soutenez ce Service Gratuit</h3>
        <p>Ce service de triage médical est entièrement gratuit. Vos donations nous aident à maintenir ce service accessible à tous.</p>
        <p>Avec seulement 20$, nous pouvons traiter environ 100 cas.</p>
    </div>
</body>
</html>`;

  return {
    priorityLevel,
    whereToConsult: triageData.whereToConsult || careLocations[priorityLevel],
    soapNote: triageData.soapNote,
    followupQuestions: triageData.followupQuestions || [],
    warningSignals: triageData.warningSignals || [],
    careAdvice: triageData.careAdvice || [],
    priorityExplanation: triageData.priorityExplanation,
    hpiConfirmation: triageData.hpiConfirmation,
    htmlContent,
    sections: {
      hpi: triageData.soapNote,
      questions: triageData.followupQuestions,
      priority: priorityLevel,
      warnings: triageData.warningSignals,
      advice: triageData.careAdvice,
    },
  };
}

// Generate fallback triage if AI fails
function generateFallbackTriage(patientData: any): any {
  const severity = parseInt(patientData.severity) || 5;
  let priorityLevel = "P3";

  // Simple priority logic based on severity
  if (severity >= 9) priorityLevel = "P1";
  else if (severity >= 7) priorityLevel = "P2";
  else if (severity >= 5) priorityLevel = "P3";
  else if (severity >= 3) priorityLevel = "P4";
  else priorityLevel = "P5";

  const isMinor = patientData.age < 18;
  const genderAbbr = patientData.gender?.toLowerCase().includes("f") ? "F" : "H";

  const soapNote = `S: Pt ${patientData.age}a ${genderAbbr} se plaint de ${patientData.chiefComplaint}. Intensité ${severity}/10. Évolution: ${patientData.timePattern || "stable"}.`;

  const followupQuestions = [
    "Depuis quand les symptômes ont-ils exactement commencé?",
    "Y a-t-il des facteurs qui déclenchent ou aggravent les symptômes?",
    "Les symptômes sont-ils constants ou intermittents?",
    "Y a-t-il eu des changements récents dans votre état de santé général?",
    "Avez-vous remarqué d'autres symptômes accompagnant le problème principal?",
    "Quels médicaments prenez-vous actuellement?",
    "Y a-t-il des antécédents familiaux de conditions similaires?",
    "Comment ces symptômes affectent-ils vos activités quotidiennes?",
    "Y a-t-il eu des événements stressants récents dans votre vie?",
    "Avez-vous des préoccupations spécifiques concernant ces symptômes?",
  ];

  return formatTriageResult(
    {
      priorityLevel,
      whereToConsult: careLocations[priorityLevel],
      soapNote,
      followupQuestions,
      warningSignals: [
        "Aggravation soudaine des symptômes",
        "Nouvelle difficulté à respirer",
        "Douleur thoracique",
        "Confusion ou changement de l'état mental",
        "Saignement important",
      ],
      careAdvice: [
        "Restez au repos dans une position confortable",
        "Restez hydraté(e)",
        "Notez tout changement dans les symptômes",
        "Apportez ce document complété et tous les médicaments actuels",
      ],
      priorityExplanation: `Basé sur une sévérité de ${severity}/10 et les symptômes rapportés, ce niveau de priorité est approprié.`,
      hpiConfirmation: `Vous consultez pour ${patientData.chiefComplaint}. Est-ce que ce résumé est exact?`,
    },
    patientData
  );
}

// Check for cached triage result
async function checkCachedTriage(patientId: string): Promise<any> {
  try {
    // Check database for existing triage within last 24 hours
    const result = await db
      .selectFrom("triage_cache")
      .selectAll()
      .where("patient_id", "=", patientId)
      .where("created_at", ">", new Date(Date.now() - 24 * 60 * 60 * 1000))
      .orderBy("created_at", "desc")
      .limit(1)
      .executeTakeFirst();

    if (result) {
      return JSON.parse(result.triage_data as string);
    }
    return null;
  } catch (error) {
    console.error("Error checking cached triage:", error);
    return null;
  }
}

// Cache triage result
async function cacheTriageResult(patientId: string, triageData: any): Promise<void> {
  try {
    await db
      .insertInto("triage_cache")
      .values({
        patient_id: patientId,
        triage_data: JSON.stringify(triageData),
        priority_level: triageData.priorityLevel,
        created_at: new Date(),
      })
      .execute();
  } catch (error) {
    console.error("Error caching triage result:", error);
  }
}

export { router };
