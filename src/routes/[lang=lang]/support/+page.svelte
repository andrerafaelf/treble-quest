<script lang="ts">
  import type { LayoutData } from '../$types';
  import { t } from 'svelte-i18n';

  let { data }: { data: LayoutData } = $props();
</script>

<svelte:head>
  <title>{$t('support.page_title')}</title>
  <meta name="description" content={$t('support.meta_description')} />
</svelte:head>

<section class="page-section narrow support-page">
  <span class="eyebrow">{$t('support.eyebrow')}</span>
  <h1 class="page-title">{$t('support.headline')}</h1>
  <div class="text-flow">
    <p>{$t('support.p1')}</p>
    <p>{$t('support.p2')}</p>
  </div>

  <div class="support-panel">
    <div>
      <h2>{$t('support.what_funds')}</h2>
      <div class="support-reasons">
        <article>
          <strong>{$t('support.fund1_title')}</strong>
          <span>{$t('support.fund1_desc')}</span>
        </article>
        <article>
          <strong>{$t('support.fund2_title')}</strong>
          <span>{$t('support.fund2_desc')}</span>
        </article>
        <article>
          <strong>{$t('support.fund3_title')}</strong>
          <span>{$t('support.fund3_desc')}</span>
        </article>
      </div>
    </div>
    <div class="support-cta">
      <span class="support-kicker">{$t('support.kicker')}</span>
      <p>{$t('support.cta')}</p>
      <a class="button primary" href="https://ko-fi.com/treblequest" target="_blank" rel="noreferrer">
        {$t('support.kofi_button')}
      </a>
    </div>
  </div>
</section>
