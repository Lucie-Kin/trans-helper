import React, { createContext, useContext, useMemo, useState } from "react";
import { createTranslator } from "./translate.ts";

export type Language = "fr" | "en" | "es";

type Ctx = {
  language: Language;
  setLanguage: (l: Language) => void;
  translate: (key: string, vars?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<Ctx | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("fr");

  const translate = useMemo(() => createTranslator(language), [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, translate }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}
