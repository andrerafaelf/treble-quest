<script lang="ts">
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import ClubSelector from '$lib/components/ClubSelector.svelte';
  import FormationSelector from '$lib/components/FormationSelector.svelte';
  import ModeSelector from '$lib/components/ModeSelector.svelte';
  import { parseRunConfigFromUrl } from '$lib/game/deeplink';
  import { getStreak, runStore } from '$lib/game/storage';
  import type { ClassicFormation, GameMode } from '$lib/game/types';
  import trebleQuestImage from '$lib/icons/treble-quest.png';
  import type { LayoutData } from './$types';
  import { t } from 'svelte-i18n';

  let { data }: { data: LayoutData } = $props();
  const lang = $derived(data.lang);

  let noOverall = $state(false);
  let selectedMode = $state<GameMode>('classic');
  let selectedClub = $state<string | undefined>(undefined);
  const streak = browser ? getStreak() : null;
  let deepLinkApplied = $state(false);
  const run = $derived($runStore);

  function startRun(mode: GameMode = 'classic', formation?: ClassicFormation, hideRatings = false, clubFilter?: string) {
    runStore.start(mode, formation, hideRatings, clubFilter);
    goto(`/${lang}/play`);
  }

  function selectMode(mode: GameMode) {
    selectedMode = mode;
    selectedClub = undefined;
  }

  function selectClub(clubName: string) {
    selectedClub = clubName;
  }

  function selectFormation(formation: ClassicFormation) {
    startRun(selectedMode, formation, noOverall, selectedMode === 'legacy' ? selectedClub : undefined);
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
        <h1 class="home-title">{$t('home.title')}</h1>
        <p class="home-sub">{$t('home.subtitle')}</p>
      </div>
    </header>

    <div class="home-panel">
      <div class="home-modes">
        <ModeSelector value={selectedMode} onSelect={selectMode} />
        <div class="steps" aria-label="Game steps">
          <div>{$t('home.step_spin')}</div>
          <div>{$t('home.step_draft')}</div>
          <div>{$t('home.step_simulate')}</div>
        </div>
      </div>

      <div class="home-config">
        <label class="toggle-row">
          <input type="checkbox" bind:checked={noOverall} />
          <span>{$t('home.no_overall')}</span>
          <strong>{$t('home.hard')}</strong>
        </label>

        {#if selectedMode === 'legacy'}
          <ClubSelector value={selectedClub} onSelect={selectClub} />
        {/if}

        {#if selectedMode !== 'legacy' || selectedClub}
          <FormationSelector onSelect={selectFormation} />
        {/if}
      </div>
    </div>

    <footer class="home-foot">
      <div class="home-foot-left">
        {#if streak && (streak.current > 0 || streak.best > 0)}
          <div class="streak-badge">
            <span class="streak-label">{streak.current >= 3 ? '🔥' : '⚡'} {$t('home.streak_label')}</span>
            <strong>{streak.current}</strong>
            {#if streak.best > 0}<span class="streak-best">{$t('home.streak_best', { values: { best: streak.best } })}</span>{/if}
          </div>
        {/if}
      </div>
      <nav class="home-foot-links" aria-label="Secondary navigation">
        {#if $runStore}
          <a href={$runStore.result ? `/${lang}/result` : `/${lang}/play`} class="foot-link foot-link-resume">
            {$runStore.result ? $t('home.view_result') : $t('home.resume_run')}
          </a>
        {/if}
        <a href={`/${lang}/leaderboard`} class="foot-link">{$t('nav.leaderboard')}</a>
        <a href={`/${lang}/how-to-play`} class="foot-link">{$t('home.how_it_works')}</a>
        <a href={`/${lang}/support`} class="foot-link">{$t('nav.support')}</a>
      </nav>
    </footer>
  </div>
</section>
