const Anthropic = require("@anthropic-ai/sdk");

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const { 
      section_name,
      custom_request,
      patient_data,
      writing_style_template,
      api_key,
      api_provider = "claude"
    } = JSON.parse(event.body);

    if (!section_name || !api_key) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing required fields: section_name, api_key" }),
      };
    }

    // Build prompt with doctor's writing style template
    let prompt = `You are a medical AI assistant helping a physician generate professional medical documentation.

SECTION TO GENERATE: ${section_name}

${patient_data ? `PATIENT INFORMATION:
${JSON.stringify(patient_data, null, 2)}
` : ''}

${writing_style_template ? `PHYSICIAN'S WRITING STYLE PREFERENCES:
${writing_style_template.template_text}

${writing_style_template.example_text ? `EXAMPLE OF PREFERRED STYLE:
${writing_style_template.example_text}` : ''}

TONE: ${writing_style_template.tone || 'professional'}
` : ''}

${custom_request ? `SPECIFIC REQUEST FROM PHYSICIAN:
${custom_request}
` : ''}

Generate the ${section_name} section following the physician's style preferences and the specific request. 
Return ONLY the content text, no code, no markdown formatting, no explanations.
Be concise, clinically appropriate, and match the requested tone and style exactly.`;

    if (api_provider === "claude") {
      const anthropic = new Anthropic({ apiKey: api_key });
      
      const message = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 2048,
        messages: [{
          role: "user",
          content: prompt,
        }],
      });

      const generatedText = message.content[0].text;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          section: section_name,
          generated_text: generatedText,
          tokens_used: message.usage.input_tokens + message.usage.output_tokens,
        }),
      };
    } else {
      // OpenAI implementation would go here
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "OpenAI provider not yet implemented" }),
      };
    }

  } catch (error) {
    console.error("AI generation error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || "Failed to generate content",
      }),
    };
  }
};

