import { initI18n, DEFAULT_LOCALE } from '$lib/i18n';
import { waitLocale } from 'svelte-i18n';

export const prerender = true;

export const load = async () => {
  initI18n(DEFAULT_LOCALE);
  await waitLocale(DEFAULT_LOCALE);
};
