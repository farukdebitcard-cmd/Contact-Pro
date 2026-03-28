/**
 * Normalizes a Bangladeshi phone number.
 * Rules:
 * - Remove spaces, dashes, symbols
 * - Always convert to local format: 01XXXXXXXXX (11 digits)
 * - Examples:
 *   - +88017XXXXXXXX -> 017XXXXXXXX
 *   - 88017XXXXXXXX -> 017XXXXXXXX
 *   - 17XXXXXXXX -> 017XXXXXXXX
 *   - 017XXXXXXXX -> 017XXXXXXXX
 */
export function normalizePhone(phone: string): string {
  if (!phone) return "";

  // 1. Remove all non-digit characters
  let clean = phone.replace(/\D/g, "");

  // 2. Handle prefixes
  if (clean.startsWith("8801") && clean.length === 13) {
    clean = clean.substring(2); // Remove '88'
  } else if (clean.startsWith("1") && clean.length === 10) {
    clean = "0" + clean; // Prepend '0'
  }

  // 3. Validate length and prefix
  if (clean.length === 11 && clean.startsWith("01")) {
    return clean;
  }

  // If it doesn't match the standard BD format after cleaning,
  // return the cleaned version anyway (or original if preferred, but cleaned is safer for storage)
  return clean;
}

export function formatPhone(phone: string): string {
  const norm = normalizePhone(phone);
  if (norm.length === 11) {
    return `${norm.slice(0, 5)} ${norm.slice(5)}`;
  }
  return phone;
}
