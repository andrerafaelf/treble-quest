<script lang="ts">
  import type { SimulationResult } from '$lib/game/types';

  let { result }: { result: SimulationResult } = $props();

  const worldCup = $derived(result.worldCup);
  const isPerfectWorldCup = $derived(
    Boolean(worldCup && worldCup.won && worldCup.wins === 8 && worldCup.draws === 0 && worldCup.losses === 0),
  );
  const perfectLeague = $derived(result.league.wins === 38 && result.league.draws === 0 && result.league.losses === 0);
  const perfectCl = $derived(
    result.championsLeague.won &&
      result.championsLeague.wins === 15 &&
      result.championsLeague.draws === 0 &&
      result.championsLeague.losses === 0,
  );

  const nextChallenge = $derived((): string => {
    if (worldCup) {
      if (isPerfectWorldCup) return 'The perfect run. Can anyone top that score?';
      if (worldCup.won)
        return `${8 - worldCup.wins} result${8 - worldCup.wins === 1 ? '' : 's'} from a perfect 8-0. Go again.`;
      if (worldCup.exitRound === 'Final') return 'Final beaten. One more match. Go back and finish it.';
      if (worldCup.exitRound === 'Semi-final') return 'Semi-final exit. Three wins from glory.';
      return 'Make it further. Build a stronger XI and go again.';
    }
    if (perfectLeague && perfectCl) return 'Perfect league AND perfect Europe. The ultimate run.';
    if (perfectLeague) return '38-0 done. Now go perfect in Europe too, 15-0 awaits.';
    if (perfectCl) return 'Perfect 15-0 in Europe. Now do the same in the league, 38-0.';
    if (result.trophies === 3)
      return `Treble done with ${result.league.points} pts. Chase 38-0 and a perfect European run.`;
    if (result.trophies === 2) return 'Double won. The Treble is one better squad away.';
    if (result.trophies === 1 && result.league.won) return 'Title won. Add the cups, the Treble is within reach.';
    if (result.trophies === 1) return 'One trophy. The league title is the next target.';
    if (result.league.position === 2) return 'Runners-up. One stronger pick changes everything.';
    if (result.league.position <= 4) return 'Top four but no title. Upgrade and push harder.';
    return 'No trophies, but the score can always improve. Go again.';
  });
</script>

<section class="result-hero">
  <div>
    <span class="eyebrow">High Score</span>
    <h1 class:treble-score={result.trophies === 3 || worldCup?.won}>{result.score.toLocaleString()}</h1>
    <p class:treble-text={result.trophies === 3 || worldCup?.won}>
      {#if worldCup}
        {isPerfectWorldCup
          ? 'Perfect 8-0 World Cup.'
          : worldCup.won
            ? 'World Cup won.'
            : `Out in ${worldCup.exitRound}.`}
      {:else}
        {result.trophies === 3
          ? 'Treble completed.'
          : result.trophies === 0
            ? 'No trophies this time.'
            : result.trophies === 1
              ? '1 trophy won.'
              : `${result.trophies} trophies won.`}
      {/if}
    </p>
    <p class="result-next-challenge">{nextChallenge()}</p>
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
