<script lang="ts">
  import { flagUrl } from '$lib/game/flags';
  import type { SeasonAwards } from '$lib/game/types';

  let { awards }: { awards: SeasonAwards } = $props();

  const bootFlag = $derived(flagUrl(awards.goldenBoot.nationality, 16, 'flat'));
  const playmakerFlag = $derived(flagUrl(awards.playmaker.nationality, 16, 'flat'));
  const gloveFlag = $derived(flagUrl(awards.goldenGlove.nationality, 16, 'flat'));
  const potsFlag = $derived(flagUrl(awards.playerOfSeason.nationality, 16, 'flat'));
</script>

<section class="awards-panel" aria-label="Season awards">
  <header class="awards-header">Season Awards</header>
  <div class="awards-grid">
    <article class="award-card award-boot">
      <span class="award-label">⚽ Golden Boot</span>
      <h3>
        {#if bootFlag}<img
            class="award-flag"
            src={bootFlag}
            alt={awards.goldenBoot.nationality}
            title={awards.goldenBoot.nationality}
            width="16"
            height="16"
            loading="lazy"
          />{/if}{awards.goldenBoot.name}
      </h3>
      <p>{awards.goldenBoot.goals} goals</p>
    </article>
    <article class="award-card award-playmaker">
      <span class="award-label">🎯 Playmaker</span>
      <h3>
        {#if playmakerFlag}<img
            class="award-flag"
            src={playmakerFlag}
            alt={awards.playmaker.nationality}
            title={awards.playmaker.nationality}
            width="16"
            height="16"
            loading="lazy"
          />{/if}{awards.playmaker.name}
      </h3>
      <p>{awards.playmaker.assists} assists</p>
    </article>
    <article class="award-card award-glove">
      <span class="award-label">🧤 Golden Glove</span>
      <h3>
        {#if gloveFlag}<img
            class="award-flag"
            src={gloveFlag}
            alt={awards.goldenGlove.nationality}
            title={awards.goldenGlove.nationality}
            width="16"
            height="16"
            loading="lazy"
          />{/if}{awards.goldenGlove.name}
      </h3>
      <p>{awards.goldenGlove.cleanSheets} clean sheets</p>
    </article>
    <article class="award-card award-pots">
      <span class="award-label">🏆 Player of the Season</span>
      <h3>
        {#if potsFlag}<img
            class="award-flag"
            src={potsFlag}
            alt={awards.playerOfSeason.nationality}
            title={awards.playerOfSeason.nationality}
            width="16"
            height="16"
            loading="lazy"
          />{/if}{awards.playerOfSeason.name}
      </h3>
      <p>Rating {awards.playerOfSeason.rating}</p>
    </article>
  </div>
</section>
