<script lang="ts">
  import { env } from '$env/dynamic/public';
  import AppShell from '$lib/components/AppShell.svelte';
  import appleTouchIcon from '$lib/icons/apple-touch-icon.png';
  import favicon16 from '$lib/icons/favicon-16x16.png';
  import favicon32 from '$lib/icons/favicon-32x32.png';
  import faviconIco from '$lib/icons/favicon.ico';
  import '../lib/styles/app.css';

  let { children } = $props();

  const siteUrl = env.PUBLIC_SITE_URL ?? 'https://treble.quest/';
  const googleSiteVerification = env.PUBLIC_GOOGLE_SITE_VERIFICATION;
  const ogImage = new URL('og-image.png', siteUrl).toString();
</script>

<svelte:head>
  <title>Treble Quest - Draft Seven Picks. Chase Three Trophies.</title>
  <meta
    name="description"
    content="Draft a football squad and simulate a Premier League, FA Cup and Champions League treble chase."
  />
  {#if googleSiteVerification}
    <meta name="google-site-verification" content={googleSiteVerification} />
  {/if}
  <meta property="og:title" content="Treble Quest - Draft Seven Picks. Chase Three Trophies." />
  <meta
    property="og:description"
    content="Draft a football squad and simulate a Premier League, FA Cup and Champions League treble chase."
  />
  <meta property="og:type" content="website" />
  <meta property="og:url" content={siteUrl} />
  <meta property="og:image" content={ogImage} />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:type" content="image/png" />
  <meta property="og:image:alt" content="Treble Quest, Draft. Simulate. Conquer." />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Treble Quest - Draft Seven Picks. Chase Three Trophies." />
  <meta
    name="twitter:description"
    content="Draft a football squad and simulate a Premier League, FA Cup and Champions League treble chase."
  />
  <meta name="twitter:image" content={ogImage} />
  <meta name="twitter:image:alt" content="Treble Quest, Draft. Simulate. Conquer." />
  <link rel="canonical" href={siteUrl} />
  <link rel="apple-touch-icon" sizes="180x180" href={appleTouchIcon} />
  <link rel="icon" type="image/png" sizes="32x32" href={favicon32} />
  <link rel="icon" type="image/png" sizes="16x16" href={favicon16} />
  <link rel="shortcut icon" href={faviconIco} />
</svelte:head>

<AppShell>
  {@render children()}
</AppShell>
