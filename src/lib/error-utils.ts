
// Helper functions for error handling

/**
 * Formats a Supabase error message for user display
 */
export function formatSupabaseError(error: any): string {
  if (!error) return 'Unknown error occurred';
  
  // Handle specific Supabase error codes
  if (error.code === 'PGRST301') {
    return 'Database row not found';
  }
  
  if (error.code === 'PGRST116') {
    return 'You need to be logged in to access this resource';
  }
  
  if (error.code === '23505') {
    return 'This record already exists';
  }
  
  if (error.code === '42P01') {
    return 'Database table not found. The application may need to be updated.';
  }
  
  if (error.code === '42501') {
    return 'You don\'t have permission to perform this action';
  }
  
  // Return the error message if available, otherwise a generic message
  return error.message || 'An error occurred while connecting to the database';
}

/**
 * Logs an error with consistent formatting
 */
export function logError(context: string, error: any): void {
  console.error(`[${context}] Error:`, error);
  
  if (error.details) {
    console.error(`[${context}] Details:`, error.details);
  }
  
  if (error.hint) {
    console.error(`[${context}] Hint:`, error.hint);
  }
}