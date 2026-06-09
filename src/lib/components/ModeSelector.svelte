<script lang="ts">
  import type { GameMode } from '$lib/game/types';

  let {
    value = 'quick',
    onSelect
  }: {
    value?: GameMode;
    onSelect?: (mode: GameMode) => void;
  } = $props();

  const modes: { id: GameMode; label: string; hint: string }[] = [
    { id: 'quick', label: 'Quick Mode', hint: 'Manager, seven-a-side squad, and one super sub.' },
    { id: 'classic', label: 'Classic Mode', hint: 'Manager plus a full XI, including exact RB, CB, CM and front-three slots.' },
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
