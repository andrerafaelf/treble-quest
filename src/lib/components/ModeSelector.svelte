<script lang="ts">
  import type { GameMode } from '$lib/game/types';
  import { t } from 'svelte-i18n';

  let {
    value = 'classic',
    onSelect
  }: {
    value?: GameMode;
    onSelect?: (mode: GameMode) => void;
  } = $props();

  const modes = $derived<{ id: GameMode; label: string; hint: string }[]>([
    { id: 'classic', label: $t('modes.classic_label'), hint: $t('modes.classic_hint') },
    { id: 'global', label: $t('modes.global_label'), hint: $t('modes.global_hint') },
    { id: 'world-cup', label: $t('modes.world_cup_label'), hint: $t('modes.world_cup_hint') },
    { id: 'legacy', label: $t('modes.legacy_label'), hint: $t('modes.legacy_hint') }
  ]);
</script>

<div class="mode-selector" role="radiogroup" aria-label="Game mode">
  {#each modes as mode}
    <button
      type="button"
      class:active={value === mode.id}
      role="radio"
      aria-checked={value === mode.id}
      onclick={() => onSelect?.(mode.id)}
    >
      <span>{mode.label}</span>
      <small>{mode.hint}</small>
    </button>
  {/each}
</div>
