const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const { patientId, variables } = JSON.parse(event.body);

    if (!patientId) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Patient ID is required" }),
      };
    }

    // Generate enhanced HPI confirmation summary after triage process
    const prompt = `You are a medical AI assistant. Generate a comprehensive enhanced HPI confirmation summary based on the triage process completed.

Patient Information:
Gender: ${variables.Gender || "Non spécifié"}
Age: ${variables.Age || "Non spécifié"}
Chief Complaint: ${variables.ChiefComplaint || "Non spécifié"}
Symptom Onset: ${variables.SymptomOnset || "Non spécifié"}
Trigger: ${variables.Trigger || "Non spécifié"}
Location: ${variables.Location || "Non spécifié"}
Description: ${variables.Description || "Non spécifié"}
Aggravating Factors: ${variables.AggravatingFactors || "Non spécifié"}
Relieving Factors: ${variables.RelievingFactors || "Non spécifié"}
Severity: ${variables.Severity || "Non spécifié"}
Evolution: ${variables.Evolution || "Non spécifié"}
Associated Symptoms: ${variables.AssociatedSymptoms || "Non spécifié"}
Treatments Tried: ${variables.TreatmentsTried || "Non spécifié"}
Treatment Response: ${variables.TreatmentResponse || "Non spécifié"}
Chronic Conditions: ${variables.ChronicConditions || "Non spécifié"}
Medication Allergies: ${variables.MedicationAllergies || "Non spécifié"}
Pregnancy/Breastfeeding: ${variables.PregnancyBreastfeeding || "Non spécifié"}
Other Notes: ${variables.OtherNotes || "Non spécifié"}

CRITICAL: Generate an enhanced HPI confirmation summary that incorporates the triage process results. This should be a comprehensive, refined summary that the doctor can use for their 12-section medical report generation.

The output should be a single, well-structured HPI confirmation summary in French that incorporates all the triage findings and provides a complete clinical picture for the doctor's further processing.

Return ONLY the enhanced HPI confirmation summary text, no formatting or code.`;

    let aiResponse = "";

    // Try OpenAI first
    if (process.env.OPENAI_API_KEY) {
      try {
        const openai = require("openai");
        const client = new openai.OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });

        const completion = await client.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content:
                "You are a medical AI assistant specializing in French medical documentation. Generate comprehensive, accurate medical summaries.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          max_tokens: 2000,
          temperature: 0.3,
        });

        aiResponse = completion.choices[0].message.content;
      } catch (error) {
        console.error("OpenAI error:", error);
        throw new Error("AI service unavailable");
      }
    } else {
      throw new Error("AI service not configured");
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: true,
        enhancedHpiSummary: aiResponse,
        patientId: patientId,
      }),
    };
  } catch (error) {
    console.error("Error generating enhanced HPI summary:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Failed to generate enhanced HPI summary",
        details: error.message,
      }),
    };
  }
};
