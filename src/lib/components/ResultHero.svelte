<script lang="ts">
  import type { SimulationResult } from '$lib/game/types';
  import { t } from 'svelte-i18n';

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
      if (isPerfectWorldCup) return $t('result_hero.wc_perfect');
      const away = 8 - worldCup.wins;
      if (worldCup.won) return away === 1 ? $t('result_hero.wc_results_away_one', { values: { n: away } }) : $t('result_hero.wc_results_away_other', { values: { n: away } });
      if (worldCup.exitRound === 'Final') return $t('result_hero.wc_final_beaten');
      if (worldCup.exitRound === 'Semi-final') return $t('result_hero.wc_semi_exit');
      return $t('result_hero.wc_go_further');
    }
    if (perfectLeague && perfectCl) return $t('result_hero.perfect_both');
    if (perfectLeague) return $t('result_hero.perfect_league_only');
    if (perfectCl) return $t('result_hero.perfect_cl_only');
    if (result.trophies === 3) return $t('result_hero.treble_pts', { values: { pts: result.league.points } });
    if (result.trophies === 2) return $t('result_hero.double_won');
    if (result.trophies === 1 && result.league.won) return $t('result_hero.title_won_chase');
    if (result.trophies === 1) return $t('result_hero.one_trophy_chase');
    if (result.league.position === 2) return $t('result_hero.runners_up');
    if (result.league.position <= 4) return $t('result_hero.top_four');
    return $t('result_hero.no_trophies_again');
  });
</script>

<section class="result-hero">
  <div>
    <span class="eyebrow">{$t('result_hero.high_score')}</span>
    <h1 class:treble-score={result.trophies === 3 || worldCup?.won}>{result.score.toLocaleString()}</h1>
    <p class:treble-text={result.trophies === 3 || worldCup?.won}>
      {#if worldCup}
        {isPerfectWorldCup
          ? $t('result_hero.perfect_world_cup')
          : worldCup.won
            ? $t('result_hero.world_cup_won')
            : $t('result_hero.out_in', { values: { round: worldCup.exitRound } })}
      {:else}
        {result.trophies === 3
          ? $t('result_hero.treble_completed')
          : result.trophies === 0
            ? $t('result_hero.no_trophies')
            : result.trophies === 1
              ? $t('result_hero.one_trophy')
              : $t('result_hero.trophies_won', { values: { n: result.trophies } })}
      {/if}
    </p>
    <p class="result-next-challenge">{nextChallenge()}</p>
  </div>
  {#if worldCup}
    <div class="trophy-strip" aria-label="World Cup result">
      <span class:won={worldCup.won}>{$t('result_hero.trophy_world_cup')}</span>
      <span class:won={isPerfectWorldCup}>{$t('result_hero.trophy_8_0')}</span>
    </div>
  {:else}
    <div class="trophy-strip" aria-label={`${result.trophies} trophies`}>
      <span class:won={result.league.won}>{$t('result_hero.trophy_premier_league')}</span>
      <span class:won={result.faCup.won}>{$t('result_hero.trophy_fa_cup')}</span>
      <span class:won={result.championsLeague.won}>{$t('result_hero.trophy_champions_league')}</span>
    </div>
  {/if}
</section>
