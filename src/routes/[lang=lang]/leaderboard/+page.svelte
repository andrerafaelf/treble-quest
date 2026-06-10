<script lang="ts">
  import { browser } from '$app/environment';
  import { replaceState } from '$app/navigation';
  import { page } from '$app/state';
  import Button from '$lib/components/Button.svelte';
  import { fetchLeaderboard, type LeaderboardEntry, type SquadEntry } from '$lib/game/leaderboard';
  import type { GameMode } from '$lib/game/types';
  import type { LayoutData } from '../$types';
  import { t } from 'svelte-i18n';

  let { data }: { data: LayoutData } = $props();
  const lang = $derived(data.lang);
  const pathLang = $derived(lang.toLowerCase());

  type LeaderboardTab = 'classic' | 'classic-no-overall' | 'world-cup' | 'world-cup-no-overall' | 'global' | 'global-no-overall' | 'legacy' | 'legacy-no-overall';

  const VALID_TABS: LeaderboardTab[] = ['classic', 'classic-no-overall', 'world-cup', 'world-cup-no-overall', 'global', 'global-no-overall', 'legacy', 'legacy-no-overall'];

  function initialTab(): LeaderboardTab {
    if (!browser) return 'classic';
    const t = page.url.searchParams.get('tab');
    return VALID_TABS.includes(t as LeaderboardTab) ? (t as LeaderboardTab) : 'classic';
  }

  let mode = $state<GameMode>('classic');
  let tab = $state<LeaderboardTab>(initialTab());
  let entries = $state<LeaderboardEntry[]>([]);
  let status = $state<'loading' | 'ready' | 'error'>('loading');
  let expanded = $state<Set<number>>(new Set());

  async function load(next: LeaderboardTab) {
    tab = next;
    mode =
      next === 'world-cup' || next === 'world-cup-no-overall'
        ? 'world-cup'
        : next === 'global' || next === 'global-no-overall'
          ? 'global'
          : next === 'legacy' || next === 'legacy-no-overall'
            ? 'legacy'
            : 'classic';
    const hideRatings =
      next === 'classic-no-overall' ||
      next === 'global-no-overall' ||
      next === 'legacy-no-overall' ||
      next === 'world-cup-no-overall';
    status = 'loading';
    expanded = new Set();
    if (browser) {
      const url = new URL(page.url);
      url.searchParams.set('tab', next);
      replaceState(url, {});
    }
    try {
      const data = await fetchLeaderboard(mode, 50, hideRatings);
      entries = data.entries;
      status = 'ready';
    } catch {
      entries = [];
      status = 'error';
    }
  }

  load(initialTab());

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
    if (entryMode === 'world-cup') return n > 0 ? $t('leaderboard.trophy_world_cup') : $t('leaderboard.trophy_no_trophy');
    if (n === 3) return $t('leaderboard.trophy_treble');
    if (n === 2) return $t('leaderboard.trophy_double');
    if (n === 1) return $t('leaderboard.trophy_one');
    return $t('leaderboard.trophy_none');
  }

  function manager(squad: SquadEntry[]): SquadEntry | undefined {
    return squad.find((s) => s.isManager);
  }

  function players(squad: SquadEntry[]): SquadEntry[] {
    return squad.filter((s) => !s.isManager);
  }

  function beatUrl(entry: LeaderboardEntry): string {
    const params = new URLSearchParams({ mode });
    if (entry.formation) params.set('formation', entry.formation);
    if (
      tab === 'classic-no-overall' ||
      tab === 'global-no-overall' ||
      tab === 'legacy-no-overall' ||
      tab === 'world-cup-no-overall'
    )
      params.set('hideRatings', '1');
    return `/${pathLang}/play?${params.toString()}`;
  }
</script>

<svelte:head>
  <title>{$t('leaderboard.page_title')}</title>
  <meta name="description" content={$t('leaderboard.meta_description')} />
</svelte:head>

<section class="page-section">
  <span class="eyebrow">{$t('leaderboard.eyebrow')}</span>
  <h1 class="page-title">{$t('leaderboard.title')}</h1>

  <div class="mode-tabs" role="tablist" aria-label="Game mode">
    <button role="tab" aria-selected={tab === 'classic'} class:active={tab === 'classic'} onclick={() => load('classic')}>{$t('leaderboard.tab_classic')}</button>
    <button role="tab" aria-selected={tab === 'classic-no-overall'} class:active={tab === 'classic-no-overall'} onclick={() => load('classic-no-overall')}>{$t('leaderboard.tab_classic_no_ovr')}</button>
    <button role="tab" aria-selected={tab === 'global'} class:active={tab === 'global'} onclick={() => load('global')}>{$t('leaderboard.tab_global')}</button>
    <button role="tab" aria-selected={tab === 'global-no-overall'} class:active={tab === 'global-no-overall'} onclick={() => load('global-no-overall')}>{$t('leaderboard.tab_global_no_ovr')}</button>
    <button role="tab" aria-selected={tab === 'world-cup'} class:active={tab === 'world-cup'} onclick={() => load('world-cup')}>{$t('leaderboard.tab_world_cup')}</button>
    <button role="tab" aria-selected={tab === 'world-cup-no-overall'} class:active={tab === 'world-cup-no-overall'} onclick={() => load('world-cup-no-overall')}>{$t('leaderboard.tab_world_cup_no_ovr')}</button>
    <button role="tab" aria-selected={tab === 'legacy'} class:active={tab === 'legacy'} onclick={() => load('legacy')}>{$t('leaderboard.tab_legacy')}</button>
    <button role="tab" aria-selected={tab === 'legacy-no-overall'} class:active={tab === 'legacy-no-overall'} onclick={() => load('legacy-no-overall')}>{$t('leaderboard.tab_legacy_no_ovr')}</button>
  </div>

  {#if status === 'loading'}
    <p class="text-flow">{$t('leaderboard.loading')}</p>
  {:else if status === 'error'}
    <p class="text-flow">{$t('leaderboard.error')}</p>
    <Button variant="secondary" onclick={() => load(tab)}>{$t('leaderboard.retry')}</Button>
  {:else if entries.length === 0}
    <p class="text-flow">{$t('leaderboard.no_scores')}</p>
    <Button href={`/${pathLang}/play`}>{$t('leaderboard.start_run')}</Button>
  {:else}
    <ol class="lb-list">
      {#each entries as entry, i (entry.name + entry.createdAt)}
        {@const isOpen = expanded.has(i)}
        {@const hasSquad = entry.squad && entry.squad.length > 0}
        <li class:top={i < 3} class:treble={entry.trophies === 3 || (mode === 'world-cup' && entry.trophies > 0)}>
          <button
            class="lb-main"
            onclick={() => { if (hasSquad) toggle(i); }}
            aria-expanded={isOpen}
            disabled={!hasSquad}
          >
            <span class="lb-rank" class:gold={i < 3}>
              {#if i === 0}🥇{:else if i === 1}🥈{:else if i === 2}🥉{:else}{i + 1}{/if}
            </span>
            <span class="lb-info">
              <span class="lb-name">{entry.name}</span>
              <span class="lb-meta">
                {trophyLabel(entry.trophies, mode)}
                {#if entry.formation}/ {entry.formation}{/if}
                / {formatDate(entry.createdAt)}
              </span>
            </span>
            <span class="lb-right">
              <span class="lb-score">{entry.score.toLocaleString()}</span>
              {#if hasSquad}<span class="lb-chevron" class:open={isOpen}>▾</span>{/if}
            </span>
          </button>

          {#if isOpen && entry.squad}
            <div class="lb-squad">
              {#if manager(entry.squad)}
                {@const mgr = manager(entry.squad)!}
                <div class="lb-squad-manager">
                  <span class="lb-slot">{$t('leaderboard.mgr_slot')}</span>
                  <span class="lb-player-name">{mgr.name}</span>
                  <span class="lb-rarity manager">{$t('leaderboard.manager_label')}</span>
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

          {#if i === 0}
            <div class="lb-beat">
              <Button href={beatUrl(entry)} variant="secondary">{$t('leaderboard.beat_score')}</Button>
            </div>
          {/if}
        </li>
      {/each}
    </ol>
  {/if}
</section>

<style>
  .lb-beat {
    padding: 0.75rem 1rem 1rem;
    display: flex;
    justify-content: center;
  }
</style>
