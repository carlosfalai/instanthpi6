/**
 * Safely parses and formats errors for API responses.
 * This prevents sensitive information from being exposed to clients
 * while providing useful debugging information.
 */
export function parseError(error: unknown): string {
  if (!error) return 'Unknown error occurred';
  
  // Handle Error objects
  if (error instanceof Error) {
    return error.message;
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }
  
  // Handle objects with message properties
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  
  // Fallback for other error types
  try {
    return JSON.stringify(error);
  } catch {
    return 'Error occurred but could not be serialized';
  }
}