import { useState, useEffect, useRef } from 'react';
import { useLang } from '../pages/_app';

const LANGS = {
  en: { flag: '🇬🇧', label: 'EN' },
  th: { flag: '🇹🇭', label: 'TH' },
  ru: { flag: '🇷🇺', label: 'RU' },
};

export default function LangSwitcher({ className = '', value, onChange, languages }) {
  const ctx = useLang();
  const lang = value ?? ctx.lang;
  const setLang = onChange ?? ctx.setLang;
  const langs = languages
    ? Object.fromEntries(languages.map((c) => [c, LANGS[c]]).filter(([, v]) => v))
    : LANGS;
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const ref = useRef(null);

  // Avoid hydration mismatch: flag emojis can serialize differently
  // between server and client. Render a stable placeholder until mount.
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const current = langs[lang] || Object.values(langs)[0];

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Change language"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 md:gap-1.5 bg-gray-100 hover:bg-gray-200 rounded-xl px-2.5 md:px-3 py-1.5 md:py-2 text-sm md:text-base font-bold text-on-background transition-colors"
      >
        <span suppressHydrationWarning>{mounted ? current.flag : ''}</span>
        <span className="hidden sm:inline text-xs">{current.label}</span>
        <svg
          className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M3 4.5L6 7.5L9 4.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute right-0 mt-2 w-32 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50"
        >
          {Object.entries(langs).map(([code, info]) => (
            <button
              key={code}
              role="option"
              aria-selected={lang === code}
              onClick={() => {
                setLang(code);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold text-left hover:bg-gray-50 transition-colors ${
                lang === code ? 'text-primary' : 'text-on-background'
              }`}
            >
              <span className="text-base" suppressHydrationWarning>{info.flag}</span>
              <span>{info.label}</span>
              {lang === code && <span className="ml-auto text-primary">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
