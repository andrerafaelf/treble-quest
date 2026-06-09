<script lang="ts">
  import type { StatHighlights } from '$lib/game/types';
  import { t } from 'svelte-i18n';

  let { highlights, achievements = [] }: { highlights: StatHighlights; achievements?: string[] } = $props();

  const finishedOrdinal = $derived(ordinal(highlights.actualFinish));
  const expectedOrdinal = $derived(ordinal(highlights.expectedFinish));
  const delta = $derived(highlights.expectedFinish - highlights.actualFinish);
  const titleWon = $derived(highlights.actualFinish === 1);
  const verdict = $derived(
    titleWon
      ? highlights.isWorldCup
        ? $t('highlights.wc_winners')
        : $t('highlights.title_won')
      : delta >= 3
        ? $t('highlights.overperformed')
        : delta <= -3
          ? $t('highlights.underperformed')
          : $t('highlights.as_expected'),
  );
  const verdictClass = $derived(
    titleWon || delta >= 3 ? 'verdict-over' : delta <= -3 ? 'verdict-under' : 'verdict-met',
  );

  const finishNext = $derived((): string | null => {
    if (highlights.isWorldCup) {
      if (highlights.actualFinish === 1) return $t('highlights.next_perfect_8_0');
      if (highlights.actualFinish === 2) return $t('highlights.next_reach_final');
      if (highlights.actualFinish <= 4) return $t('highlights.next_final');
      if (highlights.actualFinish <= 8) return $t('highlights.next_semi');
      return $t('highlights.next_knockouts');
    }
    if (highlights.actualFinish === 1) return $t('highlights.next_38_0');
    if (highlights.actualFinish === 2) return $t('highlights.next_win_title');
    if (highlights.actualFinish <= 4) return $t('highlights.next_top_two');
    return null;
  });

  function ordinal(value: number): string {
    if (value <= 0) return '-';
    const tens = value % 100;
    if (tens >= 11 && tens <= 13) return `${value}th`;
    const ones = value % 10;
    const suffix = ones === 1 ? 'st' : ones === 2 ? 'nd' : ones === 3 ? 'rd' : 'th';
    return `${value}${suffix}`;
  }
</script>

<section class="highlights-panel" aria-label="Season highlights">
  <div class="highlights-finish">
    <article class="finish-card">
      <span class="finish-label">{$t('highlights.finished')}</span>
      <strong>{finishedOrdinal}</strong>
    </article>
    <article class="finish-card">
      <span class="finish-label">{$t('highlights.projected')}</span>
      <strong class="finish-muted">{expectedOrdinal}</strong>
    </article>
    <article class="finish-card finish-verdict {verdictClass}">
      <strong>{verdict}</strong>
      {#if finishNext()}
        <span class="finish-next">{finishNext()}</span>
      {/if}
    </article>
  </div>

  <article class="narrative-card">
    <h3>{highlights.narrativeHeadline}</h3>
    <p>{highlights.narrativeBody}</p>
  </article>

  {#if achievements.length > 0}
    <div class="achievements-row">
      {#each achievements as ach}
        <span class="ach-pill">{ach}</span>
      {/each}
    </div>
  {/if}

  <div class="mini-stats">
    <article class="mini-stat">
      <span>{$t('highlights.clean_sheets')}</span>
      <strong>{highlights.cleanSheets}</strong>
    </article>
    <article class="mini-stat">
      <span>{$t('highlights.longest_win_streak')}</span>
      <strong>{highlights.longestWinStreak}</strong>
    </article>
    {#if highlights.biggestWin}
      <article class="mini-stat mini-stat-wide">
        <span>{$t('highlights.biggest_win')}</span>
        <strong>{highlights.biggestWin.gf}-{highlights.biggestWin.ga} vs {highlights.biggestWin.opponent}</strong>
      </article>
    {/if}
  </div>
</section>

<style>
  .achievements-row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 4px;
  }

  .ach-pill {
    font-size: 0.65rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 3px 10px;
    border-radius: 5px;
    background: rgba(255, 215, 0, 0.12);
    color: #ffd700;
    border: 1px solid rgba(255, 215, 0, 0.3);
  }
</style>
