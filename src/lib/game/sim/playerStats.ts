import type { Match, MatchScorer, PlayerPick, PlayerSeasonStats, RunState } from '$lib/game/types';

type ScorerCandidate = {
  playerId: string;
  name: string;
  positionShort: string;
  attackWeight: number;
  assistWeight: number;
  isGK: boolean;
  isDef: boolean;
  overall: number;
};

function positionMultiplier(positions: string[]): { attack: number; assist: number } {
  if (positions.includes('ST')) return { attack: 1.45, assist: 0.55 };
  if (positions.includes('LW') || positions.includes('RW')) return { attack: 1.15, assist: 1.05 };
  if (positions.includes('LM') || positions.includes('RM')) return { attack: 0.85, assist: 1.0 };
  if (positions.includes('CM')) return { attack: 0.55, assist: 1.2 };
  if (positions.includes('LB') || positions.includes('RB')) return { attack: 0.22, assist: 0.55 };
  if (positions.includes('CB')) return { attack: 0.14, assist: 0.18 };
  if (positions.includes('GK')) return { attack: 0.02, assist: 0.05 };
  return { attack: 0.4, assist: 0.4 };
}

function shortPosition(positions: string[]): string {
  const priority = ['ST', 'LW', 'RW', 'LM', 'RM', 'CM', 'LB', 'RB', 'CB', 'GK'];
  for (const p of priority) {
    if (positions.includes(p)) return p;
  }
  return positions[0] ?? '—';
}

export function buildCandidates(run: RunState): ScorerCandidate[] {
  const playerPicks = run.picks.filter((pick): pick is PlayerPick => pick.type === 'player');
  return playerPicks.map((pick) => {
    const mult = positionMultiplier(pick.player.positions);
    const attackWeight = pick.player.attack * mult.attack + 5;
    const assistWeight = pick.player.control * mult.assist + 5;
    return {
      playerId: pick.player.id,
      name: pick.player.name,
      positionShort: shortPosition(pick.player.positions),
      attackWeight,
      assistWeight,
      isGK: pick.player.positions.includes('GK'),
      isDef: pick.player.positions.some((p) => ['CB', 'LB', 'RB'].includes(p)),
      overall: pick.player.overall,
    };
  });
}

function weightedDraw(weights: number[], rng: () => number): number {
  const total = weights.reduce((sum, w) => sum + w, 0);
  if (total <= 0) return 0;
  let roll = rng() * total;
  for (let i = 0; i < weights.length; i += 1) {
    roll -= weights[i];
    if (roll <= 0) return i;
  }
  return weights.length - 1;
}

export function attributeMatchGoals(
  match: Match,
  candidates: ScorerCandidate[],
  rng: () => number,
): { scorers: MatchScorer[]; assisters: { playerId: string; name: string }[] } {
  const scorers: MatchScorer[] = [];
  const assisters: { playerId: string; name: string }[] = [];
  if (match.gf <= 0 || candidates.length === 0) return { scorers, assisters };

  const attackWeights = candidates.map((c) => c.attackWeight);

  for (let g = 0; g < match.gf; g += 1) {
    const idx = weightedDraw(attackWeights, rng);
    const scorer = candidates[idx];
    const minute = 1 + Math.floor(rng() * 90);
    scorers.push({ playerId: scorer.playerId, name: scorer.name, minute });

    if (rng() < 0.7) {
      const assistWeights = candidates.map((c, i) => (i === idx ? 0 : c.assistWeight));
      const assistTotal = assistWeights.reduce((sum, w) => sum + w, 0);
      if (assistTotal > 0) {
        const ai = weightedDraw(assistWeights, rng);
        const assister = candidates[ai];
        assisters.push({ playerId: assister.playerId, name: assister.name });
      }
    }
  }

  scorers.sort((a, b) => a.minute - b.minute);
  return { scorers, assisters };
}

export function aggregatePlayerStats(
  run: RunState,
  matches: Match[],
  candidates: ScorerCandidate[],
): PlayerSeasonStats[] {
  const playerPicks = run.picks.filter((pick): pick is PlayerPick => pick.type === 'player');
  const stats = new Map<string, PlayerSeasonStats>();

  for (const pick of playerPicks) {
    const cand = candidates.find((c) => c.playerId === pick.player.id);
    stats.set(pick.player.id, {
      playerId: pick.player.id,
      name: pick.player.name,
      nationality: pick.player.nationality,
      positionShort: cand?.positionShort ?? shortPosition(pick.player.positions),
      club: pick.player.club,
      season: pick.player.season,
      overall: pick.player.overall,
      apps: 0,
      goals: 0,
      assists: 0,
      cleanSheets: 0,
    });
  }

  const isStarter = (c: ScorerCandidate): boolean => c.isGK || c.isDef;

  for (const match of matches) {
    for (const pick of playerPicks) {
      const entry = stats.get(pick.player.id);
      if (entry) entry.apps += 1;
    }
    for (const scorer of match.scorers) {
      const entry = stats.get(scorer.playerId);
      if (entry) entry.goals += 1;
    }
    for (const assister of match.assisters) {
      const entry = stats.get(assister.playerId);
      if (entry) entry.assists += 1;
    }
    if (match.cleanSheet) {
      for (const cand of candidates.filter(isStarter)) {
        const entry = stats.get(cand.playerId);
        if (entry) entry.cleanSheets += 1;
      }
    }
  }

  return Array.from(stats.values());
}
