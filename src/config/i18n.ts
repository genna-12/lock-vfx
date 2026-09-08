/// <reference types="vite/client" />
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Definiamo un'interfaccia rigorosa invece di usare 'any'
interface TranslationModule {
  default?: Record<string, unknown>;
  [key: string]: unknown;
}

const modules = import.meta.glob('../locales/*.json', { eager: true });

// Evitiamo 'any' tipizzando correttamente le risorse
const resources: Record<string, { translation: Record<string, unknown> }> = {};
const availableLanguages: string[] = [];

Object.entries(modules).forEach(([path, module]) => {
  const lang = path.match(/\/([^/]+)\.json$/)?.[1];
  if (lang) {
    const typedModule = module as TranslationModule;
    // Estraiamo il JSON in modo sicuro
    const translationData = (typedModule.default || typedModule) as Record<string, unknown>;
    
    resources[lang] = { translation: translationData };
    availableLanguages.push(lang);
  }
});

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    // Regola: si parte dalla lingua del dispositivo se il sito ce l'ha,
    // altrimenti inglese. `supportedLngs` si autoalimenta dai file in
    // locales/, quindi aggiungere una lingua = aggiungere un JSON (piu' la
    // voce nella LangPill).
    fallbackLng: 'en',
    supportedLngs: availableLanguages,
    load: 'languageOnly',            // it-IT -> it
    nonExplicitSupportedLngs: true,  // pt-BR accettato se esiste pt
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export { availableLanguages };
export default i18n;