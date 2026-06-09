<script lang="ts">
  import type { DraftPrompt, DraftSlot } from '$lib/game/types';
  import { t } from 'svelte-i18n';

  let { prompt, slot }: { prompt?: DraftPrompt; slot?: DraftSlot } = $props();
</script>

<div class="spin-panel">
  <div>
    <span class="eyebrow">{slot ? $t('spin.pick_label', { values: { label: slot.label } }) : $t('spin.pick_complete')}</span>
    {#if prompt?.type === 'player'}
      <h1>{prompt.slot.label}</h1>
      <p>{$t('spin.select_player', { values: { label: prompt.slot.label.toLowerCase() } })}</p>
    {:else if prompt?.type === 'manager'}
      <h1>{$t('spin.touchline_brief')}</h1>
      <p>{$t('spin.manager_desc')}</p>
    {:else}
      <h1>{$t('spin.simulating')}</h1>
      <p>{$t('spin.treble_chase')}</p>
    {/if}
  </div>
  <div class="spin-badge" aria-hidden="true">
    <span></span>
  </div>
</div>
