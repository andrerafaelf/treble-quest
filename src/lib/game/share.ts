import type { SimulationResult } from '$lib/game/types';

export function createShareText(result: SimulationResult, shareUrl?: string): string {
  const emoji =
    result.trophies === 3 ? '🏆🏆🏆 TREBLE' : result.league.won ? '🏆 CHAMPIONS' : result.trophies > 0 ? '🏆' : '⚽';

  const record = `${result.league.wins}-${result.league.draws}-${result.league.losses}`;
  const topScorer = result.awards.goldenBoot;

  let text = `${emoji} — my all-time top-flight XI`;
  if (result.league.won) {
    text += ` won the title with ${result.league.points} pts (${record})`;
  } else {
    text += ` finished with ${result.league.points} pts (${record})`;
  }
  if (topScorer.fromUser) {
    text += ` with ${topScorer.name} scoring ${topScorer.goals}`;
  }
  text += `. Can you top it on 38-0?`;
  if (shareUrl) text += `\n${shareUrl}`;
  return text;
}
