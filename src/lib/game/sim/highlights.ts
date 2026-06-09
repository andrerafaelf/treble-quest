import { PL_CLUBS } from '$lib/game/sim/clubRatings';
import type { LeagueTableRow, Match, PlayerSeasonStats, StatHighlights, TeamRatings } from '$lib/game/types';

export function deriveHighlights(
  matches: Match[],
  plMatches: Match[],
  ratings: TeamRatings,
  table: LeagueTableRow[],
  playerStats: PlayerSeasonStats[],
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
  const leagueWins = plMatches.filter((m) => m.result === 'W').length;
  const leagueDraws = plMatches.filter((m) => m.result === 'D').length;
  const leagueLosses = plMatches.filter((m) => m.result === 'L').length;
  const perfectLeague = leagueWins === 38 && leagueDraws === 0 && leagueLosses === 0;
  const delta = actualPts - expectedPoints;

  const clMatches = matches.filter((m) => m.competition === 'CL');
  const clWon = clMatches.length > 0 && matches.some((m) => m.competition === 'CL' && m.round === 'Final' && m.result === 'W');
  const clWins = clMatches.filter((m) => m.result === 'W').length;
  const clDraws = clMatches.filter((m) => m.result === 'D').length;
  const perfectCl = clWon && clWins === 15 && clDraws === 0;

  let narrativeHeadline = 'A SOLID CAMPAIGN';
  let narrativeBody = '';

  if (actualFinish === 1) {
    if (perfectLeague && perfectCl) {
      narrativeHeadline = 'PERFECT SEASON';
      narrativeBody = `38-0 in the league. 15-0 in Europe. Maximum pressure, maximum output. The legend is complete.`;
    } else if (perfectLeague) {
      narrativeHeadline = 'PERFECT 38-0';
      narrativeBody = `Maximum pressure, maximum output: 38 wins from 38. ${actualPts} points and a flawless title run. Now go do the same in Europe — 15-0 is waiting.`;
    } else {
      const matchesOffPerfect = 38 - leagueWins;
      narrativeHeadline = 'CHAMPIONS OF ENGLAND';
      narrativeBody = `Title delivered with ${actualPts} points. Next target: 38-0. Flip ${leagueDraws} draw${leagueDraws === 1 ? '' : 's'} and ${leagueLosses} loss${leagueLosses === 1 ? '' : 'es'} into wins — ${matchesOffPerfect} results stand between you and perfection.`;
    }
  } else if (delta >= 10) {
    narrativeHeadline = 'NOBODY SAW THAT COMING';
    narrativeBody = `${actualPts} points, ${ordinal(actualFinish)} place. Projected ${ordinal(expectedFinish)}. Now prove it wasn't a fluke — go win the title.`;
  } else if (delta <= -10) {
    narrativeHeadline = 'A SEASON TO FORGET';
    narrativeBody = `${actualPts} points and ${ordinal(actualFinish)}. Projected for ${ordinal(expectedFinish)} — never clicked. Build a stronger XI and come back harder.`;
  } else if (actualFinish === 2) {
    const gap = expectedPoints - actualPts;
    narrativeHeadline = 'SO CLOSE';
    narrativeBody = `${actualPts} points, runners-up. ${gap > 0 ? `${gap} more points` : 'A single result'} and this is a title. Swap out the weak link and go again.`;
  } else if (actualFinish <= 4) {
    narrativeHeadline = 'TOP FOUR';
    narrativeBody = `${actualPts} points, ${ordinal(actualFinish)} place. Champions League secured — but the title is right there. Push for it.`;
  } else if (actualFinish >= 18) {
    narrativeHeadline = 'RELEGATED';
    narrativeBody = `Only ${actualPts} points. ${ordinal(actualFinish)} place and the drop. Brutal. Rebuild your XI and get back up.`;
  } else {
    narrativeBody = `${actualPts} points, ${ordinal(actualFinish)} place. Projected ${ordinal(expectedFinish)}. Top four is the next milestone — strengthen the squad and push.`;
  }

  return {
    biggestWin,
    longestWinStreak: longestStreak,
    cleanSheets,
    narrativeHeadline,
    narrativeBody,
    expectedFinish,
    actualFinish,
  };
}

function computeSquadStrength(ratings: TeamRatings, playerStats: PlayerSeasonStats[]): number {
  const overallAvg = playerStats.length ? playerStats.reduce((sum, p) => sum + p.overall, 0) / playerStats.length : 65;
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
