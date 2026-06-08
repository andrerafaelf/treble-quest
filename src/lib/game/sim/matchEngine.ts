import { weightedTeamPower } from '$lib/game/scoring';
import type { TeamRatings, Venue } from '$lib/game/types';

export type MatchInputs = {
  ratings: TeamRatings;
  opponentRating: number;
  venue: Venue;
  managerLeagueBoost: number;
  managerCupBoost: number;
  competition: 'PL' | 'FAC' | 'CL';
  roundPressure?: number;
  varianceMultiplier: number;
};

export type MatchOutcome = {
  gf: number;
  ga: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function poissonSample(lambda: number, rng: () => number): number {
  if (lambda <= 0) return 0;
  const safeLambda = Math.min(lambda, 7);
  const L = Math.exp(-safeLambda);
  let k = 0;
  let p = 1;
  do {
    k += 1;
    p *= rng();
  } while (p > L && k < 12);
  return k - 1;
}

export function simulateMatch(inputs: MatchInputs, rng: () => number): MatchOutcome {
  const { ratings, opponentRating, venue, competition, varianceMultiplier } = inputs;

  const teamPower = weightedTeamPower(ratings);
  const venueAttackBonus = venue === 'H' ? 4 : venue === 'A' ? -2 : 0;
  const venueDefenceBonus = venue === 'H' ? 3 : venue === 'A' ? -2 : 0;

  const compBoost = competition === 'PL' ? inputs.managerLeagueBoost : inputs.managerCupBoost;
  const pressureTax = inputs.roundPressure ?? 0;

  const effectivePower = teamPower + venueAttackBonus + compBoost * 0.4;
  const effectiveDefence = ratings.defence + venueDefenceBonus + ratings.consistency * 0.15;

  const powerGap = (effectivePower - opponentRating) / 12;

  const baseAttackLambda = 1.1 + powerGap * 0.5 + (ratings.attack - 60) * 0.016 - pressureTax * 0.35;
  const baseDefenceLambda = 1.1 - powerGap * 0.42 - (effectiveDefence - 60) * 0.016 + pressureTax * 0.25;

  const attackNoise = (rng() - 0.5) * 0.6 * varianceMultiplier;
  const defenceNoise = (rng() - 0.5) * 0.6 * varianceMultiplier;

  const lambdaFor = clamp(baseAttackLambda + attackNoise, 0.18, 4.4);
  const lambdaAga = clamp(baseDefenceLambda + defenceNoise, 0.15, 4.2);

  const gf = poissonSample(lambdaFor, rng);
  const ga = poissonSample(lambdaAga, rng);

  return { gf, ga };
}

export function resultLetter(gf: number, ga: number): 'W' | 'D' | 'L' {
  if (gf > ga) return 'W';
  if (gf < ga) return 'L';
  return 'D';
}
