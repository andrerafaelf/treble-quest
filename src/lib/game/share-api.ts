import { env } from '$env/dynamic/public';
import type { RunState } from '$lib/game/types';

const API_BASE = (env.PUBLIC_API_BASE ?? 'http://127.0.0.1:8787').replace(/\/$/, '');

export async function createShareLink(run: RunState): Promise<string> {
  const body = {
    run: {
      id: run.id,
      seed: run.seed,
      mode: run.mode,
      formation: run.formation,
      startedAt: run.startedAt,
      picks: run.picks.map((pick) => ({
        slotId: pick.slot.id,
        optionId: pick.type === 'manager' ? pick.manager.id : pick.player.id,
      })),
    },
  };

  const res = await fetch(`${API_BASE}/share`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error ?? 'share_failed');
  }
  return data.url;
}
