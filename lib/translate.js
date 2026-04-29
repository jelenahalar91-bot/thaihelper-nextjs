/**
 * Google Cloud Translation API v2 wrapper.
 * Translates text between languages, primarily for message translation.
 */

const TRANSLATE_URL = 'https://translation.googleapis.com/language/translate/v2';

export async function translateText(text, targetLang, sourceLang = null) {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;

  if (!apiKey) {
    console.warn('GOOGLE_TRANSLATE_API_KEY not set, skipping translation');
    return null;
  }

  if (!text?.trim()) return null;

  // Short-circuit if source equals target
  if (sourceLang && sourceLang === targetLang) return text;

  try {
    const body = {
      q: text,
      target: targetLang,
      format: 'text',
    };
    if (sourceLang) body.source = sourceLang;

    const response = await fetch(`${TRANSLATE_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error('Translation API error:', response.status, await response.text());
      return null;
    }

    const result = await response.json();
    const translation = result.data?.translations?.[0];

    return {
      translatedText: translation?.translatedText || null,
      detectedSourceLanguage: translation?.detectedSourceLanguage || sourceLang,
    };
  } catch (err) {
    console.error('Translation failed:', err.message);
    return null;
  }
}

// Thai Unicode block — used to detect Thai-script names at registration.
// Name romanization uses a Thai-specific prefix trick (see romanizeThaiName)
// so we keep this narrow detector even though `hasForeignScript` is broader.
const THAI_SCRIPT_RE = /[\u0E00-\u0E7F]/;

export function hasThaiScript(text) {
  return THAI_SCRIPT_RE.test(text || '');
}

// Scripts beyond Latin that we want to auto-translate for English-reading
// employers. Covers SEA (Thai, Burmese, Khmer, Lao), CJK, Korean, Indic
// (Devanagari/Bengali/Tamil), Arabic and Cyrillic — basically anything an
// English speaker can't read. Latin-with-diacritics (Vietnamese, Tagalog,
// Spanish, etc.) is intentionally NOT included; English readers can usually
// puzzle through those.
const FOREIGN_SCRIPT_RE = /[\u0400-\u04FF\u0600-\u06FF\u0900-\u097F\u0980-\u09FF\u0B80-\u0BFF\u0E00-\u0E7F\u0E80-\u0EFF\u1000-\u109F\u1780-\u17FF\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF]/;

export function hasForeignScript(text) {
  return FOREIGN_SCRIPT_RE.test(text || '');
}

/**
 * If `text` contains Thai script, romanize it and return "Romanized (ไทย)".
 * Otherwise return the input unchanged. Lets English-reading employers see a
 * readable name while preserving the original for Thai speakers. Falls back
 * to the original input if the Translate API is unavailable.
 *
 * Why: Google Translate translates Thai words by meaning ("ประคอง" → "support"),
 * not phonetics. Wrapping the name in "ชื่อของฉันคือ {name}" ("My name is …")
 * forces Google to treat it as a proper noun and transliterate instead.
 */
export async function romanizeThaiName(text) {
  const trimmed = (text || '').trim();
  if (!trimmed || !hasThaiScript(trimmed)) return trimmed;

  const result = await translateText(`ชื่อของฉันคือ ${trimmed}`, 'en', 'th');
  const raw = result?.translatedText?.trim();
  if (!raw) return trimmed;

  // Strip the "My name is " prefix and any trailing period.
  const romanized = raw.replace(/^my name is\s*/i, '').replace(/[.!?]+$/, '').trim();
  if (!romanized || romanized === trimmed) return trimmed;

  return `${romanized} (${trimmed})`;
}

/**
 * If `text` contains a non-English script (Thai, Burmese, Khmer, Lao, CJK,
 * Korean, Indic, Arabic, Cyrillic, ...) translate it to English and return
 * the translation. Otherwise return null (caller should fall back to
 * original). Source language is auto-detected by Google so this works for
 * any of the supported scripts without us having to know which one upfront.
 */
export async function translateForeignText(text) {
  const trimmed = (text || '').trim();
  if (!trimmed || !hasForeignScript(trimmed)) return null;

  const result = await translateText(trimmed, 'en'); // auto-detect source
  const translated = result?.translatedText?.trim();
  if (!translated || translated === trimmed) return null;
  return translated;
}

// Back-compat alias — older imports may still reference this name.
export const translateThaiText = translateForeignText;

/**
 * Detect the language of a text string.
 */
export async function detectLanguage(text) {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey || !text?.trim()) return null;

  try {
    const response = await fetch(
      `https://translation.googleapis.com/language/translate/v2/detect?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: text }),
      }
    );

    if (!response.ok) return null;

    const result = await response.json();
    return result.data?.detections?.[0]?.[0]?.language || null;
  } catch {
    return null;
  }
}
