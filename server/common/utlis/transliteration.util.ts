import Sanscript from '@indic-transliteration/sanscript';

/**
 * Safely transliterates Latin/ITRANS text to Devanagari.
 * - Never throws
 * - Returns null if input is empty or invalid
 * - Trims whitespace
 */
export function transliterateToDevanagari(
  text?: string | null
): string | null {
  if (!text) return null;

  const cleaned = text.trim();
  if (!cleaned) return null;

  try {
    return Sanscript.t(cleaned, 'itrans', 'devanagari');
  } catch (err) {
    // Fail silently — transliteration should never break business logic
    return null;
  }
}
