<script lang="ts">
  import type { SimulationResult } from '$lib/game/types';

  let { result }: { result: SimulationResult } = $props();
</script>

<section class="breakdown-grid">
  <article>
    <span>Premier League</span>
    <h2>{result.league.label}</h2>
    <p>{result.league.points} points</p>
  </article>
  <article>
    <span>FA Cup</span>
    <h2>{result.faCup.won ? 'Winners' : result.faCup.exitRound}</h2>
    <p>{result.faCup.roundsWon} rounds won</p>
  </article>
  <article>
    <span>Champions League</span>
    <h2>{result.championsLeague.won ? 'Winners' : result.championsLeague.exitRound}</h2>
    <p>{result.championsLeague.group}</p>
  </article>
</section>
