<script lang="ts">
  import Button from '$lib/components/Button.svelte';
  import { fetchLeaderboardSpot, getSavedName, hasSubmitted, saveName, submitScore } from '$lib/game/leaderboard';
  import type { RunState } from '$lib/game/types';
  import { t } from 'svelte-i18n';

  let { run, lang = 'en' }: { run: RunState; lang?: string } = $props();

  let name = $state(getSavedName());
  const alreadySubmitted = $derived(hasSubmitted(run.id));
  let status = $state<'idle' | 'submitting' | 'success' | 'error'>('idle');
  let errorMessage = $state('');
  let spotRank = $state<number | null>(null);
  let spotLoading = $state(false);
  let confirmedRank = $state<number | null>(null);
  let confirmedTotal = $state<number | null>(null);

  const boardLabel = $derived(
    run.mode === 'classic'
      ? run.hideRatings
        ? $t('leaderboard_submit.board_classic_no_ovr')
        : $t('leaderboard_submit.board_classic')
      : run.mode === 'world-cup'
        ? $t('leaderboard_submit.board_world_cup')
        : $t('leaderboard_submit.board_quick'),
  );

  $effect(() => {
    if (alreadySubmitted) status = 'success';
  });

  const ERROR_KEYS: Record<string, string> = {
    invalid_name: 'leaderboard_submit.err_invalid_name',
    invalid_run: 'leaderboard_submit.err_invalid_run',
    already_submitted: 'leaderboard_submit.err_already_submitted',
    submit_failed: 'leaderboard_submit.err_submit_failed',
  };

  $effect(() => {
    if (!run.result || alreadySubmitted || status === 'success') return;
    let cancelled = false;
    spotLoading = true;
    fetchLeaderboardSpot(run.mode, run.result.score, run.mode === 'classic' && run.hideRatings === true)
      .then((spot) => { if (cancelled) return; spotRank = spot.rank; })
      .catch(() => { if (cancelled) return; spotRank = null; })
      .finally(() => { if (cancelled) return; spotLoading = false; });
    return () => { cancelled = true; };
  });

  async function onSubmit(event: Event) {
    event.preventDefault();
    if (status === 'submitting') return;
    status = 'submitting';
    errorMessage = '';
    try {
      saveName(name.trim());
      const submitted = await submitScore(name.trim(), run);
      confirmedRank = submitted.rank ?? null;
      confirmedTotal = submitted.totalEntries ?? null;
      status = 'success';
    } catch (err) {
      const key = err instanceof Error ? err.message : 'submit_failed';
      errorMessage = $t(ERROR_KEYS[key] ?? ERROR_KEYS.submit_failed);
      status = 'error';
    }
  }
</script>

<section class="leaderboard-submit" aria-label="Submit score">
  {#if status === 'success'}
    <div class="lb-success">
      <div>
        <strong>{$t('leaderboard_submit.score_submitted')}</strong>
        {#if confirmedRank}
          <p class="lb-confirmed-rank" class:lb-confirmed-top={confirmedRank <= 10}>
            {confirmedRank <= 10 ? $t('leaderboard_submit.top_10_locked', { values: { rank: confirmedRank } }) : $t('leaderboard_submit.lb_rank', { values: { rank: confirmedRank } })}
            {#if confirmedTotal}<span>/ {confirmedTotal}</span>{/if}
          </p>
        {/if}
      </div>
      <a href="/{lang}/leaderboard">{$t('leaderboard_submit.view_leaderboard')}</a>
    </div>
  {:else}
    <form onsubmit={onSubmit}>
      {#if spotLoading}
        <p class="lb-spot lb-spot-muted">{$t('leaderboard_submit.calculating')}</p>
      {:else if spotRank}
        <div class="lb-spot" class:lb-spot-top={spotRank <= 10}>
          <strong>{spotRank <= 10 ? $t('leaderboard_submit.top_10_label', { values: { rank: spotRank } }) : $t('leaderboard_submit.projected_rank', { values: { rank: spotRank } })}</strong>
          <span>{spotRank <= 10 ? $t('leaderboard_submit.submit_claim', { values: { board: boardLabel } }) : $t('leaderboard_submit.submit_lock', { values: { board: boardLabel } })}</span>
        </div>
      {/if}
      <label for="lb-name">{$t('leaderboard_submit.add_name')}</label>
      <div class="lb-row">
        <input
          id="lb-name"
          type="text"
          minlength="2"
          maxlength="16"
          required
          autocomplete="off"
          placeholder={$t('leaderboard_submit.name_placeholder')}
          bind:value={name}
          disabled={status === 'submitting'}
        />
        <Button type="submit" disabled={status === 'submitting' || name.trim().length < 2}>
          {status === 'submitting' ? $t('leaderboard_submit.submitting') : $t('leaderboard_submit.submit')}
        </Button>
      </div>
      {#if status === 'error'}
        <p class="lb-error">{errorMessage}</p>
      {/if}
    </form>
  {/if}
</section>
