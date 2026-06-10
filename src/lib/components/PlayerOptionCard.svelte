<script lang="ts">
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
</script>

<button
  class="option-card player-card"
  type="button"
  {disabled}
  onclick={() => onSelect?.(player.id)}
  onmouseenter={() => onHover?.(player.id)}
  onmouseleave={() => onHover?.(null)}
  onfocus={() => onHover?.(player.id)}
  onblur={() => onHover?.(null)}
>
  <div class="card-top-row">
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
  </div>
  <span class="player-club">{player.club}</span>
  <span class="player-season-year">{player.season}</span>
  <h2>{player.name}</h2>
  <p>{player.role}</p>
  <div class="meta-row">
    <span>{positionText}</span>
    {#if requiresSpecificPosition}
      <span class="fit">{required}</span>
    {/if}
  </div>
  {#if showRatings}
    <div class="overall-badge" aria-label={`${player.name} overall rating`}>
      <span>Overall</span>
      <strong>{player.overall}</strong>
    </div>
  {:else}
    <div class="blind-strip">Ratings hidden</div>
  {/if}
  {#if chemPreview && chemDelta > 0}
    <div class="chem-delta-badge">
      <span class="chem-delta-icon">⚗</span>
      <span class="chem-delta-value">+{chemDelta} chem</span>
      {#if chemPreview.bonds.length > 0}
        <span class="chem-delta-reason">{chemPreview.bonds[0].label}</span>
      {/if}
    </div>
  {/if}
</button>
