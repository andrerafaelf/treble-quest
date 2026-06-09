<script lang="ts">
  import Button from '$lib/components/Button.svelte';
  import { fetchLeaderboardSpot, getSavedName, hasSubmitted, saveName, submitScore } from '$lib/game/leaderboard';
  import type { RunState } from '$lib/game/types';

  let { run }: { run: RunState } = $props();

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
        ? 'Classic No Overall'
        : 'Classic'
      : run.mode === 'world-cup'
        ? 'World Cup'
        : 'Quick',
  );

  $effect(() => {
    if (alreadySubmitted) status = 'success';
  });

  const ERROR_LABELS: Record<string, string> = {
    invalid_name: 'Pick a name (2–16 chars, letters/numbers).',
    invalid_run: 'Run rejected by the server.',
    already_submitted: 'This run is already on the board.',
    submit_failed: 'Could not reach the leaderboard. Try again.',
  };

  $effect(() => {
    if (!run.result || alreadySubmitted || status === 'success') return;
    let cancelled = false;
    spotLoading = true;
    fetchLeaderboardSpot(run.mode, run.result.score, run.mode === 'classic' && run.hideRatings === true)
      .then((spot) => {
        if (cancelled) return;
        spotRank = spot.rank;
      })
      .catch(() => {
        if (cancelled) return;
        spotRank = null;
      })
      .finally(() => {
        if (cancelled) return;
        spotLoading = false;
      });
    return () => {
      cancelled = true;
    };
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
      errorMessage = ERROR_LABELS[key] ?? ERROR_LABELS.submit_failed;
      status = 'error';
    }
  }
</script>

<section class="leaderboard-submit" aria-label="Submit score">
  {#if status === 'success'}
    <div class="lb-success">
      <div>
        <strong>Score submitted</strong>
        {#if confirmedRank}
          <p class="lb-confirmed-rank" class:lb-confirmed-top={confirmedRank <= 10}>
            {confirmedRank <= 10 ? `Top 10 locked: #${confirmedRank}` : `Leaderboard rank: #${confirmedRank}`}
            {#if confirmedTotal}
              <span>/ {confirmedTotal}</span>
            {/if}
          </p>
        {/if}
      </div>
      <a href="/leaderboard">View leaderboard →</a>
    </div>
  {:else}
    <form onsubmit={onSubmit}>
      {#if spotLoading}
        <p class="lb-spot lb-spot-muted">Calculating your leaderboard spot…</p>
      {:else if spotRank}
        <div class="lb-spot" class:lb-spot-top={spotRank <= 10}>
          <strong>{spotRank <= 10 ? `Top 10 (#${spotRank})` : `Projected rank #${spotRank}`}</strong>
          <span
            >{spotRank <= 10
              ? `Submit to claim your ${boardLabel} spot.`
              : `Submit to lock your ${boardLabel} leaderboard rank.`}</span
          >
        </div>
      {/if}
      <label for="lb-name">Add your name to the leaderboard</label>
      <div class="lb-row">
        <input
          id="lb-name"
          type="text"
          minlength="2"
          maxlength="16"
          required
          autocomplete="off"
          placeholder="Manager name"
          bind:value={name}
          disabled={status === 'submitting'}
        />
        <Button type="submit" disabled={status === 'submitting' || name.trim().length < 2}>
          {status === 'submitting' ? 'Submitting…' : 'Submit'}
        </Button>
      </div>
      {#if status === 'error'}
        <p class="lb-error">{errorMessage}</p>
      {/if}
    </form>
  {/if}
</section>
