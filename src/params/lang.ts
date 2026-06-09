import { SUPPORTED_LOCALES } from '$lib/i18n';
import type { ParamMatcher } from '@sveltejs/kit';

export const match: ParamMatcher = (param) => {
  return SUPPORTED_LOCALES.includes(param as (typeof SUPPORTED_LOCALES)[number]);
};
