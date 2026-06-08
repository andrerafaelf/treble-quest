<script lang="ts">
  import { env } from '$env/dynamic/public';
  import Button from '$lib/components/Button.svelte';

  let { text }: { text: string } = $props();
  let copied = $state(false);

  const siteUrl = env.PUBLIC_SITE_URL ?? 'https://treble.quest';

  async function copyShareText() {
    try {
      await navigator.clipboard.writeText(text);
      copied = true;
      window.setTimeout(() => (copied = false), 1600);
    } catch {
      copied = false;
    }
  }

  function shareOnX() {
    const intent = new URL('https://x.com/intent/post');
    intent.searchParams.set('text', text);
    intent.searchParams.set('url', siteUrl);
    window.open(intent.toString(), '_blank', 'noopener,noreferrer');
  }
</script>

<section class="share-panel">
  <pre>{text}</pre>
  <div class="share-actions">
    <Button variant="secondary" onclick={copyShareText}>{copied ? 'Copied' : 'Copy share text'}</Button>
    <Button onclick={shareOnX}>Share on X</Button>
  </div>
</section>
