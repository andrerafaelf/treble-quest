import type { SimulationResult } from '$lib/game/types';

export function createShareText(result: SimulationResult, shareUrl?: string): string {
  if (result.worldCup) {
    const record = `${result.worldCup.wins}-${result.worldCup.draws}-${result.worldCup.losses}`;
    const perfect = result.worldCup.won && result.worldCup.wins === 8 && result.worldCup.draws === 0 && result.worldCup.losses === 0;
    let text = perfect
      ? `Perfect 8-0 World Cup run with my all-time XI`
      : result.worldCup.won
        ? `World Cup won with my all-time XI (${record})`
        : `My all-time XI went ${record} in World Cup mode`;
    text += `. Can you go 8-0?`;
    if (shareUrl) text += `\n${shareUrl}`;
    return text;
  }

  const record = `${result.league.wins}-${result.league.draws}-${result.league.losses}`;
  const topScorer = result.awards.goldenBoot;
  const perfectLeague = result.league.wins === 38 && result.league.draws === 0 && result.league.losses === 0;
  const perfectCl = result.championsLeague.won && result.championsLeague.wins === 15 && result.championsLeague.draws === 0 && result.championsLeague.losses === 0;

  let text =
    result.trophies === 3
      ? 'Treble completed with my all-time top-flight XI'
      : result.league.won
        ? 'Champions with my all-time top-flight XI'
        : 'My all-time top-flight XI';

  if (result.league.won) {
    text += ` won the title with ${result.league.points} pts (${record})`;
  } else {
    text += ` finished with ${result.league.points} pts (${record})`;
  }
  if (perfectLeague) text += ` - perfect 38-0`;
  if (perfectCl) text += ` - perfect 15-0 in Europe`;
  if (topScorer.fromUser) text += ` with ${topScorer.name} scoring ${topScorer.goals}`;
  text += `. Can you win the Treble on Treble Quest?`;
  if (shareUrl) text += `\n${shareUrl}`;
  return text;
}
