<script lang="ts">
  import { flag } from '$lib/game/flags';
  import type { PlayerSeason, Position } from '$lib/game/types';

  let {
    player,
    required = 'ANY',
    showRatings = true,
    disabled = false,
    onSelect
  }: {
    player: PlayerSeason;
    required?: Position;
    showRatings?: boolean;
    disabled?: boolean;
    onSelect?: (id: string) => void;
  } = $props();

  const realPositions = $derived(player.positions.filter((position) => !['ANY', 'DEF', 'MID', 'FWD'].includes(position)));
  const fallbackPositions = $derived([
    ...(player.positions.includes('DEF') ? ['CB'] : []),
    ...(player.positions.includes('MID') ? ['CM'] : []),
    ...(player.positions.includes('FWD') ? ['ST'] : [])
  ]);
  const positionText = $derived(realPositions.length ? realPositions.join(' / ') : fallbackPositions.join(' / '));
  const requiresSpecificPosition = $derived(required !== 'ANY');
  const nationalityFlag = $derived(flag(player.nationality));
</script>

<button class="option-card player-card" type="button" {disabled} onclick={() => onSelect?.(player.id)}>
  <div class="card-top-row">
    <span class={`rarity ${player.rarity}`}>{player.rarity}</span>
    <span class="player-flag" title={player.nationality}>{nationalityFlag}</span>
  </div>
  <span class="player-club">{player.club}</span>
  <span class="player-season-year">{player.season}</span>
  <h2>{player.name}</h2>
  <p>{player.role}</p>
  <div class="meta-row">
    <span>{positionText}</span>
    {#if requiresSpecificPosition}
      <span class="fit">{required}</span>
    {/if}
  </div>
  {#if showRatings}
    <div class="overall-badge" aria-label={`${player.name} overall rating`}>
      <span>Overall</span>
      <strong>{player.overall}</strong>
    </div>
  {:else}
    <div class="blind-strip">Ratings hidden</div>
  {/if}
</button>
