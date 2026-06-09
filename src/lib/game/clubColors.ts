// Primary (body) and secondary (collar/sleeve accent) colours per club/nation.
// Used only for the jersey pitch display. Fallback to generic kit if not found.

export type KitColors = { primary: string; secondary: string; text: string };

const KITS: Record<string, KitColors> = {
  // Premier League clubs
  Arsenal: { primary: '#ef0107', secondary: '#ffffff', text: '#ffffff' },
  'Aston Villa': { primary: '#95bfe5', secondary: '#670e36', text: '#670e36' },
  Blackburn: { primary: '#009ee0', secondary: '#ffffff', text: '#ffffff' },
  Bolton: { primary: '#ffffff', secondary: '#1c3f94', text: '#1c3f94' },
  Brentford: { primary: '#e30613', secondary: '#ffffff', text: '#ffffff' },
  Brighton: { primary: '#0057b8', secondary: '#ffffff', text: '#ffffff' },
  'Charlton Athletic': { primary: '#d71920', secondary: '#ffffff', text: '#ffffff' },
  Chelsea: { primary: '#034694', secondary: '#ffffff', text: '#ffffff' },
  'Birmingham City': { primary: '#0000ff', secondary: '#ffffff', text: '#ffffff' },
  'Crystal Palace': { primary: '#1b458f', secondary: '#c4122e', text: '#ffffff' },
  Everton: { primary: '#003399', secondary: '#ffffff', text: '#ffffff' },
  Fulham: { primary: '#ffffff', secondary: '#000000', text: '#000000' },
  Ipswich: { primary: '#0044a9', secondary: '#ffffff', text: '#ffffff' },
  Leeds: { primary: '#ffffff', secondary: '#1d428a', text: '#1d428a' },
  Leicester: { primary: '#003090', secondary: '#fdbe11', text: '#ffffff' },
  Liverpool: { primary: '#c8102e', secondary: '#f6eb61', text: '#ffffff' },
  'Manchester City': { primary: '#6caee0', secondary: '#ffffff', text: '#ffffff' },
  'Manchester United': { primary: '#da020e', secondary: '#ffe500', text: '#ffffff' },
  Middlesbrough: { primary: '#e00000', secondary: '#ffffff', text: '#ffffff' },
  Newcastle: { primary: '#241f20', secondary: '#ffffff', text: '#ffffff' },
  Portsmouth: { primary: '#001489', secondary: '#ffffff', text: '#ffffff' },
  Reading: { primary: '#004494', secondary: '#ffffff', text: '#ffffff' },
  Southampton: { primary: '#d71920', secondary: '#ffffff', text: '#ffffff' },
  Swansea: { primary: '#ffffff', secondary: '#000000', text: '#000000' },
  Tottenham: { primary: '#ffffff', secondary: '#132257', text: '#132257' },
  'West Ham': { primary: '#7a263a', secondary: '#1bb1e7', text: '#ffffff' },
  Wigan: { primary: '#1d59af', secondary: '#ffffff', text: '#ffffff' },
  Wolves: { primary: '#fdb913', secondary: '#000000', text: '#000000' },

  // Global mode clubs
  Porto: { primary: '#003087', secondary: '#ffffff', text: '#ffffff' },
  Nacional: { primary: '#000000', secondary: '#e30613', text: '#ffffff' },
  Benfica: { primary: '#e30613', secondary: '#ffffff', text: '#ffffff' },
  'Sporting CP': { primary: '#009a44', secondary: '#ffffff', text: '#ffffff' },
  'AC Milan': { primary: '#fb090b', secondary: '#000000', text: '#ffffff' },
  Ajax: { primary: '#ffffff', secondary: '#d2122e', text: '#d2122e' },
  'Bayern Munich': { primary: '#dc052d', secondary: '#0066b2', text: '#ffffff' },
  Juventus: { primary: '#000000', secondary: '#ffffff', text: '#ffffff' },
  'Inter Milan': { primary: '#0068a8', secondary: '#000000', text: '#ffffff' },
  'Real Madrid': { primary: '#ffffff', secondary: '#febe10', text: '#003087' },
  Barcelona: { primary: '#a50044', secondary: '#004d98', text: '#ffffff' },
  Celtic: { primary: '#16a34a', secondary: '#ffffff', text: '#ffffff' },
  Marseille: { primary: '#2faee0', secondary: '#ffffff', text: '#ffffff' },
  Lazio: { primary: '#87ceeb', secondary: '#ffffff', text: '#003087' },
  Roma: { primary: '#8b0000', secondary: '#f5c000', text: '#f5c000' },
  'Boca Juniors': { primary: '#003087', secondary: '#f5c000', text: '#f5c000' },
  'River Plate': { primary: '#ffffff', secondary: '#e30613', text: '#e30613' },
  // National teams (World Cup mode)
  Argentina: { primary: '#74acdf', secondary: '#ffffff', text: '#003087' },
  Belgium: { primary: '#000000', secondary: '#ef3340', text: '#f6d600' },
  Brazil: { primary: '#009c3b', secondary: '#fedf00', text: '#002776' },
  Colombia: { primary: '#fcd116', secondary: '#003087', text: '#003087' },
  Croatia: { primary: '#ff0000', secondary: '#ffffff', text: '#ffffff' },
  Denmark: { primary: '#c60c30', secondary: '#ffffff', text: '#ffffff' },
  England: { primary: '#ffffff', secondary: '#003090', text: '#003090' },
  France: { primary: '#002395', secondary: '#ffffff', text: '#ffffff' },
  Germany: { primary: '#ffffff', secondary: '#000000', text: '#000000' },
  Italy: { primary: '#003DA5', secondary: '#ffffff', text: '#ffffff' },
  Japan: { primary: '#2c4d9a', secondary: '#ffffff', text: '#ffffff' },
  Mexico: { primary: '#006847', secondary: '#ffffff', text: '#ffffff' },
  Morocco: { primary: '#c1272d', secondary: '#006233', text: '#ffffff' },
  Netherlands: { primary: '#ff6600', secondary: '#ffffff', text: '#ffffff' },
  Portugal: { primary: '#006600', secondary: '#ff0000', text: '#ffffff' },
  Serbia: { primary: '#c6363c', secondary: '#0c4076', text: '#ffffff' },
  Spain: { primary: '#c60b1e', secondary: '#ffc400', text: '#ffffff' },
  'South Korea': { primary: '#ce1126', secondary: '#003478', text: '#ffffff' },
  Switzerland: { primary: '#d52b1e', secondary: '#ffffff', text: '#ffffff' },
  Uruguay: { primary: '#5aaee0', secondary: '#ffffff', text: '#ffffff' },
  USA: { primary: '#002868', secondary: '#bf0a30', text: '#ffffff' },
};

const FALLBACK: KitColors = { primary: '#444', secondary: '#888', text: '#fff' };

export function kitColors(club: string): KitColors {
  return KITS[club] ?? FALLBACK;
}
