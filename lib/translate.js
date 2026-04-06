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
