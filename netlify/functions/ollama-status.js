const axios = require("axios");

const OLLAMA_BASE_URL = process.env.OLLAMA_URL || "https://ollama.instanthpi.ca";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.1:8b";

exports.handler = async () => {
  try {
    const r = await axios.get(`${OLLAMA_BASE_URL}/api/tags`, { timeout: 5000 });
    const models = r.data?.models || [];
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "online",
        url: OLLAMA_BASE_URL,
        available_models: models.map((m) => m.name),
        current_model: OLLAMA_MODEL,
        model_available: models.some((m) => m.name === OLLAMA_MODEL),
      }),
    };
  } catch (e) {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "offline", url: OLLAMA_BASE_URL }),
    };
  }
};
