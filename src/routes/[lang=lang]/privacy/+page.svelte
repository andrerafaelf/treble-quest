<script lang="ts">
  import Button from '$lib/components/Button.svelte';
  import type { LayoutData } from '../$types';
  import { t } from 'svelte-i18n';

  let { data }: { data: LayoutData } = $props();
  const lang = $derived(data.lang);

  const consentKey = 'trebleQuestAnalyticsConsent';

  function resetAnalyticsChoice() {
    window.localStorage.removeItem(consentKey);
    window.location.reload();
  }
</script>

<svelte:head>
  <title>{$t('privacy.page_title')}</title>
</svelte:head>

<section class="page-section narrow">
  <span class="eyebrow">{$t('privacy.eyebrow')}</span>
  <h1 class="page-title">{$t('privacy.headline')}</h1>
  <div class="text-flow">
    <p>{$t('privacy.p1')}</p>
    <p>{$t('privacy.p2')}</p>
    <p>{$t('privacy.p3')}</p>
  </div>
  <div class="toolbar-row">
    <Button href={`/${lang}/play`}>{$t('privacy.play')}</Button>
    <button type="button" class="button secondary" onclick={resetAnalyticsChoice}>
      {$t('privacy.reset_analytics')}
    </button>
    <Button href={`/${lang}`} variant="ghost">{$t('privacy.home')}</Button>
  </div>
</section>
