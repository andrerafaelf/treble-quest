<script lang="ts">
  import { env } from '$env/dynamic/public';
  import { createShareText } from '$lib/game/share';
  import { createShareLink } from '$lib/game/share-api';
  import type { RunState, SimulationResult } from '$lib/game/types';
  import { t } from 'svelte-i18n';

  let { run, result }: { run: RunState; result: SimulationResult } = $props();

  const siteUrl = env.PUBLIC_SITE_URL ?? 'https://treble.quest';
  let shareUrl = $state<string | null>(null);
  let shareError = $state(false);
  let loading = $state(false);
  let copied = $state(false);
  let xHint = $state(false);
  let cachedCapture = $state<{ file: File; blob: Blob } | null>(null);

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

  $effect(() => {
    captureCard().then((result) => {
      cachedCapture = result;
    });
  });

  const shareText = $derived(createShareText(result, shareUrl ?? siteUrl, $t));

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

  function shareOnX() {
    xHint = false;
    if (xHintTimer) clearTimeout(xHintTimer);
    const intent = new URL('https://x.com/intent/post');
    intent.searchParams.set('text', shareText);

    if (navigator.maxTouchPoints > 0) {
      if (cachedCapture && navigator.canShare?.({ files: [cachedCapture.file] })) {
        navigator.share({ text: shareText, files: [cachedCapture.file] }).catch(() => {});
        return;
      }
      window.open(intent.toString(), '_blank', 'noopener,noreferrer');
      return;
    }

    // Desktop: open intent immediately, then capture and download image
    window.open(intent.toString(), '_blank', 'noopener,noreferrer');
    captureCard().then((captured) => {
      if (captured) {
        downloadFile(captured.file);
        xHint = true;
        xHintTimer = setTimeout(() => (xHint = false), 8000);
      }
    });
  }

  function shareOnWhatsApp() {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

    if (navigator.maxTouchPoints > 0) {
      if (cachedCapture && navigator.canShare?.({ files: [cachedCapture.file] })) {
        navigator.share({ text: shareText, files: [cachedCapture.file] }).catch(() => {});
        return;
      }
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }

    // Desktop: copy image to clipboard, then open WhatsApp Web
    const captured = cachedCapture;
    if (captured) {
      navigator.clipboard
        .write([new ClipboardItem({ 'image/png': captured.blob })])
        .catch(() => {});
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  async function saveImage() {
    const captured = cachedCapture ?? (await captureCard());
    if (captured) downloadFile(captured.file);
  }

  function nativeShare() {
    if (cachedCapture && navigator.canShare?.({ files: [cachedCapture.file] })) {
      navigator.share({ text: shareText, files: [cachedCapture.file] }).catch(() => {});
      return;
    }
    if (navigator.share) {
      navigator.share({ text: shareText, url: shareUrl ?? siteUrl }).catch(() => {});
      return;
    }
    shareOnX();
  }
</script>

<section class="share-panel">
  <div class="share-modal">
    <div class="share-buttons">
      <button class="share-btn share-btn--whatsapp" onclick={shareOnWhatsApp}>{$t('share.whatsapp')}</button>
      <button class="share-btn share-btn--x" onclick={shareOnX}>𝕏</button>
      <button class="share-btn share-btn--copy" onclick={copyLink}>{copied ? $t('share.copied') : $t('share.copy')}</button>
    </div>
    <div class="share-buttons">
      <button class="share-btn share-btn--image" onclick={saveImage}>{$t('share.save_image')}</button>
      <button class="share-btn share-btn--native" onclick={nativeShare}>{$t('share.share')}</button>
    </div>
    {#if xHint}
      <p class="share-note share-note--hint">{$t('share.x_hint')}</p>
    {:else if loading}
      <p class="share-note">{$t('share.preparing_link')}</p>
    {:else if shareUrl}
      <p class="share-note">{$t('share.verified_link')}</p>
    {:else if shareError}
      <p class="share-note share-note--error">{$t('share.link_error')}</p>
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
