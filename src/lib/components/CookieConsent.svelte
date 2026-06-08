<script lang="ts">
  import { env } from '$env/dynamic/public';
  import { onMount } from 'svelte';

  const consentKey = 'trebleQuestAnalyticsConsent';
  const consentGrantedEvent = 'treblequest:analytics-consent-granted';
  const analyticsEnabled = Boolean(env.PUBLIC_GA_MEASUREMENT_ID);

  let ready = $state(false);
  let choice = $state<'unknown' | 'granted' | 'denied'>('unknown');

  onMount(() => {
    if (!analyticsEnabled) return;

    choice =
      (window.localStorage.getItem(consentKey) as 'granted' | 'denied' | null) ?? 'unknown';
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
      <strong>Help improve Treble Quest?</strong>
      <p>
        Analytics help spot broken flows, popular modes, and where the game needs polish. No ads,
        no accounts, and Google Analytics only loads if you accept.
      </p>
    </div>
    <div class="cookie-actions">
      <button type="button" class="button primary" onclick={acceptAnalytics}>Accept analytics</button>
      <button type="button" class="button ghost" onclick={declineAnalytics}>No thanks</button>
      <a href="/privacy">Privacy</a>
    </div>
  </section>
{/if}
