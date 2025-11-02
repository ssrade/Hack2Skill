import React, { createContext, useContext, useState, useEffect } from 'react';
import { translationService } from '../services/translationService';

interface TranslationContextType {
  currentLanguage: string;
  setLanguage: (lang: string) => void;
  t: (text: string) => Promise<string>;
  tSync: (text: string) => string;
  inline: (text: string) => string;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<string>(() => {
    return translationService.getLanguage();
  });

  const [translationCache, setTranslationCache] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    translationService.setLanguage(currentLanguage);
  }, [currentLanguage]);

  const setLanguage = (lang: string) => {
    setCurrentLanguage(lang);
    translationService.setLanguage(lang);
    // Clear cache when language changes
    translationService.clearCache();
    setTranslationCache({});
  };

  // Async translation
  const t = async (text: string): Promise<string> => {
    if (currentLanguage === 'en') return text;
    
    const cacheKey = `${text}_${currentLanguage}`;
    if (translationCache[cacheKey]) {
      return translationCache[cacheKey];
    }

    const translated = await translationService.translate(text, currentLanguage);
    setTranslationCache(prev => ({ ...prev, [cacheKey]: translated }));
    return translated;
  };

  // Sync translation (returns original if not in cache)
  const tSync = (text: string): string => {
    if (currentLanguage === 'en') return text;
    
    const cacheKey = `${text}_${currentLanguage}`;
    return translationCache[cacheKey] || text;
  };

  // Inline translation for JSX - triggers background translation
  const inline = (text: string): string => {
    if (currentLanguage === 'en') return text;
    
    const cacheKey = `${text}_${currentLanguage}`;
    
    // Return cached translation if available
    if (translationCache[cacheKey]) {
      return translationCache[cacheKey];
    }
    
    // Trigger translation in background and return original text
    t(text); // This will cache it for next render
    
    return text; // Return original while translating
  };

  return (
    <TranslationContext.Provider value={{ currentLanguage, setLanguage, t, tSync, inline }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within TranslationProvider');
  }
  return context;
};
