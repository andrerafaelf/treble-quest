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

  // PL lure copy
  const plNextLine = $derived(() => {
    if (perfectLeague) return null;
    if (!result.league.won) {
      if (result.league.position <= 2) return `${result.league.position === 2 ? 'Runners-up' : ordinal(result.league.position)}. One stronger XI wins this. Go again.`;
      if (result.league.position <= 4) return `Top four, but the title is what counts. Upgrade your weakest slot and push for 1st.`;
      return `Outside the top four. The gap to the title can be closed — start with a better draft.`;
    }
    return `38-0 is ${leagueResultsOffPerfect} result${leagueResultsOffPerfect === 1 ? '' : 's'} away. Convert ${result.league.draws} draw${result.league.draws === 1 ? '' : 's'} and ${result.league.losses} loss${result.league.losses === 1 ? '' : 'es'} — ${plDroppedPoints} points dropped from a perfect 114.`;
  });

  // CL lure copy
  const clNextLine = $derived(() => {
    if (perfectCl) return null;
    if (!result.championsLeague.won) {
      if (result.championsLeague.exitRound === 'Final') return `Final beaten. One more match to be European champion. Come back and finish it.`;
      if (result.championsLeague.exitRound === 'Semi-final') return `Semi-final exit. Four rounds from glory — a better squad gets through.`;
      if (result.championsLeague.exitRound === 'Quarter-final') return `Quarter-final exit. Six rounds from the top. Build a side that lasts the distance.`;
      if (result.championsLeague.exitRound === 'Round of 16') return `Round of 16 exit. The knockout rounds demand elite players at every slot.`;
      return `Dropped in the league phase. Make the knockouts first, then chase the trophy.`;
    }
    return `15-0 is ${clResultsOffPerfect} result${clResultsOffPerfect === 1 ? '' : 's'} away. ${clSlips} slip${clSlips === 1 ? '' : 's'} cost you — the perfect run allows zero.`;
  });

  function ordinal(n: number): string {
    const t = n % 100;
    if (t >= 11 && t <= 13) return `${n}th`;
    const s = n % 10;
    return `${n}${s === 1 ? 'st' : s === 2 ? 'nd' : s === 3 ? 'rd' : 'th'}`;
  }
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
      {#if perfectWorldCup}
        <p>Flawless. 8 wins from 8. The perfect tournament.</p>
      {:else if worldCup.won}
        <p>{worldCup.group}</p>
        <p>8-0 is {8 - worldCup.wins} result{8 - worldCup.wins === 1 ? '' : 's'} away. {worldCup.draws + worldCup.losses} slip{worldCup.draws + worldCup.losses === 1 ? '' : 's'} cost you — the perfect run allows none.</p>
      {:else if worldCup.exitRound === 'Final'}
        <p>Final exit. One match from the trophy. Draft a stronger XI and go back.</p>
      {:else if worldCup.exitRound === 'Semi-final'}
        <p>Semi-final exit. {worldCup.opponent ? `Lost to ${worldCup.opponent}.` : ''} Three wins from the title — build the squad that gets there.</p>
      {:else if worldCup.exitRound === 'Quarter-final'}
        <p>Quarter-final exit. {worldCup.opponent ? `Lost to ${worldCup.opponent}.` : ''} The trophy needs four more rounds of wins.</p>
      {:else if worldCup.exitRound === 'Round of 16' || worldCup.exitRound === 'Round of 32'}
        <p>Early exit. {worldCup.opponent ? `Lost to ${worldCup.opponent}.` : ''} Elite-rated players survive the knockout rounds — upgrade your squad.</p>
      {:else}
        <p>Group stage exit. The dream starts by getting out of the group.</p>
      {/if}
    </article>
  {:else}
    <article class="perfect-hunt" style="grid-column: 1 / -1;">
      <span>Perfect Season Chase</span>
      <h2>38-0 + 15-0</h2>
      <p class="hunt-summary">
        Combined chase progress: <strong>{combinedProgress}%</strong>
        {#if combinedProgress === 100}— flawless.{:else if combinedProgress >= 80} — elite territory.{:else if combinedProgress >= 60} — pushing for it.{:else} — room to grow.{/if}
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
            <p>Perfect. 114/114 points. Nothing left to prove in the league.</p>
          {:else if result.league.won}
            <p>{leagueResultsOffPerfect} result{leagueResultsOffPerfect === 1 ? '' : 's'} short of 38-0. {plDroppedPoints} points dropped from perfect 114.</p>
          {:else}
            <p>Win the title first — then chase 38-0.</p>
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
            <p>Perfect. 15 wins from 15. Europe conquered without a slip.</p>
          {:else if result.championsLeague.won}
            <p>{clResultsOffPerfect} result{clResultsOffPerfect === 1 ? '' : 's'} short of 15-0. {clSlips} slip{clSlips === 1 ? '' : 's'} — the perfect run allows zero.</p>
          {:else}
            <p>Lift the trophy first — then hunt the perfect 15-0.</p>
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
      {#if plNextLine()}
        <p>{plNextLine()}</p>
      {/if}
    </article>

    <article class:won={result.faCup.won}>
      <span>{result.faCup.won ? 'FA Cup won' : 'FA Cup'}</span>
      <h2>{result.faCup.won ? 'Winners' : result.faCup.exitRound}</h2>
      <p>
        {#if result.faCup.won}
          All six rounds won.
        {:else if result.faCup.opponent}
          Lost to {result.faCup.opponent}.
        {:else}
          Knocked out in {result.faCup.exitRound}.
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
          Dropped in league phase{result.championsLeague.opponent ? ` — vs ${result.championsLeague.opponent}` : ''}.
        {:else if result.championsLeague.opponent}
          Lost to {result.championsLeague.opponent}.
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
