<script lang="ts">
  import { env } from '$env/dynamic/public';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { DEFAULT_LOCALE, normalizeLocale } from '$lib/i18n';
  import { t } from 'svelte-i18n';

  const consentKey = 'trebleQuestAnalyticsConsent';
  const consentGrantedEvent = 'treblequest:analytics-consent-granted';
  const analyticsEnabled = Boolean(env.PUBLIC_GA_MEASUREMENT_ID);

  const lang = $derived(normalizeLocale($page.params.lang) ?? DEFAULT_LOCALE);
  const pathLang = $derived(lang.toLowerCase());

  let ready = $state(false);
  let choice = $state<'unknown' | 'granted' | 'denied'>('unknown');

  onMount(() => {
    if (!analyticsEnabled) return;
    choice = (window.localStorage.getItem(consentKey) as 'granted' | 'denied' | null) ?? 'unknown';
    ready = true;
  });

  function acceptAnalytics() {
    window.localStorage.setItem(consentKey, 'granted');
    choice = 'granted';
    window.dispatchEvent(new CustomEvent(consentGrantedEvent));
  }

  function declineAnalytics() {
    window.localStorage.setItem(consentKey, 'denied');
    choice = 'denied';
  }
</script>

{#if analyticsEnabled && ready && choice === 'unknown'}
  <section class="cookie-banner" aria-label="Analytics consent">
    <div>
      <strong>{$t('cookie.title')}</strong>
      <p>{$t('cookie.body')}</p>
    </div>
    <div class="cookie-actions">
      <button type="button" class="button primary" onclick={acceptAnalytics}>{$t('cookie.accept')}</button>
      <button type="button" class="button ghost" onclick={declineAnalytics}>{$t('cookie.decline')}</button>
      <a href={`/${pathLang}/privacy`}>{$t('cookie.privacy')}</a>
    </div>
  </section>
{/if}
