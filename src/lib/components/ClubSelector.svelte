<script lang="ts">
  import { legacyClubs } from '$lib/game/data/players';
  import { kitColors } from '$lib/game/clubColors';
  import { t } from 'svelte-i18n';

  let {
    value = undefined,
    onSelect
  }: {
    value?: string;
    onSelect?: (clubName: string) => void;
  } = $props();
</script>

<div class="club-selector">
  <p class="club-selector-label">{$t('club_selector.label')}</p>
  <div class="club-grid" role="radiogroup" aria-label="Club selection">
    {#each legacyClubs as club}
      {@const kit = kitColors(club.name)}
      <button
        type="button"
        class="club-btn"
        class:active={value === club.name}
        role="radio"
        aria-checked={value === club.name}
        style="--kit-primary: {kit.primary}; --kit-secondary: {kit.secondary}; --kit-text: {kit.text}"
        onclick={() => onSelect?.(club.name)}
      >
        <div class="club-crest" aria-hidden="true">
          <span class="club-short">{club.shortName}</span>
        </div>
        <span class="club-name">{club.name}</span>
      </button>
    {/each}
  </div>
</div>

<style>
  .club-selector {
    margin-top: 14px;
  }

  .club-selector-label {
    color: var(--muted);
    font-size: 0.82rem;
    margin: 0 0 10px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .club-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .club-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 7px;
    padding: 12px 8px;
    border: 1px solid var(--line);
    background: rgba(255, 255, 255, 0.035);
    border-radius: 8px;
    cursor: pointer;
    color: var(--text);
    transition: border-color 0.15s, background 0.15s;
  }

  .club-btn:hover {
    border-color: rgba(230, 57, 70, 0.45);
    background: rgba(230, 57, 70, 0.06);
  }

  .club-btn.active {
    border-color: var(--kit-primary);
    box-shadow: inset 0 -3px 0 var(--kit-primary);
    background: rgba(255, 255, 255, 0.06);
  }

  .club-crest {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--kit-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid var(--kit-secondary);
  }

  .club-short {
    font-size: 0.62rem;
    font-weight: 900;
    color: var(--kit-text);
    letter-spacing: 0.04em;
  }

  .club-name {
    font-size: 0.72rem;
    font-weight: 700;
    text-align: center;
    line-height: 1.2;
    color: var(--text);
  }
</style>
