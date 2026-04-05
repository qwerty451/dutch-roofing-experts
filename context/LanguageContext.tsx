"use client";

import React, { createContext, useContext, useState } from "react";
import {
  defaultLocale,
  defaultTranslations,
  type Locale,
  type TranslationKey,
  type Translations,
} from "@/lib/i18n";

const LOCALE_STORAGE_KEY = "dakservice-locale";

interface LanguageContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: TranslationKey) => string;
  translations: Record<Locale, Translations>;
  setTranslations: (t: Record<Locale, Translations>) => void;
}

const LanguageContext = createContext<LanguageContextType>({
  locale: defaultLocale,
  setLocale: () => {},
  t: (key) => key,
  translations: defaultTranslations,
  setTranslations: () => {},
});

function getInitialLocale(): Locale {
  if (typeof window === "undefined") return defaultLocale;
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (stored && ["es", "en", "nl"].includes(stored)) {
    return stored as Locale;
  }
  return defaultLocale;
}

export function LanguageProvider({
  children,
  initialTranslations,
}: {
  children: React.ReactNode;
  initialTranslations?: Record<Locale, Translations>;
}) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);
  const [translations, setTranslations] = useState(
    initialTranslations ?? defaultTranslations
  );

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem(LOCALE_STORAGE_KEY, l);
  };

  const t = (key: TranslationKey): string =>
    translations[locale]?.[key] ?? translations[defaultLocale]?.[key] ?? key;

  return (
    <LanguageContext.Provider
      value={{ locale, setLocale, t, translations, setTranslations }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
