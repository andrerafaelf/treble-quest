<script lang="ts">
  import Button from '$lib/components/Button.svelte';
  import { fetchLeaderboard, type LeaderboardEntry } from '$lib/game/leaderboard';
  import type { GameMode } from '$lib/game/types';

  let mode = $state<GameMode>('quick');
  let entries = $state<LeaderboardEntry[]>([]);
  let status = $state<'loading' | 'ready' | 'error'>('loading');

  async function load(next: GameMode) {
    mode = next;
    status = 'loading';
    try {
      const data = await fetchLeaderboard(next, 50);
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

  function formatDate(ms: number): string {
    return new Date(ms).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }
</script>

<svelte:head>
  <title>Leaderboard – Treble Quest</title>
  <meta name="description" content="Top Treble Quest scores from Quick and Classic mode runs." />
</svelte:head>

<section class="page-section">
  <span class="eyebrow">Leaderboard</span>
  <h1 class="page-title">High Scores</h1>

  <div class="mode-tabs" role="tablist" aria-label="Game mode">
    <button
      role="tab"
      aria-selected={mode === 'quick'}
      class:active={mode === 'quick'}
      onclick={() => load('quick')}
    >Quick</button>
    <button
      role="tab"
      aria-selected={mode === 'classic'}
      class:active={mode === 'classic'}
      onclick={() => load('classic')}
    >Classic</button>
  </div>

  {#if status === 'loading'}
    <p class="text-flow">Loading…</p>
  {:else if status === 'error'}
    <p class="text-flow">Could not load the leaderboard. Try again later.</p>
    <Button variant="secondary" onclick={() => load(mode)}>Retry</Button>
  {:else if entries.length === 0}
    <p class="text-flow">No scores yet. Be the first.</p>
    <Button href="/play">Start a run</Button>
  {:else}
    <ol class="lb-list">
      {#each entries as entry, i (entry.name + entry.createdAt)}
        <li class:top={i < 3}>
          <span class="lb-rank">{i + 1}</span>
          <span class="lb-name">{entry.name}</span>
          <span class="lb-meta">
            {#if entry.formation}{entry.formation} · {/if}
            {entry.trophies} {entry.trophies === 1 ? 'trophy' : 'trophies'} · {formatDate(entry.createdAt)}
          </span>
          <span class="lb-score">{entry.score.toLocaleString()}</span>
        </li>
      {/each}
    </ol>
  {/if}
</section>
