<script lang="ts">
  import { goto } from '$app/navigation';
  import Button from '$lib/components/Button.svelte';
  import CompetitionBreakdown from '$lib/components/CompetitionBreakdown.svelte';
  import LeaderboardSubmit from '$lib/components/LeaderboardSubmit.svelte';
  import ResultHero from '$lib/components/ResultHero.svelte';
  import SharePanel from '$lib/components/SharePanel.svelte';
  import SquadRail from '$lib/components/SquadRail.svelte';
  import { getDraftSlots } from '$lib/game/draft';
  import { runStore } from '$lib/game/storage';

  $: run = $runStore;
  $: result = run?.result;
  $: slots = run ? getDraftSlots(run.mode, run.formation) : [];

  function replay() {
    runStore.replay();
    goto('/play');
  }

  function newRun() {
    runStore.clear();
    goto('/play');
  }
</script>

<svelte:head>
  <title>Treble Quest Result</title>
</svelte:head>

{#if !run}
  <section class="page-section narrow">
    <span class="eyebrow">No active run</span>
    <h1 class="page-title">Start a draft first.</h1>
    <Button href="/play">Start Run</Button>
  </section>
{:else if !result}
  <section class="page-section narrow">
    <span class="eyebrow">Run in progress</span>
    <h1 class="page-title">Finish your draft.</h1>
    <Button href="/play">Resume draft</Button>
  </section>
{:else}
  <section class="result-page">
    <div class="result-card">
      <ResultHero {result} />
      <CompetitionBreakdown {result} />
      <section class="insight-grid">
        <article>
          <span>Best pick</span>
          <h2>{result.bestPick.type === 'manager' ? result.bestPick.manager.name : result.bestPick.player.name}</h2>
          <p>{result.bestPick.slot.label}</p>
        </article>
        <article>
          <span>Weak link</span>
          <h2>{result.weakLink.type === 'manager' ? result.weakLink.manager.name : result.weakLink.player.name}</h2>
          <p>{result.weakLink.slot.label}</p>
        </article>
        <article>
          <span>Manager impact</span>
          <h2>{result.ratings.managerBoost}</h2>
          <p>{result.managerImpact}</p>
        </article>
      </section>
      <section class="final-squad-pitch" aria-label="Final squad">
        <SquadRail picks={run.picks} {slots} />
      </section>
      <LeaderboardSubmit {run} />
      <SharePanel text={result.shareText} />
      <div class="toolbar-row">
        <Button onclick={replay}>Play again</Button>
        <Button variant="secondary" onclick={newRun}>New mode</Button>
      </div>
    </div>
  </section>
{/if}
