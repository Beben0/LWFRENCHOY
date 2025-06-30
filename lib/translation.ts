// In-memory cache (session-level)
const translationCache = new Map<string, string>();

// Load persisted cache from localStorage (browser only)
if (typeof window !== "undefined") {
  try {
    const raw = window.localStorage.getItem("lt_cache_v1");
    if (raw) {
      const obj = JSON.parse(raw) as Record<string, string>;
      Object.entries(obj).forEach(([k, v]) => translationCache.set(k, v));
    }
  } catch (err) {
    console.warn("Failed to parse translation cache", err);
  }
}

function persistCache() {
  if (typeof window === "undefined") return;
  const obj: Record<string, string> = {};
  translationCache.forEach((v, k) => {
    obj[k] = v;
  });
  try {
    window.localStorage.setItem("lt_cache_v1", JSON.stringify(obj));
  } catch (_) {
    // ignore quota errors
  }
}

export interface TranslateOptions {
  sourceLang?: string; // default: 'fr'
  targetLang: string; // e.g. 'en', 'es', 'de', etc.
}

/**
 * Translate a short text string using a self-hosted LibreTranslate instance (default endpoint: http://localhost:5000/translate).
 * Falls back to the original text if the request fails.
 */
export async function translate(
  text: string,
  { sourceLang = "fr", targetLang }: TranslateOptions
): Promise<string> {
  // Do not translate empty strings or whitespace-only strings.
  if (!text.trim()) return text;

  // If source and target are the same, short-circuit.
  if (sourceLang === targetLang) return text;

  const cacheKey = `${sourceLang}:${targetLang}:${text}`;
  const cached = translationCache.get(cacheKey);
  if (cached) return cached;

  // LibreTranslate API endpoint (self-hosted)
  const endpoint =
    process.env.LIBRETRANSLATE_ENDPOINT || "http://localhost:5005/translate";

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: text,
        source: sourceLang,
        target: targetLang,
        format: "text",
      }),
    });

    if (!res.ok) throw new Error(`LibreTranslate API responded ${res.status}`);

    const json = (await res.json()) as { translatedText: string };
    const translated = json.translatedText ?? text;
    translationCache.set(cacheKey, translated);
    persistCache();
    return translated;
  } catch (err) {
    console.error("Translation error:", err);
    return text; // Fallback to original
  }
}
