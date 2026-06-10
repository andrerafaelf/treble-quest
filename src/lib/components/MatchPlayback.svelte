<script lang="ts">
  import type { LeagueTableRow, Match, SimulationResult } from '$lib/game/types';
  import { onDestroy, onMount } from 'svelte';

  let {
    matches,
    leagueTable = [],
    result,
    teamName = 'Your XI',
    onDone,
  }: {
    matches: Match[];
    leagueTable?: LeagueTableRow[];
    result?: SimulationResult;
    teamName?: string;
    onDone: () => void;
  } = $props();

  let simDone = $state(false);

  const SPEEDS = [
    { label: '0.5x', ms: 1200 },
    { label: '1x', ms: 600 },
    { label: '2x', ms: 300 },
    { label: '4x', ms: 130 },
    { label: '8x', ms: 55 },
  ];
  const DEFAULT_SPEED_INDEX = 1;
  const STORAGE_KEY = 'treble-quest-playback-speed';

  let currentIndex = $state(0);
  let runningTotals = $state({
    pl: { w: 0, d: 0, l: 0, pts: 0, gf: 0, ga: 0 },
    fac: '',
    cl: '',
    wc: { w: 0, d: 0, l: 0 },
  });
  let timer: ReturnType<typeof setInterval> | undefined;
  let paused = $state(false);
  let speedIndex = $state(loadSpeed());
  let activeTab = $state<'pl' | 'cl' | 'fac' | 'wc'>('pl');

  // Track per-match history for live standings
  let plHistory = $state<Match[]>([]);
  let clHistory = $state<Match[]>([]);
  let facHistory = $state<Match[]>([]);
  let wcHistory = $state<Match[]>([]);

  function loadSpeed(): number {
    if (typeof localStorage === 'undefined') return DEFAULT_SPEED_INDEX;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SPEED_INDEX;
    const parsed = parseInt(raw, 10);
    if (Number.isNaN(parsed) || parsed < 0 || parsed >= SPEEDS.length) return DEFAULT_SPEED_INDEX;
    return parsed;
  }

  function setSpeed(idx: number) {
    speedIndex = idx;
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, String(idx));
    restartTimer();
  }

  function restartTimer() {
    if (timer) clearInterval(timer);
    if (!paused) timer = setInterval(tick, SPEEDS[speedIndex].ms);
  }

  function tick() {
    if (paused) return;
    if (currentIndex >= matches.length - 1) {
      stop();
      simDone = true;
      activeTab = hasWorldCup ? 'wc' : 'pl';
      return;
    }
    currentIndex += 1;
    accumulate(matches[currentIndex]);
  }

  function accumulate(m: Match) {
    if (m.competition === 'WC') {
      if (m.result === 'W') runningTotals.wc.w += 1;
      else if (m.result === 'D') runningTotals.wc.d += 1;
      else runningTotals.wc.l += 1;
      wcHistory = [...wcHistory, m];
      activeTab = 'wc';
    } else if (m.competition === 'PL') {
      if (m.result === 'W') {
        runningTotals.pl.w += 1;
        runningTotals.pl.pts += 3;
      } else if (m.result === 'D') {
        runningTotals.pl.d += 1;
        runningTotals.pl.pts += 1;
      } else {
        runningTotals.pl.l += 1;
      }
      runningTotals.pl.gf += m.gf;
      runningTotals.pl.ga += m.ga;
      plHistory = [...plHistory, m];
      if (activeTab !== 'pl') activeTab = 'pl';
    } else if (m.competition === 'FAC') {
      runningTotals.fac = m.result === 'W' ? `${m.round} won` : `${m.round} out`;
      facHistory = [...facHistory, m];
      activeTab = 'fac';
    } else if (m.competition === 'CL') {
      runningTotals.cl = m.result === 'W' ? `${m.round} win` : (m.round ?? 'League phase');
      clHistory = [...clHistory, m];
      activeTab = 'cl';
    }
  }

  function start() {
    if (matches.length === 0) {
      onDone();
      return;
    }
    accumulate(matches[0]);
    timer = setInterval(tick, SPEEDS[speedIndex].ms);
  }

  function stop() {
    if (timer) clearInterval(timer);
    timer = undefined;
  }

  function skip() {
    stop();
    // Play through remaining matches to ensure all history is accumulated
    for (let i = currentIndex + 1; i < matches.length; i++) {
      currentIndex = i;
      accumulate(matches[i]);
    }
    simDone = true;
    activeTab = hasWorldCup ? 'wc' : 'pl';
  }

  function togglePause() {
    paused = !paused;
    restartTimer();
  }

  onMount(start);
  onDestroy(stop);

  const current = $derived(matches[currentIndex]);
  const progress = $derived(((currentIndex + 1) / matches.length) * 100);
  const hasWorldCup = $derived(matches.some((m) => m.competition === 'WC'));
  const hasCL = $derived(matches.some((m) => m.competition === 'CL'));
  const hasFAC = $derived(matches.some((m) => m.competition === 'FAC'));

  function compLabel(m: Match): string {
    if (m.competition === 'WC') return m.round ? `World Cup · ${m.round}` : 'World Cup';
    if (m.competition === 'PL') return 'Premier League';
    if (m.competition === 'FAC') return m.round ? `FA Cup · ${m.round}` : 'FA Cup';
    return m.round ? `Champions League · ${m.round}` : 'Champions League';
  }

  function scorerSummary(m: Match): string {
    if (m.scorers.length === 0) return '';
    const counts = new Map<string, number[]>();
    for (const s of m.scorers) {
      const arr = counts.get(s.name) ?? [];
      arr.push(s.minute);
      counts.set(s.name, arr);
    }
    return Array.from(counts.entries())
      .map(
        ([name, mins]) =>
          `${name} ${mins
            .sort((a, b) => a - b)
            .map((minute) => `${minute}'`)
            .join(' ')}`,
      )
      .join(' · ');
  }

  // Derive PL table stats from plHistory
  const plGd = $derived(runningTotals.pl.gf - runningTotals.pl.ga);
  const plPlayed = $derived(plHistory.length);

  // Last 5 PL results
  const plLast5 = $derived(plHistory.slice(-5));

  // Live table: every club progresses together. The user row uses real running
  // totals from played matches; AI clubs are scaled to the same point in the season
  // (played/38 of their final stats) so the whole table climbs as games go on, rather
  // than freezing the AI at full-season totals while only the user moves.
  const liveTable = $derived(
    (() => {
      if (!leagueTable.length) return leagueTable;
      const fraction = plPlayed >= 38 ? 1 : plPlayed / 38;
      const rows: LeagueTableRow[] = leagueTable.map((row) => {
        if (row.isUser) {
          return {
            ...row,
            played: plPlayed,
            wins: runningTotals.pl.w,
            draws: runningTotals.pl.d,
            losses: runningTotals.pl.l,
            goalsFor: runningTotals.pl.gf,
            goalsAgainst: runningTotals.pl.ga,
            goalDifference: runningTotals.pl.gf - runningTotals.pl.ga,
            points: runningTotals.pl.pts,
          };
        }
        if (fraction >= 1) return row;
        const played = Math.round(38 * fraction);
        const wins = Math.round(row.wins * fraction);
        const draws = Math.round(row.draws * fraction);
        const losses = Math.max(0, played - wins - draws);
        const goalsFor = Math.round(row.goalsFor * fraction);
        const goalsAgainst = Math.round(row.goalsAgainst * fraction);
        return {
          ...row,
          played,
          wins,
          draws,
          losses,
          goalsFor,
          goalsAgainst,
          goalDifference: goalsFor - goalsAgainst,
          points: wins * 3 + draws,
        };
      });
      rows.sort(
        (a, b) =>
          b.points - a.points ||
          b.goalDifference - a.goalDifference ||
          b.goalsFor - a.goalsFor ||
          a.club.localeCompare(b.club),
      );
      return rows;
    })(),
  );

  function computeAchievements(r: SimulationResult): string[] {
    const a: string[] = [];
    if (r.worldCup) {
      if (r.worldCup.won) a.push(r.worldCup.losses === 0 ? 'WORLD CONQUERORS' : 'WORLD CHAMPIONS');
      return a;
    }
    if (r.league.wins === 38) a.push('PERFECTOS');
    else if (r.league.losses === 0) a.push('INVINCIBLES');
    else if (r.league.points >= 100) a.push('CENTURIONS');
    if (r.championsLeague.won) a.push(r.championsLeague.losses === 0 ? 'PERFECT EUROPEANS' : 'EUROPEAN CHAMPIONS');
    if (r.faCup.won) {
      const facConceded = r.matches.filter((m) => m.competition === 'FAC').reduce((s, m) => s + m.ga, 0);
      a.push(facConceded === 0 ? 'CUP KINGS' : 'FA CUP WINNERS');
    }
    return a;
  }

  // CL status
  type ClPhase = { round: string; won: boolean; opponent: string; agg?: string };
  const clPhases = $derived<ClPhase[]>(
    (() => {
      const phases: ClPhase[] = [];
      // Group phase: cluster consecutive CL matches without rounds or with 'League phase'
      const groupMatches = clHistory.filter((m) => !m.round || m.round === 'League phase');
      if (groupMatches.length > 0) {
        const gw = groupMatches.filter((m) => m.result === 'W').length;
        const gd = groupMatches.filter((m) => m.result === 'D').length;
        const gl = groupMatches.filter((m) => m.result === 'L').length;
        const gpts = gw * 3 + gd;
        phases.push({ round: 'League Phase', won: gpts >= 10, opponent: `${gw}W ${gd}D ${gl}L · ${gpts} pts` });
      }
      // Knockout rounds — use aggregate match (last leg of each tie)
      const knockoutRounds = ['Round of 16', 'Quarter-final', 'Semi-final', 'Final'];
      for (const r of knockoutRounds) {
        const legs = clHistory.filter((m) => m.round === r);
        if (legs.length === 0) continue;
        const last = legs[legs.length - 1];
        const agg = last.aggregate ? `${last.aggregate.gf}–${last.aggregate.ga} agg` : undefined;
        phases.push({
          round: r,
          won: last.result === 'W' && (!last.aggregate || last.aggregate.gf > last.aggregate.ga),
          opponent: last.opponent,
          agg,
        });
      }
      return phases;
    })(),
  );

  // FA Cup rounds (always single-match, no aggregates)
  type FacRound = { round: string; opponent: string; result: 'W' | 'D' | 'L'; score: string };
  const facRounds = $derived<FacRound[]>(
    facHistory.map((m) => ({
      round: m.round ?? 'Round',
      opponent: m.opponent,
      result: m.result,
      score: `${m.gf}–${m.ga}`,
    })),
  );

  // WC rounds
  const wcRounds = $derived<FacRound[]>(
    wcHistory.map((m) => ({
      round: m.round ?? 'Match',
      opponent: m.opponent,
      result: m.result,
      score: `${m.gf}–${m.ga}`,
    })),
  );
</script>

<section class="playback" aria-label="Match-by-match season playback">
  {#if simDone}
    <!-- Done state: show final standings + prompt -->
    <div class="sim-done-banner">
      <div class="sim-done-outcome">
        {#if result}
          <span class="sim-done-label">
            {result.trophies === 3
              ? '🏆 Treble!'
              : result.worldCup?.won
                ? '🏆 World Cup!'
                : result.league.won
                  ? '🏆 Champions!'
                  : result.trophies > 0
                    ? '🏆 Trophy winner!'
                    : `Finished ${result.league.position === 1 ? '1st' : result.league.position + 'th'}`}
          </span>
          {#if !result.worldCup}
            <span class="sim-done-pts"
              >{result.league.points} pts · {result.league.wins}-{result.league.draws}-{result.league.losses}</span
            >
          {:else}
            <span class="sim-done-pts"
              >{result.worldCup.wins}-{result.worldCup.draws}-{result.worldCup.losses} in World Cup</span
            >
          {/if}
          {@const achievements = computeAchievements(result)}
          {#if achievements.length > 0}
            <div class="sim-achievements">
              {#each achievements as ach}
                <span class="sim-ach-pill">{ach}</span>
              {/each}
            </div>
          {/if}
        {/if}
      </div>
      <button class="sim-done-cta" onclick={onDone}>View Full Results →</button>
    </div>
  {:else}
    <div class="playback-header">
      <span class="playback-eyebrow">Match {currentIndex + 1} / {matches.length}</span>
      <div class="playback-controls">
        <div class="pb-speed" role="group" aria-label="Playback speed">
          {#each SPEEDS as s, i (s.label)}
            <button
              type="button"
              class="pb-speed-btn"
              class:active={speedIndex === i}
              onclick={() => setSpeed(i)}
              aria-label={`${s.label} speed`}
              aria-pressed={speedIndex === i}>{s.label}</button
            >
          {/each}
        </div>
        <button type="button" class="pb-btn pb-pause" onclick={togglePause}>
          {paused ? 'Resume' : 'Pause'}
        </button>
        <button type="button" class="pb-btn pb-skip" onclick={skip}>Skip</button>
      </div>
    </div>

    <div class="playback-progress">
      <div class="playback-progress-fill" style="width: {progress}%"></div>
    </div>

    {#if current}
      <article class="playback-match playback-{current.result.toLowerCase()}">
        <span class="pm-comp">{compLabel(current)}</span>
        <span class="pm-date"
          >{current.date} · {current.venue === 'H' ? 'Home' : current.venue === 'A' ? 'Away' : 'Neutral'}</span
        >
        <div class="pm-score-row">
          <span class="pm-opp">{current.venue === 'A' ? current.opponent : teamName}</span>
          <span class="pm-score"
            >{current.venue === 'A' ? current.ga : current.gf} – {current.venue === 'A' ? current.gf : current.ga}</span
          >
          <span class="pm-opp">{current.venue === 'A' ? teamName : current.opponent}</span>
        </div>
        <div class="pm-badge pm-badge-{current.result.toLowerCase()}">
          {current.result === 'W' ? 'WIN' : current.result === 'D' ? 'DRAW' : 'LOSS'}
        </div>
        {#if current.scorers.length > 0}
          <p class="pm-scorers">{scorerSummary(current)}</p>
        {/if}
        {#if current.aggregate}
          <p class="pm-agg">Aggregate {current.aggregate.gf}–{current.aggregate.ga}</p>
        {/if}
      </article>
    {/if}
  {/if}

  <!-- Live standings panel — always visible -->
  <div class="standings">
    <div class="standings-tabs" role="tablist">
      {#if !hasWorldCup}
        <button role="tab" class:active={activeTab === 'pl'} onclick={() => (activeTab = 'pl')}>PL</button>
        {#if hasCL}
          <button role="tab" class:active={activeTab === 'cl'} onclick={() => (activeTab = 'cl')}>UCL</button>
        {/if}
        {#if hasFAC}
          <button role="tab" class:active={activeTab === 'fac'} onclick={() => (activeTab = 'fac')}>FA Cup</button>
        {/if}
      {:else}
        <button role="tab" class:active={activeTab === 'wc'} onclick={() => (activeTab = 'wc')}>World Cup</button>
      {/if}
    </div>

    <div class="standings-body">
      {#if activeTab === 'pl'}
        <!-- Full PL table — final rows if simDone, live user row during playback -->
        {#if simDone && leagueTable.length > 0}
          <div class="st-full-table">
            <div class="st-row st-head">
              <span class="st-rank">#</span>
              <span class="st-club-col">Club</span>
              <span class="st-num">P</span>
              <span class="st-num">W</span>
              <span class="st-num">D</span>
              <span class="st-num">L</span>
              <span class="st-num st-gd">GD</span>
              <span class="st-num st-pts">Pts</span>
            </div>
            {#each leagueTable as row, idx}
              <div
                class="st-row"
                class:st-user={row.isUser}
                class:st-cl-spot={idx < 4 && !row.isUser}
                class:st-rel={idx >= 17 && !row.isUser}
              >
                <span class="st-rank">{idx + 1}</span>
                <span class="st-club-col" class:st-user-name={row.isUser}>{row.club}</span>
                <span class="st-num">{row.played}</span>
                <span class="st-num">{row.wins}</span>
                <span class="st-num">{row.draws}</span>
                <span class="st-num">{row.losses}</span>
                <span class="st-num st-gd">{row.goalDifference > 0 ? '+' : ''}{row.goalDifference}</span>
                <span class="st-num st-pts">{row.points}</span>
              </div>
            {/each}
          </div>
        {:else}
          <!-- Live: full table with user row updating live, others show their final standings -->
          <div class="st-full-table">
            <div class="st-row st-head">
              <span class="st-rank">#</span>
              <span class="st-club-col">Club</span>
              <span class="st-num">P</span>
              <span class="st-num">W</span>
              <span class="st-num">D</span>
              <span class="st-num">L</span>
              <span class="st-num st-gd">GD</span>
              <span class="st-num st-pts">Pts</span>
            </div>
            {#each liveTable as row, idx}
              <div
                class="st-row"
                class:st-user={row.isUser}
                class:st-cl-spot={idx < 4 && !row.isUser}
                class:st-rel={idx >= 17 && !row.isUser}
              >
                <span class="st-rank">{idx + 1}</span>
                <span class="st-club-col" class:st-user-name={row.isUser}>{row.club}</span>
                <span class="st-num" class:st-dim={!row.isUser}>{row.played}</span>
                <span class="st-num" class:st-dim={!row.isUser}>{row.wins}</span>
                <span class="st-num" class:st-dim={!row.isUser}>{row.draws}</span>
                <span class="st-num" class:st-dim={!row.isUser}>{row.losses}</span>
                <span class="st-num st-gd" class:st-dim={!row.isUser}
                  >{row.goalDifference > 0 ? '+' : ''}{row.goalDifference}</span
                >
                <span class="st-num st-pts" class:st-dim={!row.isUser}>{row.points}</span>
              </div>
            {/each}
            {#if plLast5.length > 0}
              <div class="st-form">
                <span class="st-form-label">Form</span>
                <div class="st-form-badges">
                  {#each plLast5 as m}
                    <span class="st-form-badge st-form-{m.result.toLowerCase()}">{m.result}</span>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        {/if}
      {:else if activeTab === 'cl'}
        <div class="st-bracket">
          {#if clPhases.length === 0}
            <p class="st-empty">Champions League starts soon</p>
          {:else}
            {#each clPhases as phase}
              <div
                class="st-bracket-row"
                class:won={phase.won}
                class:lost={!phase.won && clPhases[clPhases.length - 1] === phase}
              >
                <span class="st-bracket-round">{phase.round}</span>
                <span class="st-bracket-opp">{phase.opponent}</span>
                {#if phase.agg}
                  <span class="st-bracket-agg">{phase.agg}</span>
                {/if}
                <span class="st-bracket-badge" class:win={phase.won} class:loss={!phase.won}>
                  {phase.won ? '✓' : '✗'}
                </span>
              </div>
            {/each}
          {/if}
        </div>
      {:else if activeTab === 'fac'}
        <div class="st-bracket">
          {#if facRounds.length === 0}
            <p class="st-empty">FA Cup starts soon</p>
          {:else}
            {#each facRounds as r}
              <div class="st-bracket-row" class:won={r.result === 'W'} class:lost={r.result === 'L'}>
                <span class="st-bracket-round">{r.round}</span>
                <span class="st-bracket-opp">{r.opponent}</span>
                <span class="st-bracket-score">{r.score}</span>
                <span
                  class="st-bracket-badge"
                  class:win={r.result === 'W'}
                  class:draw={r.result === 'D'}
                  class:loss={r.result === 'L'}
                >
                  {r.result}
                </span>
              </div>
            {/each}
          {/if}
        </div>
      {:else if activeTab === 'wc'}
        <div class="st-bracket">
          {#if wcRounds.length === 0}
            <p class="st-empty">World Cup group stage</p>
          {:else}
            {#each wcRounds as r}
              <div class="st-bracket-row" class:won={r.result === 'W'} class:lost={r.result === 'L'}>
                <span class="st-bracket-round">{r.round}</span>
                <span class="st-bracket-opp">{r.opponent}</span>
                <span class="st-bracket-score">{r.score}</span>
                <span
                  class="st-bracket-badge"
                  class:win={r.result === 'W'}
                  class:draw={r.result === 'D'}
                  class:loss={r.result === 'L'}
                >
                  {r.result}
                </span>
              </div>
            {/each}
            <div class="st-wc-target">
              <span>Target: 8-0-0</span>
              <strong>{runningTotals.wc.w}W · {runningTotals.wc.d}D · {runningTotals.wc.l}L</strong>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</section>

<style>
  /* Done banner */
  .sim-done-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1rem;
    background: rgba(16, 185, 129, 0.08);
    border: 1px solid rgba(16, 185, 129, 0.2);
    border-radius: 8px;
    margin-bottom: 0.75rem;
  }

  .sim-done-outcome {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .sim-done-label {
    font-size: 1rem;
    font-weight: 800;
    color: #f8fafc;
  }

  .sim-done-pts {
    font-size: 0.75rem;
    color: var(--muted);
  }

  .sim-achievements {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 4px;
  }

  .sim-ach-pill {
    font-size: 0.6rem;
    font-weight: 800;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    padding: 2px 7px;
    border-radius: 4px;
    background: rgba(255, 215, 0, 0.15);
    color: #ffd700;
    border: 1px solid rgba(255, 215, 0, 0.3);
  }

  .sim-done-cta {
    background: var(--accent);
    color: #fff;
    border: none;
    border-radius: 6px;
    padding: 0.6rem 1.1rem;
    font-weight: 800;
    font-size: 0.85rem;
    cursor: pointer;
    white-space: nowrap;
    transition: opacity 0.15s;
  }

  .sim-done-cta:hover {
    opacity: 0.88;
  }

  .standings {
    margin-top: 0.75rem;
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 8px;
    overflow: hidden;
  }

  .standings-tabs {
    display: flex;
    border-bottom: 1px solid var(--line);
  }

  .standings-tabs button {
    flex: 1;
    background: none;
    border: none;
    color: var(--muted);
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    padding: 0.5rem 0.25rem;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition:
      color 0.15s,
      border-color 0.15s;
  }

  .standings-tabs button:hover {
    color: var(--text);
  }

  .standings-tabs button.active {
    color: var(--accent);
    border-bottom-color: var(--accent);
  }

  .standings-body {
    padding: 0.75rem;
  }

  /* Full PL table */
  .st-full-table {
    overflow-x: auto;
  }

  .st-row {
    display: grid;
    grid-template-columns: 1.4rem 1fr repeat(4, 1.6rem) 2.2rem 2.2rem;
    align-items: center;
    gap: 0;
    padding: 0.22rem 0.25rem;
    border-radius: 4px;
    font-size: 0.75rem;
  }

  .st-head {
    font-size: 0.6rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--muted);
    border-bottom: 1px solid var(--line);
    padding-bottom: 0.3rem;
    margin-bottom: 0.15rem;
    border-radius: 0;
  }

  .st-user {
    background: rgba(230, 57, 70, 0.08);
    border-left: 2px solid var(--accent);
    padding-left: 0.15rem;
  }

  .st-cl-spot {
    border-left: 2px solid rgba(69, 123, 157, 0.4);
    padding-left: 0.15rem;
  }

  .st-rel {
    opacity: 0.6;
  }

  .st-rank {
    font-size: 0.65rem;
    color: var(--muted);
    text-align: center;
    font-variant-numeric: tabular-nums;
  }

  .st-club-col {
    font-size: 0.75rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding-right: 0.25rem;
  }

  .st-user-name {
    color: var(--accent);
    font-weight: 700;
  }

  .st-num {
    text-align: center;
    font-size: 0.72rem;
    color: var(--muted);
    font-variant-numeric: tabular-nums;
  }

  .st-gd {
    color: var(--text);
  }

  .st-pts {
    color: var(--gold);
    font-weight: 700;
  }

  .st-dim {
    opacity: 0.3;
  }

  /* Form */
  .st-form {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.6rem;
    padding-top: 0.6rem;
    border-top: 1px solid var(--line);
  }

  .st-form-label {
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--muted);
  }

  .st-form-badges {
    display: flex;
    gap: 3px;
  }

  .st-form-badge {
    width: 1.4rem;
    height: 1.4rem;
    border-radius: 3px;
    font-size: 0.6rem;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .st-form-w {
    background: rgba(16, 185, 129, 0.25);
    color: #10b981;
  }
  .st-form-d {
    background: rgba(148, 163, 184, 0.18);
    color: #94a3b8;
  }
  .st-form-l {
    background: rgba(230, 57, 70, 0.22);
    color: var(--accent);
  }

  /* Bracket (CL / FAC / WC) */
  .st-bracket {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .st-bracket-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.35rem 0.5rem;
    border-radius: 5px;
    background: var(--surface-2);
    font-size: 0.78rem;
  }

  .st-bracket-row.won {
    background: rgba(16, 185, 129, 0.08);
    border-left: 2px solid #10b981;
  }

  .st-bracket-row.lost {
    background: rgba(230, 57, 70, 0.08);
    border-left: 2px solid var(--accent);
  }

  .st-bracket-round {
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--muted);
    min-width: 5rem;
    flex-shrink: 0;
  }

  .st-bracket-opp {
    flex: 1;
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .st-bracket-agg,
  .st-bracket-score {
    font-size: 0.72rem;
    color: var(--muted);
    font-variant-numeric: tabular-nums;
  }

  .st-bracket-badge {
    font-size: 0.65rem;
    font-weight: 800;
    width: 1.4rem;
    height: 1.4rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .st-bracket-badge.win {
    background: rgba(16, 185, 129, 0.2);
    color: #10b981;
  }
  .st-bracket-badge.draw {
    background: rgba(148, 163, 184, 0.18);
    color: #94a3b8;
  }
  .st-bracket-badge.loss {
    background: rgba(230, 57, 70, 0.18);
    color: var(--accent);
  }

  .st-wc-target {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px solid var(--line);
    font-size: 0.75rem;
    color: var(--muted);
  }

  .st-wc-target strong {
    color: var(--gold);
  }

  .st-empty {
    font-size: 0.78rem;
    color: var(--muted);
    text-align: center;
    padding: 0.5rem 0;
  }
</style>
