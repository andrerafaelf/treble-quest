<script lang="ts">
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import Button from '$lib/components/Button.svelte';
  import Card from '$lib/components/Card.svelte';
  import FormationSelector from '$lib/components/FormationSelector.svelte';
  import ModeSelector from '$lib/components/ModeSelector.svelte';
  import { getStreak, runStore } from '$lib/game/storage';
  import trebleQuestImage from '$lib/icons/treble-quest.png';
  import type { ClassicFormation, GameMode } from '$lib/game/types';

  let choosingClassic = false;
  const streak = browser ? getStreak() : null;

  function startRun(mode: GameMode = 'quick', formation?: ClassicFormation) {
    runStore.start(mode, formation);
    goto('/play');
  }

  function selectMode(mode: GameMode) {
    if (mode === 'classic') {
      choosingClassic = true;
      return;
    }
    choosingClassic = false;
    startRun('quick');
  }

  function selectFormation(formation: ClassicFormation) {
    startRun('classic', formation);
  }
</script>

<section class="hero">
  <div class="hero-inner">
    <div>
      <span class="eyebrow">Fast football draft simulator</span>
      <h1>Treble Quest</h1>
      <p class="hero-copy">
        Draft a sharp squad. Chase three trophies. Built for football arguments, group chats, and
        one-more-run addiction.
      </p>
      <div class="cta-row">
        <Button onclick={() => startRun('quick')}>Start Quick Run</Button>
        <Button href="/how-to-play" variant="secondary">How it works</Button>
        <Button href="/support" variant="ghost">Support the game</Button>
        {#if $runStore}
          <Button href={$runStore.result ? '/result' : '/play'} variant="ghost">
            {$runStore.result ? 'View result' : 'Resume run'}
          </Button>
        {/if}
      </div>
    </div>
    <Card tone="accent">
      <img class="home-crest" src={trebleQuestImage} alt="Treble Quest crest" />
      <ModeSelector value={choosingClassic ? 'classic' : 'quick'} onSelect={selectMode} />
      {#if choosingClassic}
        <FormationSelector onSelect={selectFormation} />
      {/if}
      <div class="steps" aria-label="Game steps" style="margin-top: 18px;">
        <div>Spin a club and season</div>
        <div>Draft one option</div>
        <div>Simulate the treble chase</div>
      </div>
      {#if streak && (streak.current > 0 || streak.best > 0)}
        <div class="streak-badge">
          <span class="streak-label">{streak.current >= 3 ? '🔥' : '⚡'} Streak</span>
          <strong>{streak.current}</strong>
          {#if streak.best > 0}<span class="streak-best">Best: {streak.best}</span>{/if}
        </div>
      {/if}
      <a class="support-nudge" href="/support">
        <strong>Keep the ratings growing</strong>
        <span>Support new pools, balance passes, and hosting on Ko-fi.</span>
      </a>
    </Card>
  </div>
</section>
