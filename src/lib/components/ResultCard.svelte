<script lang="ts">
  import type { RunState, SimulationResult } from '$lib/game/types';

  let { result, run }: { result: SimulationResult; run: RunState } = $props();

  const record = $derived(`${result.league.wins}-${result.league.draws}-${result.league.losses}`);
  const playerPicks = $derived(run.picks.filter((p) => p.type === 'player'));
  const modeLabel = $derived(run.mode === 'world-cup' ? 'World Cup' : run.mode === 'classic' ? run.formation : 'Quick');
  const perfectWorldCup = $derived(Boolean(result.worldCup?.won && result.worldCup.wins === 8 && result.worldCup.draws === 0 && result.worldCup.losses === 0));

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

  const trophyLabel = $derived(
    perfectWorldCup
      ? 'PERFECT 8-0'
      : result.worldCup?.won
        ? 'WORLD CUP'
        : result.trophies === 3
          ? 'TREBLE'
          : result.league.won
            ? 'CHAMPIONS'
            : result.trophies === 2
              ? 'DOUBLE'
              : result.trophies === 1
                ? 'TROPHY WINNER'
                : `Finished ${ordinal(result.league.position)}`
  );

  const clLabel = $derived(
    result.championsLeague.won
      ? 'CL Winners'
      : result.championsLeague.exitRound === 'Group Stage'
        ? 'CL: Out in Groups'
        : `CL: Out in ${result.championsLeague.exitRound}`
  );

  const facLabel = $derived(
    result.faCup.won
      ? 'FA Cup Winners'
      : result.faCup.exitRound === 'Round 3'
        ? 'FA Cup: R3 exit'
        : `FA Cup: Out in ${result.faCup.exitRound}`
  );
</script>

<div id="share-card-capture" class="share-card">
  <div class="sc-header">
    <span class="sc-brand">Treble Quest</span>
    <span class="sc-tags">
      {modeLabel} / OVR {Math.round((result.ratings.attack + result.ratings.control + result.ratings.defence) / 3)}
    </span>
  </div>

  <div class="sc-record">
    <div class="sc-record-line">{record}</div>
    <div class="sc-record-sub">WON / DRAWN / LOST</div>
  </div>

  {#if result.worldCup}
    <div class="sc-stats">
      <span class="sc-stat"><strong>{result.worldCup.goalsFor}</strong> GF</span>
      <span class="sc-dot">/</span>
      <span class="sc-stat">target <strong>8-0</strong></span>
    </div>
  {:else}
    <div class="sc-stats">
      <span class="sc-stat"><strong>{result.league.points}</strong> pts</span>
      <span class="sc-dot">/</span>
      <span class="sc-stat">finished <strong>{ordinal(result.league.position)}</strong></span>
    </div>
    <div class="sc-cups">
      <span class="sc-cup">{clLabel}</span>
      <span class="sc-dot">·</span>
      <span class="sc-cup">{facLabel}</span>
    </div>
  {/if}

  {#if result.league.won || result.trophies > 0 || result.worldCup?.won}
    <div class="sc-trophy">{trophyLabel}</div>
  {/if}

  <div class="sc-squad">
    {#each playerPicks as pick}
      {#if pick.type === 'player'}
        <div class="sc-player">
          <span class="sc-pos" style:background={posColor(pick.slot.short)}>{pick.slot.short}</span>
          <span class="sc-name">{pick.player.name}</span>
          <span class="sc-ovr">{pick.player.overall}</span>
        </div>
      {/if}
    {/each}
  </div>

  {#if result.awards.goldenBoot.fromUser || result.awards.playerOfSeason.fromUser}
    <div class="sc-awards">
      {#if result.awards.goldenBoot.fromUser}
        <div class="sc-award">
          <span class="sc-award-label">GOLDEN BOOT</span>
          <span class="sc-award-name">{result.awards.goldenBoot.name}</span>
          <span class="sc-award-stat">{result.awards.goldenBoot.goals} goals</span>
        </div>
      {/if}
      {#if result.awards.playerOfSeason.fromUser}
        <div class="sc-award">
          <span class="sc-award-label">PLAYER OF SEASON</span>
          <span class="sc-award-name">{result.awards.playerOfSeason.name}</span>
        </div>
      {/if}
    </div>
  {/if}

  <div class="sc-footer">
    <span class="sc-verified">Verified result</span>
    <span class="sc-cta">{result.worldCup ? 'Can you go 8-0?' : 'Can you win the Treble?'} / treble.quest</span>
  </div>
</div>

<style>
  .share-card {
    width: 390px;
    padding: 24px;
    background: #0f1923;
    border-radius: 8px;
    border: 1px solid #2d3f50;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: #e2e8f0;
    position: absolute;
    left: -9999px;
    top: 0;
  }

  .sc-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }

  .sc-brand {
    font-size: 1.2rem;
    font-weight: 900;
    color: #f8fafc;
  }

  .sc-tags {
    font-size: 0.7rem;
    color: #94a3b8;
    background: #1a2634;
    padding: 4px 8px;
    border-radius: 4px;
    text-align: right;
  }

  .sc-record {
    text-align: center;
    margin-bottom: 8px;
  }

  .sc-record-line {
    font-size: 2.2rem;
    font-weight: 900;
    color: #f8fafc;
  }

  .sc-record-sub {
    font-size: 0.6rem;
    color: #64748b;
    letter-spacing: 0.08em;
  }

  .sc-stats {
    text-align: center;
    margin-bottom: 12px;
    font-size: 0.85rem;
    color: #f59e0b;
  }

  .sc-cups {
    text-align: center;
    margin-bottom: 10px;
    font-size: 0.7rem;
    color: #64748b;
  }

  .sc-cup {
    color: #94a3b8;
  }

  .sc-dot {
    margin: 0 6px;
    color: #475569;
  }

  .sc-stat strong {
    color: #f8fafc;
  }

  .sc-trophy {
    text-align: center;
    font-size: 0.75rem;
    font-weight: 800;
    color: #10b981;
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.25);
    border-radius: 6px;
    padding: 6px 12px;
    margin-bottom: 14px;
  }

  .sc-squad {
    margin-bottom: 14px;
  }

  .sc-player {
    display: flex;
    align-items: center;
    padding: 3px 0;
    border-bottom: 1px solid rgba(45, 63, 80, 0.5);
  }

  .sc-player:last-child {
    border-bottom: none;
  }

  .sc-pos {
    font-size: 0.6rem;
    font-weight: 700;
    color: #fff;
    padding: 2px 5px;
    border-radius: 3px;
    width: 28px;
    text-align: center;
    flex-shrink: 0;
  }

  .sc-name {
    flex: 1;
    font-size: 0.78rem;
    margin-left: 8px;
    font-weight: 600;
  }

  .sc-ovr {
    font-size: 0.78rem;
    font-weight: 700;
    color: #f59e0b;
  }

  .sc-awards {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-bottom: 14px;
  }

  .sc-award {
    background: #1a2634;
    border-radius: 8px;
    padding: 8px;
    text-align: center;
  }

  .sc-award-label {
    font-size: 0.55rem;
    color: #f59e0b;
    letter-spacing: 0.03em;
  }

  .sc-award-name {
    display: block;
    font-size: 0.75rem;
    font-weight: 700;
    color: #f8fafc;
    margin-top: 2px;
  }

  .sc-award-stat {
    display: block;
    font-size: 0.65rem;
    color: #10b981;
  }

  .sc-footer {
    text-align: center;
    padding-top: 10px;
    border-top: 1px solid #2d3f50;
  }

  .sc-verified {
    display: block;
    font-size: 0.65rem;
    color: #10b981;
    margin-bottom: 4px;
  }

  .sc-cta {
    font-size: 0.7rem;
    color: #64748b;
  }
</style>
