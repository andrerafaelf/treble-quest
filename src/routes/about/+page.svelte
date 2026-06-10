<script lang="ts">
  import Button from '$lib/components/Button.svelte';
</script>

<svelte:head>
  <title>About Treble Quest</title>
</svelte:head>

<section class="page-section narrow">
  <span class="eyebrow">About</span>
  <h1 class="page-title">A two-minute treble argument.</h1>
  <div class="text-flow">
    <p>
      Treble Quest is a small, independent football draft game about impossible squad debates:
      peak seasons, tactical fits, cup nerve, and the joy of seeing a drafted team chase the lot.
    </p>
    <p>
      It is intentionally compact. No transfer windows, no wage budgets, no inbox admin. Draft your squad,
      simulate, share the damage.
    </p>
  </div>
  <div class="toolbar-row">
    <Button href="/play">Start Run</Button>
    <Button href="/support" variant="secondary">Support Treble Quest</Button>
    <Button href="/privacy" variant="secondary">Privacy</Button>
  </div>
</section>
