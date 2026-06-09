<script lang="ts">
  import { flagUrl } from '$lib/game/flags';
  import type { SeasonAwards } from '$lib/game/types';
  import { t } from 'svelte-i18n';

  let { awards }: { awards: SeasonAwards } = $props();

  const bootFlag = $derived(flagUrl(awards.goldenBoot.nationality, 16, 'flat'));
  const playmakerFlag = $derived(flagUrl(awards.playmaker.nationality, 16, 'flat'));
  const gloveFlag = $derived(flagUrl(awards.goldenGlove.nationality, 16, 'flat'));
  const potsFlag = $derived(flagUrl(awards.playerOfSeason.nationality, 16, 'flat'));
</script>

<section class="awards-panel" aria-label="Season awards">
  <header class="awards-header">{$t('awards.header')}</header>
  <div class="awards-grid">
    <article class="award-card award-boot">
      <span class="award-label">{$t('awards.golden_boot')}</span>
      <h3>
        {#if bootFlag}<img class="award-flag" src={bootFlag} alt={awards.goldenBoot.nationality} title={awards.goldenBoot.nationality} width="16" height="16" loading="lazy" />{/if}{awards.goldenBoot.name}
      </h3>
      <p>{awards.goldenBoot.goals === 1 ? $t('awards.goals_one', { values: { n: awards.goldenBoot.goals } }) : $t('awards.goals_other', { values: { n: awards.goldenBoot.goals } })}</p>
    </article>
    <article class="award-card award-playmaker">
      <span class="award-label">{$t('awards.playmaker')}</span>
      <h3>
        {#if playmakerFlag}<img class="award-flag" src={playmakerFlag} alt={awards.playmaker.nationality} title={awards.playmaker.nationality} width="16" height="16" loading="lazy" />{/if}{awards.playmaker.name}
      </h3>
      <p>{awards.playmaker.assists === 1 ? $t('awards.assists_one', { values: { n: awards.playmaker.assists } }) : $t('awards.assists_other', { values: { n: awards.playmaker.assists } })}</p>
    </article>
    <article class="award-card award-glove">
      <span class="award-label">{$t('awards.golden_glove')}</span>
      <h3>
        {#if gloveFlag}<img class="award-flag" src={gloveFlag} alt={awards.goldenGlove.nationality} title={awards.goldenGlove.nationality} width="16" height="16" loading="lazy" />{/if}{awards.goldenGlove.name}
      </h3>
      <p>{awards.goldenGlove.cleanSheets === 1 ? $t('awards.clean_sheets_one', { values: { n: awards.goldenGlove.cleanSheets } }) : $t('awards.clean_sheets_other', { values: { n: awards.goldenGlove.cleanSheets } })}</p>
    </article>
    <article class="award-card award-pots">
      <span class="award-label">{$t('awards.player_of_season')}</span>
      <h3>
        {#if potsFlag}<img class="award-flag" src={potsFlag} alt={awards.playerOfSeason.nationality} title={awards.playerOfSeason.nationality} width="16" height="16" loading="lazy" />{/if}{awards.playerOfSeason.name}
      </h3>
      <p>{$t('awards.rating', { values: { n: awards.playerOfSeason.rating } })}</p>
    </article>
  </div>
</section>
