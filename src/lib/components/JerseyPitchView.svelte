<script lang="ts">
  import { kitColors } from '$lib/game/clubColors';
  import type { DraftPick, DraftSlot, DraftSlotId } from '$lib/game/types';

  let {
    picks = [],
    slots = [],
    showRatings = true,
  }: {
    picks?: DraftPick[];
    slots?: DraftSlot[];
    showRatings?: boolean;
  } = $props();

  const slotById = $derived(new Map(slots.map((s) => [s.id, s])));
  const pitchRows = $derived(getPitchRows(slots));

  function getPitchRows(currentSlots: DraftSlot[]): DraftSlotId[][] {
    const ids = new Set(currentSlots.map((s) => s.id));

    if (ids.has('centre-back-3')) {
      return [
        ['left-wing', 'striker', 'right-wing'],
        ['left-wing-back', 'central-midfielder-1', 'central-midfielder-2', 'right-wing-back'],
        ['centre-back-3', 'centre-back-2', 'centre-back-1'],
        ['goalkeeper'],
      ];
    }
    if (ids.has('attacking-midfielder')) {
      return [
        ['striker'],
        ['left-wing', 'attacking-midfielder', 'right-wing'],
        ['central-midfielder-1', 'central-midfielder-2'],
        ['left-back', 'centre-back-2', 'centre-back-1', 'right-back'],
        ['goalkeeper'],
      ];
    }
    if (ids.has('right-back') && ids.has('second-forward')) {
      return [
        ['second-forward', 'striker'],
        ['left-wing', 'central-midfielder-2', 'central-midfielder-1', 'right-wing'],
        ['left-back', 'centre-back-2', 'centre-back-1', 'right-back'],
        ['goalkeeper'],
      ];
    }
    if (ids.has('central-midfielder-3')) {
      return [
        ['left-wing', 'striker', 'right-wing'],
        ['central-midfielder-3', 'central-midfielder-2', 'central-midfielder-1'],
        ['left-back', 'centre-back-2', 'centre-back-1', 'right-back'],
        ['goalkeeper'],
      ];
    }
    return [
      ['second-forward', 'forward'],
      ['second-midfielder', 'midfielder'],
      ['second-defender', 'defender'],
      ['goalkeeper'],
    ];
  }

  function pickFor(slotId: DraftSlotId): DraftPick | undefined {
    return picks.find((p) => p.slot.id === slotId);
  }

  function initials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function shortName(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return name;
    // "V. van Dijk" style
    return parts[0][0] + '. ' + parts.slice(1).join(' ');
  }

  function clubOf(pick: DraftPick): string {
    return pick.type === 'player' ? pick.player.club : '';
  }
</script>

<div class="jersey-pitch" aria-label="Squad formation">
  {#each pitchRows as row}
    <div class="jersey-row" style="--spots: {row.length}">
      {#each row as slotId}
        {@const slot = slotById.get(slotId)}
        {@const pick = pickFor(slotId)}
        {#if slot}
          {@const filled = Boolean(pick)}
          {@const club = pick ? clubOf(pick) : ''}
          {@const kit = kitColors(club)}
          {@const name = pick
            ? pick.type === 'manager'
              ? pick.manager.name
              : pick.player.name
            : ''}
          {@const overall = pick?.type === 'player' ? pick.player.overall : null}
          {@const label = filled ? initials(name) : slot.short}

          <div class="jersey-spot" class:filled>
            <!-- SVG jersey -->
            <svg
              class="jersey-svg"
              viewBox="0 0 60 56"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <!-- sleeve left -->
              <polygon points="0,10 14,4 18,22 4,26" fill={filled ? kit.primary : '#2a2a2a'} />
              <!-- sleeve right -->
              <polygon points="60,10 46,4 42,22 56,26" fill={filled ? kit.primary : '#2a2a2a'} />
              <!-- body -->
              <path d="M14,4 Q30,0 46,4 L50,56 L10,56 Z" fill={filled ? kit.primary : '#2a2a2a'} />
              <!-- collar accent -->
              <path d="M22,4 Q30,8 38,4 Q36,14 30,16 Q24,14 22,4 Z" fill={filled ? kit.secondary : '#3a3a3a'} />
              <!-- initials -->
              <text
                x="30"
                y="40"
                text-anchor="middle"
                dominant-baseline="middle"
                font-family="system-ui, sans-serif"
                font-weight="900"
                font-size={label.length > 2 ? '11' : '14'}
                fill={filled ? kit.text : '#666'}
                letter-spacing="0.5"
              >{label}</text>
            </svg>

            {#if showRatings && overall !== null}
              <span class="jersey-overall">{overall}</span>
            {/if}

            <span class="jersey-name">
              {filled ? shortName(name) : slot.short}
            </span>
          </div>
        {/if}
      {/each}
    </div>
  {/each}
</div>

<style>
  .jersey-pitch {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 6px;
    min-height: 420px;
    padding: 14px 10px;
    border: 1px solid rgba(68, 224, 208, 0.2);
    border-radius: 8px;
    background:
      linear-gradient(
        90deg,
        transparent 49.5%,
        rgba(255, 255, 255, 0.1) 49.5%,
        rgba(255, 255, 255, 0.1) 50.5%,
        transparent 50.5%
      ),
      radial-gradient(ellipse at center, transparent 0 16%, rgba(255, 255, 255, 0.1) 16.5% 17.5%, transparent 18%),
      repeating-linear-gradient(90deg, rgba(45, 160, 90, 0.12) 0 20%, rgba(45, 140, 70, 0.06) 20% 40%),
      rgba(6, 28, 16, 0.82);
  }

  .jersey-row {
    display: grid;
    grid-template-columns: repeat(var(--spots), minmax(0, 1fr));
    gap: 4px;
    align-items: end;
  }

  .jersey-spot {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    position: relative;
  }

  .jersey-svg {
    width: 100%;
    max-width: 58px;
    height: auto;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
  }

  .filled .jersey-svg {
    filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.7));
  }

  .jersey-overall {
    position: absolute;
    top: -6px;
    right: calc(50% - 28px);
    min-width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #f5c518;
    color: #111;
    font-size: 0.6rem;
    font-weight: 900;
    display: grid;
    place-items: center;
    padding: 0 3px;
    line-height: 1;
    box-shadow: 0 1px 3px rgba(0,0,0,0.5);
  }

  .jersey-name {
    font-size: 0.58rem;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.9);
    text-align: center;
    line-height: 1.2;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  }

  .jersey-spot:not(.filled) .jersey-name {
    color: rgba(255, 255, 255, 0.3);
  }
</style>
