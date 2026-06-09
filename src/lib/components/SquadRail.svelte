<script lang="ts">
  import { draftSlots } from '$lib/game/draft';
  import type { DraftPick, DraftSlot, DraftSlotId } from '$lib/game/types';

  let {
    picks = [],
    slots = draftSlots,
    showRatings = true
  }: {
    picks?: DraftPick[];
    slots?: DraftSlot[];
    showRatings?: boolean;
  } = $props();

  const slotById = $derived(new Map(slots.map((slot) => [slot.id, slot])));
  const managerPick = $derived(picks.find((pick) => pick.slot.id === 'manager'));
  const subPick = $derived(picks.find((pick) => pick.slot.id === 'super-sub'));
  const pitchRows = $derived(getPitchRows(slots));

  function getPitchRows(currentSlots: DraftSlot[]): DraftSlotId[][] {
    const ids = new Set(currentSlots.map((slot) => slot.id));

    if (ids.has('centre-back-3')) {
      return [
        ['left-wing', 'striker', 'right-wing'],
        ['left-wing-back', 'central-midfielder-1', 'central-midfielder-2', 'right-wing-back'],
        ['centre-back-3', 'centre-back-2', 'centre-back-1'],
        ['goalkeeper']
      ];
    }

    if (ids.has('attacking-midfielder')) {
      return [
        ['striker'],
        ['left-wing', 'attacking-midfielder', 'right-wing'],
        ['central-midfielder-1', 'central-midfielder-2'],
        ['left-back', 'centre-back-2', 'centre-back-1', 'right-back'],
        ['goalkeeper']
      ];
    }

    if (ids.has('right-back') && ids.has('second-forward')) {
      return [
        ['second-forward', 'striker'],
        ['left-wing', 'central-midfielder-2', 'central-midfielder-1', 'right-wing'],
        ['left-back', 'centre-back-2', 'centre-back-1', 'right-back'],
        ['goalkeeper']
      ];
    }

    if (ids.has('central-midfielder-3')) {
      return [
        ['left-wing', 'striker', 'right-wing'],
        ['central-midfielder-3', 'central-midfielder-2', 'central-midfielder-1'],
        ['left-back', 'centre-back-2', 'centre-back-1', 'right-back'],
        ['goalkeeper']
      ];
    }

    return [
      ['second-forward', 'forward'],
      ['second-midfielder', 'midfielder'],
      ['second-defender', 'defender'],
      ['goalkeeper']
    ];
  }

  function pickFor(slotId: DraftSlotId) {
    return picks.find((item) => item.slot.id === slotId);
  }

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
  <div class="squad-pitch" aria-label="Formation pitch">
    {#each pitchRows as row}
      <div class="pitch-row" style={`--spots: ${row.length}`}>
        {#each row as slotId}
          {@const slot = slotById.get(slotId)}
          {@const pick = pickFor(slotId)}
          {#if slot}
            <div class:filled={Boolean(pick)} class="pitch-player">
              <span>{slot.short}</span>
              <strong>{pickName(pick, slot)}</strong>
              {#if showRatings && pick?.type === 'player'}
                <em>{pick.player.overall}</em>
              {/if}
            </div>
          {/if}
        {/each}
      </div>
    {/each}
  </div>
  <div class="squad-staff">
    <div class:filled={Boolean(subPick)} class="squad-chip">
      <span>SUB</span>
      <strong>{pickName(subPick, slotById.get('super-sub')) || 'Super Sub'}</strong>
    </div>
  </div>
</aside>
