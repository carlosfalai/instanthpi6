import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "../db";
import { aiSettings } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface AIClientConfig {
  provider: "openai" | "claude";
  model: string;
  apiKey: string;
}

export interface AIClient {
  generateCompletion: (
    messages: Array<{ role: string; content: string }>,
    systemPrompt?: string
  ) => Promise<string>;
  provider: string;
  model: string;
}

// OpenAI Client implementation
class OpenAIClient implements AIClient {
  private client: OpenAI;
  public provider = "openai";
  public model: string;

  constructor(apiKey: string, model: string) {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async generateCompletion(
    messages: Array<{ role: string; content: string }>,
    systemPrompt?: string
  ): Promise<string> {
    const messageArray = systemPrompt
      ? [{ role: "system" as const, content: systemPrompt }, ...messages]
      : messages;

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: messageArray as any,
      temperature: 0.1,
      max_tokens: 2000,
    });

    return response.choices[0]?.message?.content || "";
  }
}

// Claude Client implementation
class ClaudeClient implements AIClient {
  private client: Anthropic;
  public provider = "claude";
  public model: string;

  constructor(apiKey: string, model: string) {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async generateCompletion(
    messages: Array<{ role: string; content: string }>,
    systemPrompt?: string
  ): Promise<string> {
    // Convert messages to Claude format
    const claudeMessages = messages.map((msg) => ({
      role: msg.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: msg.content,
    }));

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 2000,
      system: systemPrompt || "You are a helpful medical AI assistant.",
      messages: claudeMessages as any,
    });

    return response.content[0]?.type === "text" ? response.content[0].text : "";
  }
}

// Get user's AI configuration from database
export async function getUserAIConfig(userId: number): Promise<AIClientConfig | null> {
  try {
    const settings = await db
      .select()
      .from(aiSettings)
      .where(eq(aiSettings.userId, userId))
      .limit(1);

    if (settings.length === 0) {
      return null;
    }

    const userSettings = settings[0];
    const provider = userSettings.preferredAiProvider as "openai" | "claude";

    if (provider === "openai") {
      if (!userSettings.openaiApiKey) {
        throw new Error("OpenAI API key not configured for this user");
      }
      return {
        provider: "openai",
        model: userSettings.openaiModel || "gpt-4o",
        apiKey: userSettings.openaiApiKey,
      };
    } else if (provider === "claude") {
      if (!userSettings.claudeApiKey) {
        throw new Error("Claude API key not configured for this user");
      }
      return {
        provider: "claude",
        model: userSettings.claudeModel || "claude-3-5-haiku-20241022",
        apiKey: userSettings.claudeApiKey,
      };
    }

    return null;
  } catch (error) {
    console.error("Error getting user AI config:", error);
    return null;
  }
}

// Create AI client based on user configuration
export async function createUserAIClient(userId: number): Promise<AIClient | null> {
  try {
    const config = await getUserAIConfig(userId);

    if (!config) {
      // Fallback to environment variables if user config not found
      const openaiKey = process.env.OPENAI_API_KEY;
      const claudeKey = process.env.ANTHROPIC_API_KEY;

      if (openaiKey) {
        return new OpenAIClient(openaiKey, "gpt-4o");
      } else if (claudeKey) {
        return new ClaudeClient(claudeKey, "claude-3-5-haiku-20241022");
      }

      throw new Error("No AI configuration found for user and no fallback environment variables");
    }

    if (config.provider === "openai") {
      return new OpenAIClient(config.apiKey, config.model);
    } else if (config.provider === "claude") {
      return new ClaudeClient(config.apiKey, config.model);
    }

    return null;
  } catch (error) {
    console.error("Error creating user AI client:", error);
    return null;
  }
}

// Get available models for each provider
export function getAvailableModels(): { openai: string[]; claude: string[] } {
  return {
    openai: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-4", "gpt-3.5-turbo"],
    claude: [
      "claude-3-5-sonnet-20241022",
      "claude-3-5-haiku-20241022",
      "claude-3-opus-20240229",
      "claude-3-sonnet-20240229",
      "claude-3-haiku-20240307",
    ],
  };
}
