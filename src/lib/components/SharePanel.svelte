<script lang="ts">
  import { env } from '$env/dynamic/public';
  import { createShareText } from '$lib/game/share';
  import { createShareLink } from '$lib/game/share-api';
  import type { RunState, SimulationResult } from '$lib/game/types';

  let { run, result }: { run: RunState; result: SimulationResult } = $props();

  const siteUrl = env.PUBLIC_SITE_URL ?? 'https://treble.quest';
  let shareUrl = $state<string | null>(null);
  let shareError = $state(false);
  let loading = $state(false);
  let copied = $state(false);
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

  let xHintTimer: ReturnType<typeof setTimeout> | null = null;

  async function captureCard(): Promise<{ file: File; blob: Blob } | null> {
    const el = document.getElementById('share-card-capture');
    if (!el) return null;
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(el, { backgroundColor: '#100c0c', scale: 2, useCORS: true });
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png'));
      if (!blob) return null;
      const file = new File([blob], 'treble-quest-result.png', { type: 'image/png' });
      return { file, blob };
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
    if (xHintTimer) clearTimeout(xHintTimer);
    const captured = await captureCard();
    const intent = new URL('https://x.com/intent/post');
    intent.searchParams.set('text', shareText);

    // Mobile: try native share sheet (routes to X with image attached on iOS/Android)
    if (captured && navigator.canShare?.({ files: [captured.file] })) {
      try {
        await navigator.share({ text: shareText, files: [captured.file] });
        return;
      } catch {
        /* user cancelled or not supported — fall through */
      }
    }

    // Desktop: download image + open tweet composer; user attaches manually
    if (captured) {
      downloadFile(captured.file);
      xHint = true;
      xHintTimer = setTimeout(() => (xHint = false), 8000);
    }
    window.open(intent.toString(), '_blank', 'noopener,noreferrer');
  }

  async function shareOnWhatsApp() {
    const captured = await captureCard();

    // Mobile: native share sheet with image attached
    if (captured && navigator.canShare?.({ files: [captured.file] })) {
      try {
        await navigator.share({ text: shareText, files: [captured.file] });
        return;
      } catch {
        /* fall through */
      }
    }

    // Desktop: copy image to clipboard, then open WhatsApp Web so user can paste
    if (captured) {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': captured.blob })
        ]);
        // Small delay so clipboard is flushed before WhatsApp Web opens
        await new Promise((r) => setTimeout(r, 120));
      } catch {
        /* clipboard write not supported — just open WhatsApp with text */
      }
    }
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  async function saveImage() {
    const captured = await captureCard();
    if (captured) downloadFile(captured.file);
  }

  async function nativeShare() {
    const captured = await captureCard();
    if (captured && navigator.canShare?.({ files: [captured.file] })) {
      try {
        await navigator.share({ text: shareText, files: [captured.file] });
        return;
      } catch {
        /* fall through */
      }
    }
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
      <p class="share-note share-note--hint">Image saved, attach it to your post on 𝕏.</p>
    {:else if loading}
      <p class="share-note">Preparing verified link…</p>
    {:else if shareUrl}
      <p class="share-note">Verified link opens a server-checked result page, proof it's real.</p>
    {:else if shareError}
      <p class="share-note share-note--error">Could not create verified link. You can still share text.</p>
    {/if}
  </div>
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

</style>
