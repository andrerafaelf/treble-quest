import { createRng } from '$lib/game/draft';
import { calculateTeamRatings, pickScore, weightedTeamPower } from '$lib/game/scoring';
import { createShareText } from '$lib/game/share';
import {
  CL_FINAL_OPPONENTS,
  CL_QF_OPPONENTS,
  CL_R16_OPPONENTS,
  CL_SF_OPPONENTS
} from '$lib/game/sim/clubRatings';
import { deriveAwards } from '$lib/game/sim/awards';
import { deriveHighlights } from '$lib/game/sim/highlights';
import { buildPlTable, findUserPosition } from '$lib/game/sim/leagueTable';
import { resultLetter, simulateMatch, type MatchInputs } from '$lib/game/sim/matchEngine';
import { aggregatePlayerStats, attributeMatchGoals, buildCandidates } from '$lib/game/sim/playerStats';
import {
  buildChampionsLeagueGroupFixtures,
  buildChampionsLeagueKnockoutTie,
  buildFaCupRound,
  buildPremierLeagueFixtures,
  sortFixtures,
  type ScheduledFixture
} from '$lib/game/sim/scheduler';
import type {
  ChampionsLeagueResult,
  CupResult,
  LeagueResult,
  ManagerPick,
  Match,
  PlayerSeasonStats,
  RunState,
  SimulationResult,
  TeamRatings
} from '$lib/game/types';

export function simulateRun(run: RunState): SimulationResult {
  const seed = run.seed + run.picks.length * 431;
  const rng = createRng(seed);
  const tableRng = createRng(seed + 1009);

  const ratings = calculateTeamRatings(run);
  const manager = run.picks.find((pick): pick is ManagerPick => pick.type === 'manager')?.manager;
  const managerLeagueBoost = manager?.leagueBoost ?? 0;
  const managerCupBoost = manager?.cupBoost ?? 0;
  const varianceMultiplier = run.mode === 'quick' ? 1.05 : 0.88;
  const candidates = buildCandidates(run);

  const allMatches: Match[] = [];

  const plFixtures = buildPremierLeagueFixtures(rng);
  for (const fx of plFixtures) {
    allMatches.push(playFixture(fx, ratings, managerLeagueBoost, managerCupBoost, varianceMultiplier, rng, candidates));
  }

  const { fixtures: clGroupFixtures, groupOpponents } = buildChampionsLeagueGroupFixtures(rng);
  const groupMatches: Match[] = [];
  for (const fx of clGroupFixtures) {
    const match = playFixture(fx, ratings, managerLeagueBoost, managerCupBoost, varianceMultiplier, rng, candidates);
    groupMatches.push(match);
    allMatches.push(match);
  }

  const groupPoints = groupMatches.reduce(
    (sum, m) => sum + (m.result === 'W' ? 3 : m.result === 'D' ? 1 : 0),
    0
  );
  const groupGd = groupMatches.reduce((sum, m) => sum + (m.gf - m.ga), 0);
  const groupQualified = groupPoints >= 7 || (groupPoints >= 5 && groupGd > 0);
  const groupWon = groupPoints >= 13 || (groupPoints >= 11 && groupGd > 2);

  const championsLeagueResult: ChampionsLeagueResult = groupQualified
    ? {
        group: groupWon ? 'Won group' : 'Qualified second',
        exitRound: 'Group stage',
        roundsWon: 0,
        won: false,
        opponent: groupOpponents[0]?.name
      }
    : {
        group: 'Dropped in group',
        exitRound: 'Group stage',
        roundsWon: 0,
        won: false,
        opponent: groupMatches[groupMatches.length - 1]?.opponent
      };

  if (groupQualified) {
    let knockoutsOut = false;
    let roundsWon = 0;
    const knockoutRounds: { round: 'Round of 16' | 'Quarter-final' | 'Semi-final' | 'Final'; pool: { name: string; rating: number }[] }[] = [
      { round: 'Round of 16', pool: CL_R16_OPPONENTS },
      { round: 'Quarter-final', pool: CL_QF_OPPONENTS },
      { round: 'Semi-final', pool: CL_SF_OPPONENTS },
      { round: 'Final', pool: CL_FINAL_OPPONENTS }
    ];
    for (const { round, pool } of knockoutRounds) {
      if (knockoutsOut) break;
      const opponent = pool[Math.floor(rng() * pool.length)];
      const legs = buildChampionsLeagueKnockoutTie(round, opponent, rng);
      let tieGf = 0;
      let tieGa = 0;
      const legMatches: Match[] = [];
      for (const leg of legs) {
        const pressure = round === 'Final' ? 0.18 : round === 'Semi-final' ? 0.1 : round === 'Quarter-final' ? 0.05 : 0;
        const match = playFixture(leg, ratings, managerLeagueBoost, managerCupBoost, varianceMultiplier, rng, candidates, pressure);
        tieGf += match.gf;
        tieGa += match.ga;
        legMatches.push(match);
      }
      legMatches[legMatches.length - 1].aggregate = { gf: tieGf, ga: tieGa };

      const advanced = round === 'Final' ? tieGf > tieGa : tieGf > tieGa || (tieGf === tieGa && rng() < 0.5);
      for (const m of legMatches) allMatches.push(m);

      if (advanced) {
        roundsWon += 1;
        if (round === 'Final') {
          championsLeagueResult.won = true;
          championsLeagueResult.exitRound = 'Winners';
        }
      } else {
        knockoutsOut = true;
        championsLeagueResult.exitRound = round;
        championsLeagueResult.opponent = opponent.name;
      }
    }
    championsLeagueResult.roundsWon = roundsWon;
  }

  const faCupResult: CupResult = { competition: 'FA Cup', exitRound: 'Third Round', roundsWon: 0, won: false };
  for (let roundIdx = 0; roundIdx < 6; roundIdx += 1) {
    const fx = buildFaCupRound(roundIdx, rng);
    if (!fx) break;
    const pressure = fx.round === 'Final' ? 0.16 : fx.round === 'Semi-final' ? 0.1 : fx.round === 'Quarter-final' ? 0.05 : 0;
    const match = playFixture(fx, ratings, managerLeagueBoost, managerCupBoost, varianceMultiplier, rng, candidates, pressure);
    if (match.result === 'D') {
      const replayWin = rng() < 0.5 + (ratings.clutch - 60) * 0.005;
      if (replayWin) {
        match.gf = match.ga + 1;
        match.result = 'W';
      } else {
        match.gf = Math.max(0, match.ga - 1);
        match.result = 'L';
      }
    }
    allMatches.push(match);
    if (match.result === 'W') {
      faCupResult.roundsWon += 1;
      if (fx.round === 'Final') {
        faCupResult.won = true;
        faCupResult.exitRound = 'Winners';
      }
    } else {
      faCupResult.exitRound = fx.round ?? 'Third Round';
      faCupResult.opponent = fx.opponent;
      break;
    }
  }

  const sortedMatches = sortFixtures(allMatches as unknown as ScheduledFixture[]) as unknown as Match[];

  for (const match of sortedMatches) {
    const { scorers, assisters } = attributeMatchGoals(match, candidates, rng);
    match.scorers = scorers;
    match.assisters = assisters;
    match.cleanSheet = match.ga === 0;
  }

  const playerStats = aggregatePlayerStats(run, sortedMatches, candidates);

  const plMatches = sortedMatches.filter((m) => m.competition === 'PL');
  const { table } = buildPlTable(plMatches, tableRng);

  const leagueResult = buildLeagueResultFromMatches(plMatches, table);

  rebalancePlayerGoalsToMatches(playerStats, plMatches, sortedMatches);

  const awards = deriveAwards(playerStats);
  const highlights = deriveHighlights(sortedMatches, plMatches, ratings, table, playerStats);

  const trophies = [leagueResult.won, faCupResult.won, championsLeagueResult.won].filter(Boolean).length;
  const score = scoreTreble(leagueResult, faCupResult, championsLeagueResult, trophies, ratings, run.mode);
  const ordered = [...run.picks].sort((a, b) => pickScore(b) - pickScore(a));

  const result: SimulationResult = {
    seed,
    mode: run.mode,
    score,
    trophies,
    ratings,
    league: leagueResult,
    faCup: faCupResult,
    championsLeague: championsLeagueResult,
    bestPick: ordered[0] ?? run.picks[0],
    weakLink: ordered[ordered.length - 1] ?? run.picks[0],
    managerImpact: describeManagerImpact(manager, ratings),
    shareText: '',
    matches: sortedMatches,
    playerStats,
    leagueTable: table,
    awards,
    highlights
  };
  result.shareText = createShareText(result);
  return result;
}

function rebalancePlayerGoalsToMatches(
  _playerStats: PlayerSeasonStats[],
  _plMatches: Match[],
  _sortedMatches: Match[]
): void {
  // intentionally a no-op: stats are derived directly from match scorers,
  // so totals are consistent by construction.
}

function playFixture(
  fx: ScheduledFixture,
  ratings: TeamRatings,
  managerLeagueBoost: number,
  managerCupBoost: number,
  varianceMultiplier: number,
  rng: () => number,
  _candidates: unknown,
  roundPressure?: number
): Match {
  const inputs: MatchInputs = {
    ratings,
    opponentRating: fx.opponentRating,
    venue: fx.venue,
    managerLeagueBoost,
    managerCupBoost,
    competition: fx.competition,
    roundPressure,
    varianceMultiplier
  };
  const { gf, ga } = simulateMatch(inputs, rng);
  return {
    matchday: fx.matchday,
    date: fx.date,
    competition: fx.competition,
    round: fx.round,
    opponent: fx.opponent,
    opponentRating: fx.opponentRating,
    venue: fx.venue,
    gf,
    ga,
    result: resultLetter(gf, ga),
    scorers: [],
    assisters: [],
    cleanSheet: ga === 0
  };
}

function buildLeagueResultFromMatches(
  plMatches: Match[],
  table: ReturnType<typeof buildPlTable>['table']
): LeagueResult {
  let wins = 0;
  let draws = 0;
  let losses = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;
  for (const m of plMatches) {
    goalsFor += m.gf;
    goalsAgainst += m.ga;
    if (m.result === 'W') wins += 1;
    else if (m.result === 'D') draws += 1;
    else losses += 1;
  }
  const points = wins * 3 + draws;
  const position = findUserPosition(table);
  return {
    points,
    position,
    label: position === 1 ? 'Champions' : `${ordinal(position)} place`,
    won: position === 1,
    wins,
    draws,
    losses,
    goalsFor,
    goalsAgainst
  };
}

function scoreTreble(
  league: LeagueResult,
  faCup: CupResult,
  championsLeague: ChampionsLeagueResult,
  trophies: number,
  ratings: TeamRatings,
  mode: 'quick' | 'classic'
): number {
  const leagueScore = (league.points - 38) * 32 + (league.won ? 1200 : 0) + (league.position === 2 ? 380 : league.position === 3 ? 160 : 0);

  const cupRoundValues = [0, 90, 160, 260, 400, 620];
  const cupScore = faCup.won ? 1800 : cupRoundValues[Math.min(faCup.roundsWon, cupRoundValues.length - 1)];

  const clRoundValues = [0, 360, 640, 1000, 1500];
  const clGroupBonus = championsLeague.group === 'Won group' ? 320 : championsLeague.group === 'Qualified second' ? 140 : 0;
  const clScore = championsLeague.won ? 3400 : clRoundValues[Math.min(championsLeague.roundsWon, clRoundValues.length - 1)] + clGroupBonus;

  const qualityScore = ratings.fit * 6 + (ratings.chemistry - 50) * 10 + weightedTeamPower(ratings) * 4;

  const trebleBonus = trophies === 3 ? 2500 : trophies === 2 ? 450 : trophies === 1 ? 120 : 0;
  const trebleMultiplier = trophies === 3 ? 1.35 : 1;

  const modeMultiplier = mode === 'classic' ? 1.22 : 1;

  const raw = (leagueScore + cupScore + clScore + qualityScore + trebleBonus) * modeMultiplier * trebleMultiplier;
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
  const tens = value % 100;
  if (tens >= 11 && tens <= 13) return `${value}th`;
  const ones = value % 10;
  const suffix = ones === 1 ? 'st' : ones === 2 ? 'nd' : ones === 3 ? 'rd' : 'th';
  return `${value}${suffix}`;
}
