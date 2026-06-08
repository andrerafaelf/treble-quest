<script lang="ts">
  import type { SimulationResult } from '$lib/game/types';

  let { result }: { result: SimulationResult } = $props();
</script>

<section class="result-hero">
  <div>
    <span class="eyebrow">High Score</span>
    <h1>{result.score.toLocaleString()}</h1>
    <p>{result.trophies === 3 ? 'Treble completed.' : `${result.trophies} trophy${result.trophies === 1 ? '' : 's'} won.`}</p>
  </div>
  <div class="trophy-strip" aria-label={`${result.trophies} trophies`}>
    <span class:won={result.league.won}>Premier League</span>
    <span class:won={result.faCup.won}>FA Cup</span>
    <span class:won={result.championsLeague.won}>Champions League</span>
  </div>
</section>
