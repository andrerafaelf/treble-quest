<script lang="ts">
  import type { StatHighlights } from '$lib/game/types';

  let { highlights }: { highlights: StatHighlights } = $props();

  const finishedOrdinal = $derived(ordinal(highlights.actualFinish));
  const expectedOrdinal = $derived(ordinal(highlights.expectedFinish));
  const delta = $derived(highlights.expectedFinish - highlights.actualFinish);
  const titleWon = $derived(highlights.actualFinish === 1);
  const verdict = $derived(
    titleWon ? 'TITLE WON' : delta >= 3 ? 'OVERPERFORMED' : delta <= -3 ? 'UNDERPERFORMED' : 'AS EXPECTED',
  );
  const verdictClass = $derived(
    titleWon || delta >= 3 ? 'verdict-over' : delta <= -3 ? 'verdict-under' : 'verdict-met',
  );

  function ordinal(value: number): string {
    if (value <= 0) return '—';
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
      <span class="finish-label">Finished</span>
      <strong>{finishedOrdinal}</strong>
    </article>
    <article class="finish-card">
      <span class="finish-label">Projected</span>
      <strong class="finish-muted">{expectedOrdinal}</strong>
    </article>
    <article class="finish-card finish-verdict {verdictClass}">
      <strong>{verdict}</strong>
      {#if titleWon}
        <span class="finish-next">Next: 38-0</span>
      {/if}
    </article>
  </div>

  <article class="narrative-card">
    <h3>{highlights.narrativeHeadline}</h3>
    <p>{highlights.narrativeBody}</p>
  </article>

  <div class="mini-stats">
    <article class="mini-stat">
      <span>Clean Sheets</span>
      <strong>{highlights.cleanSheets}</strong>
    </article>
    <article class="mini-stat">
      <span>Longest Win Streak</span>
      <strong>{highlights.longestWinStreak}</strong>
    </article>
    {#if highlights.biggestWin}
      <article class="mini-stat mini-stat-wide">
        <span>Biggest Win</span>
        <strong>{highlights.biggestWin.gf}-{highlights.biggestWin.ga} vs {highlights.biggestWin.opponent}</strong>
      </article>
    {/if}
  </div>
</section>
