import { USER_CLUB_NAME } from '$lib/game/sim/clubRatings';
import type { PlayerSeasonStats, SeasonAwards } from '$lib/game/types';

export function deriveAwards(playerStats: PlayerSeasonStats[], teamName?: string): SeasonAwards {
  const clubName = teamName?.trim() || USER_CLUB_NAME;
  const sortedByGoals = [...playerStats].sort((a, b) => b.goals - a.goals || b.assists - a.assists);
  const sortedByAssists = [...playerStats].sort((a, b) => b.assists - a.assists || b.goals - a.goals);
  const goalkeepers = playerStats.filter((p) => p.positionShort === 'GK');
  const sortedByCS = goalkeepers.sort((a, b) => b.cleanSheets - a.cleanSheets);

  const composite = (p: PlayerSeasonStats) => p.goals * 4 + p.assists * 3 + p.cleanSheets * 1.5 + p.overall * 0.3;
  const sortedByComposite = [...playerStats].sort((a, b) => composite(b) - composite(a));

  const boot = sortedByGoals[0];
  const playmaker = sortedByAssists[0];
  const glove = sortedByCS[0];
  const pots = sortedByComposite[0];

  return {
    goldenBoot: boot
      ? { name: boot.name, nationality: boot.nationality, club: clubName, goals: boot.goals, fromUser: true }
      : { name: '-', nationality: '', club: clubName, goals: 0, fromUser: true },
    goldenGlove: glove
      ? {
          name: glove.name,
          nationality: glove.nationality,
          club: clubName,
          cleanSheets: glove.cleanSheets,
          fromUser: true,
        }
      : { name: '-', nationality: '', club: clubName, cleanSheets: 0, fromUser: true },
    playmaker: playmaker
      ? {
          name: playmaker.name,
          nationality: playmaker.nationality,
          club: clubName,
          assists: playmaker.assists,
          fromUser: true,
        }
      : { name: '-', nationality: '', club: clubName, assists: 0, fromUser: true },
    playerOfSeason: pots
      ? {
          name: pots.name,
          nationality: pots.nationality,
          club: clubName,
          rating: Math.round(composite(pots)),
          fromUser: true,
        }
      : { name: '-', nationality: '', club: clubName, rating: 0, fromUser: true },
  };
}
