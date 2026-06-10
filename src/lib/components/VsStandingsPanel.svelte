<script lang="ts">
  import { browser } from '$app/environment';
  import { loadSession, type PublicRoom } from '$lib/game/vs-api';
  import { connectRoom, type VsSocket } from '$lib/game/vs-socket';
  import { onDestroy } from 'svelte';
  import { writable } from 'svelte/store';

  let { compact = false }: { compact?: boolean } = $props();

  const session = browser ? loadSession() : null;
  const roomStore = writable<PublicRoom | null>(null);
  const statusStore = writable<'connecting' | 'open' | 'closed'>('closed');
  const room = $derived($roomStore);
  const status = $derived($statusStore);

  let sock: VsSocket | null = null;
  let unsubs: Array<() => void> = [];

  $effect(() => {
    if (!browser || !session || sock) return;
    sock = connectRoom(session.code, session.token);
    unsubs.push(sock.room.subscribe((r) => roomStore.set(r)));
    unsubs.push(sock.status.subscribe((s) => statusStore.set(s)));
  });

  onDestroy(() => {
    for (const u of unsubs) u();
    sock?.close();
  });

  const sortedMembers = $derived(room?.members ?? []);
  const winner = $derived(
    room && room.members.some((m) => m.done)
      ? room.members.filter((m) => m.done).sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0]
      : null,
  );
</script>

{#if session && room}
  <section class="vs-standings" class:compact>
    <header>
      <span class="eyebrow">Multiplayer · room {room.code}</span>
      <h2>
        {room.phase === 'finished' ? 'Final standings' : 'Live standings'}
        <span class="status-dot" class:on={status === 'open'}></span>
      </h2>
      {#if winner && room.phase === 'finished'}
        <p class="winner-line">🏆 <strong>{winner.name}</strong> wins with {winner.score}!</p>
      {/if}
    </header>

    <ol class="standings-list">
      {#each sortedMembers as m, i (m.pid)}
        <li class:me={m.pid === session.pid} class:done={m.done}>
          <span class="rank">{m.done ? `#${i + 1}` : '·'}</span>
          <span class="pname"
            >{m.name}{#if m.pid === session.pid}
              (you){/if}</span
          >
          {#if room.mode === 'classic'}
            <span class="formation">{m.formation}</span>
          {/if}
          {#if m.done}
            <span class="pscore">{m.score} · {m.trophies}🏆</span>
          {:else}
            <span class="pscore drafting">drafting…</span>
          {/if}
        </li>
      {/each}
    </ol>
  </section>
{/if}

<style>
  .vs-standings {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 14px;
    padding: 1rem 1.1rem;
    margin: 0 0 1.25rem;
  }
  .eyebrow {
    text-transform: uppercase;
    letter-spacing: 0.2em;
    font-size: 0.7rem;
    color: var(--accent, #e63946);
    display: block;
    margin-bottom: 0.25rem;
  }
  h2 {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0 0 0.6rem;
    font-size: 1.1rem;
  }
  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #777;
  }
  .status-dot.on {
    background: #46d369;
  }
  .winner-line {
    background: rgba(255, 184, 77, 0.15);
    padding: 0.5rem 0.75rem;
    border-radius: 8px;
    margin: 0 0 0.75rem;
    font-size: 0.95rem;
  }
  .standings-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }
  .standings-list li {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.45rem 0.6rem;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.03);
  }
  .standings-list li.me {
    background: rgba(120, 200, 255, 0.12);
  }
  .standings-list li.done {
    background: rgba(120, 255, 170, 0.08);
  }
  .rank {
    font-variant-numeric: tabular-nums;
    opacity: 0.7;
    min-width: 1.6rem;
    font-weight: 700;
  }
  .pname {
    flex: 1;
    font-weight: 600;
  }
  .formation {
    font-size: 0.7rem;
    padding: 0.05rem 0.4rem;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.1);
    letter-spacing: 0.05em;
  }
  .pscore {
    font-variant-numeric: tabular-nums;
  }
  .pscore.drafting {
    opacity: 0.5;
    font-style: italic;
    font-weight: 400;
  }
</style>
