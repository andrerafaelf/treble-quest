import { PL_CLUBS, USER_CLUB_NAME } from '$lib/game/sim/clubRatings';
import type { LeagueTableRow, Match } from '$lib/game/types';

type UserStats = {
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
};

type ClubAcc = {
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
};

export function buildPlTable(plMatches: Match[], rng: () => number): { table: LeagueTableRow[]; userRow: LeagueTableRow } {
  const userStats: UserStats = { wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, points: 0 };
  const mirror = new Map<string, ClubAcc>();

  for (const m of plMatches) {
    userStats.goalsFor += m.gf;
    userStats.goalsAgainst += m.ga;
    if (m.result === 'W') {
      userStats.wins += 1;
      userStats.points += 3;
    } else if (m.result === 'D') {
      userStats.draws += 1;
      userStats.points += 1;
    } else {
      userStats.losses += 1;
    }

    const acc = mirror.get(m.opponent) ?? { wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 };
    acc.goalsFor += m.ga;
    acc.goalsAgainst += m.gf;
    if (m.result === 'W') acc.losses += 1;
    else if (m.result === 'L') acc.wins += 1;
    else acc.draws += 1;
    mirror.set(m.opponent, acc);
  }

  const userRow: LeagueTableRow = {
    club: USER_CLUB_NAME,
    isUser: true,
    played: 38,
    wins: userStats.wins,
    draws: userStats.draws,
    losses: userStats.losses,
    goalsFor: userStats.goalsFor,
    goalsAgainst: userStats.goalsAgainst,
    goalDifference: userStats.goalsFor - userStats.goalsAgainst,
    points: userStats.points
  };

  const otherRows: LeagueTableRow[] = PL_CLUBS.map((club) => {
    const userMatchesVs = mirror.get(club.name) ?? { wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 };
    const remainingGames = 38 - 2;

    const expectedPoints = -85 + club.rating * 2.0;
    const jitter = (rng() - 0.5) * 10;
    const targetSeasonPoints = Math.round(Math.max(22, Math.min(96, expectedPoints + jitter)));

    const pointsFromUser = userMatchesVs.wins * 3 + userMatchesVs.draws;
    let remainingPoints = targetSeasonPoints - pointsFromUser;
    if (remainingPoints < 0) remainingPoints = 0;
    if (remainingPoints > remainingGames * 3) remainingPoints = remainingGames * 3;

    const drawRate = 0.22 + (rng() - 0.5) * 0.1;
    let drawsRem = Math.max(0, Math.min(remainingGames, Math.round(remainingGames * drawRate)));
    let winsRem = Math.round((remainingPoints - drawsRem) / 3);
    if (winsRem < 0) winsRem = 0;
    if (winsRem > remainingGames) winsRem = remainingGames;
    if (winsRem + drawsRem > remainingGames) drawsRem = remainingGames - winsRem;
    let lossesRem = remainingGames - winsRem - drawsRem;
    if (lossesRem < 0) {
      lossesRem = 0;
      drawsRem = remainingGames - winsRem;
    }

    const wins = winsRem + userMatchesVs.wins;
    const draws = drawsRem + userMatchesVs.draws;
    const losses = lossesRem + userMatchesVs.losses;
    const points = wins * 3 + draws;

    const ratingOffset = club.rating - 65;
    const targetSeasonGf = Math.max(22, Math.round(42 + ratingOffset * 0.55 + (rng() - 0.5) * 10));
    const targetSeasonGa = Math.max(18, Math.round(58 - ratingOffset * 0.45 + (rng() - 0.5) * 10));

    const goalsFor = Math.max(userMatchesVs.goalsFor, targetSeasonGf);
    const goalsAgainst = Math.max(userMatchesVs.goalsAgainst, targetSeasonGa);

    return {
      club: club.name,
      isUser: false,
      played: 38,
      wins,
      draws,
      losses,
      goalsFor,
      goalsAgainst,
      goalDifference: goalsFor - goalsAgainst,
      points
    };
  });

  const allRows = [...otherRows, userRow];
  allRows.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.club.localeCompare(b.club);
  });

  return { table: allRows, userRow };
}

export function findUserPosition(table: LeagueTableRow[]): number {
  return table.findIndex((row) => row.isUser) + 1;
}
