import { env } from '$env/dynamic/public';
import type { GameMode, RunState } from '$lib/game/types';

const API_BASE = (env.PUBLIC_API_BASE ?? 'http://127.0.0.1:8787').replace(/\/$/, '');

const SUBMITTED_KEY = 'treble-quest-submitted';

export type SquadEntry = {
  slot: string;
  name: string;
  overall: number;
  rarity: string;
  isManager: boolean;
};

export type LeaderboardEntry = {
  name: string;
  score: number;
  trophies: number;
  formation: string | null;
  squad: SquadEntry[] | null;
  createdAt: number;
};

export type LeaderboardResponse = {
  mode: GameMode;
  hideRatings?: boolean;
  entries: LeaderboardEntry[];
};

export type LeaderboardSpotResponse = {
  mode: GameMode;
  hideRatings: boolean;
  score: number;
  rank: number;
  totalEntries: number;
};

export async function fetchLeaderboard(mode: GameMode, limit = 50, hideRatings = false): Promise<LeaderboardResponse> {
  const params = new URLSearchParams({ mode, limit: String(limit) });
  if (hideRatings) params.set('hideRatings', '1');
  const res = await fetch(`${API_BASE}/leaderboard?${params.toString()}`);
  if (!res.ok) throw new Error(`leaderboard ${res.status}`);
  return res.json();
}

export async function fetchLeaderboardSpot(
  mode: GameMode,
  score: number,
  hideRatings = false,
): Promise<LeaderboardSpotResponse> {
  const params = new URLSearchParams({ mode, score: String(score) });
  if (hideRatings) params.set('hideRatings', '1');
  const res = await fetch(`${API_BASE}/leaderboard/spot?${params.toString()}`);
  if (!res.ok) throw new Error(`leaderboard_spot ${res.status}`);
  return res.json();
}

export async function submitScore(
  name: string,
  run: RunState,
): Promise<{ score: number; rank?: number; totalEntries?: number }> {
  const body = {
    name,
    run: {
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
    },
  };

  const res = await fetch(`${API_BASE}/scores`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = typeof data?.error === 'string' ? data.error : 'submit_failed';
    throw new Error(error);
  }
  markSubmitted(run.id);
  return {
    score: data.score,
    rank: typeof data?.rank === 'number' ? data.rank : undefined,
    totalEntries: typeof data?.totalEntries === 'number' ? data.totalEntries : undefined,
  };
}

export function hasSubmitted(runId: string): boolean {
  if (typeof localStorage === 'undefined') return false;
  try {
    const raw = localStorage.getItem(SUBMITTED_KEY);
    if (!raw) return false;
    const ids = JSON.parse(raw) as string[];
    return Array.isArray(ids) && ids.includes(runId);
  } catch {
    return false;
  }
}

function markSubmitted(runId: string) {
  if (typeof localStorage === 'undefined') return;
  try {
    const raw = localStorage.getItem(SUBMITTED_KEY);
    const ids = raw ? (JSON.parse(raw) as string[]) : [];
    if (!ids.includes(runId)) ids.push(runId);
    const trimmed = ids.slice(-50);
    localStorage.setItem(SUBMITTED_KEY, JSON.stringify(trimmed));
  } catch {
    /* ignore */
  }
}

export function getSavedName(): string {
  if (typeof localStorage === 'undefined') return '';
  return localStorage.getItem('treble-quest-name') ?? '';
}

export function saveName(name: string) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem('treble-quest-name', name);
}
