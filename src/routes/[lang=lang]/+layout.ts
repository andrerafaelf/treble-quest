import { DEFAULT_LOCALE, initI18n, normalizeLocale } from '$lib/i18n';
import { waitLocale } from 'svelte-i18n';
import type { LayoutLoad } from './$types';

export const prerender = true;

export const load: LayoutLoad = async ({ params }) => {
  const lang = normalizeLocale(params.lang) ?? DEFAULT_LOCALE;
  initI18n(lang);
  await waitLocale(lang);
  return { lang };
};
