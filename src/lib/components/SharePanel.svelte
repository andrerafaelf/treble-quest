<script lang="ts">
  import { env } from '$env/dynamic/public';
  import Button from '$lib/components/Button.svelte';
  import { createShareText } from '$lib/game/share';
  import { createShareLink } from '$lib/game/share-api';
  import type { RunState, SimulationResult } from '$lib/game/types';

  let { run, result }: { run: RunState; result: SimulationResult } = $props();

  const siteUrl = env.PUBLIC_SITE_URL ?? 'https://treble.quest';
  let shareUrl = $state<string | null>(null);
  let shareError = $state(false);
  let loading = $state(false);
  let copied = $state(false);
  let open = $state(false);
  let xHint = $state(false);

  $effect(() => {
    if (run && !shareUrl && !loading && !shareError) {
      loading = true;
      createShareLink(run)
        .then((url) => {
          shareUrl = url;
        })
        .catch(() => {
          shareError = true;
        })
        .finally(() => {
          loading = false;
        });
    }
  });

  const shareText = $derived(createShareText(result, shareUrl ?? siteUrl));

  function toggle() {
    open = !open;
    xHint = false;
  }

  async function captureCard(): Promise<File | null> {
    const el = document.getElementById('share-card-capture');
    if (!el) return null;
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(el, { backgroundColor: '#0f1923', scale: 2, useCORS: true });
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png'));
      if (!blob) return null;
      return new File([blob], 'treble-quest-result.png', { type: 'image/png' });
    } catch {
      return null;
    }
  }

  function downloadFile(file: File) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(file);
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function copyLink() {
    const url = shareUrl ?? siteUrl;
    try {
      await navigator.clipboard.writeText(url);
      copied = true;
      setTimeout(() => (copied = false), 1600);
    } catch {
      /* ignore */
    }
  }

  async function shareOnX() {
    xHint = false;
    const file = await captureCard();
    const intent = new URL('https://x.com/intent/post');
    intent.searchParams.set('text', shareText);
    if (file) {
      downloadFile(file);
      xHint = true;
    }
    window.open(intent.toString(), '_blank', 'noopener,noreferrer');
  }

  async function shareOnWhatsApp() {
    const file = await captureCard();
    // On mobile: try native share with image attached
    if (file && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ text: shareText, files: [file] });
        return;
      } catch {
        /* fall through to plain link */
      }
    }
    // Desktop fallback: open WhatsApp web with text
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  async function saveImage() {
    const file = await captureCard();
    if (file) downloadFile(file);
  }

  async function nativeShare() {
    const file = await captureCard();
    if (file && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ text: shareText, files: [file] });
        return;
      } catch {
        /* fall through */
      }
    }
    // Fallback: share text only
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText, url: shareUrl ?? siteUrl });
        return;
      } catch {
        /* ignore */
      }
    }
    shareOnX();
  }
</script>

<section class="share-panel">
  {#if !open}
    <Button onclick={toggle} full>
      {loading ? 'Preparing share link…' : '🔗 Share verified link'}
    </Button>
  {:else}
    <div class="share-modal">
      <div class="share-buttons">
        <button class="share-btn share-btn--whatsapp" onclick={shareOnWhatsApp}>WhatsApp</button>
        <button class="share-btn share-btn--x" onclick={shareOnX}>𝕏</button>
        <button class="share-btn share-btn--copy" onclick={copyLink}>{copied ? '✓ Copied' : '🔗 Copy'}</button>
      </div>
      <div class="share-buttons">
        <button class="share-btn share-btn--image" onclick={saveImage}>📷 Save image</button>
        <button class="share-btn share-btn--native" onclick={nativeShare}>📤 Share</button>
      </div>
      {#if xHint}
        <p class="share-note share-note--hint">Image downloaded, attach it to your post on 𝕏.</p>
      {:else if shareUrl}
        <p class="share-note">Verified link opens a server-checked result page, proof it's real.</p>
      {:else if shareError}
        <p class="share-note share-note--error">Could not create verified link. You can still share text.</p>
      {/if}
      <button class="share-close" onclick={toggle}>Close</button>
    </div>
  {/if}
</section>

<style>
  .share-modal {
    display: grid;
    gap: 10px;
    padding: 16px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.025);
  }

  .share-buttons {
    display: flex;
    gap: 8px;
  }

  .share-btn {
    flex: 1;
    padding: 10px 12px;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: var(--surface, #1a2634);
    color: var(--text, #e2e8f0);
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition:
      background 0.15s,
      border-color 0.15s;
  }

  .share-btn:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.15);
  }

  .share-btn--whatsapp {
    color: #25d366;
    border-color: rgba(37, 211, 102, 0.3);
  }
  .share-btn--x {
    color: #f8fafc;
  }
  .share-btn--copy {
    color: #94a3b8;
  }
  .share-btn--image {
    color: #f59e0b;
    border-color: rgba(245, 158, 11, 0.2);
  }
  .share-btn--native {
    color: #10b981;
    border-color: rgba(16, 185, 129, 0.3);
  }

  .share-note {
    font-size: 0.72rem;
    color: #64748b;
    text-align: center;
  }

  .share-note--hint {
    color: #f8fafc;
    background: rgba(248, 250, 252, 0.06);
    border-radius: 6px;
    padding: 6px 10px;
  }

  .share-note--error {
    color: #f87171;
  }

  .share-close {
    background: none;
    border: none;
    color: #94a3b8;
    font-size: 0.8rem;
    cursor: pointer;
    text-align: center;
    padding: 6px;
  }

  .share-close:hover {
    color: #e2e8f0;
  }
</style>
