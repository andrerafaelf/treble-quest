import { PL_CLUBS } from '$lib/game/sim/clubRatings';
import type { LeagueTableRow, Match, PlayerSeasonStats, StatHighlights, TeamRatings } from '$lib/game/types';

export function deriveHighlights(
  matches: Match[],
  plMatches: Match[],
  ratings: TeamRatings,
  table: LeagueTableRow[],
  playerStats: PlayerSeasonStats[]
): StatHighlights {
  let biggestMargin = -Infinity;
  let biggestWin: StatHighlights['biggestWin'];
  let cleanSheets = 0;
  let longestStreak = 0;
  let currentStreak = 0;

  for (const m of matches) {
    const margin = m.gf - m.ga;
    if (m.result === 'W' && margin > biggestMargin) {
      biggestMargin = margin;
      biggestWin = { opponent: m.opponent, gf: m.gf, ga: m.ga, competition: m.competition };
    }
    if (m.cleanSheet) cleanSheets += 1;
    if (m.result === 'W') {
      currentStreak += 1;
      if (currentStreak > longestStreak) longestStreak = currentStreak;
    } else {
      currentStreak = 0;
    }
  }

  const squadStrength = computeSquadStrength(ratings, playerStats);
  const expectedPoints = Math.round(-85 + squadStrength * 2.0);
  const actualFinish = table.findIndex((row) => row.isUser) + 1;
  const expectedFinish = expectedFinishFromPower(squadStrength);

  const actualPts = plMatches.reduce((sum, m) => sum + (m.result === 'W' ? 3 : m.result === 'D' ? 1 : 0), 0);
  const delta = actualPts - expectedPoints;

  let narrativeHeadline = 'A SOLID CAMPAIGN';
  let narrativeBody = `Finished ${ordinal(actualFinish)} with ${actualPts} points. Projected ${ordinal(expectedFinish)} — right on the mark.`;

  if (actualFinish === 1) {
    narrativeHeadline = 'CHAMPIONS OF ENGLAND';
    narrativeBody = `Top of the pile with ${actualPts} points. Projected to finish ${ordinal(expectedFinish)} — they delivered the title.`;
  } else if (delta >= 10) {
    narrativeHeadline = 'NOBODY SAW THAT COMING';
    narrativeBody = `${actualPts} points, ${ordinal(actualFinish)} place. Projected to finish ${ordinal(expectedFinish)}. They proved everyone wrong.`;
  } else if (delta <= -10) {
    narrativeHeadline = 'A SEASON TO FORGET';
    narrativeBody = `${actualPts} points and ${ordinal(actualFinish)}. Projected for ${ordinal(expectedFinish)} — never clicked.`;
  } else if (actualFinish <= 4) {
    narrativeHeadline = 'TOP FOUR';
    narrativeBody = `${actualPts} points, ${ordinal(actualFinish)} place. Champions League football secured.`;
  } else if (actualFinish >= 18) {
    narrativeHeadline = 'RELEGATED';
    narrativeBody = `Only ${actualPts} points. ${ordinal(actualFinish)} place and the drop. Brutal year.`;
  }

  return {
    biggestWin,
    longestWinStreak: longestStreak,
    cleanSheets,
    narrativeHeadline,
    narrativeBody,
    expectedFinish,
    actualFinish
  };
}

function computeSquadStrength(ratings: TeamRatings, playerStats: PlayerSeasonStats[]): number {
  const overallAvg = playerStats.length
    ? playerStats.reduce((sum, p) => sum + p.overall, 0) / playerStats.length
    : 65;
  const chemistryBonus = (ratings.chemistry - 50) * 0.06;
  const managerBonus = ratings.managerBoost * 0.18;
  const fitBonus = (ratings.fit - 50) * 0.04;
  return overallAvg + chemistryBonus + managerBonus + fitBonus;
}

function expectedFinishFromPower(power: number): number {
  const ratings = PL_CLUBS.map((c) => c.rating);
  const stronger = ratings.filter((r) => r > power).length;
  return stronger + 1;
}

function ordinal(value: number): string {
  if (value <= 0) return '—';
  const tens = value % 100;
  if (tens >= 11 && tens <= 13) return `${value}th`;
  const ones = value % 10;
  const suffix = ones === 1 ? 'st' : ones === 2 ? 'nd' : ones === 3 ? 'rd' : 'th';
  return `${value}${suffix}`;
}
