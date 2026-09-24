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
              <polygon points="0,10 14,4 18,22 4,26" fill={filled ? kit.primary : 'rgba(255, 255, 255, 0.1)'} stroke={filled ? '#fffcf3' : 'rgba(255, 255, 255, 0.6)'} stroke-width={filled ? 2.5 : 1.2} stroke-dasharray={filled ? undefined : '3 2.5'} stroke-linejoin="round" />
              <!-- sleeve right -->
              <polygon points="60,10 46,4 42,22 56,26" fill={filled ? kit.primary : 'rgba(255, 255, 255, 0.1)'} stroke={filled ? '#fffcf3' : 'rgba(255, 255, 255, 0.6)'} stroke-width={filled ? 2.5 : 1.2} stroke-dasharray={filled ? undefined : '3 2.5'} stroke-linejoin="round" />
              <!-- body -->
              <path d="M14,4 Q30,0 46,4 L50,56 L10,56 Z" fill={filled ? kit.primary : 'rgba(255, 255, 255, 0.1)'} stroke={filled ? '#fffcf3' : 'rgba(255, 255, 255, 0.6)'} stroke-width={filled ? 2.5 : 1.2} stroke-dasharray={filled ? undefined : '3 2.5'} stroke-linejoin="round" />
              <!-- collar accent -->
              <path d="M22,4 Q30,8 38,4 Q36,14 30,16 Q24,14 22,4 Z" fill={filled ? kit.secondary : 'rgba(255, 255, 255, 0.12)'} />
              <!-- initials -->
              <text
                x="30"
                y="40"
                text-anchor="middle"
                dominant-baseline="middle"
                font-family="system-ui, sans-serif"
                font-weight="900"
                font-size={label.length > 2 ? '11' : '14'}
                fill={filled ? kit.text : 'rgba(255, 255, 255, 0.75)'}
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
  /* A printed album pitch: mown stripes, white markings, keeper at the bottom */
  .jersey-pitch {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 6px;
    min-height: 420px;
    padding: 16px 10px 14px;
    border-radius: 8px;
    border: 3px solid #fffcf3;
    box-shadow:
      0 0 0 1px rgba(28, 24, 18, 0.18),
      inset 0 0 0 2px rgba(255, 255, 255, 0.35);
    background:
      /* halfway line */
      linear-gradient(rgba(255, 255, 255, 0.45), rgba(255, 255, 255, 0.45)) center / 100% 2px no-repeat,
      /* centre circle */
      radial-gradient(circle at center, transparent 0 52px, rgba(255, 255, 255, 0.45) 53px 54.5px, transparent 55.5px),
      /* penalty boxes */
      linear-gradient(rgba(255, 255, 255, 0.45), rgba(255, 255, 255, 0.45)) 50% 100% / 56% 2px no-repeat,
      linear-gradient(rgba(255, 255, 255, 0.45), rgba(255, 255, 255, 0.45)) 50% 0 / 56% 2px no-repeat,
      /* mown stripes */
      repeating-linear-gradient(180deg, #226f3d 0 38px, #1c6436 38px 76px);
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
    gap: 3px;
    position: relative;
  }

  .jersey-svg {
    width: 100%;
    max-width: 56px;
    height: auto;
    overflow: visible;
  }

  /* A filled spot is a stuck-on sticker: white rim, a shadow and a slight tilt */
  .filled .jersey-svg {
    filter: drop-shadow(0 3px 3px rgba(0, 0, 0, 0.35));
    animation: stick 0.35s cubic-bezier(0.2, 0.9, 0.3, 1.3) both;
  }

  .jersey-row .jersey-spot.filled:nth-child(odd) .jersey-svg {
    rotate: -3deg;
  }
  .jersey-row .jersey-spot.filled:nth-child(even) .jersey-svg {
    rotate: 2deg;
  }

  @keyframes stick {
    from {
      transform: scale(1.35);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }

  .jersey-overall {
    position: absolute;
    top: -7px;
    right: calc(50% - 30px);
    min-width: 22px;
    height: 22px;
    border-radius: 50%;
    background: #fffcf3;
    color: #1c1812;
    border: 2px solid #1c1812;
    font-family: var(--display);
    font-stretch: 75%;
    font-size: 0.66rem;
    font-weight: 900;
    display: grid;
    place-items: center;
    padding: 0 3px;
    line-height: 1;
  }

  .jersey-name {
    font-family: var(--display);
    font-stretch: 82%;
    font-size: 0.64rem;
    font-weight: 800;
    color: #fffcf3;
    text-align: center;
    line-height: 1.2;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.55);
  }

  .jersey-spot:not(.filled) .jersey-name {
    color: rgba(255, 255, 255, 0.6);
  }
</style>
