"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { dictionaries, Locale, getNestedTranslation } from "./dictionaries";

type TranslationContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (path: string) => string;
};

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export default function TranslationProvider({ 
  children, 
  defaultLocale = "en" 
}: { 
  children: React.ReactNode, 
  defaultLocale?: Locale 
}) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  useEffect(() => {
    const saved = localStorage.getItem("curio_locale") as Locale;
    if (saved && (saved === "en" || saved === "ur")) {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("curio_locale", newLocale);
    document.cookie = `curio_locale=${newLocale}; path=/; max-age=31536000`;
  };

  const t = (path: string) => {
    const dict = dictionaries[locale];
    return getNestedTranslation(dict, path);
  };

  return (
    <TranslationContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error("useTranslation must be used within a TranslationProvider");
  }
  return context;
}
