// src/utils/swimStyleUtils.ts

/**
 * Formats swimming styles into a display string
 * Handles various input formats (array, string, undefined)
 * 
 * @param styles - Swimming styles as an array, string, or undefined
 * @returns A formatted string for display
 */
export const formatSwimmingStyles = (
  styles: string[] | string | undefined | null
): string => {
  // If it's already a string, return it
  if (typeof styles === 'string') {
    return styles;
  }
  
  // If it's an array, join it with commas
  if (Array.isArray(styles) && styles.length > 0) {
    return styles.join(", ");
  }
  
  // Default fallback
  return "לא זמין";
};

/**
 * Extracts a single swimming style for API calls
 * Typically used when booking lessons where only one style is needed
 * 
 * @param styles - Swimming styles as array or string
 * @returns A single swimming style string
 */
export const getSingleSwimmingStyle = (
  styles: string[] | string | undefined | null
): string => {
  // If it's an array, take the first element
  if (Array.isArray(styles) && styles.length > 0) {
    return styles[0];
  }
  
  // If it's a string with multiple comma-separated values, take the first one
  if (typeof styles === 'string' && styles.includes(',')) {
    return styles.split(',')[0].trim();
  }
  
  // If it's a simple string, return it
  if (typeof styles === 'string' && styles.trim() !== '') {
    return styles.trim();
  }
  
  // Default fallback
  return "חופש";
};