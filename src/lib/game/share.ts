import type { SimulationResult } from '$lib/game/types';

type TFn = (key: string, opts?: { values?: Record<string, string | number | boolean | null | undefined> }) => string;

export function createShareText(result: SimulationResult, shareUrl?: string, t?: TFn): string {
  const _ = t ?? ((key: string) => key);

  if (result.worldCup) {
    const record = `${result.worldCup.wins}-${result.worldCup.draws}-${result.worldCup.losses}`;
    const perfect = result.worldCup.won && result.worldCup.wins === 8 && result.worldCup.draws === 0 && result.worldCup.losses === 0;
    let text: string;
    if (perfect) {
      text = _('share_text.wc_perfect', { values: { record } });
    } else if (result.worldCup.won) {
      text = _('share_text.wc_won', { values: { record } });
    } else {
      text = _('share_text.wc_out', { values: { record } });
    }
    text += ' ' + _('share_text.wc_challenge');
    if (shareUrl) text += `\n${shareUrl}`;
    return text;
  }

  const record = `${result.league.wins}-${result.league.draws}-${result.league.losses}`;
  const topScorer = result.awards.goldenBoot;
  const perfectLeague = result.league.wins === 38 && result.league.draws === 0 && result.league.losses === 0;
  const perfectCl = result.championsLeague.won && result.championsLeague.wins === 15 && result.championsLeague.draws === 0 && result.championsLeague.losses === 0;

  let text: string;
  if (result.trophies === 3) {
    text = _('share_text.treble', { values: { record, pts: result.league.points } });
  } else if (result.league.won) {
    text = _('share_text.champions', { values: { record, pts: result.league.points } });
  } else {
    text = _('share_text.no_title', { values: { record, pts: result.league.points } });
  }

  if (perfectLeague) text += ' ' + _('share_text.perfect_league');
  if (perfectCl) text += ' ' + _('share_text.perfect_europe');
  if (topScorer.fromUser) text += ' ' + _('share_text.top_scorer', { values: { name: topScorer.name, goals: topScorer.goals } });
  text += ' ' + _('share_text.challenge');
  if (shareUrl) text += `\n${shareUrl}`;
  return text;
}
