export const PL_CLUBS: { name: string; rating: number }[] = [
  { name: 'Manchester City', rating: 88 },
  { name: 'Arsenal', rating: 86 },
  { name: 'Liverpool', rating: 86 },
  { name: 'Chelsea', rating: 82 },
  { name: 'Manchester United', rating: 81 },
  { name: 'Tottenham', rating: 80 },
  { name: 'Newcastle', rating: 78 },
  { name: 'Aston Villa', rating: 76 },
  { name: 'Brighton', rating: 74 },
  { name: 'West Ham', rating: 72 },
  { name: 'Brentford', rating: 70 },
  { name: 'Crystal Palace', rating: 68 },
  { name: 'Fulham', rating: 66 },
  { name: 'Everton', rating: 65 },
  { name: 'Wolves', rating: 64 },
  { name: 'Bournemouth', rating: 63 },
  { name: 'Nottingham Forest', rating: 62 },
  { name: 'Leicester City', rating: 61 },
  { name: 'Southampton', rating: 58 }
];

export const FA_CUP_OPPONENTS: { round: string; pool: { name: string; rating: number }[] }[] = [
  {
    round: 'Third Round',
    pool: [
      { name: 'Blyth Spartans', rating: 38 },
      { name: 'Wrexham', rating: 46 },
      { name: 'Stockport County', rating: 44 },
      { name: 'Plymouth Argyle', rating: 50 },
      { name: 'Luton Town', rating: 56 },
      { name: 'Coventry City', rating: 54 }
    ]
  },
  {
    round: 'Fourth Round',
    pool: [
      { name: 'Bristol City', rating: 56 },
      { name: 'Swansea City', rating: 55 },
      { name: 'Middlesbrough', rating: 58 },
      { name: 'Preston North End', rating: 53 },
      { name: 'QPR', rating: 54 },
      { name: 'Millwall', rating: 55 }
    ]
  },
  {
    round: 'Fifth Round',
    pool: [
      { name: 'Sheffield Wednesday', rating: 58 },
      { name: 'Hull City', rating: 57 },
      { name: 'Derby County', rating: 56 },
      { name: 'Blackburn Rovers', rating: 58 },
      { name: 'Cardiff City', rating: 56 },
      { name: 'Stoke City', rating: 58 }
    ]
  },
  {
    round: 'Quarter-final',
    pool: [
      { name: 'Wolves', rating: 64 },
      { name: 'West Brom', rating: 60 },
      { name: 'Leicester City', rating: 61 },
      { name: 'Nottingham Forest', rating: 62 },
      { name: 'Southampton', rating: 58 },
      { name: 'Leeds United', rating: 63 }
    ]
  },
  {
    round: 'Semi-final',
    pool: [
      { name: 'Everton', rating: 65 },
      { name: 'West Ham', rating: 72 },
      { name: 'Tottenham', rating: 80 },
      { name: 'Aston Villa', rating: 76 },
      { name: 'Newcastle', rating: 78 },
      { name: 'Brighton', rating: 74 }
    ]
  },
  {
    round: 'Final',
    pool: [
      { name: 'Arsenal', rating: 86 },
      { name: 'Liverpool', rating: 86 },
      { name: 'Manchester City', rating: 88 },
      { name: 'Chelsea', rating: 82 },
      { name: 'Manchester United', rating: 81 },
      { name: 'Tottenham', rating: 80 }
    ]
  }
];

export const CL_GROUP_OPPONENTS: { name: string; rating: number }[] = [
  { name: 'Galatasaray', rating: 72 },
  { name: 'FC Copenhagen', rating: 68 },
  { name: 'Young Boys', rating: 65 },
  { name: 'Shakhtar Donetsk', rating: 73 },
  { name: 'Braga', rating: 70 },
  { name: 'Salzburg', rating: 73 },
  { name: 'Celtic', rating: 71 },
  { name: 'Benfica', rating: 79 }
];

export const CL_R16_OPPONENTS: { name: string; rating: number }[] = [
  { name: 'PSV', rating: 77 },
  { name: 'Porto', rating: 78 },
  { name: 'Napoli', rating: 81 },
  { name: 'Atletico Madrid', rating: 82 },
  { name: 'Sevilla', rating: 78 },
  { name: 'Lazio', rating: 77 },
  { name: 'Inter Milan', rating: 84 },
  { name: 'AC Milan', rating: 82 }
];

export const CL_QF_OPPONENTS: { name: string; rating: number }[] = [
  { name: 'Bayern Munich', rating: 87 },
  { name: 'Borussia Dortmund', rating: 82 },
  { name: 'Barcelona', rating: 86 },
  { name: 'Real Madrid', rating: 89 },
  { name: 'PSG', rating: 86 },
  { name: 'Manchester City', rating: 88 },
  { name: 'Arsenal', rating: 86 },
  { name: 'Liverpool', rating: 86 }
];

export const CL_SF_OPPONENTS: { name: string; rating: number }[] = [
  { name: 'Bayern Munich', rating: 87 },
  { name: 'Real Madrid', rating: 89 },
  { name: 'PSG', rating: 86 },
  { name: 'Manchester City', rating: 88 },
  { name: 'Barcelona', rating: 86 },
  { name: 'Inter Milan', rating: 84 }
];

export const CL_FINAL_OPPONENTS: { name: string; rating: number }[] = [
  { name: 'Real Madrid', rating: 89 },
  { name: 'Bayern Munich', rating: 87 },
  { name: 'PSG', rating: 86 },
  { name: 'Manchester City', rating: 88 },
  { name: 'Barcelona', rating: 86 },
  { name: 'Borussia Dortmund', rating: 82 }
];

export const USER_CLUB_NAME = 'Your XI';
