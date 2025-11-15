const Anthropic = require("@anthropic-ai/sdk");

exports.handler = async (event) => {
  // CORS headers
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
    const { diagnosis_name, specialty, example_template, api_key } = JSON.parse(event.body);

    if (!diagnosis_name || !api_key) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing required fields: diagnosis_name, api_key" }),
      };
    }

    const anthropic = new Anthropic({
      apiKey: api_key,
    });

    const exampleSection = example_template ? `\n\nHere's an example template format to follow:\n${JSON.stringify(example_template, null, 2)}` : '';

    const prompt = `You are a medical AI assistant helping physicians create treatment plan templates.

Create a comprehensive treatment plan template for: ${diagnosis_name}
${specialty ? `Specialty: ${specialty}` : ''}
${exampleSection}

The template should include plan items organized by categories:
- Medications (with dosages and frequencies)
- Laboratory tests
- Imaging studies
- Specialist referrals
- Patient education
- Follow-up instructions
- Work modifications (if applicable)
- Other interventions specific to this diagnosis

Return ONLY a JSON object with this exact format:
{
  "template_name": "Treatment Plan for ${diagnosis_name}",
  "diagnosis_name": "${diagnosis_name}",
  "specialty": "${specialty || 'General Medicine'}",
  "plan_items": [
    {
      "category": "Medications",
      "item": "Medication name with dosage and frequency",
      "details": "Additional details or instructions",
      "priority": "high|medium|low",
      "selected": false
    },
    {
      "category": "Laboratory",
      "item": "Specific test name",
      "details": "Reason or timing",
      "priority": "high|medium|low",
      "selected": false
    }
  ]
}

Be specific, evidence-based, and clinically appropriate. Include 8-15 relevant plan items.`;

    const message = await anthropic.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const responseText = message.content[0].text;
    
    // Parse the JSON response
    let template;
    try {
      // Extract JSON from response (in case there's surrounding text)
      const jsonMatch = responseText.match(/\{\s*"template_name"[\s\S]*\}\s*$/);
      if (jsonMatch) {
        template = JSON.parse(jsonMatch[0]);
      } else {
        template = JSON.parse(responseText);
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", responseText);
      throw new Error("AI response was not in expected JSON format");
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        template: template,
        raw_response: responseText,
      }),
    };
  } catch (error) {
    console.error("AI template generation error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || "Failed to generate template",
      }),
    };
  }
};

