import type { SimulationResult } from '$lib/game/types';

export function createShareText(result: SimulationResult): string {
  return `I scored ${result.score.toLocaleString()} on Treble Quest.

Premier League: ${result.league.label}
FA Cup: ${result.faCup.won ? 'Winners' : result.faCup.exitRound}
Champions League: ${result.championsLeague.won ? 'Winners' : result.championsLeague.exitRound}

Draft your squad. Chase three trophies.`;
}
