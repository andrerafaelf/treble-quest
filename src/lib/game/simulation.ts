import { createRng } from '$lib/game/draft';
import { calculateTeamRatings, pickScore, weightedTeamPower } from '$lib/game/scoring';
import { createShareText } from '$lib/game/share';
import type { ChampionsLeagueResult, CupResult, DraftPick, LeagueResult, ManagerPick, RunState, SimulationResult, TeamRatings } from '$lib/game/types';

export function simulateRun(run: RunState): SimulationResult {
  const seed = run.seed + run.picks.length * 431;
  const rng = createRng(seed);
  const ratings = calculateTeamRatings(run);
  const manager = run.picks.find((pick): pick is ManagerPick => pick.type === 'manager')?.manager;
  const varianceMultiplier = run.mode === 'quick' ? 1.12 : 0.92;
  const league = simulateLeague(ratings, manager?.leagueBoost ?? 0, rng, varianceMultiplier);
  const faCup = simulateFaCup(ratings, manager?.cupBoost ?? 0, rng, varianceMultiplier);
  const championsLeague = simulateChampionsLeague(ratings, manager?.cupBoost ?? 0, rng, varianceMultiplier);
  const trophies = [league.won, faCup.won, championsLeague.won].filter(Boolean).length;
  const score = scoreTreble(league, faCup, championsLeague, trophies, ratings, run.mode);
  const ordered = [...run.picks].sort((a, b) => pickScore(b) - pickScore(a));
  const result: SimulationResult = {
    seed,
    mode: run.mode,
    score,
    trophies,
    ratings,
    league,
    faCup,
    championsLeague,
    bestPick: ordered[0] ?? run.picks[0],
    weakLink: ordered[ordered.length - 1] ?? run.picks[0],
    managerImpact: describeManagerImpact(manager, ratings),
    shareText: ''
  };
  result.shareText = createShareText(result);
  return result;
}

function simulateLeague(ratings: TeamRatings, leagueBoost: number, rng: () => number, varianceMultiplier: number): LeagueResult {
  const power = weightedTeamPower(ratings);
  const noise = (rng() - 0.5) * 24 * varianceMultiplier;
  const points = Math.round(Math.max(40, Math.min(101, 28 + power * 0.5 + ratings.control * 0.16 + ratings.consistency * 0.14 + ratings.chemistry * 0.06 + leagueBoost * 0.6 + noise)));
  const position = points >= 94 ? 1 : points >= 86 ? 2 : points >= 78 ? 3 : points >= 70 ? 5 : points >= 60 ? 8 : 13;
  return {
    points,
    position,
    label: position === 1 ? 'Champions' : `${ordinal(position)} place`,
    won: position === 1
  };
}

function simulateFaCup(ratings: TeamRatings, cupBoost: number, rng: () => number, varianceMultiplier: number): CupResult {
  const rounds = ['Third Round', 'Fourth Round', 'Fifth Round', 'Quarter-final', 'Semi-final', 'Final'];
  let roundsWon = 0;
  for (const round of rounds) {
    const roundPressure = round === 'Final' ? 0.14 : round === 'Semi-final' ? 0.09 : round === 'Quarter-final' ? 0.05 : 0;
    const chance = 0.38 + ratings.clutch / 340 + ratings.defence / 520 + ratings.chemistry / 700 + cupBoost / 110 - roundPressure;
    if (rng() < Math.min(0.82, chance + (rng() - 0.5) * 0.22 * varianceMultiplier)) {
      roundsWon += 1;
    } else {
      return { competition: 'FA Cup', exitRound: round, roundsWon, won: false };
    }
  }
  return { competition: 'FA Cup', exitRound: 'Winners', roundsWon, won: true };
}

function simulateChampionsLeague(ratings: TeamRatings, cupBoost: number, rng: () => number, varianceMultiplier: number): ChampionsLeagueResult {
  const groupPower = ratings.control * 0.27 + ratings.attack * 0.2 + ratings.defence * 0.18 + ratings.consistency * 0.18 + ratings.managerBoost * 0.18;
  const groupRoll = groupPower + (rng() - 0.5) * 28 * varianceMultiplier;
  const group = groupRoll > 82 ? 'Won group' : groupRoll > 68 ? 'Qualified second' : 'Dropped in group';
  if (group === 'Dropped in group') return { group, exitRound: 'Group stage', roundsWon: 0, won: false };

  const rounds = ['Round of 16', 'Quarter-final', 'Semi-final', 'Final'];
  let roundsWon = 0;
  const seedBonus = group === 'Won group' ? 0.05 : 0;
  for (const round of rounds) {
    const roundTax = round === 'Final' ? 0.16 : round === 'Semi-final' ? 0.1 : round === 'Quarter-final' ? 0.05 : 0;
    const chance = 0.34 + ratings.clutch / 360 + ratings.attack / 560 + ratings.defence / 600 + cupBoost / 120 + seedBonus - roundTax;
    if (rng() < Math.min(0.78, chance + (rng() - 0.5) * 0.24 * varianceMultiplier)) {
      roundsWon += 1;
    } else {
      return { group, exitRound: round, roundsWon, won: false };
    }
  }
  return { group, exitRound: 'Winners', roundsWon, won: true };
}

function scoreTreble(
  league: LeagueResult,
  faCup: CupResult,
  championsLeague: ChampionsLeagueResult,
  trophies: number,
  ratings: TeamRatings,
  mode: 'quick' | 'classic'
): number {
  const leagueScore = (league.points - 38) * 2.4 + (league.won ? 40 : 0) + (league.position === 2 ? 14 : league.position === 3 ? 6 : 0);

  const cupRoundValues = [0, 6, 10, 16, 24, 36];
  const cupScore = faCup.won ? 110 : cupRoundValues[Math.min(faCup.roundsWon, cupRoundValues.length - 1)];

  const clRoundValues = [0, 22, 38, 58, 86];
  const clGroupBonus = championsLeague.group === 'Won group' ? 18 : championsLeague.group === 'Qualified second' ? 8 : 0;
  const clScore = championsLeague.won ? 200 : clRoundValues[Math.min(championsLeague.roundsWon, clRoundValues.length - 1)] + clGroupBonus;

  const qualityScore = ratings.fit * 0.35 + (ratings.chemistry - 50) * 0.6 + weightedTeamPower(ratings) * 0.25;

  const trebleBonus = trophies === 3 ? 60 : trophies === 2 ? 18 : trophies === 1 ? 6 : 0;

  const modeMultiplier = mode === 'classic' ? 1.18 : 1;

  const raw = (leagueScore + cupScore + clScore + qualityScore + trebleBonus) * modeMultiplier;
  return Math.max(0, Math.round(raw));
}

function describeManagerImpact(manager: ManagerPick['manager'] | undefined, ratings: TeamRatings): string {
  if (!manager) return 'No manager was selected, so the squad leaned entirely on raw talent.';
  const styleText = {
    balanced: 'kept the squad stable across all three competitions',
    attacking: 'pushed the attack into match-winning territory',
    defensive: 'made the knockout ties feel controlled and narrow',
    pressing: 'lifted the tempo and chemistry of the group',
    counter: 'gave the side a sharper cup-tie edge'
  }[manager.style];
  return `${manager.name} ${styleText}. Manager boost: ${ratings.managerBoost}.`;
}

function ordinal(value: number): string {
  const suffix = value === 1 ? 'st' : value === 2 ? 'nd' : value === 3 ? 'rd' : 'th';
  return `${value}${suffix}`;
}
