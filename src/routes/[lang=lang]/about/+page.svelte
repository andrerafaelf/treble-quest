<script lang="ts">
  import Button from '$lib/components/Button.svelte';
  import type { LayoutData } from '../$types';
  import { t } from 'svelte-i18n';

  let { data }: { data: LayoutData } = $props();
  const lang = $derived(data.lang);
</script>

<svelte:head>
  <title>{$t('about.page_title')}</title>
</svelte:head>

<section class="page-section narrow">
  <span class="eyebrow">{$t('about.eyebrow')}</span>
  <h1 class="page-title">{$t('about.headline')}</h1>
  <div class="text-flow">
    <p>{$t('about.p1')}</p>
    <p>{$t('about.p2')}</p>
  </div>
  <div class="toolbar-row">
    <Button href={`/${lang}/play`}>{$t('about.start_run')}</Button>
    <Button href={`/${lang}/support`} variant="secondary">{$t('about.support')}</Button>
    <Button href={`/${lang}/privacy`} variant="secondary">{$t('about.privacy')}</Button>
  </div>
</section>
