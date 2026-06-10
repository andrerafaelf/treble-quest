<script lang="ts">
  import type { ClassicFormation } from '$lib/game/types';
  import { t } from 'svelte-i18n';

  let {
    onSelect,
    selected,
  }: {
    onSelect?: (formation: ClassicFormation) => void;
    selected?: ClassicFormation;
  } = $props();

  const formations = $derived<{ id: ClassicFormation; label: string; hint: string; shape: string[] }[]>([
    {
      id: '4-3-3',
      label: '4-3-3',
      hint: $t('formations.433_hint'),
      shape: ['LW  ST  RW', 'CM  CM  CM', 'LB  CB  CB  RB', 'GK'],
    },
    {
      id: '4-4-2',
      label: '4-4-2',
      hint: $t('formations.442_hint'),
      shape: ['ST  ST', 'LM  CM  CM  RM', 'LB  CB  CB  RB', 'GK'],
    },
    {
      id: '4-2-3-1',
      label: '4-2-3-1',
      hint: $t('formations.4231_hint'),
      shape: ['ST', 'LW  AM  RW', 'CM  CM', 'LB  CB  CB  RB', 'GK'],
    },
    {
      id: '3-4-3',
      label: '3-4-3',
      hint: $t('formations.343_hint'),
      shape: ['LW  ST  RW', 'LWB  CM  CM  RWB', 'CB  CB  CB', 'GK'],
    },
  ]);
</script>

<div class="formation-selector" aria-label="Classic formation">
  {#each formations as formation}
    <button
      type="button"
      class:selected={selected === formation.id}
      aria-pressed={selected === formation.id}
      onclick={() => onSelect?.(formation.id)}
    >
      <span>{formation.label}</span>
      <div class="formation-shape" aria-hidden="true">
        {#each formation.shape as line}
          <small>{line}</small>
        {/each}
      </div>
      <p>{formation.hint}</p>
    </button>
  {/each}
</div>
