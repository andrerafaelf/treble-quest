import { browser } from '$app/environment';
import { init, register, locale } from 'svelte-i18n';

export const SUPPORTED_LOCALES = ['en', 'es', 'ar', 'pt-PT', 'de', 'it', 'id'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: SupportedLocale = 'en';

export const RTL_LOCALES: SupportedLocale[] = ['ar'];

export function isRTL(lang: string): boolean {
  return RTL_LOCALES.includes(lang as SupportedLocale);
}

register('en', () => import('./locales/en.json'));
register('es', () => import('./locales/es.json'));
register('ar', () => import('./locales/ar.json'));
register('pt-PT', () => import('./locales/pt-PT.json'));
register('de', () => import('./locales/de.json'));
register('it', () => import('./locales/it.json'));
register('id', () => import('./locales/id.json'));

export function initI18n(lang: string) {
  init({
    fallbackLocale: DEFAULT_LOCALE,
    initialLocale: browser ? lang : lang,
  });
  locale.set(lang);
}

export { locale };
