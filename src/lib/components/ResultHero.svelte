<script lang="ts">
  import type { SimulationResult } from '$lib/game/types';

  let { result }: { result: SimulationResult } = $props();

  const worldCup = $derived(result.worldCup);
  const isPerfectWorldCup = $derived(Boolean(worldCup && worldCup.won && worldCup.wins === 8 && worldCup.draws === 0 && worldCup.losses === 0));
</script>

<section class="result-hero">
  <div>
    <span class="eyebrow">High Score</span>
    <h1 class:treble-score={result.trophies === 3 || worldCup?.won}>{result.score.toLocaleString()}</h1>
    <p class:treble-text={result.trophies === 3 || worldCup?.won}>
      {#if worldCup}
        {isPerfectWorldCup ? 'Perfect 8-0 World Cup.' : worldCup.won ? 'World Cup won.' : `Out in ${worldCup.exitRound}.`}
      {:else}
        {result.trophies === 3 ? 'Treble completed.' : result.trophies === 0 ? 'No trophies this time.' : result.trophies === 1 ? '1 trophy won.' : `${result.trophies} trophies won.`}
      {/if}
    </p>
  </div>
  {#if worldCup}
    <div class="trophy-strip" aria-label="World Cup result">
      <span class:won={worldCup.won}>World Cup</span>
      <span class:won={isPerfectWorldCup}>8-0 target</span>
    </div>
  {:else}
    <div class="trophy-strip" aria-label={`${result.trophies} trophies`}>
      <span class:won={result.league.won}>Premier League</span>
      <span class:won={result.faCup.won}>FA Cup</span>
      <span class:won={result.championsLeague.won}>Champions League</span>
    </div>
  {/if}
</section>
