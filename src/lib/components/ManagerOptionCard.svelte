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
</script>

<button class="option-card manager-card" type="button" {disabled} onclick={() => onSelect?.(manager.id)}>
  <span class="rarity elite">{$t(`manager.style.${manager.style}`)}</span>
  <h2>{manager.name}</h2>
  <p>{manager.clubHint}</p>
  <div class="meta-row">
    <span>{$t(`manager.temperament.${manager.temperament}`)}</span>
    <span>{$t(`manager.style.${manager.style}`)}</span>
  </div>
  {#if showRatings}
    <div class="overall-badge" aria-label={`${manager.name} overall rating`}>
      <span>{$t('spin.overall')}</span>
      <strong>{manager.overall}</strong>
    </div>
  {:else}
    <div class="blind-strip">{$t('spin.overall_hidden')}</div>
  {/if}
</button>
