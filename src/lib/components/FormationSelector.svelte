<script lang="ts">
  import type { ClassicFormation } from '$lib/game/types';

  let {
    onSelect
  }: {
    onSelect?: (formation: ClassicFormation) => void;
  } = $props();

  const formations: { id: ClassicFormation; label: string; hint: string; shape: string[] }[] = [
    {
      id: '4-3-3',
      label: '4-3-3',
      hint: 'Best for control, wide forwards, and balanced squads.',
      shape: ['LW  ST  RW', 'CM  CM  CM', 'LB  CB  CB  RB', 'GK']
    },
    {
      id: '4-4-2',
      label: '4-4-2',
      hint: 'Classic two-striker shape with wide midfielders and a sturdy spine.',
      shape: ['ST  ST', 'LM  CM  CM  RM', 'LB  CB  CB  RB', 'GK']
    },
    {
      id: '4-2-3-1',
      label: '4-2-3-1',
      hint: 'Adds an attacking midfielder without losing the back four.',
      shape: ['ST', 'LW  AM  RW', 'CM  CM', 'LB  CB  CB  RB', 'GK']
    },
    {
      id: '3-4-3',
      label: '3-4-3',
      hint: 'High-upside shape with wing-backs and three centre-backs.',
      shape: ['LW  ST  RW', 'LWB  CM  CM  RWB', 'CB  CB  CB', 'GK']
    }
  ];
</script>

<div class="formation-selector" aria-label="Classic formation">
  {#each formations as formation}
    <button type="button" onclick={() => onSelect?.(formation.id)}>
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
