<script lang="ts">
  import type { DraftPrompt, DraftSlot } from '$lib/game/types';

  let { prompt, slot }: { prompt?: DraftPrompt; slot?: DraftSlot } = $props();
</script>

<div class="spin-panel">
  <div>
    <span class="eyebrow">Pick {slot ? slot.label : 'Complete'}</span>
    {#if prompt?.type === 'player'}
      <h1>{prompt.slot.label}</h1>
      <p>Select one player for the {prompt.slot.label.toLowerCase()} slot.</p>
    {:else if prompt?.type === 'manager'}
      <h1>Touchline Brief</h1>
      <p>Start the run with a manager identity.</p>
    {:else}
      <h1>Simulating</h1>
      <p>The treble chase is being settled.</p>
    {/if}
  </div>
  <div class="spin-badge" aria-hidden="true">
    <span></span>
  </div>
</div>
