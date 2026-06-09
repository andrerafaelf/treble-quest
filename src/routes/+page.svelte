<script lang="ts">
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { SUPPORTED_LOCALES, DEFAULT_LOCALE, type SupportedLocale } from '$lib/i18n';

  if (browser) {
    const preferred = navigator.languages
      .map((l) => {
        // exact match first (e.g. "pt-PT")
        if (SUPPORTED_LOCALES.includes(l as SupportedLocale)) return l as SupportedLocale;
        // language-only match (e.g. "pt" → "pt-PT")
        const base = l.split('-')[0];
        return SUPPORTED_LOCALES.find((s) => s.startsWith(base)) ?? null;
      })
      .find(Boolean);

    goto(`/${preferred ?? DEFAULT_LOCALE}`, { replaceState: true });
  }
</script>
