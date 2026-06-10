import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';
import type { SquadEntry } from '$lib/game/leaderboard';
import type { ClassicFormation, GameMode, RunState } from '$lib/game/types';

const API_BASE = (env.PUBLIC_API_BASE ?? 'http://127.0.0.1:8787').replace(/\/$/, '');

const SESSION_KEY = 'treble-quest-vs-session';

export type RoomPhase = 'lobby' | 'playing' | 'finished';

export type PublicMember = {
  pid: string;
  name: string;
  isHost: boolean;
  connected: boolean;
  done: boolean;
  score: number | null;
  trophies: number | null;
  squad: SquadEntry[] | null;
};

export type PublicRoom = {
  code: string;
  phase: RoomPhase;
  mode: GameMode;
  formation?: ClassicFormation;
  hideRatings: boolean;
  round: number;
  startedAt?: number;
  members: PublicMember[];
};

export type VsSession = {
  code: string;
  token: string;
  pid: string;
  name: string;
};

type JoinResponse = {
  ok: true;
  code: string;
  token: string;
  pid: string;
  room: PublicRoom;
};

function serializeRun(run: RunState) {
  // Identical shape to leaderboard.ts/share-api.ts so the server's verifyRun replays it.
  return {
    id: run.id,
    seed: run.seed,
    mode: run.mode,
    formation: run.formation,
    hideRatings: run.hideRatings,
    startedAt: run.startedAt,
    picks: run.picks.map((pick) => ({
      slotId: pick.slot.id,
      optionId: pick.type === 'manager' ? pick.manager.id : pick.player.id,
    })),
  };
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data?.error === 'string' ? data.error : `request_failed_${res.status}`);
  }
  return data as T;
}

export async function createRoom(name: string): Promise<VsSession & { room: PublicRoom }> {
  const data = await postJson<JoinResponse>('/vs/rooms', { name });
  const session: VsSession = { code: data.code, token: data.token, pid: data.pid, name };
  saveSession(session);
  return { ...session, room: data.room };
}

export async function joinRoom(code: string, name: string): Promise<VsSession & { room: PublicRoom }> {
  const data = await postJson<JoinResponse>(`/vs/rooms/${encodeURIComponent(code)}/join`, { name });
  const session: VsSession = { code: data.code, token: data.token, pid: data.pid, name };
  saveSession(session);
  return { ...session, room: data.room };
}

export async function startRoom(
  code: string,
  token: string,
  config: { mode: GameMode; formation?: ClassicFormation; hideRatings?: boolean },
): Promise<PublicRoom> {
  const data = await postJson<{ ok: true; room: PublicRoom }>(`/vs/rooms/${encodeURIComponent(code)}/start`, {
    token,
    ...config,
  });
  return data.room;
}

export async function submitVsRun(
  code: string,
  token: string,
  run: RunState,
): Promise<{ score: number; trophies: number; rank: number; totalDone: number; room: PublicRoom }> {
  return postJson(`/vs/rooms/${encodeURIComponent(code)}/submit`, {
    token,
    run: serializeRun(run),
  });
}

export async function fetchRoom(code: string): Promise<PublicRoom | null> {
  const res = await fetch(`${API_BASE}/vs/rooms/${encodeURIComponent(code)}`);
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  return data?.room ?? null;
}

export function wsUrl(code: string, token: string): string {
  const base = API_BASE.replace(/^http/, 'ws');
  const params = new URLSearchParams({ code, token });
  return `${base}/vs/ws?${params.toString()}`;
}

// ---- session persistence (survives refresh / accidental tab reload) ----

export function saveSession(session: VsSession) {
  if (!browser) return;
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    /* ignore */
  }
}

export function loadSession(): VsSession | null {
  if (!browser) return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as VsSession;
    if (parsed?.code && parsed?.token && parsed?.pid) return parsed;
    return null;
  } catch {
    return null;
  }
}

export function clearSession() {
  if (!browser) return;
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}
