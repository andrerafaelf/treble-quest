<script lang="ts">
  import type { Manager } from '$lib/game/types';

  let {
    manager,
    showRatings = true,
    disabled = false,
    onSelect
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
    <div class="rating-grid">
      <div class="rating-stat"><span>Boost</span><strong>{manager.boost}</strong></div>
      <div class="rating-stat"><span>Cups</span><strong>{manager.cupBoost}</strong></div>
      <div class="rating-stat"><span>League</span><strong>{manager.leagueBoost}</strong></div>
    </div>
  {:else}
    <div class="blind-strip">Impact hidden</div>
  {/if}
</button>
