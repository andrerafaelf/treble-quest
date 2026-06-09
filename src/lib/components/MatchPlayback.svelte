<script lang="ts">
  import type { Match } from '$lib/game/types';
  import { onDestroy, onMount } from 'svelte';

  let { matches, onDone }: { matches: Match[]; onDone: () => void } = $props();

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
  let runningTotals = $state({ pl: { w: 0, d: 0, l: 0, pts: 0 }, fac: '', cl: '', wc: { w: 0, d: 0, l: 0 } });
  let timer: ReturnType<typeof setInterval> | undefined;
  let paused = $state(false);
  let speedIndex = $state(loadSpeed());

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
      onDone();
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
    } else if (m.competition === 'FAC') {
      runningTotals.fac = m.result === 'W' ? `${m.round} won` : `${m.round} out`;
    } else if (m.competition === 'CL') {
      runningTotals.cl = m.result === 'W' ? `${m.round} win` : (m.round ?? 'League phase');
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
    onDone();
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

  function compLabel(m: Match): string {
    if (m.competition === 'WC') return m.round ? `World Cup - ${m.round}` : 'World Cup';
    if (m.competition === 'PL') return 'Premier League';
    if (m.competition === 'FAC') return m.round ? `FA Cup - ${m.round}` : 'FA Cup';
    return m.round ? `Champions League - ${m.round}` : 'Champions League';
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
      .join(' / ');
  }
</script>

<section class="playback" aria-label="Match-by-match season playback">
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
      <button type="button" class="pb-btn pb-skip" onclick={skip}>Skip to results</button>
    </div>
  </div>

  <div class="playback-progress">
    <div class="playback-progress-fill" style="width: {progress}%"></div>
  </div>

  {#if current}
    <article class="playback-match playback-{current.result.toLowerCase()}">
      <span class="pm-comp">{compLabel(current)}</span>
      <span class="pm-date"
        >{current.date} / {current.venue === 'H' ? 'Home' : current.venue === 'A' ? 'Away' : 'Neutral'}</span
      >
      <div class="pm-score-row">
        <span class="pm-opp">{current.venue === 'A' ? current.opponent : 'Your XI'}</span>
        <span class="pm-score"
          >{current.venue === 'A' ? current.ga : current.gf} - {current.venue === 'A' ? current.gf : current.ga}</span
        >
        <span class="pm-opp">{current.venue === 'A' ? 'Your XI' : current.opponent}</span>
      </div>
      <div class="pm-badge pm-badge-{current.result.toLowerCase()}">
        {current.result === 'W' ? 'WIN' : current.result === 'D' ? 'DRAW' : 'LOSS'}
      </div>
      {#if current.scorers.length > 0}
        <p class="pm-scorers">{scorerSummary(current)}</p>
      {/if}
      {#if current.aggregate}
        <p class="pm-agg">Aggregate {current.aggregate.gf}-{current.aggregate.ga}</p>
      {/if}
    </article>
  {/if}

  <div class="playback-tally">
    {#if hasWorldCup}
      <div class="tally-row">
        <span>World Cup</span>
        <strong>{runningTotals.wc.w}W-{runningTotals.wc.d}D-{runningTotals.wc.l}L / target 8-0</strong>
      </div>
    {:else}
      <div class="tally-row">
        <span>Premier League</span>
        <strong>{runningTotals.pl.w}W-{runningTotals.pl.d}D-{runningTotals.pl.l}L / {runningTotals.pl.pts} pts</strong>
      </div>
      {#if runningTotals.fac}
        <div class="tally-row">
          <span>FA Cup</span>
          <strong>{runningTotals.fac}</strong>
        </div>
      {/if}
      {#if runningTotals.cl}
        <div class="tally-row">
          <span>Champions League</span>
          <strong>{runningTotals.cl}</strong>
        </div>
      {/if}
    {/if}
  </div>
</section>
