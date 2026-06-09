<script lang="ts">
  import type { RunState, SimulationResult } from '$lib/game/types';

  let { result, run }: { result: SimulationResult; run: RunState } = $props();

  const playerPicks = $derived(run.picks.filter((p) => p.type === 'player'));
  const modeLabel = $derived(run.mode === 'world-cup' ? 'World Cup' : run.mode === 'classic' ? run.formation : 'Quick');
  const ovr = $derived(Math.round((result.ratings.attack + result.ratings.control + result.ratings.defence) / 3));
  const perfectWorldCup = $derived(Boolean(result.worldCup?.won && result.worldCup.wins === 8 && result.worldCup.draws === 0 && result.worldCup.losses === 0));

  const wcRecord = $derived(result.worldCup ? `${result.worldCup.wins}-${result.worldCup.draws}-${result.worldCup.losses}` : '');
  const plRecord = $derived(`${result.league.wins}-${result.league.draws}-${result.league.losses}`);

  function ordinal(n: number): string {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  function posColor(pos: string): string {
    if (pos === 'GK') return '#f59e0b';
    if (['RB', 'CB', 'LB', 'DEF'].includes(pos)) return '#3b82f6';
    if (['CM', 'RM', 'LM', 'RW', 'LW', 'MID', 'CAM', 'CDM'].includes(pos)) return '#10b981';
    return '#ef4444';
  }

  const outcomeLabel = $derived(
    perfectWorldCup
      ? 'Perfect 8-0'
      : result.worldCup?.won
        ? 'World Cup Won'
        : result.trophies === 3
          ? 'Treble'
          : result.league.won
            ? 'Champions'
            : result.trophies === 2
              ? 'Double'
              : result.trophies === 1
                ? 'Trophy Winner'
                : `${ordinal(result.league.position)} Place`
  );

  const isWinner = $derived(result.league.won || result.trophies > 0 || !!result.worldCup?.won);

  // CL and FA Cup pills for classic mode
  const clPill = $derived(
    result.championsLeague.won
      ? { text: 'UCL Winners', ok: true }
      : result.championsLeague.exitRound === 'League phase'
        ? { text: 'UCL: Groups', ok: false }
        : { text: `UCL: ${result.championsLeague.exitRound}`, ok: false }
  );

  const facPill = $derived(
    result.faCup.won
      ? { text: 'FA Cup', ok: true }
      : { text: `FA Cup: ${result.faCup.exitRound}`, ok: false }
  );
</script>

<div id="share-card-capture" class="rc">
  <!-- Header -->
  <div class="rc-header">
    <div class="rc-brand">
      <span class="rc-brand-name">Treble Quest</span>
      <span class="rc-brand-mode">{modeLabel}</span>
    </div>
    <div class="rc-ovr-badge">
      <span class="rc-ovr-val">{ovr}</span>
      <span class="rc-ovr-lbl">OVR</span>
    </div>
  </div>

  <!-- Outcome hero -->
  <div class="rc-hero" class:rc-hero-win={isWinner} class:rc-hero-loss={!isWinner}>
    <div class="rc-outcome">{outcomeLabel}</div>
    {#if result.worldCup}
      <div class="rc-record">{wcRecord}</div>
      <div class="rc-record-sub">W · D · L</div>
    {:else}
      <div class="rc-pts-row">
        <span class="rc-pts">{result.league.points}<span class="rc-pts-lbl">pts</span></span>
        <span class="rc-sep">·</span>
        <span class="rc-pos">{ordinal(result.league.position)}</span>
      </div>
      <div class="rc-record">{plRecord}</div>
      <div class="rc-record-sub">W · D · L</div>
    {/if}
  </div>

  <!-- Cup pills (classic only) -->
  {#if !result.worldCup}
    <div class="rc-cups">
      <span class="rc-cup" class:rc-cup-ok={clPill.ok} class:rc-cup-out={!clPill.ok}>{clPill.text}</span>
      <span class="rc-cup" class:rc-cup-ok={facPill.ok} class:rc-cup-out={!facPill.ok}>{facPill.text}</span>
    </div>
  {/if}

  <!-- Squad -->
  <div class="rc-squad">
    {#each playerPicks as pick}
      {#if pick.type === 'player'}
        <div class="rc-player">
          <span class="rc-pos-badge" style:background={posColor(pick.slot.short)}>{pick.slot.short}</span>
          <span class="rc-player-name">{pick.player.name}</span>
          <span class="rc-player-meta">{pick.player.club} · {pick.player.season}</span>
          <span class="rc-player-ovr">{pick.player.overall}</span>
        </div>
      {/if}
    {/each}
  </div>

  <!-- Awards -->
  {#if result.awards.goldenBoot.fromUser || result.awards.playerOfSeason.fromUser}
    <div class="rc-awards">
      {#if result.awards.goldenBoot.fromUser}
        <div class="rc-award">
          <span class="rc-award-ico">⚽</span>
          <div class="rc-award-body">
            <span class="rc-award-lbl">Golden Boot</span>
            <span class="rc-award-name">{result.awards.goldenBoot.name}</span>
          </div>
          <span class="rc-award-stat">{result.awards.goldenBoot.goals}G</span>
        </div>
      {/if}
      {#if result.awards.playerOfSeason.fromUser}
        <div class="rc-award">
          <span class="rc-award-ico">★</span>
          <div class="rc-award-body">
            <span class="rc-award-lbl">Player of Season</span>
            <span class="rc-award-name">{result.awards.playerOfSeason.name}</span>
          </div>
        </div>
      {/if}
    </div>
  {/if}

  <!-- Footer -->
  <div class="rc-footer">
    <span class="rc-verified">✓ Verified result</span>
    <span class="rc-cta">treble.quest</span>
  </div>
</div>

<style>
  .rc {
    width: 400px;
    background: #0d1117;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.08);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: #e2e8f0;
    position: absolute;
    left: -9999px;
    top: 0;
    overflow: hidden;
  }

  /* Header */
  .rc-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 18px 12px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }

  .rc-brand {
    display: flex;
    align-items: baseline;
    gap: 8px;
  }

  .rc-brand-name {
    font-size: 0.95rem;
    font-weight: 900;
    color: #e63946;
    letter-spacing: -0.01em;
  }

  .rc-brand-mode {
    font-size: 0.65rem;
    color: #64748b;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .rc-ovr-badge {
    display: flex;
    align-items: baseline;
    gap: 3px;
    background: rgba(244,162,97,0.12);
    border: 1px solid rgba(244,162,97,0.2);
    border-radius: 6px;
    padding: 3px 8px;
  }

  .rc-ovr-val {
    font-size: 1.1rem;
    font-weight: 900;
    color: #f4a261;
    line-height: 1;
  }

  .rc-ovr-lbl {
    font-size: 0.6rem;
    color: #f4a261;
    opacity: 0.7;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* Hero */
  .rc-hero {
    padding: 18px 18px 14px;
    text-align: center;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }

  .rc-hero-win {
    background: linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(13,17,23,0) 60%);
  }

  .rc-hero-loss {
    background: linear-gradient(135deg, rgba(69,123,157,0.08) 0%, rgba(13,17,23,0) 60%);
  }

  .rc-outcome {
    font-size: 1.5rem;
    font-weight: 900;
    color: #f8fafc;
    letter-spacing: -0.02em;
    line-height: 1;
    margin-bottom: 8px;
    text-transform: uppercase;
  }

  .rc-pts-row {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 8px;
    margin-bottom: 4px;
  }

  .rc-pts {
    font-size: 1.5rem;
    font-weight: 900;
    color: #f4a261;
    line-height: 1;
  }

  .rc-pts-lbl {
    font-size: 0.7rem;
    font-weight: 600;
    margin-left: 2px;
    opacity: 0.7;
  }

  .rc-sep {
    color: #334155;
    font-size: 1rem;
  }

  .rc-pos {
    font-size: 1.1rem;
    font-weight: 700;
    color: #94a3b8;
  }

  .rc-record {
    font-size: 1.1rem;
    font-weight: 800;
    color: #f8fafc;
    letter-spacing: 0.04em;
    margin-bottom: 2px;
  }

  .rc-record-sub {
    font-size: 0.55rem;
    color: #475569;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  /* Cup pills */
  .rc-cups {
    display: flex;
    gap: 6px;
    padding: 8px 18px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }

  .rc-cup {
    font-size: 0.62rem;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 20px;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }

  .rc-cup-ok {
    background: rgba(16,185,129,0.15);
    color: #10b981;
    border: 1px solid rgba(16,185,129,0.3);
  }

  .rc-cup-out {
    background: rgba(255,255,255,0.04);
    color: #64748b;
    border: 1px solid rgba(255,255,255,0.08);
  }

  /* Squad */
  .rc-squad {
    padding: 8px 18px 4px;
  }

  .rc-player {
    display: grid;
    grid-template-columns: 30px 1fr auto auto;
    align-items: center;
    gap: 0 8px;
    padding: 4px 0;
    border-bottom: 1px solid rgba(255,255,255,0.04);
  }

  .rc-player:last-child {
    border-bottom: none;
  }

  .rc-pos-badge {
    font-size: 0.55rem;
    font-weight: 800;
    color: #fff;
    padding: 2px 4px;
    border-radius: 3px;
    text-align: center;
    letter-spacing: 0.01em;
  }

  .rc-player-name {
    font-size: 0.78rem;
    font-weight: 700;
    color: #e2e8f0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .rc-player-meta {
    font-size: 0.6rem;
    color: #475569;
    white-space: nowrap;
    text-align: right;
  }

  .rc-player-ovr {
    font-size: 0.78rem;
    font-weight: 800;
    color: #f4a261;
    min-width: 22px;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  /* Awards */
  .rc-awards {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 8px 18px;
    border-top: 1px solid rgba(255,255,255,0.06);
  }

  .rc-award {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(255,255,255,0.03);
    border-radius: 6px;
    padding: 6px 10px;
  }

  .rc-award-ico {
    font-size: 0.85rem;
    flex-shrink: 0;
  }

  .rc-award-body {
    display: flex;
    flex-direction: column;
    gap: 1px;
    flex: 1;
    min-width: 0;
  }

  .rc-award-lbl {
    font-size: 0.55rem;
    color: #f4a261;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-weight: 700;
  }

  .rc-award-name {
    font-size: 0.75rem;
    font-weight: 700;
    color: #f8fafc;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .rc-award-stat {
    font-size: 0.75rem;
    font-weight: 800;
    color: #10b981;
    flex-shrink: 0;
  }

  /* Footer */
  .rc-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 18px 12px;
    border-top: 1px solid rgba(255,255,255,0.06);
  }

  .rc-verified {
    font-size: 0.62rem;
    color: #10b981;
    font-weight: 600;
  }

  .rc-cta {
    font-size: 0.62rem;
    color: #334155;
    font-weight: 600;
    letter-spacing: 0.03em;
  }
</style>
