<script lang="ts">
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import Button from '$lib/components/Button.svelte';
  import Card from '$lib/components/Card.svelte';
  import DraftProgress from '$lib/components/DraftProgress.svelte';
  import FormationSelector from '$lib/components/FormationSelector.svelte';
  import ManagerOptionCard from '$lib/components/ManagerOptionCard.svelte';
  import ModeSelector from '$lib/components/ModeSelector.svelte';
  import PlayerOptionCard from '$lib/components/PlayerOptionCard.svelte';
  import SpinPanel from '$lib/components/SpinPanel.svelte';
  import SquadRail from '$lib/components/SquadRail.svelte';
  import { parseRunConfigFromUrl } from '$lib/game/deeplink';
  import { getDraftSlots } from '$lib/game/draft';
  import { previewChemistry, type ChemPreview } from '$lib/game/scoring';
  import { runStore } from '$lib/game/storage';
  import type { ClassicFormation, GameMode, PlayerPick } from '$lib/game/types';
  import type { LayoutData } from '../$types';
  import { t } from 'svelte-i18n';

  let { data }: { data: LayoutData } = $props();
  const lang = $derived(data.lang);

  let mode = $state<GameMode>('classic');
  let choosingClassic = $state(false);
  let noOverall = $state(false);
  let selecting = $state(false);
  let deepLinkApplied = $state(false);
  let namingTeam = $state(false);
  let teamNameInput = $state('');
  let hoveredPlayerId = $state<string | null>(null);

  const run = $derived($runStore);
  const slots = $derived(run ? getDraftSlots(run.mode, run.formation) : getDraftSlots(mode));
  const currentSlot = $derived(run ? slots[run.currentPick] : undefined);
  const prompt = $derived(run?.lastPrompt);

  const existingPlayerPicks = $derived(
    run ? (run.picks.filter((p) => p.type === 'player') as PlayerPick[]) : [],
  );

  const chemPreviews = $derived((): Map<string, ChemPreview> => {
    if (!run || !prompt || prompt.type !== 'player') return new Map();
    const map = new Map<string, ChemPreview>();
    for (const player of prompt.options) {
      map.set(player.id, previewChemistry(existingPlayerPicks, player, run.mode));
    }
    return map;
  });

  const baseChemPreview = $derived((): ChemPreview | undefined => {
    if (existingPlayerPicks.length === 0) return undefined;
    const current = chemPreviews().values().next().value?.current ?? 50;
    return { current, projected: current, delta: 0, bonds: [] };
  });

  const activeChemPreview = $derived(
    hoveredPlayerId ? chemPreviews().get(hoveredPlayerId) : baseChemPreview(),
  );

  function startRun(nextMode: GameMode = mode, formation?: ClassicFormation, hideRatings = false) {
    runStore.start(nextMode, formation, hideRatings);
  }

  function selectMode(nextMode: GameMode) {
    mode = nextMode;
    choosingClassic = true;
  }

  function selectFormation(formation: ClassicFormation) {
    startRun(mode, formation, noOverall);
    teamNameInput = '';
    namingTeam = true;
  }

  function confirmTeamName() {
    runStore.setTeamName(teamNameInput);
    namingTeam = false;
  }

  function clearRun() {
    runStore.clear();
  }

  function choose(id: string) {
    if (selecting) return;
    selecting = true;
    hoveredPlayerId = null;
    const next = runStore.choose(id);
    window.setTimeout(() => {
      if (next && next.currentPick >= getDraftSlots(next.mode, next.formation).length) {
        runStore.finish();
        goto(`/${lang}/result`);
      }
      selecting = false;
    }, 420);
  }

  function handleHover(id: string | null) {
    hoveredPlayerId = id;
  }

  $effect(() => {
    if (!browser || deepLinkApplied || run) return;
    const config = parseRunConfigFromUrl(page.url);
    if (!config) return;
    deepLinkApplied = true;
    startRun(config.mode, config.formation, config.hideRatings);
  });

  $effect(() => {
    if (!browser || !prompt) return;
    const el = document.querySelector('.options-grid');
    if (el) {
      const rect = el.getBoundingClientRect();
      if (rect.top < 0 || rect.top > window.innerHeight * 0.75) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  });
</script>

<svelte:head>
  <title>{$t('play.page_title')}</title>
</svelte:head>

{#if !run}
  <section class="page-section narrow">
    <span class="eyebrow">{$t('play.new_run')}</span>
    <h1 class="page-title">{$t('play.choose_run')}</h1>
    <Card>
      <ModeSelector value={mode} onSelect={selectMode} />
      {#if choosingClassic}
        <label class="toggle-row">
          <input type="checkbox" bind:checked={noOverall} />
          <span>{$t('play.no_overall_mode')}</span>
          <strong>{$t('play.hard')}</strong>
        </label>
        <FormationSelector onSelect={selectFormation} />
      {/if}
      <div class="toolbar-row">
        <Button href={`/${lang}`} variant="ghost">{$t('play.back_home')}</Button>
      </div>
    </Card>
  </section>
{:else if run.result}
  <section class="page-section narrow">
    <span class="eyebrow">{$t('play.run_complete')}</span>
    <h1 class="page-title">{$t('play.result_ready')}</h1>
    <div class="toolbar-row">
      <Button href={`/${lang}/result`}>{$t('play.view_result')}</Button>
      <Button variant="secondary" onclick={() => runStore.replay()}>{$t('play.replay_mode')}</Button>
      <Button variant="danger" onclick={clearRun}>{$t('play.clear_run')}</Button>
    </div>
  </section>
{:else if namingTeam}
  <section class="page-section narrow">
    <span class="eyebrow">{$t('play.name_your_club')}</span>
    <h1 class="page-title">{$t('play.club_called')}</h1>
    <Card>
      <form
        onsubmit={(e) => {
          e.preventDefault();
          confirmTeamName();
        }}
      >
        <input
          class="team-name-input"
          type="text"
          placeholder={$t('play.club_placeholder')}
          maxlength="40"
          bind:value={teamNameInput}
          autofocus
        />
        <div class="toolbar-row">
          <Button type="submit">{$t('play.start_draft')}</Button>
          <Button variant="ghost" onclick={confirmTeamName}>{$t('play.skip')}</Button>
        </div>
      </form>
    </Card>
  </section>
{:else}
  <section class="play-grid">
    <div>
      <DraftProgress currentPick={run.currentPick} picks={run.picks} {slots} />
      <SpinPanel {prompt} slot={currentSlot} />
      <div class="options-grid" aria-live="polite">
        {#if prompt?.type === 'manager'}
          {#each prompt.options as manager}
            <ManagerOptionCard {manager} showRatings={!run.hideRatings} disabled={selecting} onSelect={choose} />
          {/each}
        {:else if prompt?.type === 'player'}
          {#each prompt.options as player}
            <PlayerOptionCard
              {player}
              required={prompt.slot.required}
              showRatings={!run.hideRatings}
              disabled={selecting}
              chemPreview={chemPreviews().get(player.id)}
              onSelect={choose}
              onHover={handleHover}
            />
          {/each}
        {/if}
      </div>
      <div class="toolbar-row">
        <Button variant="ghost" onclick={clearRun}>{$t('play.clear_run')}</Button>
      </div>
    </div>
    <SquadRail picks={run.picks} {slots} showRatings={!run.hideRatings} chemPreview={activeChemPreview} />
  </section>
{/if}
