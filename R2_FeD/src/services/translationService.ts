// Translation Service using Google Cloud Translation API
// This translates everything on the frontend - UI text and RAG responses

const GOOGLE_TRANSLATE_API_KEY = import.meta.env.VITE_GOOGLE_TRANSLATE_API_KEY;
const TRANSLATE_API_URL = 'https://translation.googleapis.com/language/translate/v2';

export interface TranslationCache {
  [key: string]: string;
}

class TranslationService {
  private cache: TranslationCache = {};
  private currentLanguage: string = 'en';

  setLanguage(languageCode: string) {
    this.currentLanguage = languageCode;
    sessionStorage.setItem('preferredLanguage', languageCode);
  }

  getLanguage(): string {
    const stored = sessionStorage.getItem('preferredLanguage');
    return stored || this.currentLanguage;
  }

  async translate(text: string, targetLang?: string): Promise<string> {
    const target = targetLang || this.currentLanguage;
    
    // If already in target language, return as is
    if (target === 'en') return text;

    // Check cache
    const cacheKey = `${text}_${target}`;
    if (this.cache[cacheKey]) {
      return this.cache[cacheKey];
    }

    try {
      const response = await fetch(`${TRANSLATE_API_URL}?key=${GOOGLE_TRANSLATE_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          target: target,
          format: 'text'
        })
      });

      if (!response.ok) {
        console.error('Translation API error:', response.statusText);
        return text; // Fallback to original text
      }

      const data = await response.json();
      const translated = data.data.translations[0].translatedText;
      
      // Cache the result
      this.cache[cacheKey] = translated;
      
      return translated;
    } catch (error) {
      console.error('Translation error:', error);
      return text; // Fallback to original text
    }
  }

  async translateBatch(texts: string[], targetLang?: string): Promise<string[]> {
    const target = targetLang || this.currentLanguage;
    
    if (target === 'en') return texts;

    try {
      const response = await fetch(`${TRANSLATE_API_URL}?key=${GOOGLE_TRANSLATE_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: texts,
          target: target,
          format: 'text'
        })
      });

      if (!response.ok) {
        return texts; // Fallback
      }

      const data = await response.json();
      return data.data.translations.map((t: any) => t.translatedText);
    } catch (error) {
      console.error('Batch translation error:', error);
      return texts;
    }
  }

  clearCache() {
    this.cache = {};
  }
}

export const translationService = new TranslationService();

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
];
