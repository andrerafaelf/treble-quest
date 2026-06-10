import { normalizeLocale } from '$lib/i18n';
import type { ParamMatcher } from '@sveltejs/kit';

export const match: ParamMatcher = (param) => {
  return normalizeLocale(param) !== null;
};
