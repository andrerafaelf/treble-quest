import { createRng } from '$lib/game/draft';
import { calculateTeamRatings, pickScore, weightedTeamPower } from '$lib/game/scoring';
import { createShareText } from '$lib/game/share';
import {
  CL_FINAL_OPPONENTS,
  CL_QF_OPPONENTS,
  CL_R16_OPPONENTS,
  CL_SF_OPPONENTS,
  WORLD_CUP_FINAL_OPPONENTS,
  WORLD_CUP_GROUP_OPPONENTS,
  WORLD_CUP_QF_OPPONENTS,
  WORLD_CUP_R16_OPPONENTS,
  WORLD_CUP_R32_OPPONENTS,
  WORLD_CUP_SF_OPPONENTS
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
  StatHighlights,
  TeamRatings,
  WorldCupResult
} from '$lib/game/types';

export function simulateRun(run: RunState): SimulationResult {
  const seed = run.seed + run.picks.length * 431;
  const rng = createRng(seed);
  const tableRng = createRng(seed + 1009);

  const ratings = calculateTeamRatings(run);
  const manager = run.picks.find((pick): pick is ManagerPick => pick.type === 'manager')?.manager;
  const managerLeagueBoost = manager?.leagueBoost ?? 0;
  const managerCupBoost = manager?.cupBoost ?? 0;
  const varianceMultiplier = run.mode === 'world-cup' ? 0.94 : 0.88;
  const candidates = buildCandidates(run);

  if (run.mode === 'world-cup') {
    return simulateWorldCupRun(
      run,
      seed,
      rng,
      ratings,
      manager,
      managerLeagueBoost,
      managerCupBoost,
      varianceMultiplier,
      candidates
    );
  }

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
  const groupQualified = groupPoints >= 10 || (groupPoints >= 9 && groupGd > 0);
  const groupWon = groupPoints >= 18 || (groupPoints >= 16 && groupGd > 4);

  const championsLeagueResult: ChampionsLeagueResult = groupQualified
    ? {
        group: groupWon ? 'Top-eight league phase' : 'Knockout play-off spot',
        exitRound: 'League phase',
        roundsWon: 0,
        won: false,
        opponent: groupOpponents[0]?.name,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0
      }
    : {
        group: 'Dropped in league phase',
        exitRound: 'League phase',
        roundsWon: 0,
        won: false,
        opponent: groupMatches[groupMatches.length - 1]?.opponent,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0
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
  Object.assign(championsLeagueResult, recordFromMatches(sortedMatches.filter((m) => m.competition === 'CL')));

  for (const match of sortedMatches) {
    const { scorers, assisters } = attributeMatchGoals(match, candidates, rng);
    match.scorers = scorers;
    match.assisters = assisters;
    match.cleanSheet = match.ga === 0;
  }

  const playerStats = aggregatePlayerStats(run, sortedMatches, candidates);

  const plMatches = sortedMatches.filter((m) => m.competition === 'PL');
  const { table } = buildPlTable(plMatches, tableRng, run.teamName);

  const leagueResult = buildLeagueResultFromMatches(plMatches, table);

  rebalancePlayerGoalsToMatches(playerStats, plMatches, sortedMatches);

  const awards = deriveAwards(playerStats, run.teamName);
  const highlights = deriveHighlights(sortedMatches, plMatches, ratings, table, playerStats);

  const trophies = [leagueResult.won, faCupResult.won, championsLeagueResult.won].filter(Boolean).length;
  const score = scoreTreble(leagueResult, faCupResult, championsLeagueResult, trophies, ratings, run.mode === 'global' ? 'global' : 'classic');
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

function simulateWorldCupRun(
  run: RunState,
  seed: number,
  rng: () => number,
  ratings: TeamRatings,
  manager: ManagerPick['manager'] | undefined,
  managerLeagueBoost: number,
  managerCupBoost: number,
  varianceMultiplier: number,
  candidates: ReturnType<typeof buildCandidates>
): SimulationResult {
  const allMatches: Match[] = [];
  const worldCupResult: WorldCupResult = {
    group: 'Group stage',
    exitRound: 'Group stage',
    roundsWon: 0,
    won: false,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0
  };

  const groupOpponents = pickUnique(WORLD_CUP_GROUP_OPPONENTS, 3, rng);
  for (let index = 0; index < groupOpponents.length; index += 1) {
    const fx = buildWorldCupFixture(index + 1, WORLD_CUP_DATES[index], 'Group stage', groupOpponents[index]);
    allMatches.push(playFixture(fx, ratings, managerLeagueBoost, managerCupBoost, varianceMultiplier, rng, candidates));
  }

  const groupMatches = allMatches.filter((m) => m.round === 'Group stage');
  const groupPoints = groupMatches.reduce((sum, m) => sum + (m.result === 'W' ? 3 : m.result === 'D' ? 1 : 0), 0);
  const groupGd = groupMatches.reduce((sum, m) => sum + (m.gf - m.ga), 0);
  const groupQualified = groupPoints >= 5 || (groupPoints >= 4 && groupGd > 0);
  worldCupResult.group = groupPoints === 9 ? 'Won group, 9/9' : groupQualified ? 'Qualified from group' : 'Group stage exit';

  if (groupQualified) {
    const knockoutRounds: {
      round: 'Round of 32' | 'Round of 16' | 'Quarter-final' | 'Semi-final' | 'Final';
      pool: { name: string; rating: number }[];
      pressure: number;
    }[] = [
      { round: 'Round of 32', pool: WORLD_CUP_R32_OPPONENTS, pressure: 0.04 },
      { round: 'Round of 16', pool: WORLD_CUP_R16_OPPONENTS, pressure: 0.08 },
      { round: 'Quarter-final', pool: WORLD_CUP_QF_OPPONENTS, pressure: 0.12 },
      { round: 'Semi-final', pool: WORLD_CUP_SF_OPPONENTS, pressure: 0.16 },
      { round: 'Final', pool: WORLD_CUP_FINAL_OPPONENTS, pressure: 0.22 }
    ];

    for (let index = 0; index < knockoutRounds.length; index += 1) {
      const { round, pool, pressure } = knockoutRounds[index];
      const opponent = pickOne(pool, rng);
      const fx = buildWorldCupFixture(index + 4, WORLD_CUP_DATES[index + 3], round, opponent);
      const match = playFixture(fx, ratings, managerLeagueBoost, managerCupBoost, varianceMultiplier, rng, candidates, pressure);
      resolveKnockoutDraw(match, ratings, managerCupBoost, rng);
      allMatches.push(match);

      if (match.result === 'W') {
        worldCupResult.roundsWon += 1;
        if (round === 'Final') {
          worldCupResult.won = true;
          worldCupResult.exitRound = 'Winners';
        }
      } else {
        worldCupResult.exitRound = round;
        worldCupResult.opponent = opponent.name;
        break;
      }
    }
  }

  const sortedMatches = sortFixtures(allMatches as unknown as ScheduledFixture[]) as unknown as Match[];

  for (const match of sortedMatches) {
    const { scorers, assisters } = attributeMatchGoals(match, candidates, rng);
    match.scorers = scorers;
    match.assisters = assisters;
    match.cleanSheet = match.ga === 0;
  }

  Object.assign(worldCupResult, recordFromMatches(sortedMatches));

  const playerStats = aggregatePlayerStats(run, sortedMatches, candidates);
  const awards = deriveAwards(playerStats);
  const highlights = deriveWorldCupHighlights(sortedMatches, worldCupResult, ratings, playerStats);
  const leagueResult = buildWorldCupLeagueResult(worldCupResult);
  const faCupResult = emptyCupResult('Not entered');
  const championsLeagueResult = emptyChampionsLeagueResult('Not entered');
  const trophies = worldCupResult.won ? 1 : 0;
  const score = scoreWorldCup(worldCupResult, ratings);
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
    worldCup: worldCupResult,
    bestPick: ordered[0] ?? run.picks[0],
    weakLink: ordered[ordered.length - 1] ?? run.picks[0],
    managerImpact: describeManagerImpact(manager, ratings, run.mode),
    shareText: '',
    matches: sortedMatches,
    playerStats,
    leagueTable: [],
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

const WORLD_CUP_DATES = ['Jun 12', 'Jun 18', 'Jun 24', 'Jun 29', 'Jul 4', 'Jul 8', 'Jul 14', 'Jul 19'];

function buildWorldCupFixture(
  matchday: number,
  date: string,
  round: string,
  opponent: { name: string; rating: number }
): ScheduledFixture {
  return {
    matchday,
    date,
    competition: 'WC',
    round,
    opponent: opponent.name,
    opponentRating: opponent.rating,
    venue: 'N'
  };
}

function pickOne<T>(pool: T[], rng: () => number): T {
  return pool[Math.floor(rng() * pool.length)];
}

function pickUnique<T>(pool: T[], count: number, rng: () => number): T[] {
  const copy = [...pool];
  const chosen: T[] = [];
  while (copy.length && chosen.length < count) {
    const index = Math.floor(rng() * copy.length);
    const [item] = copy.splice(index, 1);
    chosen.push(item);
  }
  return chosen;
}

function resolveKnockoutDraw(
  match: Match,
  ratings: TeamRatings,
  managerCupBoost: number,
  rng: () => number
): void {
  if (match.result !== 'D') return;
  const winChance = clampNumber(0.46 + (ratings.clutch - 70) * 0.005 + managerCupBoost * 0.015, 0.34, 0.74);
  if (rng() < winChance) {
    match.gf += 1;
    match.result = 'W';
  } else {
    match.ga += 1;
    match.result = 'L';
  }
}

function recordFromMatches(matches: Match[]): Pick<WorldCupResult, 'wins' | 'draws' | 'losses' | 'goalsFor' | 'goalsAgainst'> {
  let wins = 0;
  let draws = 0;
  let losses = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;
  for (const match of matches) {
    goalsFor += match.gf;
    goalsAgainst += match.ga;
    if (match.result === 'W') wins += 1;
    else if (match.result === 'D') draws += 1;
    else losses += 1;
  }
  return { wins, draws, losses, goalsFor, goalsAgainst };
}

function buildWorldCupLeagueResult(worldCup: WorldCupResult): LeagueResult {
  return {
    points: worldCup.wins * 3 + worldCup.draws,
    position: worldCupFinishPosition(worldCup),
    label: worldCup.won ? 'World champions' : worldCup.exitRound,
    won: worldCup.won,
    wins: worldCup.wins,
    draws: worldCup.draws,
    losses: worldCup.losses,
    goalsFor: worldCup.goalsFor,
    goalsAgainst: worldCup.goalsAgainst
  };
}

function emptyCupResult(exitRound: string): CupResult {
  return { competition: 'FA Cup', exitRound, roundsWon: 0, won: false };
}

function emptyChampionsLeagueResult(exitRound: string): ChampionsLeagueResult {
  return {
    group: exitRound,
    exitRound,
    roundsWon: 0,
    won: false,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0
  };
}

function deriveWorldCupHighlights(
  matches: Match[],
  worldCup: WorldCupResult,
  ratings: TeamRatings,
  playerStats: PlayerSeasonStats[]
): StatHighlights {
  let biggestMargin = -Infinity;
  let biggestWin: StatHighlights['biggestWin'];
  let cleanSheets = 0;
  let longestWinStreak = 0;
  let currentWinStreak = 0;

  for (const match of matches) {
    const margin = match.gf - match.ga;
    if (match.result === 'W' && margin > biggestMargin) {
      biggestMargin = margin;
      biggestWin = { opponent: match.opponent, gf: match.gf, ga: match.ga, competition: match.competition };
    }
    if (match.cleanSheet) cleanSheets += 1;
    if (match.result === 'W') {
      currentWinStreak += 1;
      if (currentWinStreak > longestWinStreak) longestWinStreak = currentWinStreak;
    } else {
      currentWinStreak = 0;
    }
  }

  const perfect = worldCup.won && worldCup.wins === 8 && worldCup.draws === 0 && worldCup.losses === 0;
  const record = `${worldCup.wins}-${worldCup.draws}-${worldCup.losses}`;
  let narrativeHeadline = 'WORLD CUP RUN';
  let narrativeBody = `${record} in the tournament, out in ${worldCup.exitRound}.`;

  if (perfect) {
    narrativeHeadline = '8-0 WORLD CHAMPIONS';
    narrativeBody = `Eight matches, eight wins, ${worldCup.goalsFor} scored and ${worldCup.goalsAgainst} conceded. That is the perfect World Cup.`;
  } else if (worldCup.won) {
    narrativeHeadline = 'WORLD CHAMPIONS';
    narrativeBody = `${record} and the trophy lifted. Perfect run missed, but the final was handled.`;
  } else if (worldCup.exitRound === 'Final') {
    narrativeHeadline = 'FINAL HEARTBREAK';
    narrativeBody = `${record}, beaten at the last step. One more result away from the trophy.`;
  } else if (worldCup.exitRound === 'Group stage') {
    narrativeHeadline = 'GROUP STAGE EXIT';
    narrativeBody = `${record}. The 8-0 dream never got out of the group.`;
  } else if (worldCup.roundsWon >= 3) {
    narrativeHeadline = 'DEEP TOURNAMENT RUN';
    narrativeBody = `${record}, out in the ${worldCup.exitRound}. The trophy was close.`;
  }

  return {
    biggestWin,
    longestWinStreak,
    cleanSheets,
    narrativeHeadline,
    narrativeBody,
    expectedFinish: expectedWorldCupFinish(ratings, playerStats),
    actualFinish: worldCupFinishPosition(worldCup),
    isWorldCup: true
  };
}

function expectedWorldCupFinish(ratings: TeamRatings, playerStats: PlayerSeasonStats[]): number {
  const playerAverage = playerStats.length
    ? playerStats.reduce((sum, player) => sum + player.overall, 0) / playerStats.length
    : 78;
  const power = weightedTeamPower(ratings) + (playerAverage - 78) * 0.25;
  if (power >= 88) return 1;
  if (power >= 84) return 2;
  if (power >= 80) return 4;
  if (power >= 76) return 8;
  if (power >= 72) return 16;
  return 32;
}

function worldCupFinishPosition(worldCup: WorldCupResult): number {
  if (worldCup.won) return 1;
  if (worldCup.exitRound === 'Final') return 2;
  if (worldCup.exitRound === 'Semi-final') return 4;
  if (worldCup.exitRound === 'Quarter-final') return 8;
  if (worldCup.exitRound === 'Round of 16') return 16;
  if (worldCup.exitRound === 'Round of 32') return 32;
  return 48;
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
  mode: 'classic' | 'global'
): number {
  const leagueScore = (league.points - 38) * 32 + (league.won ? 1200 : 0) + (league.position === 2 ? 380 : league.position === 3 ? 160 : 0);
  const perfectLeagueBonus = league.wins === 38 && league.draws === 0 && league.losses === 0 ? 4200 : league.won && league.losses === 0 ? 900 : 0;

  const cupRoundValues = [0, 90, 160, 260, 400, 620];
  const cupScore = faCup.won ? 1800 : cupRoundValues[Math.min(faCup.roundsWon, cupRoundValues.length - 1)];

  const clRoundValues = [0, 360, 640, 1000, 1500];
  const clGroupBonus = championsLeague.group === 'Top-eight league phase' ? 420 : championsLeague.group === 'Knockout play-off spot' ? 180 : 0;
  const perfectClBonus =
    championsLeague.won && championsLeague.wins === 15 && championsLeague.draws === 0 && championsLeague.losses === 0
      ? 5200
      : championsLeague.won && championsLeague.losses === 0
        ? 1000
        : 0;
  const clScore = (championsLeague.won ? 3400 : clRoundValues[Math.min(championsLeague.roundsWon, clRoundValues.length - 1)] + clGroupBonus) + perfectClBonus;

  const qualityScore = ratings.fit * 6 + (ratings.chemistry - 50) * 10 + weightedTeamPower(ratings) * 4;

  const trebleBonus = trophies === 3 ? 2500 : trophies === 2 ? 450 : trophies === 1 ? 120 : 0;
  const trebleMultiplier = trophies === 3 ? 1.35 : 1;

  const modeMultiplier = (mode === 'classic' || mode === 'global') ? 1.22 : 1;

  const raw = (leagueScore + perfectLeagueBonus + cupScore + clScore + qualityScore + trebleBonus) * modeMultiplier * trebleMultiplier;
  return Math.max(0, Math.round(raw));
}

function scoreWorldCup(worldCup: WorldCupResult, ratings: TeamRatings): number {
  const points = worldCup.wins * 3 + worldCup.draws;
  const recordScore = points * 280 + worldCup.goalsFor * 34 - worldCup.goalsAgainst * 42;
  const roundValues = [0, 720, 1250, 2050, 3200, 4600];
  const roundScore = roundValues[Math.min(worldCup.roundsWon, roundValues.length - 1)];
  const titleBonus = worldCup.won ? 5200 : 0;
  const perfectBonus = worldCup.won && worldCup.wins === 8 && worldCup.draws === 0 && worldCup.losses === 0 ? 5200 : 0;
  const qualityScore = ratings.fit * 7 + (ratings.chemistry - 50) * 12 + weightedTeamPower(ratings) * 5;
  return Math.max(0, Math.round((recordScore + roundScore + titleBonus + perfectBonus + qualityScore) * 1.18));
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function describeManagerImpact(manager: ManagerPick['manager'] | undefined, ratings: TeamRatings, mode: RunState['mode'] = 'classic'): SimulationResult['managerImpact'] {
  if (!manager) return { key: 'manager_impact.no_manager' };
  const styleKey = mode === 'world-cup' && manager.style === 'balanced'
    ? 'manager_impact.style_balanced_wc'
    : `manager_impact.style_${manager.style}`;
  return { key: styleKey, values: { name: manager.name, boost: ratings.managerBoost } };
}

function ordinal(value: number): string {
  const tens = value % 100;
  if (tens >= 11 && tens <= 13) return `${value}th`;
  const ones = value % 10;
  const suffix = ones === 1 ? 'st' : ones === 2 ? 'nd' : ones === 3 ? 'rd' : 'th';
  return `${value}${suffix}`;
}
