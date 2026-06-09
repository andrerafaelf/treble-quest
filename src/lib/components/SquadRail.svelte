<script lang="ts">
  import JerseyPitchView from '$lib/components/JerseyPitchView.svelte';
  import { classicDraftSlots } from '$lib/game/draft';
  import type { DraftPick, DraftSlot, DraftSlotId } from '$lib/game/types';

  let {
    picks = [],
    slots = classicDraftSlots,
    showRatings = true
  }: {
    picks?: DraftPick[];
    slots?: DraftSlot[];
    showRatings?: boolean;
  } = $props();

  const slotById = $derived(new Map(slots.map((slot) => [slot.id, slot])));
  const managerPick = $derived(picks.find((pick) => pick.slot.id === 'manager'));
  const subPick = $derived(picks.find((pick) => pick.slot.id === 'super-sub'));

  function pickName(pick: DraftPick | undefined, slot: DraftSlot | undefined) {
    if (!pick) return slot?.short ?? '';
    return pick.type === 'manager' ? pick.manager.name : pick.player.name;
  }
</script>

<aside class="squad-rail" aria-label="Selected squad">
  <h2>Squad</h2>
  <div class="squad-staff">
    <div class:filled={Boolean(managerPick)} class="squad-chip">
      <span>MGR</span>
      <strong>{pickName(managerPick, slotById.get('manager')) || 'Manager'}</strong>
    </div>
  </div>
  <JerseyPitchView {picks} {slots} {showRatings} />
  <div class="squad-staff">
    <div class:filled={Boolean(subPick)} class="squad-chip">
      <span>SUB</span>
      <strong>{pickName(subPick, slotById.get('super-sub')) || 'Super Sub'}</strong>
    </div>
  </div>
</aside>
