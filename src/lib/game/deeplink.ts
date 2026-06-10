import type { ClassicFormation, GameMode } from '$lib/game/types';

type DeepLinkRunConfig = {
  mode: GameMode;
  formation?: ClassicFormation;
  hideRatings: boolean;
};

const FORMATIONS: ClassicFormation[] = ['4-3-3', '4-4-2', '4-2-3-1', '3-4-3'];

function parseMode(raw: string | null): GameMode | null {
  if (!raw) return null;
  const normalized = raw.trim().toLowerCase();
  if (normalized === 'classic') return 'classic';
  if (normalized === 'world-cup' || normalized === 'worldcup' || normalized === 'wc') return 'world-cup';
  if (normalized === 'global') return 'global';
  if (normalized === 'legacy') return 'legacy';
  return null;
}

function parseClassicFormation(raw: string | null): ClassicFormation {
  if (!raw) return '4-3-3';
  const formation = raw.trim() as ClassicFormation;
  return FORMATIONS.includes(formation) ? formation : '4-3-3';
}

function asBool(raw: string | null): boolean {
  if (!raw) return false;
  const normalized = raw.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
}

export function parseRunConfigFromUrl(url: URL): DeepLinkRunConfig | null {
  const mode = parseMode(url.searchParams.get('mode'));
  if (!mode) return null;

  const formation = parseClassicFormation(url.searchParams.get('formation'));
  const hideRatings =
    asBool(url.searchParams.get('noOverall')) ||
    asBool(url.searchParams.get('hideRatings')) ||
    asBool(url.searchParams.get('no-overall'));

  return {
    mode,
    formation,
    hideRatings,
  };
}
