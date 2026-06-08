<script lang="ts">
  import Button from '$lib/components/Button.svelte';

  const consentKey = 'trebleQuestAnalyticsConsent';

  function resetAnalyticsChoice() {
    window.localStorage.removeItem(consentKey);
    window.location.reload();
  }
</script>

<svelte:head>
  <title>Treble Quest Privacy</title>
</svelte:head>

<section class="page-section narrow">
  <span class="eyebrow">Privacy</span>
  <h1 class="page-title">No accounts. No server state.</h1>
  <div class="text-flow">
    <p>
      Treble Quest runs in your browser. Current run progress is saved to LocalStorage on your
      device so you can resume a draft or view a completed result.
    </p>
    <p>
      The app has no backend, database, authentication, or external UI services. Clearing the run
      removes the saved game state from this browser.
    </p>
    <p>
      Treble Quest can use Google Analytics to understand basic usage patterns and improve the game,
      but the analytics script only loads after you accept analytics cookies. If you decline, that
      choice is stored in LocalStorage and Google Analytics is not loaded.
    </p>
  </div>
  <div class="toolbar-row">
    <Button href="/play">Play</Button>
    <button type="button" class="button secondary" onclick={resetAnalyticsChoice}>
      Reset analytics choice
    </button>
    <Button href="/" variant="ghost">Home</Button>
  </div>
</section>
