<script lang="ts">
  import type { SimulationResult } from '$lib/game/types';
  import { t } from 'svelte-i18n';

  let { result }: { result: SimulationResult } = $props();

  const worldCup = $derived(result.worldCup);
  const perfectLeague = $derived(result.league.wins === 38 && result.league.draws === 0 && result.league.losses === 0);
  const perfectCl = $derived(
    result.championsLeague.won &&
      result.championsLeague.wins === 15 &&
      result.championsLeague.draws === 0 &&
      result.championsLeague.losses === 0,
  );
  const perfectWorldCup = $derived(
    Boolean(worldCup && worldCup.wins === 8 && worldCup.draws === 0 && worldCup.losses === 0 && worldCup.won),
  );
  const leagueResultsOffPerfect = $derived(38 - result.league.wins);
  const clResultsOffPerfect = $derived(15 - result.championsLeague.wins);
  const plProgress = $derived(Math.max(0, Math.min(100, Math.round((result.league.wins / 38) * 100))));
  const clProgress = $derived(Math.max(0, Math.min(100, Math.round((result.championsLeague.wins / 15) * 100))));
  const combinedProgress = $derived(
    Math.max(0, Math.min(100, Math.round(((result.league.wins + result.championsLeague.wins) / 53) * 100))),
  );
  const plDroppedPoints = $derived(result.league.draws + result.league.losses * 3);
  const clSlips = $derived(result.championsLeague.draws + result.championsLeague.losses);

  const plNextLine = $derived((): string | null => {
    if (perfectLeague) return null;
    if (!result.league.won) {
      if (result.league.position === 2) return $t('breakdown.pl_runners_up');
      if (result.league.position <= 4) return $t('breakdown.pl_top_four');
      return $t('breakdown.pl_outside_top_four');
    }
    const n = leagueResultsOffPerfect;
    const r = n === 1 ? $t('breakdown.result_one') : $t('breakdown.result_other');
    const d = result.league.draws === 1 ? $t('breakdown.draw_one') : $t('breakdown.draw_other');
    const l = result.league.losses === 1 ? $t('breakdown.loss_one') : $t('breakdown.loss_other');
    return $t('breakdown.pl_38_away', { values: { n, result: r, draws: result.league.draws, draw: d, losses: result.league.losses, loss: l, pts: plDroppedPoints } });
  });

  const clNextLine = $derived((): string | null => {
    if (perfectCl) return null;
    if (!result.championsLeague.won) {
      if (result.championsLeague.exitRound === 'Final') return $t('breakdown.cl_final_beaten');
      if (result.championsLeague.exitRound === 'Semi-final') return $t('breakdown.cl_semi_exit');
      if (result.championsLeague.exitRound === 'Quarter-final') return $t('breakdown.cl_quarter_exit');
      if (result.championsLeague.exitRound === 'Round of 16') return $t('breakdown.cl_r16_exit');
      return $t('breakdown.cl_league_phase');
    }
    const n = clResultsOffPerfect;
    const r = n === 1 ? $t('breakdown.result_one') : $t('breakdown.result_other');
    const s = clSlips === 1 ? $t('breakdown.slip_one') : $t('breakdown.slip_other');
    return $t('breakdown.cl_15_away', { values: { n, result: r, slips: clSlips, slip: s } });
  });

  function combinedMsg(): string {
    if (combinedProgress === 100) return $t('breakdown.combined_flawless');
    if (combinedProgress >= 80) return $t('breakdown.combined_elite');
    if (combinedProgress >= 60) return $t('breakdown.combined_pushing');
    return $t('breakdown.combined_room');
  }

  function wcSlipsMsg(): string {
    if (!worldCup) return '';
    const slips = worldCup.draws + worldCup.losses;
    const away = 8 - worldCup.wins;
    if (away === 1) return $t('breakdown.wc_slips_one', { values: { n: away, slips } });
    return $t('breakdown.wc_slips_other', { values: { n: away, slips } });
  }
</script>

<section class="breakdown-grid">
  {#if worldCup}
    <article class:won={worldCup.won}>
      <span>{worldCup.won ? $t('breakdown.wc_won_label') : $t('breakdown.wc_label')}</span>
      <h2>{perfectWorldCup ? $t('breakdown.wc_perfect') : worldCup.won ? $t('breakdown.wc_winners') : worldCup.exitRound}</h2>
      <p class="league-record">
        {worldCup.wins}W / {worldCup.draws}D / {worldCup.losses}L
        <span class="record-pts">{$t('breakdown.wc_target')}</span>
      </p>
      <p class="league-goals">
        GF {worldCup.goalsFor} / GA {worldCup.goalsAgainst} / GD {worldCup.goalsFor - worldCup.goalsAgainst > 0 ? '+' : ''}{worldCup.goalsFor - worldCup.goalsAgainst}
      </p>
      {#if perfectWorldCup}
        <p>{$t('breakdown.wc_flawless')}</p>
      {:else if worldCup.won}
        <p>{worldCup.group}</p>
        <p>{wcSlipsMsg()}</p>
      {:else if worldCup.exitRound === 'Final'}
        <p>{$t('breakdown.wc_final_exit')}</p>
      {:else if worldCup.exitRound === 'Semi-final'}
        <p>{$t('breakdown.wc_semi_exit', { values: { opponent: worldCup.opponent ? $t('breakdown.lost_to', { values: { opponent: worldCup.opponent } }) : '' } })}</p>
      {:else if worldCup.exitRound === 'Quarter-final'}
        <p>{$t('breakdown.wc_quarter_exit', { values: { opponent: worldCup.opponent ? $t('breakdown.lost_to', { values: { opponent: worldCup.opponent } }) : '' } })}</p>
      {:else if worldCup.exitRound === 'Round of 16' || worldCup.exitRound === 'Round of 32'}
        <p>{$t('breakdown.wc_early_exit', { values: { opponent: worldCup.opponent ? $t('breakdown.lost_to', { values: { opponent: worldCup.opponent } }) : '' } })}</p>
      {:else}
        <p>{$t('breakdown.wc_group_exit')}</p>
      {/if}
    </article>
  {:else}
    <article class="perfect-hunt" style="grid-column: 1 / -1;">
      <span>{$t('breakdown.perfect_hunt')}</span>
      <h2>{$t('breakdown.perfect_hunt_target')}</h2>
      <p class="hunt-summary">
        {$t('breakdown.combined_progress', { values: { pct: combinedProgress } })}{combinedMsg()}
      </p>
      <div class="hunt-grid">
        <section class="hunt-track" class:track-complete={perfectLeague}>
          <header>
            <strong>{$t('breakdown.pl_label')}</strong>
            <em>{$t('breakdown.pl_wins', { values: { wins: result.league.wins } })}</em>
          </header>
          <div class="hunt-bar" role="presentation" aria-hidden="true">
            <span style={`width: ${plProgress}%`}></span>
          </div>
          {#if perfectLeague}
            <p>{$t('breakdown.pl_perfect')}</p>
          {:else if result.league.won}
            <p>{leagueResultsOffPerfect === 1 ? $t('breakdown.pl_short_one', { values: { n: leagueResultsOffPerfect, pts: plDroppedPoints } }) : $t('breakdown.pl_short_other', { values: { n: leagueResultsOffPerfect, pts: plDroppedPoints } })}</p>
          {:else}
            <p>{$t('breakdown.pl_win_first')}</p>
          {/if}
        </section>

        <section class="hunt-track" class:track-complete={perfectCl}>
          <header>
            <strong>{$t('breakdown.cl_label')}</strong>
            <em>{$t('breakdown.cl_wins', { values: { wins: result.championsLeague.wins } })}</em>
          </header>
          <div class="hunt-bar" role="presentation" aria-hidden="true">
            <span style={`width: ${clProgress}%`}></span>
          </div>
          {#if perfectCl}
            <p>{$t('breakdown.cl_perfect')}</p>
          {:else if result.championsLeague.won}
            <p>{clResultsOffPerfect === 1 ? $t('breakdown.cl_short_one', { values: { n: clResultsOffPerfect, slips: clSlips } }) : $t('breakdown.cl_short_other', { values: { n: clResultsOffPerfect, slips: clSlips } })}</p>
          {:else}
            <p>{$t('breakdown.cl_win_first')}</p>
          {/if}
        </section>
      </div>
    </article>

    <article class:won={result.league.won}>
      <span>{result.league.won ? $t('breakdown.pl_won_label') : $t('breakdown.pl_label')}</span>
      <h2>{perfectLeague ? $t('breakdown.pl_perfect_label') : result.league.label}</h2>
      <p class="league-record">
        {result.league.wins}W / {result.league.draws}D / {result.league.losses}L
        <span class="record-pts">{$t('breakdown.pl_pts', { values: { pts: result.league.points } })}</span>
      </p>
      <p class="league-goals">
        GF {result.league.goalsFor} / GA {result.league.goalsAgainst} / GD {result.league.goalsFor - result.league.goalsAgainst > 0 ? '+' : ''}{result.league.goalsFor - result.league.goalsAgainst}
      </p>
      {#if plNextLine()}
        <p>{plNextLine()}</p>
      {/if}
    </article>

    <article class:won={result.faCup.won}>
      <span>{result.faCup.won ? $t('breakdown.fa_won_label') : $t('breakdown.fa_label')}</span>
      <h2>{result.faCup.won ? $t('breakdown.fa_winners') : result.faCup.exitRound}</h2>
      <p>
        {#if result.faCup.won}
          {$t('breakdown.fa_all_rounds')}
        {:else if result.faCup.opponent}
          {$t('breakdown.fa_lost_to', { values: { opponent: result.faCup.opponent } })}
        {:else}
          {$t('breakdown.fa_knocked_out', { values: { round: result.faCup.exitRound } })}
        {/if}
      </p>
    </article>

    <article class:won={result.championsLeague.won}>
      <span>{result.championsLeague.won ? $t('breakdown.cl_won_label') : $t('breakdown.cl_label')}</span>
      <h2>{perfectCl ? $t('breakdown.cl_perfect_label') : result.championsLeague.won ? $t('breakdown.wc_winners') : result.championsLeague.exitRound}</h2>
      <p class="league-record">
        {result.championsLeague.wins}W / {result.championsLeague.draws}D / {result.championsLeague.losses}L
        <span class="record-pts">{$t('breakdown.cl_target')}</span>
      </p>
      <p>
        {#if result.championsLeague.won}
          {result.championsLeague.group}
        {:else if result.championsLeague.exitRound === 'League phase'}
          {$t('breakdown.dropped_league_phase', { values: { opponent: result.championsLeague.opponent ? $t('breakdown.vs_opponent', { values: { opponent: result.championsLeague.opponent } }) : '' } })}
        {:else if result.championsLeague.opponent}
          {$t('breakdown.fa_lost_to', { values: { opponent: result.championsLeague.opponent } })}
        {:else}
          {result.championsLeague.group}
        {/if}
      </p>
      {#if clNextLine()}
        <p>{clNextLine()}</p>
      {/if}
    </article>
  {/if}
</section>
