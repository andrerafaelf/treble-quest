<script lang="ts">
  import JerseyPitchView from '$lib/components/JerseyPitchView.svelte';
  import { classicDraftSlots } from '$lib/game/draft';
  import type { ChemPreview } from '$lib/game/scoring';
  import type { DraftPick, DraftSlot } from '$lib/game/types';

  let {
    picks = [],
    slots = classicDraftSlots,
    showRatings = true,
    chemPreview = undefined,
  }: {
    picks?: DraftPick[];
    slots?: DraftSlot[];
    showRatings?: boolean;
    chemPreview?: ChemPreview | undefined;
  } = $props();

  const slotById = $derived(new Map(slots.map((slot) => [slot.id, slot])));
  const managerPick = $derived(picks.find((pick) => pick.slot.id === 'manager'));
  const subPick = $derived(picks.find((pick) => pick.slot.id === 'super-sub'));

  const displayChem = $derived(chemPreview?.projected ?? chemPreview?.current ?? null);
  const baseChem = $derived(chemPreview?.current ?? null);
  const chemDelta = $derived(chemPreview?.delta ?? 0);
  const chemBonds = $derived(chemPreview?.bonds ?? []);
  const hasChem = $derived(displayChem !== null);
  const isPreviewActive = $derived(chemDelta > 0);

  function chemColor(val: number): string {
    if (val >= 80) return 'var(--gold)';
    if (val >= 60) return 'var(--accent)';
    return 'var(--muted)';
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
  <JerseyPitchView {picks} {slots} {showRatings} />
  <div class="squad-staff">
    <div class:filled={Boolean(subPick)} class="squad-chip">
      <span>SUB</span>
      <strong>{pickName(subPick, slotById.get('super-sub')) || 'Super Sub'}</strong>
    </div>
  </div>

  {#if hasChem}
    <div class="chem-panel" class:chem-panel-active={isPreviewActive}>
      <div class="chem-header">
        <span class="chem-label">Chemistry</span>
        <div class="chem-value-row">
          <span class="chem-value" style="color: {chemColor(displayChem!)}">{Math.round(displayChem!)}</span>
          {#if isPreviewActive}
            <span class="chem-arrow">+{chemDelta}</span>
          {/if}
        </div>
      </div>
      <div class="chem-bar-track">
        {#if isPreviewActive && baseChem !== null}
          <div class="chem-bar-base" style="width: {baseChem}%"></div>
        {/if}
        <div
          class="chem-bar-fill"
          class:chem-bar-preview={isPreviewActive}
          style="width: {displayChem}%"
        ></div>
      </div>
      {#if isPreviewActive && chemBonds.length > 0}
        <ul class="chem-bonds">
          {#each chemBonds as bond}
            <li class="chem-bond">
              <span class="chem-bond-label">{bond.label}</span>
              <span class="chem-bond-delta">+{bond.delta}</span>
            </li>
          {/each}
        </ul>
      {:else if !isPreviewActive}
        <p class="chem-hint">Hover a card to preview chemistry</p>
      {/if}
    </div>
  {/if}
</aside>
