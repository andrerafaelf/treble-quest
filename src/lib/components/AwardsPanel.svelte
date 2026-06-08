<script lang="ts">
  import type { SeasonAwards } from '$lib/game/types';

  let { awards }: { awards: SeasonAwards } = $props();
</script>

<section class="awards-panel" aria-label="Season awards">
  <header class="awards-header">Season Awards</header>
  <div class="awards-grid">
    <article class="award-card award-boot">
      <span class="award-label">⚽ Golden Boot</span>
      <h3>{awards.goldenBoot.name}</h3>
      <p>{awards.goldenBoot.goals} goals</p>
    </article>
    <article class="award-card award-playmaker">
      <span class="award-label">🎯 Playmaker</span>
      <h3>{awards.playmaker.name}</h3>
      <p>{awards.playmaker.assists} assists</p>
    </article>
    <article class="award-card award-glove">
      <span class="award-label">🧤 Golden Glove</span>
      <h3>{awards.goldenGlove.name}</h3>
      <p>{awards.goldenGlove.cleanSheets} clean sheets</p>
    </article>
    <article class="award-card award-pots">
      <span class="award-label">🏆 Player of the Season</span>
      <h3>{awards.playerOfSeason.name}</h3>
      <p>Rating {awards.playerOfSeason.rating}</p>
    </article>
  </div>
</section>
