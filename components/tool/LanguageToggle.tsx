'use client';

interface LanguageToggleProps {
  language: 'nl' | 'en';
  onChange: (lang: 'nl' | 'en') => void;
}

export default function LanguageToggle({ language, onChange }: LanguageToggleProps) {
  return (
    <div className="fixed top-4 right-4 z-50 flex rounded overflow-hidden border border-gray-700">
      <button
        onClick={() => onChange('nl')}
        className="px-3 h-9 text-xs font-bold uppercase tracking-widest transition-colors"
        style={
          language === 'nl'
            ? { backgroundColor: '#d4af37', color: '#000' }
            : { backgroundColor: '#1f2937', color: '#9ca3af' }
        }
        aria-label="Nederlands"
        aria-pressed={language === 'nl'}
      >
        NL
      </button>
      <button
        onClick={() => onChange('en')}
        className="px-3 h-9 text-xs font-bold uppercase tracking-widest transition-colors"
        style={
          language === 'en'
            ? { backgroundColor: '#d4af37', color: '#000' }
            : { backgroundColor: '#1f2937', color: '#9ca3af' }
        }
        aria-label="English"
        aria-pressed={language === 'en'}
      >
        EN
      </button>
    </div>
  );
}
