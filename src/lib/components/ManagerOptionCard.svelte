<script lang="ts">
  import type { Manager } from '$lib/game/types';
  import { t } from 'svelte-i18n';

  let {
    manager,
    showRatings = true,
    disabled = false,
    onSelect,
  }: {
    manager: Manager;
    showRatings?: boolean;
    disabled?: boolean;
    onSelect?: (id: string) => void;
  } = $props();

  const initials = $derived(
    manager.name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase(),
  );
</script>

<!-- Managers get the "staff" sticker: ink band instead of a club kit -->
<button class="option-card manager-card sticker sticker-staff" type="button" {disabled} onclick={() => onSelect?.(manager.id)}>
  <span class="sticker-face">
    <span class="sticker-band">
      <span class="card-top-row">
        <span class="rarity elite">{$t(`manager.style.${manager.style}`)}</span>
      </span>
      <span class="sticker-initials" aria-hidden="true">{initials}</span>
    </span>
    <span class="sticker-body">
      <h2>{manager.name}</h2>
      <p>{manager.clubHint}</p>
      <span class="meta-row">
        <span>{$t(`manager.temperament.${manager.temperament}`)}</span>
        <span>{$t(`manager.style.${manager.style}`)}</span>
      </span>
      {#if showRatings}
        <span class="overall-badge" aria-label={`${manager.name} overall rating`}>
          <span>{$t('spin.overall')}</span>
          <strong>{manager.overall}</strong>
        </span>
      {:else}
        <span class="blind-strip">{$t('spin.overall_hidden')}</span>
      {/if}
    </span>
  </span>
  <span class="sticker-no" aria-hidden="true">MGR</span>
</button>
