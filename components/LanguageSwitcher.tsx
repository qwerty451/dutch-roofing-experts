"use client";

import { useLanguage } from "@/context/LanguageContext";
import { localeFlags, localeNames, type Locale } from "@/lib/i18n";

const locales: Locale[] = ["es", "en", "nl"];

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();

  const handleClick = (lang: Locale) => {
    console.log("Language clicked:", lang, "Current locale:", locale);
    setLocale(lang);
  };

  return (
    <div className="flex items-center gap-1">
      {locales.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => handleClick(l)}
          aria-label={`Switch to ${localeNames[l]}`}
          aria-pressed={locale === l}
          style={{
            opacity: locale === l ? 1 : 0.5,
            backgroundColor: locale === l ? '#333' : 'transparent',
            padding: '4px 8px',
            borderRadius: '4px',
            cursor: 'pointer',
            border: 'none',
            fontSize: '18px'
          }}
          title={localeNames[l]}
        >
          {localeFlags[l]}
        </button>
      ))}
    </div>
  );
}
