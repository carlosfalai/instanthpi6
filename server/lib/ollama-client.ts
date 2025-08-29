import axios from "axios";

export interface OllamaConfig {
  url: string;
  model: string;
  timeout?: number;
}

export interface OllamaResponse {
  response: string;
  model: string;
  created_at: string;
  done: boolean;
}

export class OllamaClient {
  private config: OllamaConfig;

  constructor(config: OllamaConfig) {
    this.config = {
      timeout: 30000,
      ...config,
    };
  }

  async generate(prompt: string, system?: string): Promise<string> {
    try {
      console.log(`Calling Ollama at ${this.config.url} with model ${this.config.model}`);

      const fullPrompt = system ? `${system}\n\n${prompt}` : prompt;

      const response = await axios.post(
        `${this.config.url}/api/generate`,
        {
          model: this.config.model,
          prompt: fullPrompt,
          stream: false,
          options: {
            temperature: 0.7,
            top_p: 0.9,
            seed: 42,
            num_predict: 2048,
          },
        },
        {
          timeout: this.config.timeout,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      return response.data.response || "";
    } catch (error: any) {
      console.error("Ollama generation error:", error.message);
      throw new Error(`Ollama generation failed: ${error.message}`);
    }
  }

  async chat(messages: Array<{ role: string; content: string }>): Promise<string> {
    try {
      const response = await axios.post(
        `${this.config.url}/api/chat`,
        {
          model: this.config.model,
          messages,
          stream: false,
          options: {
            temperature: 0.7,
            top_p: 0.9,
          },
        },
        {
          timeout: this.config.timeout,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      return response.data.message?.content || "";
    } catch (error: any) {
      console.error("Ollama chat error:", error.message);
      throw new Error(`Ollama chat failed: ${error.message}`);
    }
  }

  async listModels(): Promise<any[]> {
    try {
      const response = await axios.get(`${this.config.url}/api/tags`, {
        timeout: 5000,
      });
      return response.data.models || [];
    } catch (error: any) {
      console.error("Failed to list Ollama models:", error.message);
      return [];
    }
  }

  async health(): Promise<boolean> {
    try {
      await axios.get(`${this.config.url}/api/tags`, { timeout: 5000 });
      return true;
    } catch (error) {
      return false;
    }
  }
}
