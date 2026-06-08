<script lang="ts">
  import type { SimulationResult } from '$lib/game/types';

  let { result }: { result: SimulationResult } = $props();
</script>

<section class="breakdown-grid">
  <article class:won={result.league.won}>
    <span>{result.league.won ? '🏆 Premier League' : 'Premier League'}</span>
    <h2>{result.league.label}</h2>
    <p class="league-record">
      {result.league.wins}W · {result.league.draws}D · {result.league.losses}L
      <span class="record-pts">{result.league.points} pts</span>
    </p>
    <p class="league-goals">GF {result.league.goalsFor} · GA {result.league.goalsAgainst} · GD {result.league.goalsFor - result.league.goalsAgainst > 0 ? '+' : ''}{result.league.goalsFor - result.league.goalsAgainst}</p>
  </article>
  <article class:won={result.faCup.won}>
    <span>{result.faCup.won ? '🏆 FA Cup' : 'FA Cup'}</span>
    <h2>{result.faCup.won ? 'Winners' : result.faCup.exitRound}</h2>
    <p>
      {#if result.faCup.won}
        All six rounds won
      {:else if result.faCup.opponent}
        Lost to {result.faCup.opponent}
      {:else}
        Knocked out in {result.faCup.exitRound}
      {/if}
    </p>
  </article>
  <article class:won={result.championsLeague.won}>
    <span>{result.championsLeague.won ? '🏆 Champions League' : 'Champions League'}</span>
    <h2>{result.championsLeague.won ? 'Winners' : result.championsLeague.exitRound}</h2>
    <p>
      {#if result.championsLeague.won}
        {result.championsLeague.group}
      {:else if result.championsLeague.exitRound === 'Group stage'}
        Dropped in group · {result.championsLeague.opponent ? `vs ${result.championsLeague.opponent}` : ''}
      {:else if result.championsLeague.opponent}
        Lost to {result.championsLeague.opponent}
      {:else}
        {result.championsLeague.group}
      {/if}
    </p>
  </article>
</section>
