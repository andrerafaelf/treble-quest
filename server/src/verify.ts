import { generatePrompt, getDraftSlots, selectOption } from '$lib/game/draft';
import { simulateRun } from '$lib/game/simulation';
import type { ClassicFormation, GameMode, RunState, SimulationResult } from '$lib/game/types';

export type SubmittedRun = {
  id: string;
  seed: number;
  mode: GameMode;
  formation?: ClassicFormation;
  startedAt: number;
  picks: Array<{ slotId: string; optionId: string }>;
};

export type SquadEntry = {
  slot: string;
  name: string;
  overall: number;
  rarity: string;
  isManager: boolean;
};

export type VerifyOk = {
  ok: true;
  runId: string;
  seed: number;
  mode: GameMode;
  formation?: ClassicFormation;
  result: SimulationResult;
  squad: SquadEntry[];
};

export type VerifyErr = { ok: false; reason: string };

export function verifyRun(submitted: SubmittedRun): VerifyOk | VerifyErr {
  if (submitted.mode !== 'quick' && submitted.mode !== 'classic') {
    return { ok: false, reason: 'invalid mode' };
  }
  if (submitted.mode === 'classic' && !submitted.formation) {
    return { ok: false, reason: 'missing formation' };
  }
  if (!Number.isFinite(submitted.seed) || submitted.seed <= 0 || submitted.seed > 2147483647) {
    return { ok: false, reason: 'invalid seed' };
  }
  if (!Array.isArray(submitted.picks)) {
    return { ok: false, reason: 'invalid picks' };
  }
  if (typeof submitted.id !== 'string' || submitted.id.length > 128) {
    return { ok: false, reason: 'invalid id' };
  }

  const expectedSlots = getDraftSlots(submitted.mode, submitted.formation);
  if (submitted.picks.length !== expectedSlots.length) {
    return { ok: false, reason: 'pick count mismatch' };
  }

  let run: RunState = {
    id: submitted.id,
    seed: submitted.seed,
    mode: submitted.mode,
    formation: submitted.formation,
    startedAt: submitted.startedAt,
    currentPick: 0,
    picks: []
  };
  run = { ...run, lastPrompt: generatePrompt(run) };

  for (const submittedPick of submitted.picks) {
    const slot = expectedSlots[run.currentPick];
    const prompt = run.lastPrompt;
    if (!slot || !prompt) return { ok: false, reason: 'state desync' };
    if (slot.id !== submittedPick.slotId) {
      return { ok: false, reason: `slot mismatch at pick ${run.currentPick}` };
    }

    const valid = prompt.options.some((o) => o.id === submittedPick.optionId);
    if (!valid) {
      return { ok: false, reason: `option not offered at pick ${run.currentPick}` };
    }

    run = selectOption(run, submittedPick.optionId);
  }

  if (run.picks.length !== expectedSlots.length) {
    return { ok: false, reason: 'incomplete run' };
  }

  const result = simulateRun(run);
  const squad: SquadEntry[] = run.picks.map((pick) => ({
    slot: pick.slot.short,
    name: pick.type === 'manager' ? pick.manager.name : pick.player.name,
    overall: pick.type === 'manager' ? pick.manager.boost : pick.player.overall,
    rarity: pick.type === 'manager' ? 'manager' : pick.player.rarity,
    isManager: pick.type === 'manager',
  }));
  return {
    ok: true,
    runId: submitted.id,
    seed: submitted.seed,
    mode: submitted.mode,
    formation: submitted.formation,
    result,
    squad,
  };
}
