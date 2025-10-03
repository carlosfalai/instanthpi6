import crypto from 'crypto';

// Get encryption key from environment or generate one for development
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');

if (!process.env.ENCRYPTION_KEY) {
  console.warn('⚠️ WARNING: ENCRYPTION_KEY not set in environment. Using temporary key for development.');
}

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Derives a key from the master key using PBKDF2
 */
function deriveKey(salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    salt,
    100000,
    KEY_LENGTH,
    'sha512'
  );
}

/**
 * Encrypts a string value using AES-256-GCM
 * @param text - The plain text to encrypt
 * @returns Base64 encoded encrypted data with salt, iv, and auth tag
 */
export function encryptCredential(text: string): string {
  if (!text) {
    throw new Error('Cannot encrypt empty text');
  }

  try {
    // Generate random salt and IV
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Derive key from master key and salt
    const key = deriveKey(salt);
    
    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Encrypt the text
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get authentication tag
    const authTag = cipher.getAuthTag();
    
    // Combine salt + iv + authTag + encrypted data
    const combined = Buffer.concat([
      salt,
      iv,
      authTag,
      Buffer.from(encrypted, 'hex')
    ]);
    
    // Return as base64
    return combined.toString('base64');
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt credential');
  }
}

/**
 * Decrypts an encrypted credential
 * @param encryptedData - Base64 encoded encrypted data
 * @returns Decrypted plain text
 */
export function decryptCredential(encryptedData: string): string {
  if (!encryptedData) {
    throw new Error('Cannot decrypt empty data');
  }

  try {
    // Convert from base64
    const combined = Buffer.from(encryptedData, 'base64');
    
    // Extract components
    const salt = combined.subarray(0, SALT_LENGTH);
    const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const authTag = combined.subarray(
      SALT_LENGTH + IV_LENGTH,
      SALT_LENGTH + IV_LENGTH + TAG_LENGTH
    );
    const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    
    // Derive key from master key and salt
    const key = deriveKey(salt);
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    // Decrypt the data
    let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt credential');
  }
}

/**
 * Validates that encrypted data can be decrypted
 */
export function validateEncryptedData(encryptedData: string): boolean {
  try {
    decryptCredential(encryptedData);
    return true;
  } catch {
    return false;
  }
}

/**
 * Masks a credential for display (shows first 4 and last 4 characters)
 */
export function maskCredential(credential: string, visibleChars: number = 4): string {
  if (!credential || credential.length <= visibleChars * 2) {
    return '••••••••';
  }
  
  const start = credential.substring(0, visibleChars);
  const end = credential.substring(credential.length - visibleChars);
  const middle = '•'.repeat(Math.min(credential.length - (visibleChars * 2), 20));
  
  return `${start}${middle}${end}`;
}
