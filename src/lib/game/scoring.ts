import { isSlotFit } from '$lib/game/draft';
import type { DraftPick, Manager, PlayerPick, RunState, TeamRatings } from '$lib/game/types';

export function calculateTeamRatings(run: RunState): TeamRatings {
  const playerPicks = run.picks.filter((pick): pick is PlayerPick => pick.type === 'player');
  const manager = run.picks.find((pick) => pick.type === 'manager')?.manager;
  const players = playerPicks.map((pick) => pick.player);
  const safeCount = Math.max(players.length, 1);
  const average = (key: 'control' | 'defence' | 'clutch' | 'consistency') => players.reduce((sum, player) => sum + player[key], 0) / safeCount;
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
    chemistry: calculateChemistry(playerPicks),
    managerBoost: calculateManagerBoost(manager),
    fit: Math.round((fit / Math.max(playerPicks.length, 1)) * 100)
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

export function calculateManagerBoost(manager?: Manager): number {
  if (!manager) return 0;
  return Math.round(manager.boost * 1.3 + manager.cupBoost * 0.7 + manager.leagueBoost * 0.7);
}

export function weightedTeamPower(ratings: TeamRatings): number {
  return (
    ratings.attack * 0.18 +
    ratings.control * 0.22 +
    ratings.defence * 0.18 +
    ratings.clutch * 0.14 +
    ratings.consistency * 0.18 +
    ratings.chemistry * 0.07 +
    ratings.managerBoost * 0.03
  );
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
