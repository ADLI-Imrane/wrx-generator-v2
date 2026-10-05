import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { fr } from './fr';

export type Lang = 'en' | 'fr';
type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (s: string, vars?: Record<string, string | number>) => string;
};
const I18n = createContext<Ctx | null>(null);

const initial = (): Lang => {
  try {
    const saved = localStorage.getItem('wrx-lang');
    if (saved === 'en' || saved === 'fr') return saved;
  } catch {
    /* storage unavailable */
  }
  return navigator.language?.startsWith('fr') ? 'fr' : 'en';
};

/** English strings are the keys; French lives in fr.ts. A missing translation falls back to English. */
export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initial);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  const value = useMemo<Ctx>(
    () => ({
      lang,
      setLang: (l) => {
        setLangState(l);
        try {
          localStorage.setItem('wrx-lang', l);
        } catch {
          /* ignore */
        }
      },
      t: (s, vars) => {
        let out = lang === 'fr' ? (fr[s] ?? s) : s;
        if (vars) for (const [k, v] of Object.entries(vars)) out = out.replaceAll(`{${k}}`, String(v));
        return out;
      },
    }),
    [lang],
  );
  return <I18n.Provider value={value}>{children}</I18n.Provider>;
}

export const useT = () => {
  const ctx = useContext(I18n);
  if (!ctx) throw new Error('useT outside I18nProvider');
  return ctx;
};
