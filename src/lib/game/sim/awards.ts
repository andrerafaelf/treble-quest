import { USER_CLUB_NAME } from '$lib/game/sim/clubRatings';
import type { PlayerSeasonStats, SeasonAwards } from '$lib/game/types';

export function deriveAwards(playerStats: PlayerSeasonStats[]): SeasonAwards {
  const sortedByGoals = [...playerStats].sort((a, b) => b.goals - a.goals || b.assists - a.assists);
  const sortedByAssists = [...playerStats].sort((a, b) => b.assists - a.assists || b.goals - a.goals);
  const goalkeepers = playerStats.filter((p) => p.positionShort === 'GK');
  const sortedByCS = goalkeepers.sort((a, b) => b.cleanSheets - a.cleanSheets);

  const composite = (p: PlayerSeasonStats) =>
    p.goals * 4 + p.assists * 3 + p.cleanSheets * 1.5 + p.overall * 0.3;
  const sortedByComposite = [...playerStats].sort((a, b) => composite(b) - composite(a));

  const boot = sortedByGoals[0];
  const playmaker = sortedByAssists[0];
  const glove = sortedByCS[0];
  const pots = sortedByComposite[0];

  return {
    goldenBoot: boot
      ? { name: boot.name, club: USER_CLUB_NAME, goals: boot.goals, fromUser: true }
      : { name: '—', club: USER_CLUB_NAME, goals: 0, fromUser: true },
    goldenGlove: glove
      ? { name: glove.name, club: USER_CLUB_NAME, cleanSheets: glove.cleanSheets, fromUser: true }
      : { name: '—', club: USER_CLUB_NAME, cleanSheets: 0, fromUser: true },
    playmaker: playmaker
      ? { name: playmaker.name, club: USER_CLUB_NAME, assists: playmaker.assists, fromUser: true }
      : { name: '—', club: USER_CLUB_NAME, assists: 0, fromUser: true },
    playerOfSeason: pots
      ? { name: pots.name, club: USER_CLUB_NAME, rating: Math.round(composite(pots)), fromUser: true }
      : { name: '—', club: USER_CLUB_NAME, rating: 0, fromUser: true }
  };
}
