import {
  CL_GROUP_OPPONENTS,
  FA_CUP_OPPONENTS,
  PL_CLUBS
} from '$lib/game/sim/clubRatings';
import type { Competition, Venue } from '$lib/game/types';

export type ScheduledFixture = {
  matchday: number;
  date: string;
  competition: Competition;
  round?: string;
  opponent: string;
  opponentRating: number;
  venue: Venue;
  legOf?: 'home' | 'away';
};

const SEASON_DATES: { matchday: number; label: string }[] = [
  { matchday: 1, label: 'Aug 17' },
  { matchday: 2, label: 'Aug 24' },
  { matchday: 3, label: 'Aug 31' },
  { matchday: 4, label: 'Sep 14' },
  { matchday: 5, label: 'Sep 18' },
  { matchday: 6, label: 'Sep 21' },
  { matchday: 7, label: 'Sep 28' },
  { matchday: 8, label: 'Oct 2' },
  { matchday: 9, label: 'Oct 5' },
  { matchday: 10, label: 'Oct 19' },
  { matchday: 11, label: 'Oct 23' },
  { matchday: 12, label: 'Oct 26' },
  { matchday: 13, label: 'Nov 2' },
  { matchday: 14, label: 'Nov 6' },
  { matchday: 15, label: 'Nov 9' },
  { matchday: 16, label: 'Nov 23' },
  { matchday: 17, label: 'Nov 27' },
  { matchday: 18, label: 'Dec 3' },
  { matchday: 19, label: 'Dec 7' },
  { matchday: 20, label: 'Dec 10' },
  { matchday: 21, label: 'Dec 14' },
  { matchday: 22, label: 'Dec 21' },
  { matchday: 23, label: 'Dec 26' },
  { matchday: 24, label: 'Dec 29' },
  { matchday: 25, label: 'Jan 4' },
  { matchday: 26, label: 'Jan 11' },
  { matchday: 27, label: 'Jan 14' },
  { matchday: 28, label: 'Jan 18' },
  { matchday: 29, label: 'Jan 25' },
  { matchday: 30, label: 'Feb 1' },
  { matchday: 31, label: 'Feb 8' },
  { matchday: 32, label: 'Feb 15' },
  { matchday: 33, label: 'Feb 18' },
  { matchday: 34, label: 'Feb 22' },
  { matchday: 35, label: 'Feb 25' },
  { matchday: 36, label: 'Mar 1' },
  { matchday: 37, label: 'Mar 8' },
  { matchday: 38, label: 'Mar 11' },
  { matchday: 39, label: 'Mar 15' },
  { matchday: 40, label: 'Apr 1' },
  { matchday: 41, label: 'Apr 5' },
  { matchday: 42, label: 'Apr 9' },
  { matchday: 43, label: 'Apr 12' },
  { matchday: 44, label: 'Apr 16' },
  { matchday: 45, label: 'Apr 19' },
  { matchday: 46, label: 'Apr 23' },
  { matchday: 47, label: 'Apr 26' },
  { matchday: 48, label: 'May 3' },
  { matchday: 49, label: 'May 7' },
  { matchday: 50, label: 'May 10' },
  { matchday: 51, label: 'May 14' },
  { matchday: 52, label: 'May 17' },
  { matchday: 53, label: 'May 24' },
  { matchday: 54, label: 'May 28' },
  { matchday: 55, label: 'Jun 1' }
];

function dateFor(matchday: number): string {
  return SEASON_DATES.find((d) => d.matchday === matchday)?.label ?? `MD ${matchday}`;
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickFromPool<T>(pool: T[], rng: () => number): T {
  return pool[Math.floor(rng() * pool.length)];
}

const PL_MATCHDAYS: number[] = [
  1, 2, 3, 4, 7, 8, 10, 11, 13, 14, 16, 17, 18, 19, 20, 21, 22, 23, 24,
  26, 27, 29, 30, 31, 32, 34, 35, 37, 38, 42, 43, 44, 46, 47, 49, 50, 51, 53
];

const CL_GROUP_MATCHDAYS = [5, 9, 12, 15, 25, 28, 33, 36];
const FAC_MATCHDAYS = [33, 36, 40, 45, 48, 54];
const CL_KO_MATCHDAYS: Record<string, [number, number]> = {
  'Round of 16': [41, 52],
  'Quarter-final': [55, 55],
  'Semi-final': [55, 55],
  'Final': [55, 55]
};

const CL_KO_SINGLE_MATCHDAYS: Record<string, number> = {
  'Round of 16': 41,
  'Quarter-final': 48,
  'Semi-final': 52,
  'Final': 55
};

export function buildPremierLeagueFixtures(rng: () => number): ScheduledFixture[] {
  const opponents = PL_CLUBS;
  const order = shuffle(opponents, rng);
  const fixtures: ScheduledFixture[] = [];
  for (let i = 0; i < 19; i += 1) {
    const matchday = PL_MATCHDAYS[i];
    const venue: Venue = i % 2 === 0 ? 'H' : 'A';
    fixtures.push({
      matchday,
      date: dateFor(matchday),
      competition: 'PL',
      opponent: order[i].name,
      opponentRating: order[i].rating,
      venue
    });
  }
  for (let i = 0; i < 19; i += 1) {
    const matchday = PL_MATCHDAYS[19 + i];
    const venue: Venue = i % 2 === 0 ? 'A' : 'H';
    fixtures.push({
      matchday,
      date: dateFor(matchday),
      competition: 'PL',
      opponent: order[i].name,
      opponentRating: order[i].rating,
      venue
    });
  }
  return fixtures;
}

export function buildChampionsLeagueGroupFixtures(rng: () => number): {
  fixtures: ScheduledFixture[];
  groupOpponents: { name: string; rating: number }[];
} {
  const groupOpponents = shuffle(CL_GROUP_OPPONENTS, rng).slice(0, 8);
  const fixtures = groupOpponents.map((opponent, index) => {
    const matchday = CL_GROUP_MATCHDAYS[index];
    return {
      matchday,
      date: dateFor(matchday),
      competition: 'CL' as const,
      round: 'League phase',
      opponent: opponent.name,
      opponentRating: opponent.rating,
      venue: index % 2 === 0 ? 'H' as const : 'A' as const
    };
  });
  return { fixtures, groupOpponents };
}

export function buildFaCupRound(roundIndex: number, rng: () => number): ScheduledFixture | undefined {
  if (roundIndex >= FA_CUP_OPPONENTS.length || roundIndex >= FAC_MATCHDAYS.length) return undefined;
  const round = FA_CUP_OPPONENTS[roundIndex];
  const opponent = pickFromPool(round.pool, rng);
  const matchday = FAC_MATCHDAYS[roundIndex];
  const venue: Venue = round.round === 'Semi-final' || round.round === 'Final' ? 'N' : roundIndex % 2 === 0 ? 'H' : 'A';
  return {
    matchday,
    date: dateFor(matchday),
    competition: 'FAC',
    round: round.round,
    opponent: opponent.name,
    opponentRating: opponent.rating,
    venue
  };
}

export function buildChampionsLeagueKnockoutTie(
  round: 'Round of 16' | 'Quarter-final' | 'Semi-final' | 'Final',
  opponent: { name: string; rating: number },
  rng: () => number
): ScheduledFixture[] {
  if (round === 'Final') {
    const matchday = CL_KO_SINGLE_MATCHDAYS[round];
    return [
      {
        matchday,
        date: dateFor(matchday),
        competition: 'CL',
        round,
        opponent: opponent.name,
        opponentRating: opponent.rating,
        venue: 'N'
      }
    ];
  }
  const baseMatchday = CL_KO_SINGLE_MATCHDAYS[round];
  const firstLeg = baseMatchday - 4;
  const secondLeg = baseMatchday;
  const homeFirst = rng() < 0.5;
  return [
    {
      matchday: firstLeg,
      date: dateFor(firstLeg),
      competition: 'CL',
      round,
      opponent: opponent.name,
      opponentRating: opponent.rating,
      venue: homeFirst ? 'H' : 'A',
      legOf: 'home'
    },
    {
      matchday: secondLeg,
      date: dateFor(secondLeg),
      competition: 'CL',
      round,
      opponent: opponent.name,
      opponentRating: opponent.rating,
      venue: homeFirst ? 'A' : 'H',
      legOf: 'away'
    }
  ];
}

export function sortFixtures(fixtures: ScheduledFixture[]): ScheduledFixture[] {
  return [...fixtures].sort((a, b) => {
    if (a.matchday !== b.matchday) return a.matchday - b.matchday;
    const compOrder: Record<Competition, number> = { WC: 0, CL: 1, FAC: 2, PL: 3 };
    return compOrder[a.competition] - compOrder[b.competition];
  });
}
