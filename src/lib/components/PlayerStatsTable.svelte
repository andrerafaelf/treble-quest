<script lang="ts">
  import { flagUrl } from '$lib/game/flags';
  import type { PlayerSeasonStats } from '$lib/game/types';

  let { stats }: { stats: PlayerSeasonStats[] } = $props();

  const sorted = $derived(
    [...stats].sort((a, b) => {
      const posOrder = ['ST', 'LW', 'RW', 'LM', 'RM', 'CM', 'LB', 'RB', 'CB', 'GK'];
      const ai = posOrder.indexOf(a.positionShort);
      const bi = posOrder.indexOf(b.positionShort);
      if (ai !== bi) return ai - bi;
      return b.goals - a.goals;
    }),
  );
</script>

<section class="player-stats" aria-label="Squad statistics">
  <header class="ps-header">
    <span class="ps-title">Your Squad, Season Stats</span>
  </header>
  <div class="ps-grid ps-row ps-head">
    <span class="ps-pos">PL</span>
    <span class="ps-name">Player</span>
    <span class="ps-num">G</span>
    <span class="ps-num">A</span>
    <span class="ps-num">CS</span>
  </div>
  {#each sorted as p (p.playerId)}
    {@const pFlag = flagUrl(p.nationality, 16, 'flat')}
    <div class="ps-grid ps-row">
      <span class="ps-pos" data-pos={p.positionShort}>{p.positionShort}</span>
      <span class="ps-name">
        {#if pFlag}
          <img
            class="ps-flag"
            src={pFlag}
            alt={p.nationality}
            title={p.nationality}
            width="16"
            height="16"
            loading="lazy"
          />
        {/if}{p.name}</span
      >
      <span class="ps-num">{p.goals || '-'}</span>
      <span class="ps-num">{p.assists || '-'}</span>
      <span class="ps-num">{p.cleanSheets || '-'}</span>
    </div>
  {/each}
</section>
