<script lang="ts">
  import { draftSlots } from '$lib/game/draft';
  import type { DraftPick, DraftSlot } from '$lib/game/types';

  let { currentPick = 0, picks = [], slots = draftSlots }: { currentPick?: number; picks?: DraftPick[]; slots?: DraftSlot[] } = $props();
</script>

<div class="draft-progress" aria-label="Draft progress">
  {#each slots as slot, index}
    <div class:done={index < picks.length} class:current={index === currentPick} class="progress-step">
      <span>{slot.short}</span>
    </div>
  {/each}
</div>
