<script lang="ts">
  import type { SimulationResult } from '$lib/game/types';

  let { result }: { result: SimulationResult } = $props();

  const worldCup = $derived(result.worldCup);
  const perfectLeague = $derived(result.league.wins === 38 && result.league.draws === 0 && result.league.losses === 0);
  const perfectCl = $derived(result.championsLeague.won && result.championsLeague.wins === 15 && result.championsLeague.draws === 0 && result.championsLeague.losses === 0);
  const perfectWorldCup = $derived(Boolean(worldCup && worldCup.wins === 8 && worldCup.draws === 0 && worldCup.losses === 0 && worldCup.won));
</script>

<section class="breakdown-grid">
  {#if worldCup}
    <article class:won={worldCup.won}>
      <span>{worldCup.won ? 'World Cup won' : 'World Cup'}</span>
      <h2>{perfectWorldCup ? 'Perfect 8-0' : worldCup.won ? 'Winners' : worldCup.exitRound}</h2>
      <p class="league-record">
        {worldCup.wins}W / {worldCup.draws}D / {worldCup.losses}L
        <span class="record-pts">target 8-0</span>
      </p>
      <p class="league-goals">GF {worldCup.goalsFor} / GA {worldCup.goalsAgainst} / GD {worldCup.goalsFor - worldCup.goalsAgainst > 0 ? '+' : ''}{worldCup.goalsFor - worldCup.goalsAgainst}</p>
      {#if !worldCup.won && worldCup.opponent}
        <p>Lost to {worldCup.opponent}</p>
      {:else}
        <p>{worldCup.group}</p>
      {/if}
    </article>
  {:else}
    <article class:won={result.league.won}>
      <span>{result.league.won ? 'Premier League won' : 'Premier League'}</span>
      <h2>{perfectLeague ? 'Perfect 38-0' : result.league.label}</h2>
      <p class="league-record">
        {result.league.wins}W / {result.league.draws}D / {result.league.losses}L
        <span class="record-pts">{result.league.points} pts</span>
      </p>
      <p class="league-goals">GF {result.league.goalsFor} / GA {result.league.goalsAgainst} / GD {result.league.goalsFor - result.league.goalsAgainst > 0 ? '+' : ''}{result.league.goalsFor - result.league.goalsAgainst}</p>
    </article>
    <article class:won={result.faCup.won}>
      <span>{result.faCup.won ? 'FA Cup won' : 'FA Cup'}</span>
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
      <span>{result.championsLeague.won ? 'Champions League won' : 'Champions League'}</span>
      <h2>{perfectCl ? 'Perfect 15-0' : result.championsLeague.won ? 'Winners' : result.championsLeague.exitRound}</h2>
      <p class="league-record">
        {result.championsLeague.wins}W / {result.championsLeague.draws}D / {result.championsLeague.losses}L
        <span class="record-pts">target 15-0</span>
      </p>
      <p>
        {#if result.championsLeague.won}
          {result.championsLeague.group}
        {:else if result.championsLeague.exitRound === 'League phase'}
          Dropped in league phase - {result.championsLeague.opponent ? `vs ${result.championsLeague.opponent}` : ''}
        {:else if result.championsLeague.opponent}
          Lost to {result.championsLeague.opponent}
        {:else}
          {result.championsLeague.group}
        {/if}
      </p>
    </article>
  {/if}
</section>
