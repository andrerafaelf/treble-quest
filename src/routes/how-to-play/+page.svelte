<script lang="ts">
  import Button from '$lib/components/Button.svelte';
  import Card from '$lib/components/Card.svelte';
</script>

<svelte:head>
  <title>How to Play Treble Quest</title>
</svelte:head>

<section class="page-section narrow">
  <span class="eyebrow">How to play</span>
  <h1 class="page-title">Draft clean. Simulate fast.</h1>
  <div class="text-flow">
    <p>
      Quick Mode gives you the compact Treble Quest draft: manager, goalkeeper, two defenders, two
      midfielders, two forwards, and a super sub. Classic Mode asks for a formation first, then
      drafts a manager, a full XI, and a super sub.
    </p>
    <p>
      Ratings are internal Treble Quest values, not copied from any game or ratings provider.
      Chemistry comes from club, season, nationality links, squad balance, and slot fit.
    </p>
  </div>
  <Card>
    <div class="steps">
      <div>Spin a real club-season pool.</div>
      <div>Draft one of three options for the active slot.</div>
      <div>Simulate the league, FA Cup, and Champions League chase.</div>
    </div>
  </Card>
  <div class="toolbar-row">
    <Button href="/play">Start Run</Button>
    <Button href="/" variant="ghost">Back home</Button>
  </div>
</section>
