/**
 * Input validation utilities
 */

/**
 * Validate weight input
 * Returns the parsed weight or null if invalid
 */
export function validateWeight(input: string): number | null {
  const trimmed = input.trim();
  const weight = parseFloat(trimmed);

  // Check if it's a valid number
  if (isNaN(weight)) {
    return null;
  }

  // Check if it's positive
  if (weight <= 0) {
    return null;
  }

  // Check reasonable range (0.1 to 10000 grams)
  if (weight < 0.1 || weight > 10000) {
    return null;
  }

  return weight;
}

/**
 * Validate album size
 * Returns true if size is valid (1-10 photos)
 */
export function validateAlbumSize(photoCount: number): boolean {
  return photoCount >= 1 && photoCount <= 10;
}

/**
 * Validate token format
 * Returns true if token format is valid
 */
export function validateToken(token: string): boolean {
  // Token should be alphanumeric and reasonable length
  return /^[a-zA-Z0-9_-]{10,100}$/.test(token);
}
