import Sanscript from "sanscript";

/**
 * Transliterate English (ITRANS) text to Marathi (Devanagari).
 * Used for real-time input transliteration in forms.
 * 
 * @example
 * toMarathi("kumar") // returns "कुमार"
 */
export function toMarathi(text: string): string {
    if (!text) return "";
    return Sanscript.t(text, "itrans", "devanagari");
}

/**
 * Transliterate Devanagari text back to ITRANS (romanized).
 * Useful for search/filtering operations.
 */
export function toITRANS(text: string): string {
    if (!text) return "";
    return Sanscript.t(text, "devanagari", "itrans");
}
