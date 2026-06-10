<script lang="ts">
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { SUPPORTED_LOCALES, DEFAULT_LOCALE, normalizeLocale } from '$lib/i18n';

  if (browser) {
    const preferred = navigator.languages
      .map((l) => {
        // exact match first (e.g. "pt-PT")
        const exact = normalizeLocale(l);
        if (exact) return exact;
        // language-only match (e.g. "pt" → "pt-PT")
        const base = l.split('-')[0];
        return SUPPORTED_LOCALES.find((s) => s.startsWith(base)) ?? null;
      })
      .find(Boolean);

    goto(`/${(preferred ?? DEFAULT_LOCALE).toLowerCase()}`, { replaceState: true });
  }
</script>
