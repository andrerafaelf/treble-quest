<script lang="ts">
  import type { SimulationResult } from '$lib/game/types';

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
      <p class="league-goals">
        GF {worldCup.goalsFor} / GA {worldCup.goalsAgainst} / GD {worldCup.goalsFor - worldCup.goalsAgainst > 0
          ? '+'
          : ''}{worldCup.goalsFor - worldCup.goalsAgainst}
      </p>
      {#if !worldCup.won && worldCup.opponent}
        <p>Lost to {worldCup.opponent}</p>
      {:else}
        <p>{worldCup.group}</p>
      {/if}
    </article>
  {:else}
    <article class="perfect-hunt" style="grid-column: 1 / -1;">
      <span>Perfect Season Chase</span>
      <h2>38-0 + 15-0</h2>
      <p class="hunt-summary">
        Combined chase progress: <strong>{combinedProgress}%</strong>
      </p>
      <div class="hunt-grid">
        <section class="hunt-track" class:track-complete={perfectLeague}>
          <header>
            <strong>Premier League</strong>
            <em>{result.league.wins}/38 wins</em>
          </header>
          <div class="hunt-bar" role="presentation" aria-hidden="true">
            <span style={`width: ${plProgress}%`}></span>
          </div>
          {#if perfectLeague}
            <p>Perfect complete. 114/114 points.</p>
          {:else}
            <p>
              {leagueResultsOffPerfect} results short. {plDroppedPoints} points dropped from the perfect 114.
            </p>
          {/if}
        </section>

        <section class="hunt-track" class:track-complete={perfectCl}>
          <header>
            <strong>Champions League</strong>
            <em>{result.championsLeague.wins}/15 wins</em>
          </header>
          <div class="hunt-bar" role="presentation" aria-hidden="true">
            <span style={`width: ${clProgress}%`}></span>
          </div>
          {#if perfectCl}
            <p>Perfect complete. 15 wins from 15.</p>
          {:else}
            <p>
              {clResultsOffPerfect} results short. {clSlips} slip{clSlips === 1 ? '' : 's'} so far - target allows zero.
            </p>
          {/if}
        </section>
      </div>
    </article>

    <article class:won={result.league.won}>
      <span>{result.league.won ? 'Premier League won' : 'Premier League'}</span>
      <h2>{perfectLeague ? 'Perfect 38-0' : result.league.label}</h2>
      <p class="league-record">
        {result.league.wins}W / {result.league.draws}D / {result.league.losses}L
        <span class="record-pts">{result.league.points} pts</span>
      </p>
      <p class="league-goals">
        GF {result.league.goalsFor} / GA {result.league.goalsAgainst} / GD {result.league.goalsFor -
          result.league.goalsAgainst >
        0
          ? '+'
          : ''}{result.league.goalsFor - result.league.goalsAgainst}
      </p>
      {#if !perfectLeague}
        <p>
          Next target: 38-0. Convert {result.league.draws} draw{result.league.draws === 1 ? '' : 's'} and {result.league
            .losses} loss{result.league.losses === 1 ? '' : 'es'} into wins ({leagueResultsOffPerfect} results away).
        </p>
      {/if}
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
      {#if !perfectCl}
        <p>
          {#if result.championsLeague.won}
            Next target: 15-0. Convert {result.championsLeague.draws} draw{result.championsLeague.draws === 1
              ? ''
              : 's'} and
            {result.championsLeague.losses} loss{result.championsLeague.losses === 1 ? '' : 'es'} into wins ({clResultsOffPerfect}
            results away).
          {:else}
            Next target: 15-0. First step is lifting this trophy, then chasing 15 wins with zero slips.
          {/if}
        </p>
      {/if}
    </article>
  {/if}
</section>
