<script lang="ts">
  import Button from '$lib/components/Button.svelte';
  import { fetchLeaderboard, type LeaderboardEntry, type SquadEntry } from '$lib/game/leaderboard';
  import type { GameMode } from '$lib/game/types';

  type LeaderboardTab = 'quick' | 'classic' | 'classic-no-overall' | 'world-cup';

  let mode = $state<GameMode>('quick');
  let tab = $state<LeaderboardTab>('quick');
  let entries = $state<LeaderboardEntry[]>([]);
  let status = $state<'loading' | 'ready' | 'error'>('loading');
  let expanded = $state<Set<number>>(new Set());

  async function load(next: LeaderboardTab) {
    tab = next;
    mode = next === 'world-cup' ? 'world-cup' : next === 'quick' ? 'quick' : 'classic';
    const hideRatings = next === 'classic-no-overall';
    status = 'loading';
    expanded = new Set();
    try {
      const data = await fetchLeaderboard(mode, 50, hideRatings);
      entries = data.entries;
      status = 'ready';
    } catch {
      entries = [];
      status = 'error';
    }
  }

  $effect(() => {
    load('quick');
  });

  function toggle(i: number) {
    const next = new Set(expanded);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    expanded = next;
  }

  function formatDate(ms: number): string {
    return new Date(ms).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function trophyLabel(n: number, entryMode: GameMode): string {
    if (entryMode === 'world-cup') return n > 0 ? 'World Cup' : 'No trophy';
    if (n === 3) return 'Treble';
    if (n === 2) return 'Double';
    if (n === 1) return '1 trophy';
    return 'No trophies';
  }

  function manager(squad: SquadEntry[]): SquadEntry | undefined {
    return squad.find((s) => s.isManager);
  }

  function players(squad: SquadEntry[]): SquadEntry[] {
    return squad.filter((s) => !s.isManager);
  }
</script>

<svelte:head>
  <title>Leaderboard - Treble Quest</title>
  <meta name="description" content="Top Treble Quest scores from Quick, Classic, and World Cup mode runs." />
</svelte:head>

<section class="page-section">
  <span class="eyebrow">Leaderboard</span>
  <h1 class="page-title">High Scores</h1>

  <div class="mode-tabs" role="tablist" aria-label="Game mode">
    <button role="tab" aria-selected={tab === 'quick'} class:active={tab === 'quick'} onclick={() => load('quick')}
      >Quick</button
    >
    <button
      role="tab"
      aria-selected={tab === 'classic'}
      class:active={tab === 'classic'}
      onclick={() => load('classic')}>Classic</button
    >
    <button
      role="tab"
      aria-selected={tab === 'classic-no-overall'}
      class:active={tab === 'classic-no-overall'}
      onclick={() => load('classic-no-overall')}>Classic No Overall</button
    >
    <button
      role="tab"
      aria-selected={tab === 'world-cup'}
      class:active={tab === 'world-cup'}
      onclick={() => load('world-cup')}>World Cup</button
    >
  </div>

  {#if status === 'loading'}
    <p class="text-flow">Loading...</p>
  {:else if status === 'error'}
    <p class="text-flow">Could not load the leaderboard. Try again later.</p>
    <Button variant="secondary" onclick={() => load(tab)}>Retry</Button>
  {:else if entries.length === 0}
    <p class="text-flow">No scores yet. Be the first.</p>
    <Button href="/play">Start a run</Button>
  {:else}
    <ol class="lb-list">
      {#each entries as entry, i (entry.name + entry.createdAt)}
        {@const isOpen = expanded.has(i)}
        {@const hasSquad = entry.squad && entry.squad.length > 0}
        <li class:top={i < 3} class:treble={entry.trophies === 3 || (mode === 'world-cup' && entry.trophies > 0)}>
          <button
            class="lb-main"
            onclick={() => {
              if (hasSquad) toggle(i);
            }}
            aria-expanded={isOpen}
            disabled={!hasSquad}
          >
            <span class="lb-rank" class:gold={i < 3}>{i + 1}</span>
            <span class="lb-info">
              <span class="lb-name">{entry.name}</span>
              <span class="lb-meta">
                {trophyLabel(entry.trophies, mode)}
                {#if entry.formation}
                  / {entry.formation}{/if}
                / {formatDate(entry.createdAt)}
              </span>
            </span>
            <span class="lb-right">
              <span class="lb-score">{entry.score.toLocaleString()}</span>
              {#if hasSquad}
                <span class="lb-chevron" class:open={isOpen}>v</span>
              {/if}
            </span>
          </button>

          {#if isOpen && entry.squad}
            <div class="lb-squad">
              {#if manager(entry.squad)}
                {@const mgr = manager(entry.squad)!}
                <div class="lb-squad-manager">
                  <span class="lb-slot">MGR</span>
                  <span class="lb-player-name">{mgr.name}</span>
                  <span class="lb-rarity manager">Manager</span>
                </div>
              {/if}
              <div class="lb-squad-players">
                {#each players(entry.squad) as player}
                  <div class="lb-squad-player">
                    <span class="lb-slot">{player.slot}</span>
                    <span class="lb-player-name">{player.name}</span>
                    <span class="lb-overall">{player.overall}</span>
                    <span class="lb-rarity {player.rarity}">{player.rarity}</span>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </li>
      {/each}
    </ol>
  {/if}
</section>
