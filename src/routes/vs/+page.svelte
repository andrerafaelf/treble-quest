<script lang="ts">
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { env } from '$env/dynamic/public';
  import Button from '$lib/components/Button.svelte';
  import Card from '$lib/components/Card.svelte';
  import DraftProgress from '$lib/components/DraftProgress.svelte';
  import FormationSelector from '$lib/components/FormationSelector.svelte';
  import ManagerOptionCard from '$lib/components/ManagerOptionCard.svelte';
  import ModeSelector from '$lib/components/ModeSelector.svelte';
  import PlayerOptionCard from '$lib/components/PlayerOptionCard.svelte';
  import SpinPanel from '$lib/components/SpinPanel.svelte';
  import { getDraftSlots } from '$lib/game/draft';
  import { getSavedName, saveName } from '$lib/game/leaderboard';
  import { runStore } from '$lib/game/storage';
  import type { ClassicFormation, GameMode } from '$lib/game/types';
  import {
    clearSession,
    createRoom,
    joinRoom,
    loadSession,
    setFormation,
    startRoom,
    submitVsRun,
    type PublicRoom,
    type VsSession,
  } from '$lib/game/vs-api';
  import { connectRoom, type VsSocket } from '$lib/game/vs-socket';
  import { onDestroy } from 'svelte';
  import { writable } from 'svelte/store';

  // ---- local UI state ----
  let nameInput = $state(browser ? getSavedName() : '');
  let codeInput = $state('');
  let busy = $state(false);
  let errorMsg = $state('');
  let copied = $state(false);

  // If we arrived via an invite link (?code=…), this is a join-only flow:
  // skip "create lobby" entirely and just ask for a name. Guard on `browser`
  // because reading searchParams is disallowed during static prerender.
  const inviteCode = $derived(browser ? page.url.searchParams.get('code')?.trim().toUpperCase() || '' : '');

  // host round config
  let mode = $state<GameMode>('classic');
  let noOverall = $state(false);

  // local pick (synced to server) for this player's own formation; used when the round starts
  let myFormation = $state<ClassicFormation>('4-3-3');

  // session + live room
  let session = $state<VsSession | null>(null);
  let sock: VsSocket | null = null;
  let unsubs: Array<() => void> = [];
  const roomStore = writable<PublicRoom | null>(null);
  const statusStore = writable<'connecting' | 'open' | 'closed'>('closed');
  const room = $derived($roomStore);
  const status = $derived($statusStore);

  // local run state (the player's own draft, its own random seed)
  const run = $derived($runStore);
  const slots = $derived(run ? getDraftSlots(run.mode, run.formation) : []);
  const currentSlot = $derived(run ? slots[run.currentPick] : undefined);
  const prompt = $derived(run?.lastPrompt);
  let selecting = $state(false);
  let submitting = $state(false);
  let submitted = $state(false);
  let myResult = $state<{ score: number; rank: number; totalDone: number } | null>(null);
  let startedRound = $state(0); // round number the local run was started for
  let countdown = $state<number | null>(null); // 3,2,1 then "GO" before the draft begins
  let countdownTimer: ReturnType<typeof setInterval> | null = null;

  const me = $derived(room?.members.find((m) => m.pid === session?.pid) ?? null);
  const isHost = $derived(me?.isHost ?? false);
  const sortedMembers = $derived(room?.members ?? []);
  const winner = $derived(
    room && room.members.some((m) => m.done)
      ? room.members.filter((m) => m.done).sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0]
      : null,
  );

  const shareUrl = $derived.by(() => {
    if (!room) return '';
    const origin = browser ? window.location.origin : (env.PUBLIC_SITE_URL ?? '').replace(/\/$/, '');
    return `${origin}/vs?code=${room.code}`;
  });

  function detachSocket() {
    for (const u of unsubs) u();
    unsubs = [];
    sock?.close();
    sock = null;
  }

  function attachSocket(s: VsSession) {
    detachSocket();
    sock = connectRoom(s.code, s.token);
    unsubs.push(sock.room.subscribe((r) => roomStore.set(r)));
    unsubs.push(sock.status.subscribe((st) => statusStore.set(st)));
  }

  // Restore an existing session (refresh / accidental reload) on mount.
  $effect(() => {
    if (!browser || session) return;
    const saved = loadSession();
    if (saved) {
      session = saved;
      attachSocket(saved);
    }
  });

  // When the host starts a new round, every player sees a synced countdown, then
  // auto-begins their own draft for that round using their own chosen formation.
  $effect(() => {
    if (!room || !session) return;
    if (room.phase === 'playing' && room.round !== startedRound) {
      const r = room;
      const f = me?.formation ?? myFormation;
      startedRound = r.round;
      submitted = false;
      submitting = false;
      myResult = null;
      runStore.clear();
      beginCountdown(() => runStore.start(r.mode, f, r.hideRatings));
    }
  });

  // Keep the local picker in sync with whatever the server thinks our formation is
  // (e.g. after rejoin from sessionStorage we adopt our previous pick).
  $effect(() => {
    if (me?.formation && me.formation !== myFormation) {
      myFormation = me.formation;
    }
  });

  async function handleFormationChange(next: ClassicFormation) {
    myFormation = next;
    if (!session) return;
    try {
      await setFormation(session.code, session.token, next);
    } catch (e) {
      errorMsg = friendlyError((e as Error).message);
    }
  }

  function beginCountdown(onGo: () => void) {
    if (countdownTimer) clearInterval(countdownTimer);
    countdown = 3;
    countdownTimer = setInterval(() => {
      if (countdown === null) return;
      if (countdown > 1) {
        countdown -= 1;
      } else if (countdown === 1) {
        countdown = 0; // shows "GO!"
      } else {
        if (countdownTimer) clearInterval(countdownTimer);
        countdownTimer = null;
        countdown = null;
        onGo();
      }
    }, 800);
  }

  async function handleCreate() {
    errorMsg = '';
    const name = nameInput.trim();
    if (name.length < 2) {
      errorMsg = 'Pick a name (2–16 characters).';
      return;
    }
    busy = true;
    try {
      saveName(name);
      const res = await createRoom(name);
      session = { code: res.code, token: res.token, pid: res.pid, name: res.name };
      roomStore.set(res.room);
      attachSocket(session);
    } catch (e) {
      errorMsg = friendlyError((e as Error).message);
    } finally {
      busy = false;
    }
  }

  async function handleJoin(explicitCode?: string) {
    errorMsg = '';
    const name = nameInput.trim();
    const code = (explicitCode ?? codeInput).trim().toUpperCase();
    if (name.length < 2) {
      errorMsg = 'Pick a name (2–16 characters).';
      return;
    }
    if (code.length < 4) {
      errorMsg = 'Enter the room code.';
      return;
    }
    busy = true;
    try {
      saveName(name);
      const res = await joinRoom(code, name);
      session = { code: res.code, token: res.token, pid: res.pid, name: res.name };
      roomStore.set(res.room);
      attachSocket(session);
    } catch (e) {
      errorMsg = friendlyError((e as Error).message);
    } finally {
      busy = false;
    }
  }

  async function handleStart() {
    if (!session) return;
    errorMsg = '';
    busy = true;
    try {
      // Each player picks their own formation; we still send one for compatibility.
      await startRoom(session.code, session.token, {
        mode,
        formation: myFormation,
        hideRatings: noOverall,
      });
    } catch (e) {
      errorMsg = friendlyError((e as Error).message);
    } finally {
      busy = false;
    }
  }

  function choose(id: string) {
    if (selecting || !run) return;
    selecting = true;
    const next = runStore.choose(id);
    window.setTimeout(() => {
      if (next && next.currentPick >= getDraftSlots(next.mode, next.formation).length) {
        finishAndSubmit();
      }
      selecting = false;
    }, 420);
  }

  async function finishAndSubmit() {
    if (!session || submitting || submitted) return;
    const finished = runStore.finish();
    if (!finished) return;
    submitting = true;
    try {
      const res = await submitVsRun(session.code, session.token, finished);
      submitted = true;
      myResult = { score: res.score, rank: res.rank, totalDone: res.totalDone };
    } catch (e) {
      errorMsg = friendlyError((e as Error).message);
    } finally {
      submitting = false;
    }
  }

  async function copyLink() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      copied = true;
      window.setTimeout(() => (copied = false), 1500);
    } catch {
      /* ignore */
    }
  }

  function leave() {
    detachSocket();
    if (countdownTimer) clearInterval(countdownTimer);
    countdownTimer = null;
    countdown = null;
    clearSession();
    session = null;
    roomStore.set(null);
    runStore.clear();
    submitted = false;
    myResult = null;
    startedRound = 0;
    goto('/vs', { replaceState: true });
  }

  function friendlyError(code: string): string {
    const map: Record<string, string> = {
      room_not_found: "That room doesn't exist (or it expired).",
      already_started: 'That round already started — wait for the next one.',
      room_full: 'That lobby is full.',
      invalid_name: 'That name is not allowed. Use 2–16 letters/numbers.',
      not_host: 'Only the host can start the round.',
      already_submitted: 'You already submitted this round.',
      invalid_run: 'Your run could not be verified.',
    };
    return map[code] ?? 'Something went wrong. Try again.';
  }

  function ordinal(n: number): string {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
  }

  onDestroy(() => {
    detachSocket();
    if (countdownTimer) clearInterval(countdownTimer);
  });
</script>

<svelte:head>
  <title>Treble Quest — Multiplayer</title>
  <meta name="description" content="Create a lobby, share the link with your friends, and race to the best treble." />
</svelte:head>

{#if countdown !== null}
  <div class="countdown-overlay" role="status" aria-live="assertive">
    <p class="countdown-eyebrow">Round {room?.round ?? ''} — get ready</p>
    {#key countdown}
      <span class="countdown-number" class:go={countdown === 0}>{countdown === 0 ? 'GO!' : countdown}</span>
    {/key}
    <p class="countdown-mode">
      {room?.mode === 'world-cup'
        ? 'World Cup'
        : room?.mode === 'global'
          ? 'Global'
          : room?.mode === 'legacy'
            ? 'Legacy'
            : 'Classic'}
      {#if room?.mode === 'classic' && room?.formation}· {room.formation}{/if}
    </p>
  </div>
{/if}

{#if !session || !room}
  {#if inviteCode}
    <!-- ENTRY (invite link): join-only, just ask for a name -->
    <section class="page-section narrow">
      <span class="eyebrow">Multiplayer</span>
      <h1 class="page-title">Join the lobby</h1>
      <p class="lede">
        You've been invited to room <strong class="code-inline">{inviteCode}</strong>. Pick a name to join the race.
      </p>
      <Card>
        <form
          onsubmit={(e) => {
            e.preventDefault();
            handleJoin(inviteCode);
          }}
        >
          <label class="field">
            <span>Your name</span>
            <input
              type="text"
              placeholder="Pick a name"
              maxlength="16"
              bind:value={nameInput}
              autofocus
            />
          </label>
          <Button type="submit" disabled={busy} full>
            {busy ? 'Joining…' : `Join lobby ${inviteCode}`}
          </Button>
        </form>

        {#if errorMsg}<p class="error">{errorMsg}</p>{/if}
        <div class="toolbar-row">
          <Button href="/vs" variant="ghost">Create my own lobby instead</Button>
        </div>
      </Card>
    </section>
  {:else}
    <!-- ENTRY: create or join -->
    <section class="page-section narrow">
      <span class="eyebrow">Multiplayer</span>
      <h1 class="page-title">Race your friends.</h1>
      <p class="lede">
        Create a lobby, share the link, and everyone drafts at the same time. Highest treble score wins.
      </p>
      <Card>
        <label class="field">
          <span>Your name</span>
          <input type="text" placeholder="Pick a name" maxlength="16" bind:value={nameInput} />
        </label>

        <div class="entry-actions">
          <Button onclick={handleCreate} disabled={busy}>Create lobby</Button>
        </div>

        <div class="divider"><span>or join one</span></div>

        <form
          class="join-row"
          onsubmit={(e) => {
            e.preventDefault();
            handleJoin();
          }}
        >
          <input
            class="code-input"
            type="text"
            placeholder="CODE"
            maxlength="6"
            bind:value={codeInput}
            oninput={() => (codeInput = codeInput.toUpperCase())}
          />
          <Button type="submit" variant="secondary" disabled={busy}>Join</Button>
        </form>

        {#if errorMsg}<p class="error">{errorMsg}</p>{/if}
        <div class="toolbar-row">
          <Button href="/" variant="ghost">Back home</Button>
        </div>
      </Card>
    </section>
  {/if}
{:else if room.phase === 'lobby'}
  <!-- LOBBY -->
  <section class="page-section">
    <span class="eyebrow">Lobby {status === 'open' ? '· live' : '· connecting…'}</span>
    <h1 class="page-title">Waiting room</h1>

    {#if status !== 'open'}
      <p class="conn-warning">
        ⚠ Live connection {status === 'connecting' ? 'is reconnecting' : 'is offline'} — the player list and round start
        may lag until it's back. If this persists, the multiplayer WebSocket isn't reachable.
      </p>
    {/if}

    <div class="lobby-grid">
      <Card>
        <div class="code-block">
          <span class="code-label">Room code</span>
          <strong class="code-big">{room.code}</strong>
          <button class="copy-btn" type="button" onclick={copyLink}>
            {copied ? 'Copied!' : 'Copy invite link'}
          </button>
          <small class="share-url">{shareUrl}</small>
        </div>

        {#if room.mode === 'classic'}
          <div class="my-formation">
            <h2>Your formation</h2>
            <p class="picked">Locked in: <strong>{me?.formation ?? myFormation}</strong></p>
            <FormationSelector onSelect={handleFormationChange} />
          </div>
        {/if}

        {#if isHost}
          <div class="host-controls">
            <h2>Round settings</h2>
            <ModeSelector value={mode} onSelect={(m) => (mode = m)} />
            <label class="toggle-row">
              <input type="checkbox" bind:checked={noOverall} />
              <span>No overall mode</span><strong>Hard</strong>
            </label>
            <Button onclick={handleStart} disabled={busy || room.members.length < 1}>
              Start round ({room.members.length} player{room.members.length === 1 ? '' : 's'})
            </Button>
          </div>
        {:else}
          <p class="waiting">Waiting for the host to start the round…</p>
        {/if}
        {#if errorMsg}<p class="error">{errorMsg}</p>{/if}
      </Card>

      <Card>
        <h2 class="players-title">Players ({room.members.length})</h2>
        <ul class="player-list">
          {#each sortedMembers as m (m.pid)}
            <li class:me={m.pid === session.pid}>
              <span class="dot" class:on={m.connected}></span>
              <span class="pname">{m.name}</span>
              {#if room.mode === 'classic'}
                <span class="badge formation">{m.formation}</span>
              {/if}
              {#if m.isHost}<span class="badge host">HOST</span>{/if}
              {#if m.pid === session.pid}<span class="badge you">YOU</span>{/if}
            </li>
          {/each}
        </ul>
        <div class="toolbar-row">
          <Button variant="ghost" onclick={leave}>Leave lobby</Button>
        </div>
      </Card>
    </div>
  </section>
{:else}
  <!-- PLAYING / FINISHED -->
  <section class="vs-play-grid">
    <div class="play-main">
      {#if run && !submitted && !run.result}
        <DraftProgress currentPick={run.currentPick} picks={run.picks} {slots} />
        <SpinPanel {prompt} slot={currentSlot} />
        <div class="options-grid" aria-live="polite">
          {#if prompt?.type === 'manager'}
            {#each prompt.options as manager}
              <ManagerOptionCard {manager} showRatings={!run.hideRatings} disabled={selecting} onSelect={choose} />
            {/each}
          {:else if prompt?.type === 'player'}
            {#each prompt.options as player}
              <PlayerOptionCard
                {player}
                required={prompt.slot.required}
                showRatings={!run.hideRatings}
                disabled={selecting}
                onSelect={choose}
              />
            {/each}
          {/if}
        </div>
      {:else if submitting}
        <Card><p class="big-status">Submitting your squad…</p></Card>
      {:else}
        <!-- this player is done -->
        <Card>
          <span class="eyebrow">Locked in</span>
          {#if myResult}
            <h1 class="page-title">You scored {myResult.score}.</h1>
            <p class="lede">
              Currently {ordinal(myResult.rank)} of {myResult.totalDone} finished.
              {#if room.phase !== 'finished'}Others are still drafting…{/if}
            </p>
          {:else}
            <h1 class="page-title">Squad locked in.</h1>
          {/if}
          <Button href="/result" variant="secondary">See your full match report</Button>
        </Card>
      {/if}
    </div>

    <aside class="standings">
      <h2>
        {room.phase === 'finished' ? 'Final standings' : 'Live standings'}
        <span class="status-dot" class:on={status === 'open'}></span>
      </h2>
      {#if winner && room.phase === 'finished'}
        <p class="winner-line">🏆 <strong>{winner.name}</strong> wins with {winner.score}!</p>
      {/if}
      <ol class="standings-list">
        {#each sortedMembers as m (m.pid)}
          <li class:me={m.pid === session.pid} class:done={m.done}>
            <span class="pname"
              >{m.name}{#if m.pid === session.pid}
                (you){/if}</span
            >
            {#if m.done}
              <span class="pscore">{m.score} · {m.trophies}🏆</span>
            {:else}
              <span class="pscore drafting">drafting…</span>
            {/if}
          </li>
        {/each}
      </ol>

      {#if isHost && room.phase === 'finished'}
        <Button onclick={handleStart} disabled={busy}>New round</Button>
      {/if}
      <div class="toolbar-row">
        <Button variant="ghost" onclick={leave}>Leave</Button>
      </div>
      {#if errorMsg}<p class="error">{errorMsg}</p>{/if}
    </aside>
  </section>
{/if}

<style>
  .narrow {
    max-width: 540px;
    margin: 0 auto;
  }
  .lede {
    color: var(--muted, #9aa);
    margin: 0 0 1rem;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    margin-bottom: 1rem;
  }
  .field span {
    font-size: 0.85rem;
    opacity: 0.8;
  }
  .field input,
  .code-input {
    padding: 0.7rem 0.9rem;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    background: rgba(255, 255, 255, 0.04);
    color: inherit;
    font-size: 1rem;
  }
  .entry-actions {
    margin-bottom: 0.75rem;
  }
  .code-inline {
    letter-spacing: 0.15em;
    background: rgba(255, 255, 255, 0.08);
    padding: 0.05rem 0.4rem;
    border-radius: 6px;
  }
  .divider {
    text-align: center;
    margin: 1rem 0;
    opacity: 0.5;
    font-size: 0.8rem;
    position: relative;
  }
  .join-row {
    display: flex;
    gap: 0.5rem;
  }
  .code-input {
    flex: 1;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    font-weight: 700;
    text-align: center;
  }
  .error {
    color: #ff6b6b;
    margin-top: 0.75rem;
    font-size: 0.9rem;
  }
  .conn-warning {
    background: rgba(255, 184, 77, 0.12);
    border: 1px solid rgba(255, 184, 77, 0.35);
    color: #ffd28a;
    padding: 0.6rem 0.9rem;
    border-radius: 8px;
    font-size: 0.9rem;
    margin: 0 0 1rem;
    max-width: 640px;
  }
  .toolbar-row {
    margin-top: 1rem;
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .lobby-grid,
  .vs-play-grid {
    display: grid;
    gap: 1.25rem;
  }
  .lobby-grid {
    grid-template-columns: 1.3fr 1fr;
  }
  .vs-play-grid {
    grid-template-columns: 1fr 320px;
  }
  @media (max-width: 860px) {
    .lobby-grid,
    .vs-play-grid {
      grid-template-columns: 1fr;
    }
  }

  .code-block {
    text-align: center;
    padding: 0.5rem 0 1rem;
  }
  .code-label {
    display: block;
    font-size: 0.8rem;
    opacity: 0.7;
  }
  .code-big {
    font-size: 2.6rem;
    letter-spacing: 0.25em;
    display: block;
    margin: 0.2rem 0 0.6rem;
  }
  .copy-btn {
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: transparent;
    color: inherit;
    padding: 0.4rem 0.9rem;
    border-radius: 999px;
    cursor: pointer;
  }
  .share-url {
    display: block;
    margin-top: 0.5rem;
    opacity: 0.5;
    word-break: break-all;
  }
  .host-controls h2,
  .players-title {
    margin: 1rem 0 0.5rem;
  }
  .picked {
    font-size: 0.9rem;
    opacity: 0.8;
  }
  .toggle-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0.75rem 0;
  }
  .waiting {
    text-align: center;
    opacity: 0.7;
    padding: 1.5rem 0;
  }

  .player-list,
  .standings-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  .player-list li,
  .standings-list li {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.6rem;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.03);
  }
  .player-list li.me,
  .standings-list li.me {
    background: rgba(120, 200, 255, 0.12);
  }
  .standings-list li.done {
    background: rgba(120, 255, 170, 0.1);
  }
  .pname {
    flex: 1;
    font-weight: 600;
  }
  .pscore {
    font-variant-numeric: tabular-nums;
    opacity: 0.9;
  }
  .pscore.drafting {
    opacity: 0.5;
    font-style: italic;
    font-weight: 400;
  }
  .dot,
  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #777;
    flex: none;
  }
  .dot.on,
  .status-dot.on {
    background: #46d369;
  }
  .badge {
    font-size: 0.65rem;
    padding: 0.1rem 0.4rem;
    border-radius: 4px;
    font-weight: 700;
  }
  .badge.formation {
    background: rgba(255, 255, 255, 0.12);
    letter-spacing: 0.05em;
  }
  .badge.host {
    background: #ffb84d;
    color: #222;
  }
  .badge.you {
    background: rgba(120, 200, 255, 0.3);
  }
  .my-formation {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }
  .my-formation h2 {
    margin: 0 0 0.5rem;
  }

  .standings {
    align-self: start;
    position: sticky;
    top: 1rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 14px;
    padding: 1rem;
  }
  .standings h2 {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0 0 0.75rem;
    font-size: 1.05rem;
  }
  .winner-line {
    background: rgba(255, 184, 77, 0.15);
    padding: 0.6rem 0.75rem;
    border-radius: 8px;
    margin: 0 0 0.75rem;
  }
  .big-status {
    text-align: center;
    padding: 2rem 0;
    font-size: 1.2rem;
  }

  .countdown-overlay {
    position: fixed;
    inset: 0;
    z-index: 200;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    background: radial-gradient(circle at center, rgba(20, 24, 36, 0.96), rgba(8, 10, 16, 0.98));
    backdrop-filter: blur(4px);
  }
  .countdown-eyebrow {
    text-transform: uppercase;
    letter-spacing: 0.25em;
    font-size: 0.85rem;
    color: var(--accent, #e63946);
    margin: 0;
  }
  .countdown-number {
    font-size: clamp(6rem, 22vw, 14rem);
    font-weight: 900;
    line-height: 1;
    color: #fff;
    animation: countpop 0.8s ease-out;
  }
  .countdown-number.go {
    color: #46d369;
  }
  .countdown-mode {
    opacity: 0.7;
    margin: 0;
    font-variant: small-caps;
    letter-spacing: 0.1em;
  }
  @keyframes countpop {
    0% {
      transform: scale(0.4);
      opacity: 0;
    }
    40% {
      transform: scale(1.15);
      opacity: 1;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .countdown-number {
      animation: none;
    }
  }
</style>
