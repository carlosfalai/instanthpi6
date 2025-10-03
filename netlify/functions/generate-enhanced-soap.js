// Enhanced SOAP note generation - no database dependency needed

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  try {
    const { patient_id, hpi_summary, patient_answers, triage_result } = JSON.parse(event.body || "{}");

    if (!patient_id || !hpi_summary || !patient_answers) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Missing required fields" })
      };
    }

    // Generate enhanced SOAP note
    const enhancedSoapNote = generateEnhancedSoapNote(hpi_summary, patient_answers, triage_result);
    
    // Generate doctor HPI summary with patient clarifications
    const doctorHpiSummary = generateDoctorHpiSummary(hpi_summary, patient_answers);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        enhanced_soap_note: enhancedSoapNote,
        doctor_hpi_summary: doctorHpiSummary
      })
    };

  } catch (error) {
    console.error('Error generating enhanced SOAP note:', error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Internal server error" })
    };
  }
};

function generateEnhancedSoapNote(hpiSummary, patientAnswers, triageResult) {
  const answersText = Object.entries(patientAnswers)
    .map(([index, answer]) => `Q${parseInt(index) + 1}: ${answer}`)
    .join('\n');

  return `RAPPORT MÉDICAL COMPLET - PATIENT ID: ${triageResult?.patient_id || 'N/A'}

=== HISTOIRE DE LA MALADIE ACTUELLE (HMA) ===
${hpiSummary}

=== CLARIFICATIONS DU PATIENT ===
${answersText}

=== ÉVALUATION DE TRIAGE ===
Niveau de priorité: ${triageResult?.triage_level || 'N/A'}
Score d'urgence: ${triageResult?.urgency_score || 'N/A'}/10
Raisonnement: ${triageResult?.reasoning || 'N/A'}
Action recommandée: ${triageResult?.recommended_action || 'N/A'}

=== PLAN DE SOINS PROPOSÉ ===
1. Évaluation médicale immédiate requise
2. Investigations complémentaires selon l'évaluation
3. Suivi médical approprié selon le niveau de triage
4. Éducation du patient sur les signes d'alarme

=== RECOMMANDATIONS POUR LE MÉDECIN ===
- Vérifier les signes vitaux
- Évaluer la douleur selon l'échelle numérique
- Considérer les antécédents médicaux mentionnés
- Planifier le suivi selon la priorité établie

=== INFORMATIONS DE CONTACT ===
Patient ID: ${triageResult?.patient_id || 'N/A'}
Date de génération: ${new Date().toLocaleDateString('fr-CA')}
Système InstantHPI - Rapport généré automatiquement`;
}

function generateDoctorHpiSummary(hpiSummary, patientAnswers) {
  const clarifications = Object.entries(patientAnswers)
    .filter(([_, answer]) => answer && answer.trim())
    .map(([index, answer]) => `Clarification ${parseInt(index) + 1}: ${answer}`)
    .join(' ');

  return `${hpiSummary} ${clarifications ? `Clarifications supplémentaires: ${clarifications}` : ''}`;
}
