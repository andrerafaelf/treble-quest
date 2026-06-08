<script lang="ts">
  import Header from '$lib/components/Header.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import CookieConsent from '$lib/components/CookieConsent.svelte';
  import GoogleAnalytics from '$lib/components/GoogleAnalytics.svelte';

  let { children } = $props();
</script>

<div class="app-shell">
  <GoogleAnalytics />
  <Header />
  <main>
    {@render children()}
  </main>
  <Footer />
  <CookieConsent />
</div>
