import { browser } from '$app/environment';
import { createRun, replayRun, selectOption } from '$lib/game/draft';
import { simulateRun } from '$lib/game/simulation';
import type { ClassicFormation, GameMode, RunState } from '$lib/game/types';
import { writable } from 'svelte/store';

const STORAGE_KEY = 'treble-quest-run';
const STREAK_KEY = 'treble-quest-streak';
const classicFormations = new Set<ClassicFormation>(['4-3-3', '4-4-2', '4-2-3-1', '3-4-3']);
const initialRun = browser ? loadRun() : undefined;

export type StreakState = {
  current: number;
  best: number;
};

function loadStreak(): StreakState {
  if (!browser) return { current: 0, best: 0 };
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (!raw) return { current: 0, best: 0 };
    return JSON.parse(raw) as StreakState;
  } catch {
    return { current: 0, best: 0 };
  }
}

function saveStreak(streak: StreakState) {
  if (!browser) return;
  localStorage.setItem(STREAK_KEY, JSON.stringify(streak));
}

export function recordStreakResult(trophies: number): StreakState {
  const streak = loadStreak();
  if (trophies > 0) {
    streak.current += 1;
    if (streak.current > streak.best) streak.best = streak.current;
  } else {
    streak.current = 0;
  }
  saveStreak(streak);
  return streak;
}

export function getStreak(): StreakState {
  return loadStreak();
}

function createRunStore() {
  const { subscribe, set, update } = writable<RunState | undefined>(initialRun);

  const persist = (run: RunState | undefined) => {
    if (!browser) return;
    if (!run) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(run));
  };

  return {
    subscribe,
    start(mode: GameMode, formation?: ClassicFormation, hideRatings = false, clubFilter?: string) {
      const run = createRun(mode, formation, hideRatings, clubFilter);
      set(run);
      persist(run);
      return run;
    },
    setTeamName(name: string) {
      update((run) => {
        if (!run) return run;
        const next = { ...run, teamName: name.trim() || undefined };
        persist(next);
        return next;
      });
    },
    choose(id: string) {
      let next: RunState | undefined;
      update((run) => {
        if (!run || run.result) return run;
        next = selectOption(run, id);
        persist(next);
        return next;
      });
      return next;
    },
    finish() {
      let next: RunState | undefined;
      update((run) => {
        if (!run) return run;
        next = { ...run, result: run.result ?? simulateRun(run) };
        persist(next);
        return next;
      });
      return next;
    },
    replay() {
      let next: RunState | undefined;
      update((run) => {
        next = run ? replayRun(run) : createRun('classic');
        persist(next);
        return next;
      });
      return next;
    },
    clear() {
      set(undefined);
      persist(undefined);
    },
  };
}

export const runStore = createRunStore();

function loadRun(): RunState | undefined {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const run = JSON.parse(raw) as RunState;
    if (hasInvalidMode(run) || hasRemovedQuickWildcard(run) || hasInvalidClassicFormation(run)) {
      localStorage.removeItem(STORAGE_KEY);
      return undefined;
    }
    return run;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return undefined;
  }
}

function hasRemovedQuickWildcard(run: RunState): boolean {
  // Legacy check: invalidate any saved runs from the removed quick mode
  return (run.mode as string) === 'quick';
}

function hasInvalidMode(run: RunState): boolean {
  return run.mode !== 'classic' && run.mode !== 'world-cup' && run.mode !== 'global' && run.mode !== 'legacy';
}

function hasInvalidClassicFormation(run: RunState): boolean {
  return !run.formation || !classicFormations.has(run.formation);
}
