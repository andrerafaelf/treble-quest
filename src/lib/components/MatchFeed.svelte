<script lang="ts">
  import type { Match } from '$lib/game/types';

  let { matches }: { matches: Match[] } = $props();

  let expanded = $state(false);

  function compLabel(m: Match): string {
    if (m.competition === 'PL') return 'Premier League';
    if (m.competition === 'FAC') return `FA Cup · ${m.round ?? ''}`.trim();
    return `Champions League · ${m.round ?? ''}`.trim();
  }

  function compTag(m: Match): string {
    if (m.competition === 'PL') return 'PL';
    if (m.competition === 'FAC') return 'FAC';
    return 'CL';
  }

  function scoreText(m: Match): string {
    return `${m.gf}-${m.ga}`;
  }

  function scorerText(m: Match): string {
    if (m.scorers.length === 0) return '';
    const counts = new Map<string, number[]>();
    for (const s of m.scorers) {
      const arr = counts.get(s.name) ?? [];
      arr.push(s.minute);
      counts.set(s.name, arr);
    }
    return Array.from(counts.entries())
      .map(([name, minutes]) => {
        const ms = minutes.sort((a, b) => a - b).map((m) => `${m}'`).join(' ');
        return `${name} ${ms}`;
      })
      .join(' · ');
  }
</script>

<section class="match-feed" aria-label="Season match feed">
  <button class="feed-toggle" type="button" onclick={() => (expanded = !expanded)} aria-expanded={expanded}>
    <span>{expanded ? 'Hide' : 'Show'} season results ({matches.length} matches)</span>
    <span class="feed-chevron" class:open={expanded}>▾</span>
  </button>

  {#if expanded}
    <div class="feed-list">
      {#each matches as m, i (i)}
        <article class="feed-match feed-{m.result.toLowerCase()}">
          <span class="feed-result">{m.result}</span>
          <div class="feed-info">
            <div class="feed-top">
              <span class="feed-opponent">{m.opponent}</span>
              <span class="feed-comp-tag feed-comp-{m.competition.toLowerCase()}">{compTag(m)}</span>
              <span class="feed-comp">{compLabel(m)} · {m.date} {m.venue !== 'N' ? `· ${m.venue}` : ''}</span>
            </div>
            {#if m.scorers.length > 0}
              <div class="feed-scorers">{scorerText(m)}</div>
            {/if}
            {#if m.aggregate}
              <div class="feed-agg">Agg {m.aggregate.gf}-{m.aggregate.ga}</div>
            {/if}
          </div>
          <span class="feed-score">{scoreText(m)}</span>
        </article>
      {/each}
    </div>
  {/if}
</section>
