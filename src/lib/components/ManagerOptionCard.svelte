<script lang="ts">
  import type { Manager } from '$lib/game/types';

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
  <span class="rarity elite">{manager.style}</span>
  <h2>{manager.name}</h2>
  <p>{manager.clubHint}</p>
  <div class="meta-row">
    <span>{manager.temperament}</span>
    <span>{manager.style}</span>
  </div>
  {#if showRatings}
    <div class="overall-badge" aria-label={`${manager.name} overall rating`}>
      <span>Overall</span>
      <strong>{manager.overall}</strong>
    </div>
  {:else}
    <div class="blind-strip">Overall hidden</div>
  {/if}
</button>
