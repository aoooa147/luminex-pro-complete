/**
 * Custom hook for language/i18n management
 * Handles language switching and translations
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { LANGUAGES } from '@/lib/utils/constants';
import { translations } from '@/lib/utils/translations';

export function useLanguage() {
  const [language, setLanguage] = useState('en');
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  // Memoize translation function
  const t = useMemo(() => {
    return (key: string, params?: Record<string, string | number>) => {
      let text = translations[language]?.[key] || translations['en'][key] || key;
      if (params) {
        Object.keys(params).forEach(param => {
          text = text.replace(`{${param}}`, String(params[param]));
        });
      }
      return text;
    };
  }, [language]);

  // Memoize active language metadata
  const activeLanguage = useMemo(() => {
    return LANGUAGES.find(l => l.code === language) || LANGUAGES[0];
  }, [language]);

  // Load saved language preference from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('preferredLanguage');
      if (savedLanguage && translations[savedLanguage]) {
        setLanguage(savedLanguage);
      } else {
        const browserLang = navigator.language.slice(0, 2);
        if (translations[browserLang]) {
          setLanguage(browserLang);
        }
      }
    }
  }, []);

  // Save language preference to localStorage
  const changeLanguage = useCallback((lang: string) => {
    if (translations[lang]) {
      setLanguage(lang);
      if (typeof window !== 'undefined') {
        localStorage.setItem('preferredLanguage', lang);
      }
    }
  }, []);

  // Close language menu when clicking outside
  useEffect(() => {
    if (!showLanguageMenu) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.language-menu')) {
        setShowLanguageMenu(false);
      }
    };
    
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 100);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showLanguageMenu]);

  return {
    language,
    activeLanguage,
    showLanguageMenu,
    setShowLanguageMenu,
    setLanguage: changeLanguage,
    t,
  };
}

