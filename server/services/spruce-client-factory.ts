import { SpruceHealthClient } from '../spruce-health-client';
import { supabase } from '../supabase-server';
import { decryptCredential } from '../utils/encryption';

// Cache for Spruce clients to avoid repeated decryption
const clientCache = new Map<string, SpruceHealthClient>();

interface DoctorSpruceCredentials {
  spruce_access_id?: string;
  spruce_api_key?: string;
}

/**
 * Fetches doctor's Spruce credentials from database
 */
async function getDoctorSpruceCredentials(userId: string): Promise<DoctorSpruceCredentials | null> {
  try {
    const { data, error } = await supabase
      .from('doctor_credentials')
      .select('spruce_access_id, spruce_api_key')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No credentials found
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching Spruce credentials:', error);
    return null;
  }
}

/**
 * Gets configured Spruce client for a doctor
 * 
 * @param userId - The doctor's user ID
 * @param forceRefresh - Skip cache and get fresh credentials
 * @returns SpruceHealthClient instance or throws if not configured
 */
export async function getSpruceClient(
  userId: string,
  forceRefresh: boolean = false
): Promise<SpruceHealthClient> {
  // Check cache first unless force refresh
  if (!forceRefresh && clientCache.has(userId)) {
    return clientCache.get(userId)!;
  }

  // Fetch doctor's credentials
  const credentials = await getDoctorSpruceCredentials(userId);

  if (!credentials || !credentials.spruce_access_id || !credentials.spruce_api_key) {
    throw new Error('SPRUCE_CREDENTIALS_NOT_CONFIGURED');
  }

  // Decrypt credentials
  const accessId = decryptCredential(credentials.spruce_access_id);
  const apiKey = decryptCredential(credentials.spruce_api_key);

  if (!accessId || !apiKey) {
    throw new Error('SPRUCE_CREDENTIALS_DECRYPT_FAILED');
  }

  // Create Spruce client
  const client = new SpruceHealthClient({
    bearerToken: apiKey,
    maxRetries: 3,
    retryDelay: 1000,
  });

  // Cache the client
  clientCache.set(userId, client);

  return client;
}

/**
 * Clears cached Spruce client for a user
 * Useful after credential updates
 */
export function clearSpruceClientCache(userId: string): void {
  clientCache.delete(userId);
}

/**
 * Checks if doctor has Spruce credentials configured
 */
export async function hasSpruceCredentials(userId: string): Promise<boolean> {
  try {
    const credentials = await getDoctorSpruceCredentials(userId);
    return !!(credentials && credentials.spruce_access_id && credentials.spruce_api_key);
  } catch {
    return false;
  }
}
