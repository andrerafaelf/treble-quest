<script lang="ts">
  import Button from '$lib/components/Button.svelte';
  import { getSavedName, hasSubmitted, saveName, submitScore } from '$lib/game/leaderboard';
  import type { RunState } from '$lib/game/types';

  let { run }: { run: RunState } = $props();

  let name = $state(getSavedName());
  const alreadySubmitted = $derived(hasSubmitted(run.id));
  let status = $state<'idle' | 'submitting' | 'success' | 'error'>('idle');
  let errorMessage = $state('');

  $effect(() => {
    if (alreadySubmitted) status = 'success';
  });

  const ERROR_LABELS: Record<string, string> = {
    invalid_name: 'Pick a name (2–16 chars, letters/numbers).',
    invalid_run: 'Run rejected by the server.',
    already_submitted: 'This run is already on the board.',
    submit_failed: 'Could not reach the leaderboard. Try again.'
  };

  async function onSubmit(event: Event) {
    event.preventDefault();
    if (status === 'submitting') return;
    status = 'submitting';
    errorMessage = '';
    try {
      saveName(name.trim());
      await submitScore(name.trim(), run);
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
      <strong>Score submitted</strong>
      <a href="/leaderboard">View leaderboard →</a>
    </div>
  {:else}
    <form onsubmit={onSubmit}>
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
