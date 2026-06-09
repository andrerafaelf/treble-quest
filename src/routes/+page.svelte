<script lang="ts">
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import FormationSelector from '$lib/components/FormationSelector.svelte';
  import ModeSelector from '$lib/components/ModeSelector.svelte';
  import { parseRunConfigFromUrl } from '$lib/game/deeplink';
  import { getStreak, runStore } from '$lib/game/storage';
  import type { ClassicFormation, GameMode } from '$lib/game/types';
  import trebleQuestImage from '$lib/icons/treble-quest.png';

  let noOverall = $state(false);
  let selectedMode = $state<GameMode>('classic');
  const streak = browser ? getStreak() : null;
  let deepLinkApplied = $state(false);
  const run = $derived($runStore);

  function startRun(mode: GameMode = 'classic', formation?: ClassicFormation, hideRatings = false) {
    runStore.start(mode, formation, hideRatings);
    goto('/play');
  }

  function selectMode(mode: GameMode) {
    selectedMode = mode;
  }

  function selectFormation(formation: ClassicFormation) {
    startRun(selectedMode, formation, noOverall);
  }

  function startWorldCup() {
    startRun('world-cup', undefined, noOverall);
  }

  $effect(() => {
    if (!browser || deepLinkApplied) return;
    if (run && !run.result) return;
    const config = parseRunConfigFromUrl(page.url);
    if (!config) return;
    deepLinkApplied = true;
    startRun(config.mode, config.formation, config.hideRatings);
  });
</script>

<section class="home-page">
  <div class="home-wrap">
    <header class="home-header">
      <img class="home-crest-sm" src={trebleQuestImage} alt="Treble Quest crest" />
      <div class="home-title-group">
        <h1 class="home-title">Treble Quest</h1>
        <p class="home-sub">Fast football draft simulator</p>
      </div>
    </header>

    <div class="home-panel">
      <div class="home-modes">
        <ModeSelector value={selectedMode} onSelect={selectMode} />
        <div class="steps" aria-label="Game steps">
          <div>Spin a club and season</div>
          <div>Draft one option</div>
          <div>Simulate the treble chase</div>
        </div>
      </div>

      <div class="home-config">
        <label class="toggle-row">
          <input type="checkbox" bind:checked={noOverall} />
          <span>No overall</span>
          <strong>Hard</strong>
        </label>

        {#if selectedMode === 'world-cup'}
          <button class="start-wc-btn" onclick={startWorldCup}> Start World Cup → </button>
        {:else}
          <FormationSelector onSelect={selectFormation} />
        {/if}
      </div>
    </div>

    <footer class="home-foot">
      <div class="home-foot-left">
        {#if streak && (streak.current > 0 || streak.best > 0)}
          <div class="streak-badge">
            <span class="streak-label">{streak.current >= 3 ? '🔥' : '⚡'} Streak</span>
            <strong>{streak.current}</strong>
            {#if streak.best > 0}<span class="streak-best">Best: {streak.best}</span>{/if}
          </div>
        {/if}
      </div>
      <nav class="home-foot-links" aria-label="Secondary navigation">
        {#if $runStore}
          <a href={$runStore.result ? '/result' : '/play'} class="foot-link foot-link-resume">
            {$runStore.result ? 'View result' : 'Resume run'}
          </a>
        {/if}
        <a href="/leaderboard" class="foot-link">Leaderboard</a>
        <a href="/how-to-play" class="foot-link">How it works</a>
        <a href="/support" class="foot-link">Support</a>
      </nav>
    </footer>
  </div>
</section>
