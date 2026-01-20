const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

exports.handler = async (event, context) => {
  // Handle CORS
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      },
      body: "",
    };
  }

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Content-Type": "application/json",
  };

  try {
    if (event.httpMethod === "GET") {
      // Get patient profile by ID
      const patientId = event.path.split("/").pop();

      const { data, error } = await supabase
        .from("patient_profiles")
        .select("*")
        .eq("id", patientId)
        .single();

      if (error) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: "Patient profile not found" }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data),
      };
    }

    if (event.httpMethod === "POST") {
      // Create or update patient profile
      const profileData = JSON.parse(event.body);

      const { data, error } = await supabase
        .from("patient_profiles")
        .upsert(profileData, { onConflict: "id" })
        .select()
        .single();

      if (error) {
        console.error("Error saving patient profile:", error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: "Failed to save patient profile" }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  } catch (error) {
    console.error("Error in patient-profile function:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
