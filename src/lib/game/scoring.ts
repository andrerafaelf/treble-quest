import { isSlotFit, seasonDecade } from '$lib/game/draft';
import type { DraftPick, Manager, PlayerPick, PlayerSeason, RunState, TeamRatings } from '$lib/game/types';

export function calculateTeamRatings(run: RunState): TeamRatings {
  const playerPicks = run.picks.filter((pick): pick is PlayerPick => pick.type === 'player');
  const manager = run.picks.find((pick) => pick.type === 'manager')?.manager;
  const players = playerPicks.map((pick) => pick.player);
  const safeCount = Math.max(players.length, 1);
  const average = (key: 'control' | 'defence' | 'clutch' | 'consistency') =>
    players.reduce((sum, player) => sum + player[key], 0) / safeCount;
  const outfieldPlayers = players.filter((player) => !player.positions.includes('GK'));
  const attackCount = Math.max(outfieldPlayers.length, 1);
  const attack = outfieldPlayers.reduce((sum, player) => sum + player.attack, 0) / attackCount;
  const fit = playerPicks.reduce((sum, pick) => sum + (isSlotFit(pick.player, pick.slot.required) ? 1 : 0), 0);

  return {
    attack: clampRating(attack),
    control: clampRating(average('control')),
    defence: clampRating(average('defence')),
    clutch: clampRating(average('clutch')),
    consistency: clampRating(average('consistency')),
    chemistry: run.mode === 'legacy' ? calculateLegacyChemistry(playerPicks) : calculateChemistry(playerPicks),
    managerBoost: calculateManagerBoost(manager),
    fit: Math.round((fit / Math.max(playerPicks.length, 1)) * 100),
  };
}

export function calculateChemistry(playerPicks: PlayerPick[]): number {
  let score = 50;
  const players = playerPicks.map((pick) => pick.player);
  for (let i = 0; i < players.length; i += 1) {
    for (let j = i + 1; j < players.length; j += 1) {
      if (players[i].club === players[j].club) score += 4;
      if (players[i].season === players[j].season && players[i].club === players[j].club) score += 4;
      if (players[i].nationality === players[j].nationality) score += 2;
    }
  }

  const has = (position: string) => playerPicks.some((pick) => pick.player.positions.includes(position as never));
  if (has('GK') && has('DEF') && has('MID') && has('FWD')) score += 12;
  score += playerPicks.filter((pick) => isSlotFit(pick.player, pick.slot.required)).length * 3;
  return Math.round(Math.min(100, score));
}

// Era chemistry for legacy mode: same-club is a given, so bond by era (same season = +6, same decade = +3, same nationality = +2)
export function calculateLegacyChemistry(playerPicks: PlayerPick[]): number {
  let score = 50;
  const players = playerPicks.map((pick) => pick.player);
  for (let i = 0; i < players.length; i += 1) {
    for (let j = i + 1; j < players.length; j += 1) {
      if (players[i].season === players[j].season) score += 6;
      else if (seasonDecade(players[i].season) === seasonDecade(players[j].season)) score += 3;
      if (players[i].nationality === players[j].nationality) score += 2;
    }
  }
  const has = (position: string) => playerPicks.some((pick) => pick.player.positions.includes(position as never));
  if (has('GK') && has('DEF') && has('MID') && has('FWD')) score += 12;
  score += playerPicks.filter((pick) => isSlotFit(pick.player, pick.slot.required)).length * 3;
  return Math.round(Math.min(100, score));
}

export function calculateManagerBoost(manager?: Manager): number {
  if (!manager) return 0;
  return Math.round(manager.boost * 1.3 + manager.cupBoost * 0.7 + manager.leagueBoost * 0.7);
}

export function weightedTeamPower(ratings: TeamRatings): number {
  return (
    ratings.attack * 0.15 +
    ratings.control * 0.18 +
    ratings.defence * 0.15 +
    ratings.clutch * 0.12 +
    ratings.consistency * 0.15 +
    ratings.chemistry * 0.22 +
    ratings.managerBoost * 0.03
  );
}

export type ChemBond = {
  label: string;
  delta: number;
};

export type ChemPreview = {
  current: number;
  projected: number;
  delta: number;
  bonds: ChemBond[];
};

export function previewChemistry(existingPicks: PlayerPick[], candidate: PlayerSeason, mode: string): ChemPreview {
  const current = mode === 'legacy' ? calculateLegacyChemistry(existingPicks) : calculateChemistry(existingPicks);

  const bonds: ChemBond[] = [];
  const players = existingPicks.map((p) => p.player);

  if (mode === 'legacy') {
    for (const p of players) {
      if (p.season === candidate.season) bonds.push({ label: `Same era as ${p.name.split(' ').pop()}`, delta: 6 });
      else if (seasonDecade(p.season) === seasonDecade(candidate.season))
        bonds.push({ label: `Same decade as ${p.name.split(' ').pop()}`, delta: 3 });
      if (p.nationality === candidate.nationality)
        bonds.push({ label: `${candidate.nationality} connection`, delta: 2 });
    }
  } else {
    for (const p of players) {
      if (p.club === candidate.club) {
        bonds.push({ label: `${candidate.club} bond`, delta: 4 });
        if (p.season === candidate.season) bonds.push({ label: `${candidate.season} squad`, delta: 4 });
      }
      if (p.nationality === candidate.nationality)
        bonds.push({ label: `${candidate.nationality} connection`, delta: 2 });
    }
  }

  // Deduplicate bond labels, summing deltas
  const merged = new Map<string, number>();
  for (const b of bonds) merged.set(b.label, (merged.get(b.label) ?? 0) + b.delta);
  const dedupedBonds = Array.from(merged.entries())
    .map(([label, delta]) => ({ label, delta }))
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 4);

  const totalDelta = dedupedBonds.reduce((sum, b) => sum + b.delta, 0);
  const projected = Math.min(100, current + totalDelta);

  return { current, projected, delta: projected - current, bonds: dedupedBonds };
}

export function pickScore(pick: DraftPick): number {
  if (pick.type === 'manager') {
    return 76 + pick.manager.boost + pick.manager.cupBoost * 0.9 + pick.manager.leagueBoost * 0.9;
  }
  const fit = isSlotFit(pick.player, pick.slot.required) ? 6 : -8;
  return pick.player.overall + pick.player.clutch * 0.05 + pick.player.consistency * 0.05 + fit;
}

export function clampRating(value: number): number {
  return Math.round(Math.max(35, Math.min(100, value)));
}
