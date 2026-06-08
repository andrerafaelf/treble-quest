<script lang="ts">
  import type { SimulationResult } from '$lib/game/types';

  let { result }: { result: SimulationResult } = $props();
</script>

<section class="breakdown-grid">
  <article class:won={result.league.won}>
    <span>{result.league.won ? '🏆 Premier League' : 'Premier League'}</span>
    <h2>{result.league.label}</h2>
    <p>{result.league.points} points</p>
  </article>
  <article class:won={result.faCup.won}>
    <span>{result.faCup.won ? '🏆 FA Cup' : 'FA Cup'}</span>
    <h2>{result.faCup.won ? 'Winners' : result.faCup.exitRound}</h2>
    <p>{result.faCup.roundsWon} rounds won</p>
  </article>
  <article class:won={result.championsLeague.won}>
    <span>{result.championsLeague.won ? '🏆 Champions League' : 'Champions League'}</span>
    <h2>{result.championsLeague.won ? 'Winners' : result.championsLeague.exitRound}</h2>
    <p>{result.championsLeague.exitRound === 'Group stage' ? result.championsLeague.group : `${result.championsLeague.group} · ${result.championsLeague.roundsWon} rounds won`}</p>
  </article>
</section>
