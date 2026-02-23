import { useMemo, useState } from "react";
import type { Language } from "./LanguageContext";

const LANGS: Record<Language, { label: string; flag: string }> = {
  fr: { label: "Français", flag: "🇫🇷" },
  en: { label: "English", flag: "🇬🇧" },
  es: { label: "Español", flag: "🇪🇸" },
};

type Props = {
  language: Language;
  onChange: (l: Language) => void;
};

export function LanguageDropdown({ language, onChange }: Props) {
  const [open, setOpen] = useState(false);

  const current = useMemo(() => LANGS[language], [language]);

  return (
    <div className="lang">
      <button
        type="button"
        className="lang__btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="lang__flag" aria-hidden="true">{current.flag}</span>
        <span className="lang__label">{current.label}</span>
        <span className="lang__code">{language.toUpperCase()}</span>
        <span className="lang__chev" aria-hidden="true">▾</span>
      </button>

      {open && (
        <div className="lang__panel" role="listbox" aria-label="Language">
          {(Object.keys(LANGS) as Language[]).map((l) => (
            <button
              key={l}
              type="button"
              role="option"
              aria-selected={l === language}
              className={`lang__item ${l === language ? "is-active" : ""}`}
              onClick={() => {
                onChange(l);
                setOpen(false);
              }}
            >
              <span className="lang__flag" aria-hidden="true">{LANGS[l].flag}</span>
              <span className="lang__label">{LANGS[l].label}</span>
              <span className="lang__code">{l.toUpperCase()}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
