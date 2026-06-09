<script lang="ts">
  import { goto } from '$app/navigation';
  import Button from '$lib/components/Button.svelte';
  import Card from '$lib/components/Card.svelte';
  import DraftProgress from '$lib/components/DraftProgress.svelte';
  import FormationSelector from '$lib/components/FormationSelector.svelte';
  import ManagerOptionCard from '$lib/components/ManagerOptionCard.svelte';
  import ModeSelector from '$lib/components/ModeSelector.svelte';
  import PlayerOptionCard from '$lib/components/PlayerOptionCard.svelte';
  import SpinPanel from '$lib/components/SpinPanel.svelte';
  import SquadRail from '$lib/components/SquadRail.svelte';
  import { getDraftSlots } from '$lib/game/draft';
  import { runStore } from '$lib/game/storage';
  import type { ClassicFormation, GameMode } from '$lib/game/types';

  let mode: GameMode = 'quick';
  let choosingClassic = false;
  let noOverall = false;
  let selecting = false;

  $: run = $runStore;
  $: slots = run ? getDraftSlots(run.mode, run.formation) : getDraftSlots(mode);
  $: currentSlot = run ? slots[run.currentPick] : undefined;
  $: prompt = run?.lastPrompt;

  function startRun(nextMode: GameMode = mode, formation?: ClassicFormation, hideRatings = false) {
    runStore.start(nextMode, formation, hideRatings);
  }

  function selectMode(nextMode: GameMode) {
    mode = nextMode;
    if (nextMode === 'classic') {
      choosingClassic = true;
      return;
    }
    choosingClassic = false;
    noOverall = false;
    startRun(nextMode);
  }

  function selectFormation(formation: ClassicFormation) {
    startRun('classic', formation, noOverall);
  }

  function clearRun() {
    runStore.clear();
  }

  function choose(id: string) {
    if (selecting) return;
    selecting = true;
    const next = runStore.choose(id);
    window.setTimeout(() => {
      if (next && next.currentPick >= getDraftSlots(next.mode, next.formation).length) {
        runStore.finish();
        goto('/result');
      }
      selecting = false;
    }, 420);
  }
</script>

<svelte:head>
  <title>Play Treble Quest</title>
</svelte:head>

{#if !run}
  <section class="page-section narrow">
    <span class="eyebrow">New run</span>
    <h1 class="page-title">Choose your run.</h1>
    <Card>
      <ModeSelector value={mode} onSelect={selectMode} />
      {#if choosingClassic}
        <label class="toggle-row">
          <input type="checkbox" bind:checked={noOverall} />
          <span>No overall mode</span>
          <strong>Hard</strong>
        </label>
        <FormationSelector onSelect={selectFormation} />
      {/if}
      <div class="toolbar-row">
        <Button href="/" variant="ghost">Back home</Button>
      </div>
    </Card>
  </section>
{:else if run.result}
  <section class="page-section narrow">
    <span class="eyebrow">Run complete</span>
    <h1 class="page-title">Your result is ready.</h1>
    <div class="toolbar-row">
      <Button href="/result">View result</Button>
      <Button variant="secondary" onclick={() => runStore.replay()}>Replay mode</Button>
      <Button variant="danger" onclick={clearRun}>Clear run</Button>
    </div>
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
              onSelect={choose}
            />
          {/each}
        {/if}
      </div>
      <div class="toolbar-row">
        <Button variant="ghost" onclick={clearRun}>Clear run</Button>
      </div>
    </div>
    <SquadRail picks={run.picks} {slots} showRatings={!run.hideRatings} />
  </section>
{/if}
