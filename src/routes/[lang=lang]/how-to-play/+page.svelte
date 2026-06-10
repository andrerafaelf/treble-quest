<script lang="ts">
  import Button from '$lib/components/Button.svelte';
  import Card from '$lib/components/Card.svelte';
  import type { LayoutData } from '../$types';
  import { t } from 'svelte-i18n';

  let { data }: { data: LayoutData } = $props();
  const lang = $derived(data.lang);
  const pathLang = $derived(lang.toLowerCase());
</script>

<svelte:head>
  <title>{$t('how_to_play.page_title')}</title>
</svelte:head>

<section class="page-section narrow">
  <span class="eyebrow">{$t('how_to_play.eyebrow')}</span>
  <h1 class="page-title">{$t('how_to_play.headline')}</h1>
  <div class="text-flow">
    <p>{$t('how_to_play.p1')}</p>
    <p>{$t('how_to_play.p2')}</p>
  </div>
  <Card>
    <div class="steps">
      <div>{$t('how_to_play.step1')}</div>
      <div>{$t('how_to_play.step2')}</div>
      <div>{$t('how_to_play.step3')}</div>
    </div>
  </Card>
  <div class="toolbar-row">
    <Button href={`/${pathLang}/play`}>{$t('how_to_play.start_run')}</Button>
    <Button href={`/${pathLang}`} variant="ghost">{$t('how_to_play.back_home')}</Button>
  </div>
</section>
