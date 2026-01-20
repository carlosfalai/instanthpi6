const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

exports.handler = async (event) => {
  // Set CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json",
  };

  // Handle preflight requests
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: "CORS preflight" }),
    };
  }

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const { patient_id } = event.queryStringParameters || {};

    if (!patient_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Patient ID is required" }),
      };
    }

    // Query consultations table
    const { data: consultations, error: consultationsError } = await supabase
      .from("consultations")
      .select("*")
      .eq("patient_id", patient_id)
      .order("created_at", { ascending: false });

    if (consultationsError) {
      console.error("Error fetching consultations:", consultationsError);
    }

    // Query patient_answers table
    const { data: patientAnswers, error: answersError } = await supabase
      .from("patient_answers")
      .select("*")
      .eq("patient_id", patient_id)
      .order("created_at", { ascending: false });

    if (answersError) {
      console.error("Error fetching patient answers:", answersError);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        patient_id,
        consultations: consultations || [],
        patient_answers: patientAnswers || [],
        found:
          (consultations && consultations.length > 0) ||
          (patientAnswers && patientAnswers.length > 0),
      }),
    };
  } catch (error) {
    console.error("Error in api-patient-data:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
