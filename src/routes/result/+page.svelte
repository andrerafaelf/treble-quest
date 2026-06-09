<script lang="ts">
  import { goto } from '$app/navigation';
  import AwardsPanel from '$lib/components/AwardsPanel.svelte';
  import Button from '$lib/components/Button.svelte';
  import CompetitionBreakdown from '$lib/components/CompetitionBreakdown.svelte';
  import LeaderboardSubmit from '$lib/components/LeaderboardSubmit.svelte';
  import LeagueTable from '$lib/components/LeagueTable.svelte';
  import MatchFeed from '$lib/components/MatchFeed.svelte';
  import MatchPlayback from '$lib/components/MatchPlayback.svelte';
  import PlayerStatsTable from '$lib/components/PlayerStatsTable.svelte';
  import ResultCard from '$lib/components/ResultCard.svelte';
  import ResultHero from '$lib/components/ResultHero.svelte';
  import SharePanel from '$lib/components/SharePanel.svelte';
  import SquadRail from '$lib/components/SquadRail.svelte';
  import StatHighlights from '$lib/components/StatHighlights.svelte';
  import { getDraftSlots } from '$lib/game/draft';
  import { recordStreakResult, runStore, type StreakState } from '$lib/game/storage';
  import { onDestroy } from 'svelte';

  const run = $derived($runStore);
  const result = $derived(run?.result);
  const slots = $derived(run ? getDraftSlots(run.mode, run.formation) : []);
  const replayLabel = $derived(result?.worldCup ? 'Run it back for 8-0' : 'Run it back for 38-0 + 15-0');

  const achievements = $derived(
    (() => {
      if (!result) return [];
      const a: string[] = [];
      if (result.worldCup) {
        if (result.worldCup.won) a.push(result.worldCup.losses === 0 ? 'WORLD CONQUERORS' : 'WORLD CHAMPIONS');
        return a;
      }
      if (result.league.wins === 38) a.push('PERFECTOS');
      else if (result.league.losses === 0) a.push('INVINCIBLES');
      else if (result.league.points >= 100) a.push('CENTURIONS');
      if (result.championsLeague.won)
        a.push(result.championsLeague.losses === 0 ? 'PERFECT EUROPEANS' : 'EUROPEAN CHAMPIONS');
      if (result.faCup.won) {
        const facConceded = result.matches.filter((m) => m.competition === 'FAC').reduce((s, m) => s + m.ga, 0);
        a.push(facConceded === 0 ? 'CUP KINGS' : 'FA CUP WINNERS');
      }
      return a;
    })(),
  );

  let streak = $state<StreakState | null>(null);
  let playbackDone = $state(false);
  let keepResultOnLeave = $state(false);
  let lastSeedSeen = $state<number | undefined>(undefined);

  $effect(() => {
    if (result && streak === null) {
      streak = recordStreakResult(result.trophies);
    }
  });

  $effect(() => {
    const resultKey = result?.seed;
    if (resultKey !== undefined && lastSeedSeen !== resultKey) {
      playbackDone = false;
      lastSeedSeen = resultKey;
    }
  });

  function finishPlayback() {
    playbackDone = true;
  }

  function replay() {
    streak = null;
    playbackDone = false;
    keepResultOnLeave = true;
    runStore.replay();
    goto('/play');
  }

  function newRun() {
    streak = null;
    playbackDone = false;
    keepResultOnLeave = true;
    runStore.clear();
    goto('/play');
  }

  onDestroy(() => {
    if (!keepResultOnLeave && $runStore?.result) runStore.clear();
  });
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
    <div class="result-card" class:treble={result.trophies === 3 || result.worldCup?.won}>
      {#if !playbackDone}
        <MatchPlayback
          matches={result.matches}
          leagueTable={result.leagueTable}
          {result}
          teamName={run.teamName}
          onDone={finishPlayback}
        />
      {:else}
        <ResultHero {result} />
        <StatHighlights highlights={result.highlights} {achievements} />
        <CompetitionBreakdown {result} />
        <AwardsPanel awards={result.awards} />
        <PlayerStatsTable stats={result.playerStats} />
        <MatchFeed matches={result.matches} />
        {#if result.leagueTable.length > 0}
          <LeagueTable rows={result.leagueTable} />
        {/if}
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
          {#if streak}
            <article class:streak-fire={streak.current >= 3}>
              <span>Streak</span>
              <h2>{streak.current === 0 ? 'Broken' : `${streak.current} ${streak.current === 1 ? 'run' : 'runs'}`}</h2>
              <p>
                {streak.current === 0
                  ? 'No trophies, streak reset'
                  : streak.current >= streak.best
                    ? `Best streak: ${streak.best}`
                    : `Personal best: ${streak.best}`}
              </p>
            </article>
          {/if}
        </section>
        <section class="final-squad-pitch" aria-label="Final squad">
          <SquadRail picks={run.picks} {slots} />
        </section>
        <LeaderboardSubmit {run} />
        <div class="kofi-nudge">
          <p>
            Enjoying Treble Quest? <a href="https://ko-fi.com/treblequest" target="_blank" rel="noreferrer"
              >Support on Ko-fi</a
            > to keep it online and growing.
          </p>
        </div>
        <SharePanel {run} {result} />
        <ResultCard {result} {run} />
        <div class="toolbar-row">
          <Button onclick={replay}>{replayLabel}</Button>
          <Button variant="secondary" onclick={newRun}>New mode</Button>
        </div>
      {/if}
    </div>
  </section>
{/if}
