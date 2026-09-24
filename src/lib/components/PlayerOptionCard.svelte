<script lang="ts">
  import { kitColors } from '$lib/game/clubColors';
  import { flagUrl } from '$lib/game/flags';
  import type { ChemPreview } from '$lib/game/scoring';
  import type { PlayerSeason, Position } from '$lib/game/types';

  let {
    player,
    required = 'ANY',
    showRatings = true,
    disabled = false,
    chemPreview = undefined,
    onSelect,
    onHover,
  }: {
    player: PlayerSeason;
    required?: Position;
    showRatings?: boolean;
    disabled?: boolean;
    chemPreview?: ChemPreview;
    onSelect?: (id: string) => void;
    onHover?: (id: string | null) => void;
  } = $props();

  const realPositions = $derived(
    player.positions.filter((position) => !['ANY', 'DEF', 'MID', 'FWD'].includes(position)),
  );
  const fallbackPositions = $derived([
    ...(player.positions.includes('DEF') ? ['CB'] : []),
    ...(player.positions.includes('MID') ? ['CM'] : []),
    ...(player.positions.includes('FWD') ? ['ST'] : []),
  ]);
  const positionText = $derived(realPositions.length ? realPositions.join(' / ') : fallbackPositions.join(' / '));
  const requiresSpecificPosition = $derived(required !== 'ANY');
  const nationalityFlagUrl = $derived(flagUrl(player.nationality, 24, 'flat'));
  const chemDelta = $derived(chemPreview?.delta ?? 0);

  // Sticker look: the band takes the club's kit colours
  const kit = $derived(kitColors(player.club));
  const initials = $derived(
    player.name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase(),
  );
  // A stable album number per player, like the numbers printed on real stickers
  const stickerNo = $derived(
    String(([...player.id].reduce((hash, ch) => (hash * 31 + ch.charCodeAt(0)) >>> 0, 7) % 680) + 1).padStart(3, '0'),
  );
</script>

<button
  class="option-card player-card sticker {showRatings ? `sticker-${player.rarity}` : ''}"
  style="--kit: {kit.primary}; --kit-2: {kit.secondary}; --kit-text: {kit.text}"
  type="button"
  {disabled}
  onclick={() => onSelect?.(player.id)}
  onmouseenter={() => onHover?.(player.id)}
  onmouseleave={() => onHover?.(null)}
  onfocus={() => onHover?.(player.id)}
  onblur={() => onHover?.(null)}
>
  <span class="sticker-face">
    <span class="sticker-band">
      <span class="card-top-row">
        {#if showRatings}
          <span class={`rarity ${player.rarity}`}>{player.rarity}</span>
        {/if}
        {#if nationalityFlagUrl}
          <img
            class="player-flag"
            src={nationalityFlagUrl}
            alt={player.nationality}
            title={player.nationality}
            width="24"
            height="24"
            loading="lazy"
          />
        {/if}
      </span>
      <span class="sticker-initials" aria-hidden="true">{initials}</span>
    </span>

    <span class="sticker-body">
      <span class="player-club">{player.club}</span>
      <span class="player-season-year">{player.season}</span>
      <h2>{player.name}</h2>
      <p>{player.role}</p>
      <span class="meta-row">
        <span>{positionText}</span>
        {#if requiresSpecificPosition}
          <span class="fit">{required}</span>
        {/if}
      </span>
      {#if showRatings}
        <span class="overall-badge" aria-label={`${player.name} overall rating`}>
          <span>Overall</span>
          <strong>{player.overall}</strong>
        </span>
      {:else}
        <span class="blind-strip">Ratings hidden</span>
      {/if}
      {#if chemPreview && chemDelta > 0}
        <span class="chem-delta-badge">
          <span class="chem-delta-icon">⚗</span>
          <span class="chem-delta-value">+{chemDelta} chem</span>
          {#if chemPreview.bonds.length > 0}
            <span class="chem-delta-reason">{chemPreview.bonds[0].label}</span>
          {/if}
        </span>
      {/if}
    </span>
  </span>
  <span class="sticker-no" aria-hidden="true">Nº {stickerNo}</span>
</button>
