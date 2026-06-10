import { globalManagers, globalPlayerSeasons } from '$lib/game/data/global';
import { managers } from '$lib/game/data/managers';
import { playerSeasons } from '$lib/game/data/players';
import { worldCupManagers, worldCupPlayerSeasons } from '$lib/game/data/world-cup-2026';
import type {
  ClassicFormation,
  DraftPick,
  DraftPrompt,
  DraftSlot,
  GameMode,
  PlayerSeason,
  Position,
  RunState,
} from '$lib/game/types';

export const quickDraftSlots: DraftSlot[] = [
  { id: 'manager', label: 'Manager', short: 'MGR', required: 'ANY' },
  { id: 'goalkeeper', label: 'Goalkeeper', short: 'GK', required: 'GK' },
  { id: 'defender', label: 'Defender', short: 'DEF', required: 'DEF' },
  { id: 'second-defender', label: 'Second Defender', short: 'DEF', required: 'DEF' },
  { id: 'midfielder', label: 'Midfielder', short: 'MID', required: 'MID' },
  { id: 'second-midfielder', label: 'Second Midfielder', short: 'MID', required: 'MID' },
  { id: 'forward', label: 'Forward', short: 'FWD', required: 'FWD' },
  { id: 'second-forward', label: 'Second Forward', short: 'FWD', required: 'FWD' },
  { id: 'super-sub', label: 'Super Sub', short: 'SUB', required: 'NOGK' },
];

const classicBaseSlots: DraftSlot[] = [
  { id: 'manager', label: 'Manager', short: 'MGR', required: 'ANY' },
  { id: 'goalkeeper', label: 'Goalkeeper', short: 'GK', required: 'GK' },
];

export const classicFormationSlots: Record<ClassicFormation, DraftSlot[]> = {
  '4-3-3': [
    ...classicBaseSlots,
    { id: 'right-back', label: 'Right Back', short: 'RB', required: 'RB' },
    { id: 'centre-back-1', label: 'Centre Back', short: 'CB', required: 'CB' },
    { id: 'centre-back-2', label: 'Centre Back', short: 'CB', required: 'CB' },
    { id: 'left-back', label: 'Left Back', short: 'LB', required: 'LB' },
    { id: 'central-midfielder-1', label: 'Central Midfielder', short: 'CM', required: 'CM' },
    { id: 'central-midfielder-2', label: 'Central Midfielder', short: 'CM', required: 'CM' },
    { id: 'central-midfielder-3', label: 'Third Central Midfielder', short: 'CM', required: 'CM' },
    { id: 'right-wing', label: 'Right Wing', short: 'RW', required: 'RW' },
    { id: 'striker', label: 'Striker', short: 'ST', required: 'ST' },
    { id: 'left-wing', label: 'Left Wing', short: 'LW', required: 'LW' },
    { id: 'super-sub', label: 'Super Sub', short: 'SUB', required: 'NOGK' },
  ],
  '4-4-2': [
    ...classicBaseSlots,
    { id: 'right-back', label: 'Right Back', short: 'RB', required: 'RB' },
    { id: 'centre-back-1', label: 'Centre Back', short: 'CB', required: 'CB' },
    { id: 'centre-back-2', label: 'Centre Back', short: 'CB', required: 'CB' },
    { id: 'left-back', label: 'Left Back', short: 'LB', required: 'LB' },
    { id: 'right-wing', label: 'Right Midfielder', short: 'RM', required: 'RM' },
    { id: 'central-midfielder-1', label: 'Central Midfielder', short: 'CM', required: 'CM' },
    { id: 'central-midfielder-2', label: 'Second Central Midfielder', short: 'CM', required: 'CM' },
    { id: 'left-wing', label: 'Left Midfielder', short: 'LM', required: 'LM' },
    { id: 'striker', label: 'Striker', short: 'ST', required: 'ST' },
    { id: 'second-forward', label: 'Second Striker', short: 'ST', required: 'ST' },
    { id: 'super-sub', label: 'Super Sub', short: 'SUB', required: 'NOGK' },
  ],
  '4-2-3-1': [
    ...classicBaseSlots,
    { id: 'right-back', label: 'Right Back', short: 'RB', required: 'RB' },
    { id: 'centre-back-1', label: 'Centre Back', short: 'CB', required: 'CB' },
    { id: 'centre-back-2', label: 'Centre Back', short: 'CB', required: 'CB' },
    { id: 'left-back', label: 'Left Back', short: 'LB', required: 'LB' },
    { id: 'central-midfielder-1', label: 'Holding Midfielder', short: 'CM', required: 'CM' },
    { id: 'central-midfielder-2', label: 'Second Midfielder', short: 'CM', required: 'CM' },
    { id: 'right-wing', label: 'Right Wing', short: 'RW', required: 'RW' },
    { id: 'attacking-midfielder', label: 'Attacking Midfielder', short: 'AM', required: 'CM' },
    { id: 'left-wing', label: 'Left Wing', short: 'LW', required: 'LW' },
    { id: 'striker', label: 'Striker', short: 'ST', required: 'ST' },
    { id: 'super-sub', label: 'Super Sub', short: 'SUB', required: 'NOGK' },
  ],
  '3-4-3': [
    ...classicBaseSlots,
    { id: 'centre-back-1', label: 'Right Centre Back', short: 'CB', required: 'CB' },
    { id: 'centre-back-2', label: 'Centre Back', short: 'CB', required: 'CB' },
    { id: 'centre-back-3', label: 'Left Centre Back', short: 'CB', required: 'CB' },
    { id: 'right-wing-back', label: 'Right Wing-Back', short: 'RWB', required: 'RB' },
    { id: 'central-midfielder-1', label: 'Central Midfielder', short: 'CM', required: 'CM' },
    { id: 'central-midfielder-2', label: 'Second Central Midfielder', short: 'CM', required: 'CM' },
    { id: 'left-wing-back', label: 'Left Wing-Back', short: 'LWB', required: 'LB' },
    { id: 'right-wing', label: 'Right Forward', short: 'RW', required: 'RW' },
    { id: 'striker', label: 'Striker', short: 'ST', required: 'ST' },
    { id: 'left-wing', label: 'Left Forward', short: 'LW', required: 'LW' },
    { id: 'super-sub', label: 'Super Sub', short: 'SUB', required: 'NOGK' },
  ],
};

export const classicDraftSlots = classicFormationSlots['4-3-3'];

export const modeLabels: Record<GameMode, string> = {
  classic: 'Classic Mode',
  'world-cup': 'World Cup Mode',
  global: 'Global Mode',
  legacy: 'Legacy Draft',
};

export function createSeed(): number {
  return Math.floor(Date.now() % 2147483647) ^ Math.floor(Math.random() * 2147483647);
}

export function createRun(mode: GameMode, formation?: ClassicFormation, hideRatings = false, clubFilter?: string): RunState {
  const seed = createSeed();
  const run: RunState = {
    id: `run-${seed}-${Date.now()}`,
    seed,
    mode,
    formation: formation ?? '4-3-3',
    hideRatings: hideRatings,
    clubFilter: mode === 'legacy' ? clubFilter : undefined,
    startedAt: Date.now(),
    currentPick: 0,
    picks: [],
  };
  return { ...run, lastPrompt: generatePrompt(run) };
}

export function replayRun(previous: RunState): RunState {
  return createRun(previous.mode, previous.formation, previous.hideRatings, previous.clubFilter);
}

export function getDraftSlots(mode: GameMode, formation?: ClassicFormation): DraftSlot[] {
  return classicFormationSlots[formation ?? '4-3-3'];
}

export function nextSlot(run: RunState): DraftSlot | undefined {
  return getDraftSlots(run.mode, run.formation)[run.currentPick];
}

export function isSlotFit(player: PlayerSeason, required: Position): boolean {
  if (required === 'ANY') return true;
  if (required === 'NOGK') return !player.positions.includes('GK');
  if (player.positions.includes(required)) return true;
  if (required === 'DEF') return player.positions.some((position) => ['RB', 'CB', 'LB'].includes(position));
  if (required === 'MID') return player.positions.includes('CM');
  if (required === 'FWD') return player.positions.some((position) => ['RW', 'ST', 'LW'].includes(position));
  if (required === 'RM') return player.positions.some((position) => ['RW', 'CM'].includes(position));
  if (required === 'LM') return player.positions.some((position) => ['LW', 'CM'].includes(position));
  return false;
}

export function pickValue(pick: DraftPick): number {
  if (pick.type === 'manager')
    return 78 + pick.manager.boost + pick.manager.cupBoost * 0.8 + pick.manager.leagueBoost * 0.8;
  const fit = isSlotFit(pick.player, pick.slot.required) ? 5 : -7;
  return pick.player.overall + pick.player.clutch * 0.08 + pick.player.consistency * 0.08 + fit;
}

export function generatePrompt(run: RunState): DraftPrompt | undefined {
  const slot = nextSlot(run);
  if (!slot) return undefined;
  const rng = createRng(run.seed + run.currentPick * 9973 + run.picks.length * 17);

  if (slot.id === 'manager') {
    const managerPool = run.mode === 'world-cup' ? worldCupManagers : run.mode === 'global' ? globalManagers : managers;
    return {
      type: 'manager',
      seed: Math.floor(rng() * 100000),
      options: chooseUnique(managerPool, 4, rng),
    };
  }

  const playerPool =
    run.mode === 'world-cup' ? worldCupPlayerSeasons : run.mode === 'global' ? globalPlayerSeasons : playerSeasons;
  const usedIds = new Set(run.picks.filter((pick) => pick.type === 'player').map((pick) => pick.player.id));
  const basePool = run.mode === 'legacy' && run.clubFilter
    ? playerPool.filter((player) => player.club === run.clubFilter)
    : playerPool;
  const fitPlayers = basePool.filter((player) => !usedIds.has(player.id) && isSlotFit(player, slot.required));
  const options = run.mode === 'legacy' ? chooseEraDiversePlayers(fitPlayers, 4, rng) : chooseDiversePlayers(fitPlayers, 4, rng);

  return {
    type: 'player',
    seed: Math.floor(rng() * 100000),
    club: options[0]?.club ?? '',
    season: options[0]?.season ?? '',
    slot,
    options,
  };
}

export function selectOption(run: RunState, id: string): RunState {
  const prompt = run.lastPrompt ?? generatePrompt(run);
  const slot = nextSlot(run);
  if (!prompt || !slot) return run;

  let pick: DraftPick | undefined;
  if (prompt.type === 'manager') {
    const manager = prompt.options.find((option) => option.id === id);
    if (manager) pick = { type: 'manager', slot, manager };
  } else {
    const player = prompt.options.find((option) => option.id === id);
    if (player) pick = { type: 'player', slot, player };
  }
  if (!pick) return run;

  const nextRun: RunState = {
    ...run,
    currentPick: run.currentPick + 1,
    picks: [...run.picks, pick],
    lastPrompt: undefined,
  };
  return { ...nextRun, lastPrompt: generatePrompt(nextRun) };
}

export function createRng(seed: number): () => number {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function chooseUnique<T extends { id: string }>(items: T[], count: number, rng: () => number): T[] {
  const copy = [...items];
  const chosen: T[] = [];
  while (copy.length && chosen.length < count) {
    const index = Math.floor(rng() * copy.length);
    const [item] = copy.splice(index, 1);
    chosen.push(item);
  }
  return chosen;
}

const RARITY_WEIGHT: Record<PlayerSeason['rarity'], number> = {
  solid: 8,
  elite: 5,
  legend: 3,
};

function chooseDiversePlayers(items: PlayerSeason[], count: number, rng: () => number): PlayerSeason[] {
  const chosen: PlayerSeason[] = [];
  const remaining = [...items];
  while (remaining.length && chosen.length < count) {
    const diversePool = remaining.filter((player) => !chosen.some((picked) => sameClubSeason(picked, player)));
    const pool = diversePool.length ? diversePool : remaining;
    const option = weightedPick(pool, rng);
    chosen.push(option);
    remaining.splice(
      remaining.findIndex((player) => player.id === option.id),
      1,
    );
  }
  return chosen;
}

function weightedPick(pool: PlayerSeason[], rng: () => number): PlayerSeason {
  const weights = pool.map((player) => RARITY_WEIGHT[player.rarity]);
  const total = weights.reduce((sum, w) => sum + w, 0);
  let roll = rng() * total;
  for (let i = 0; i < pool.length; i += 1) {
    roll -= weights[i];
    if (roll <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

function sameClubSeason(a: PlayerSeason, b: PlayerSeason): boolean {
  return a.club === b.club && a.season === b.season;
}

function seasonDecade(season: string): string {
  const year = parseInt(season.slice(0, 4), 10);
  return `${Math.floor(year / 10) * 10}s`;
}

// Like chooseDiversePlayers but diversity is by season (all same club in legacy mode)
function chooseEraDiversePlayers(items: PlayerSeason[], count: number, rng: () => number): PlayerSeason[] {
  const chosen: PlayerSeason[] = [];
  const remaining = [...items];
  while (remaining.length && chosen.length < count) {
    const diversePool = remaining.filter((player) => !chosen.some((picked) => picked.season === player.season));
    const pool = diversePool.length ? diversePool : remaining;
    const option = weightedPick(pool, rng);
    chosen.push(option);
    remaining.splice(
      remaining.findIndex((player) => player.id === option.id),
      1,
    );
  }
  return chosen;
}

export { seasonDecade };
