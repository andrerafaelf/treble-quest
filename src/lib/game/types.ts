export type Position = 'GK' | 'RB' | 'CB' | 'LB' | 'CM' | 'RW' | 'ST' | 'LW' | 'RM' | 'LM' | 'DEF' | 'MID' | 'FWD' | 'ANY';

export type PlayerSeason = {
  id: string;
  name: string;
  club: string;
  season: string;
  nationality: string;
  positions: Position[];
  role: string;
  overall: number;
  attack: number;
  control: number;
  defence: number;
  clutch: number;
  consistency: number;
  chaos: number;
  rarity: 'solid' | 'elite' | 'legend';
};

export type Manager = {
  id: string;
  name: string;
  clubHint?: string;
  style: 'balanced' | 'attacking' | 'defensive' | 'pressing' | 'counter';
  temperament: 'calm' | 'intense' | 'pragmatic' | 'romantic';
  boost: number;
  cupBoost: number;
  leagueBoost: number;
};

export type GameMode = 'quick' | 'classic' | 'world-cup';

export type ClassicFormation = '4-3-3' | '4-4-2' | '4-2-3-1' | '3-4-3';

export type DraftSlotId =
  | 'manager'
  | 'goalkeeper'
  | 'defender'
  | 'second-defender'
  | 'midfielder'
  | 'second-midfielder'
  | 'forward'
  | 'second-forward'
  | 'right-back'
  | 'centre-back-1'
  | 'centre-back-2'
  | 'centre-back-3'
  | 'left-back'
  | 'central-midfielder-1'
  | 'central-midfielder-2'
  | 'central-midfielder-3'
  | 'attacking-midfielder'
  | 'right-wing-back'
  | 'left-wing-back'
  | 'right-wing'
  | 'striker'
  | 'left-wing'
  | 'super-sub';

export type DraftSlot = {
  id: DraftSlotId;
  label: string;
  short: string;
  required: Position;
};

export type PlayerPick = {
  type: 'player';
  slot: DraftSlot;
  player: PlayerSeason;
};

export type ManagerPick = {
  type: 'manager';
  slot: DraftSlot;
  manager: Manager;
};

export type DraftPick = PlayerPick | ManagerPick;

export type DraftPrompt =
  | {
      type: 'manager';
      seed: number;
      options: Manager[];
    }
  | {
      type: 'player';
      seed: number;
      club: string;
      season: string;
      slot: DraftSlot;
      options: PlayerSeason[];
    };

export type RunState = {
  id: string;
  seed: number;
  mode: GameMode;
  formation?: ClassicFormation;
  hideRatings?: boolean;
  startedAt: number;
  currentPick: number;
  picks: DraftPick[];
  lastPrompt?: DraftPrompt;
  result?: SimulationResult;
};

export type TeamRatings = {
  attack: number;
  control: number;
  defence: number;
  clutch: number;
  consistency: number;
  chemistry: number;
  managerBoost: number;
  fit: number;
};

export type LeagueResult = {
  points: number;
  position: number;
  label: string;
  won: boolean;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
};

export type CupResult = {
  competition: 'FA Cup';
  exitRound: string;
  roundsWon: number;
  won: boolean;
  opponent?: string;
};

export type ChampionsLeagueResult = {
  group: string;
  exitRound: string;
  roundsWon: number;
  won: boolean;
  opponent?: string;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
};

export type WorldCupResult = {
  group: string;
  exitRound: string;
  roundsWon: number;
  won: boolean;
  opponent?: string;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
};

export type Competition = 'PL' | 'FAC' | 'CL' | 'WC';
export type Venue = 'H' | 'A' | 'N';
export type MatchResultLetter = 'W' | 'D' | 'L';

export type MatchScorer = {
  playerId: string;
  name: string;
  minute: number;
};

export type Match = {
  matchday: number;
  date: string;
  competition: Competition;
  round?: string;
  opponent: string;
  opponentRating: number;
  venue: Venue;
  gf: number;
  ga: number;
  result: MatchResultLetter;
  scorers: MatchScorer[];
  assisters: { playerId: string; name: string }[];
  cleanSheet: boolean;
  aggregate?: { gf: number; ga: number };
};

export type PlayerSeasonStats = {
  playerId: string;
  name: string;
  positionShort: string;
  club: string;
  season: string;
  overall: number;
  apps: number;
  goals: number;
  assists: number;
  cleanSheets: number;
};

export type LeagueTableRow = {
  club: string;
  isUser: boolean;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};

export type SeasonAwards = {
  goldenBoot: { name: string; club: string; goals: number; fromUser: boolean };
  goldenGlove: { name: string; club: string; cleanSheets: number; fromUser: boolean };
  playmaker: { name: string; club: string; assists: number; fromUser: boolean };
  playerOfSeason: { name: string; club: string; rating: number; fromUser: boolean };
};

export type StatHighlights = {
  biggestWin?: { opponent: string; gf: number; ga: number; competition: Competition };
  longestWinStreak: number;
  cleanSheets: number;
  narrativeHeadline: string;
  narrativeBody: string;
  expectedFinish: number;
  actualFinish: number;
};

export type SimulationResult = {
  seed: number;
  mode: GameMode;
  score: number;
  trophies: number;
  ratings: TeamRatings;
  league: LeagueResult;
  faCup: CupResult;
  championsLeague: ChampionsLeagueResult;
  worldCup?: WorldCupResult;
  bestPick: PlayerPick | ManagerPick;
  weakLink: PlayerPick | ManagerPick;
  managerImpact: string;
  shareText: string;
  matches: Match[];
  playerStats: PlayerSeasonStats[];
  leagueTable: LeagueTableRow[];
  awards: SeasonAwards;
  highlights: StatHighlights;
};
