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
  const noise = (rng() - 0.42) * 18 * varianceMultiplier;
  const points = Math.round(Math.max(55, Math.min(101, 43 + power * 0.55 + ratings.control * 0.18 + ratings.consistency * 0.16 + ratings.chemistry * 0.08 + leagueBoost * 0.75 + noise)));
  const position = points >= 89 ? 1 : points >= 82 ? 2 : points >= 75 ? 3 : points >= 68 ? 5 : points >= 61 ? 8 : 11;
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
    const roundPressure = round === 'Final' ? 5 : round === 'Semi-final' ? 3 : 0;
    const chance = 0.47 + ratings.clutch / 260 + ratings.defence / 420 + ratings.chemistry / 550 + cupBoost / 85 - roundPressure / 100;
    if (rng() < Math.min(0.91, chance - (varianceMultiplier - 1) * 0.05 + (rng() - 0.5) * 0.16 * varianceMultiplier)) {
      roundsWon += 1;
    } else {
      return { competition: 'FA Cup', exitRound: round, roundsWon, won: false };
    }
  }
  return { competition: 'FA Cup', exitRound: 'Winners', roundsWon, won: true };
}

function simulateChampionsLeague(ratings: TeamRatings, cupBoost: number, rng: () => number, varianceMultiplier: number): ChampionsLeagueResult {
  const groupPower = ratings.control * 0.27 + ratings.attack * 0.2 + ratings.defence * 0.18 + ratings.consistency * 0.18 + ratings.managerBoost * 0.18;
  const group = groupPower + (rng() - 0.35) * 22 * varianceMultiplier > 74 ? 'Won group' : groupPower > 64 ? 'Qualified second' : 'Dropped in group';
  if (group === 'Dropped in group') return { group, exitRound: 'Group stage', roundsWon: 0, won: false };

  const rounds = ['Round of 16', 'Quarter-final', 'Semi-final', 'Final'];
  let roundsWon = 0;
  for (const round of rounds) {
    const finalTax = round === 'Final' ? 0.05 : round === 'Semi-final' ? 0.025 : 0;
    const chance = 0.42 + ratings.clutch / 280 + ratings.attack / 430 + ratings.defence / 470 + cupBoost / 90 - finalTax;
    if (rng() < Math.min(0.88, chance + (rng() - 0.5) * 0.18 * varianceMultiplier)) {
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
