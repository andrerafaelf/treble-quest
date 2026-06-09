<script lang="ts">
  import type { GameMode } from '$lib/game/types';

  let {
    value = 'classic',
    onSelect
  }: {
    value?: GameMode;
    onSelect?: (mode: GameMode) => void;
  } = $props();

  const modes: { id: GameMode; label: string; hint: string }[] = [
    { id: 'classic', label: 'Classic Mode', hint: 'Manager plus a full XI, including exact RB, CB, CM and front-three slots. English football.' },
    { id: 'global', label: 'Global Mode', hint: 'Legendary teams from all eras and all leagues — Porto 2004, Nacional 2008/09, Barcelona 2010/11, Real Madrid 2013/14, and more.' },
    { id: 'world-cup', label: 'World Cup Mode', hint: 'A national-team run built around the 8-0 champion path.' }
  ];
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
