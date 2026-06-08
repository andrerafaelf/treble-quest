<script lang="ts">
  import type { LeagueTableRow } from '$lib/game/types';

  let { rows }: { rows: LeagueTableRow[] } = $props();
</script>

<section class="league-table" aria-label="Final Premier League table">
  <header class="lt-header">
    <span class="lt-title">Final League Table</span>
  </header>
  <div class="lt-grid lt-row lt-row-head">
    <span class="lt-pos">#</span>
    <span class="lt-club">Club</span>
    <span class="lt-num">P</span>
    <span class="lt-num">W</span>
    <span class="lt-num">D</span>
    <span class="lt-num">L</span>
    <span class="lt-num lt-gd">GD</span>
    <span class="lt-num lt-pts">PTS</span>
  </div>
  {#each rows as row, idx (row.club)}
    <div class="lt-grid lt-row" class:lt-user={row.isUser} class:lt-cl={idx < 4} class:lt-rel={idx >= 17}>
      <span class="lt-pos">{idx + 1}</span>
      <span class="lt-club">{row.club}</span>
      <span class="lt-num">{row.played}</span>
      <span class="lt-num">{row.wins}</span>
      <span class="lt-num">{row.draws}</span>
      <span class="lt-num">{row.losses}</span>
      <span class="lt-num lt-gd">{row.goalDifference > 0 ? '+' : ''}{row.goalDifference}</span>
      <span class="lt-num lt-pts">{row.points}</span>
    </div>
  {/each}
</section>
