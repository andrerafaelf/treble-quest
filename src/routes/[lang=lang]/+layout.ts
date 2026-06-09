import { initI18n, type SupportedLocale } from '$lib/i18n';
import { waitLocale } from 'svelte-i18n';
import type { LayoutLoad } from './$types';

export const prerender = true;

export const load: LayoutLoad = async ({ params }) => {
  const lang = params.lang as SupportedLocale;
  initI18n(lang);
  await waitLocale(lang);
  return { lang };
};
