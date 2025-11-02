import { useState, useEffect } from 'react';
import { useTranslation } from '../contexts/TranslationContext';

/**
 * Hook to automatically translate text when language changes
 * Usage: const translatedText = useTranslatedText("Hello World");
 */
export const useTranslatedText = (text: string): string => {
  const { t, currentLanguage } = useTranslation();
  const [translatedText, setTranslatedText] = useState(text);

  useEffect(() => {
    let isMounted = true;

    const translateText = async () => {
      const result = await t(text);
      if (isMounted) {
        setTranslatedText(result);
      }
    };

    translateText();

    return () => {
      isMounted = false;
    };
  }, [text, currentLanguage, t]);

  return translatedText;
};

/**
 * Hook to translate multiple texts at once
 */
export const useTranslatedTexts = (texts: string[]): string[] => {
  const { currentLanguage } = useTranslation();
  const [translatedTexts, setTranslatedTexts] = useState(texts);

  useEffect(() => {
    let isMounted = true;

    const translateTexts = async () => {
      if (currentLanguage === 'en') {
        setTranslatedTexts(texts);
        return;
      }

      const promises = texts.map(text => 
        import('../services/translationService').then(({ translationService }) => 
          translationService.translate(text, currentLanguage)
        )
      );
      
      const results = await Promise.all(promises);
      if (isMounted) {
        setTranslatedTexts(results);
      }
    };

    translateTexts();

    return () => {
      isMounted = false;
    };
  }, [texts.join(','), currentLanguage]);

  return translatedTexts;
};
