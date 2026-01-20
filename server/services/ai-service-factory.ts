import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { supabase } from "../supabase-server";
import { decryptCredential } from "../utils/encryption";

// Cache for AI clients to avoid repeated decryption and instantiation
const clientCache = new Map<
  string,
  { client: OpenAI | Anthropic; provider: "openai" | "claude" }
>();

interface DoctorAICredentials {
  openai_api_key?: string;
  claude_api_key?: string;
  preferred_ai_provider?: "openai" | "claude" | "none";
}

/**
 * Fetches doctor's AI credentials from database
 */
async function getDoctorCredentials(userId: string): Promise<DoctorAICredentials | null> {
  try {
    const { data, error } = await supabase
      .from("doctor_credentials")
      .select("openai_api_key, claude_api_key, preferred_ai_provider")
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No credentials found
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error fetching doctor credentials:", error);
    return null;
  }
}

/**
 * Gets configured AI client (OpenAI or Claude) for a doctor
 * Returns the client and provider type
 *
 * @param userId - The doctor's user ID
 * @param forceRefresh - Skip cache and get fresh credentials
 * @returns Object with client and provider, or throws if not configured
 */
export async function getAIClient(
  userId: string,
  forceRefresh: boolean = false
): Promise<{ client: OpenAI | Anthropic; provider: "openai" | "claude" }> {
  // Check cache first unless force refresh
  if (!forceRefresh && clientCache.has(userId)) {
    return clientCache.get(userId)!;
  }

  // Fetch doctor's credentials
  const credentials = await getDoctorCredentials(userId);

  if (!credentials) {
    throw new Error("CREDENTIALS_NOT_CONFIGURED");
  }

  const { openai_api_key, claude_api_key, preferred_ai_provider } = credentials;

  // Determine which provider to use
  let provider: "openai" | "claude";
  let apiKey: string | undefined;

  if (preferred_ai_provider === "openai" && openai_api_key) {
    provider = "openai";
    apiKey = decryptCredential(openai_api_key);
  } else if (preferred_ai_provider === "claude" && claude_api_key) {
    provider = "claude";
    apiKey = decryptCredential(claude_api_key);
  } else if (openai_api_key) {
    // Fallback to OpenAI if available
    provider = "openai";
    apiKey = decryptCredential(openai_api_key);
  } else if (claude_api_key) {
    // Fallback to Claude if available
    provider = "claude";
    apiKey = decryptCredential(claude_api_key);
  } else {
    throw new Error("NO_AI_CREDENTIALS");
  }

  if (!apiKey) {
    throw new Error(`${provider.toUpperCase()}_KEY_DECRYPT_FAILED`);
  }

  // Create the appropriate client
  let client: OpenAI | Anthropic;

  if (provider === "openai") {
    client = new OpenAI({ apiKey });
  } else {
    client = new Anthropic({ apiKey });
  }

  // Cache the client
  const result = { client, provider };
  clientCache.set(userId, result);

  return result;
}

/**
 * Gets OpenAI client specifically
 * Throws if doctor doesn't have OpenAI configured
 */
export async function getOpenAIClient(userId: string): Promise<OpenAI> {
  const { client, provider } = await getAIClient(userId);

  if (provider !== "openai") {
    throw new Error("OPENAI_NOT_CONFIGURED");
  }

  return client as OpenAI;
}

/**
 * Gets Claude client specifically
 * Throws if doctor doesn't have Claude configured
 */
export async function getClaudeClient(userId: string): Promise<Anthropic> {
  const { client, provider } = await getAIClient(userId);

  if (provider !== "claude") {
    throw new Error("CLAUDE_NOT_CONFIGURED");
  }

  return client as Anthropic;
}

/**
 * Clears cached AI client for a user
 * Useful after credential updates
 */
export function clearAIClientCache(userId: string): void {
  clientCache.delete(userId);
}

/**
 * Checks if doctor has AI credentials configured
 */
export async function hasAICredentials(userId: string): Promise<boolean> {
  try {
    const credentials = await getDoctorCredentials(userId);
    return !!(credentials && (credentials.openai_api_key || credentials.claude_api_key));
  } catch {
    return false;
  }
}

/**
 * Gets system-wide AI client as fallback (uses env variables)
 * This should only be used for non-doctor-specific operations
 */
export function getSystemAIClient(): { client: OpenAI | Anthropic; provider: "openai" | "claude" } {
  const openaiKey = process.env.OPENAI_API_KEY;
  const claudeKey = process.env.ANTHROPIC_API_KEY;

  if (openaiKey) {
    return {
      client: new OpenAI({ apiKey: openaiKey }),
      provider: "openai",
    };
  } else if (claudeKey) {
    return {
      client: new Anthropic({ apiKey: claudeKey }),
      provider: "claude",
    };
  }

  throw new Error("NO_SYSTEM_AI_CREDENTIALS");
}
