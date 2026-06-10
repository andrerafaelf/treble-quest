import { PL_CLUBS, USER_CLUB_NAME } from '$lib/game/sim/clubRatings';
import type { LeagueTableRow, Match } from '$lib/game/types';

const DEFAULT_CLUB_NAME = USER_CLUB_NAME;

type Club = { name: string; rating: number; isUser: boolean };

type ClubAcc = {
  club: string;
  rating: number;
  isUser: boolean;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
};

// Lightweight Poisson sampler for AI-vs-AI scorelines, mirroring the match engine's
// distribution so the whole table is generated on one consistent scale.
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

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// Expected goals for `home` against `away`, before noise. Rating gap drives the
// scoreline, home side gets an attacking edge. Tuned so a top side (88) hosting a
// bottom side (58) projects ~2.6 xG and a coin-flip projects ~1.4 xG each.
function expectedGoals(attackRating: number, defenceRating: number, homeBonus: number): number {
  const gap = (attackRating - defenceRating) / 10;
  return clamp(1.35 + gap * 0.55 + homeBonus, 0.2, 4.2);
}

function simulateAiMatch(
  home: Club,
  away: Club,
  rng: () => number
): { homeGoals: number; awayGoals: number } {
  const lambdaHome = expectedGoals(home.rating, away.rating, 0.35) + (rng() - 0.5) * 0.5;
  const lambdaAway = expectedGoals(away.rating, home.rating, -0.2) + (rng() - 0.5) * 0.5;
  return {
    homeGoals: poissonSample(clamp(lambdaHome, 0.2, 4.4), rng),
    awayGoals: poissonSample(clamp(lambdaAway, 0.15, 4.2), rng)
  };
}

function applyResult(home: ClubAcc, away: ClubAcc, homeGoals: number, awayGoals: number): void {
  home.goalsFor += homeGoals;
  home.goalsAgainst += awayGoals;
  away.goalsFor += awayGoals;
  away.goalsAgainst += homeGoals;

  if (homeGoals > awayGoals) {
    home.wins += 1;
    away.losses += 1;
  } else if (homeGoals < awayGoals) {
    away.wins += 1;
    home.losses += 1;
  } else {
    home.draws += 1;
    away.draws += 1;
  }
}

/**
 * Build the full Premier League table from a real 20-team double round-robin.
 *
 * The user's 38 matches are already simulated and passed in via `plMatches`; those
 * exact results are slotted into the fixture matrix (and mirrored onto each opponent).
 * Every other club-vs-club fixture is simulated here with the same scoreline model,
 * so goal difference falls out of actual goals and the whole table is internally
 * consistent — no more decoupled GD or "frozen" AI clubs.
 */
export function buildPlTable(
  plMatches: Match[],
  rng: () => number,
  teamName?: string
): { table: LeagueTableRow[]; userRow: LeagueTableRow } {
  const clubName = teamName?.trim() || DEFAULT_CLUB_NAME;

  const clubs: Club[] = [
    { name: clubName, rating: 0, isUser: true },
    ...PL_CLUBS.map((c) => ({ name: c.name, rating: c.rating, isUser: false }))
  ];

  const accs = new Map<string, ClubAcc>();
  for (const club of clubs) {
    accs.set(club.name, {
      club: club.name,
      rating: club.rating,
      isUser: club.isUser,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0
    });
  }

  // Index the user's real results by opponent + venue so we can place them exactly.
  // Each opponent is played twice (home and away); key on both.
  const userResults = new Map<string, Match>();
  for (const m of plMatches) {
    userResults.set(`${m.opponent}|${m.venue}`, m);
  }

  // Play every ordered (home, away) pair exactly once, 20 teams -> 380 fixtures.
  for (const home of clubs) {
    for (const away of clubs) {
      if (home.name === away.name) continue;

      const homeAcc = accs.get(home.name)!;
      const awayAcc = accs.get(away.name)!;

      if (home.isUser) {
        // User at home vs this opponent — use their real result.
        const real = userResults.get(`${away.name}|H`);
        if (real) {
          applyResult(homeAcc, awayAcc, real.gf, real.ga);
          continue;
        }
      }
      if (away.isUser) {
        // User away at this opponent — the home club's goals are the user's `ga`,
        // and the user's (away) goals are their `gf`.
        const real = userResults.get(`${home.name}|A`);
        if (real) {
          applyResult(homeAcc, awayAcc, real.ga, real.gf);
          continue;
        }
      }
      if (home.isUser || away.isUser) {
        // User fixture with no matching real result (shouldn't happen for a full
        // 38-game season) — skip rather than invent data.
        continue;
      }

      // AI vs AI — simulate for real so GD falls out of actual goals.
      const { homeGoals, awayGoals } = simulateAiMatch(home, away, rng);
      applyResult(homeAcc, awayAcc, homeGoals, awayGoals);
    }
  }

  const rows: LeagueTableRow[] = Array.from(accs.values()).map((acc) => ({
    club: acc.club,
    isUser: acc.isUser,
    played: acc.wins + acc.draws + acc.losses,
    wins: acc.wins,
    draws: acc.draws,
    losses: acc.losses,
    goalsFor: acc.goalsFor,
    goalsAgainst: acc.goalsAgainst,
    goalDifference: acc.goalsFor - acc.goalsAgainst,
    points: acc.wins * 3 + acc.draws
  }));

  rows.sort(sortRows);

  const userRow = rows.find((r) => r.isUser)!;
  return { table: rows, userRow };
}

function sortRows(a: LeagueTableRow, b: LeagueTableRow): number {
  if (b.points !== a.points) return b.points - a.points;
  if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
  if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
  return a.club.localeCompare(b.club);
}

export function findUserPosition(table: LeagueTableRow[]): number {
  return table.findIndex((row) => row.isUser) + 1;
}
