<script lang="ts">
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

  const isGoalkeeper = $derived(player.positions.includes('GK'));
  const ratings = $derived(
    isGoalkeeper
      ? ([
          ['Control', player.control],
          ['Defence', player.defence],
          ['Clutch', player.clutch]
        ] as const)
      : ([
          ['Attack', player.attack],
          ['Control', player.control],
          ['Defence', player.defence],
          ['Clutch', player.clutch]
        ] as const)
  );

  const realPositions = $derived(player.positions.filter((position) => !['ANY', 'DEF', 'MID', 'FWD'].includes(position)));
  const fallbackPositions = $derived([
    ...(player.positions.includes('DEF') ? ['CB'] : []),
    ...(player.positions.includes('MID') ? ['CM'] : []),
    ...(player.positions.includes('FWD') ? ['ST'] : [])
  ]);
  const positionText = $derived(realPositions.length ? realPositions.join(' / ') : fallbackPositions.join(' / '));
  const requiresSpecificPosition = $derived(required !== 'ANY');
</script>

<button class="option-card player-card" type="button" {disabled} onclick={() => onSelect?.(player.id)}>
  <span class={`rarity ${player.rarity}`}>{player.rarity}</span>
  <span class="player-season">{player.season} {player.club}</span>
  <h2>{player.name}</h2>
  <p>{player.role}</p>
  <div class="meta-row">
    <span>{player.nationality}</span>
    <span>{positionText}</span>
    {#if requiresSpecificPosition}
      <span class="fit">{required} locked</span>
    {/if}
  </div>
  {#if showRatings}
    <div class="rating-grid" aria-label={`${player.name} ratings`}>
      {#each ratings as [label, value]}
        <div class="rating-stat">
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      {/each}
    </div>
  {:else}
    <div class="blind-strip">Ratings hidden</div>
  {/if}
</button>
