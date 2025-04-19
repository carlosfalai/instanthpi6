import OpenAI from "openai";

// Initialize OpenAI API
// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Analyzes an image to verify if it's a RAMQ health insurance card
 * @param base64Image Base64 encoded image string
 * @returns Object with verification result and confidence level
 */
export async function verifyRAMQCard(base64Image: string): Promise<{ 
  isValid: boolean; 
  confidence: number;
  message: string;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a document verification system specifically trained to identify Quebec's RAMQ health insurance cards. Analyze the provided image and determine if it is a valid RAMQ card."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please analyze this image and tell me if it appears to be a valid RAMQ (Régie de l'assurance maladie du Québec) health insurance card. Respond with a JSON object that includes 'isValid' (boolean), 'confidence' (number between 0-1), and 'message' (string with your assessment)."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ],
        },
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    // Ensure we have all required fields
    return {
      isValid: result.isValid === true,
      confidence: typeof result.confidence === 'number' ? result.confidence : 0,
      message: result.message || "Unable to verify RAMQ card"
    };
  } catch (error) {
    console.error("Error verifying RAMQ card:", error);
    return {
      isValid: false,
      confidence: 0,
      message: "Error analyzing the image"
    };
  }
}

/**
 * Extracts information from a RAMQ card image
 * @param base64Image Base64 encoded image string
 * @returns Object with extracted RAMQ information
 */
export async function extractRAMQInfo(base64Image: string): Promise<{
  name?: string;
  ramqNumber?: string;
  expirationDate?: string;
  success: boolean;
  message: string;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a document information extraction system specialized in RAMQ health insurance cards from Quebec. Extract key information from the provided card image."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract the following information from this RAMQ card: name, RAMQ number, and expiration date. Format your response as a JSON object with fields 'name', 'ramqNumber', 'expirationDate', 'success' (boolean), and 'message'."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ],
        },
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      name: result.name,
      ramqNumber: result.ramqNumber,
      expirationDate: result.expirationDate,
      success: result.success === true,
      message: result.message || "Information extracted successfully"
    };
  } catch (error) {
    console.error("Error extracting RAMQ info:", error);
    return {
      success: false,
      message: "Error extracting information from the image"
    };
  }
}