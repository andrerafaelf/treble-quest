import type { ShareRow } from './db.ts';

type SquadEntry = {
  slot: string;
  name: string;
  overall: number;
  rarity: string;
  isManager: boolean;
};

type Awards = {
  goldenBoot: { name: string; goals: number; fromUser: boolean };
  goldenGlove: { name: string; cleanSheets: number; fromUser: boolean };
  playerOfSeason: { name: string; rating: number; fromUser: boolean };
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function positionColor(slot: string): string {
  if (slot === 'GK') return '#f59e0b';
  if (['RB', 'CB', 'LB'].includes(slot)) return '#3b82f6';
  if (['CM', 'RM', 'LM', 'RW', 'LW', 'CAM', 'CDM'].includes(slot)) return '#10b981';
  if (['ST', 'CF'].includes(slot)) return '#ef4444';
  return '#94a3b8';
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function isWorldCup(share: ShareRow): boolean {
  return share.mode === 'world-cup';
}

function trophyLabel(share: ShareRow): string {
  if (isWorldCup(share)) return share.trophies > 0 ? 'WORLD CUP WINNERS' : `Out in ${ordinal(share.league_position)}`;
  if (share.trophies === 3) return 'TREBLE WINNERS';
  if (share.trophies === 2) return 'DOUBLE WINNERS';
  if (share.league_position === 1) return 'CHAMPIONS';
  if (share.trophies === 1) return 'TROPHY WINNERS';
  return `Finished ${ordinal(share.league_position)}`;
}

function ogTitle(share: ShareRow): string {
  const record = `${share.league_wins}-${share.league_draws}-${share.league_losses}`;
  if (isWorldCup(share)) {
    return share.trophies > 0 ? `World Cup won (${record})` : `World Cup run: ${record}`;
  }
  return `${share.league_points} pts (${record}) - ${ordinal(share.league_position)} place`;
}

function ogDescription(share: ShareRow, awards: Awards): string {
  const parts: string[] = [];
  if (awards.goldenBoot?.fromUser) parts.push(`${awards.goldenBoot.name} scored ${awards.goldenBoot.goals} goals`);
  if (awards.playerOfSeason?.fromUser) parts.push(`${awards.playerOfSeason.name} won Player of the Season`);
  parts.push(isWorldCup(share) ? 'Can you go 8-0?' : 'Can you win the Treble on Treble Quest?');
  return parts.join('. ');
}

function modeLabel(share: ShareRow): string {
  if (isWorldCup(share)) return 'World Cup';
  if (share.mode === 'classic') return share.formation ? `Classic / ${share.formation}` : 'Classic';
  return 'Quick';
}

export function renderResultPage(share: ShareRow, siteUrl: string): string {
  const squad: SquadEntry[] = JSON.parse(share.squad_json);
  const awards: Awards = JSON.parse(share.awards_json);
  const record = `${share.league_wins}-${share.league_draws}-${share.league_losses}`;
  const label = trophyLabel(share);
  const title = ogTitle(share);
  const description = ogDescription(share, awards);
  const pageUrl = `${siteUrl}/r/${share.id}`;
  const ogImage = `${siteUrl}/og-image.png`;
  const worldCup = isWorldCup(share);

  const players = squad.filter((s) => !s.isManager);
  const manager = squad.find((s) => s.isManager);

  const squadRows = players
    .map(
      (p) => `
      <div class="squad-row">
        <span class="pos" style="background:${positionColor(p.slot)}">${escapeHtml(p.slot)}</span>
        <span class="name">${escapeHtml(p.name)}</span>
        <span class="ovr">${p.overall}</span>
      </div>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} | Treble Quest</title>
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${escapeHtml(pageUrl)}">
  <meta property="og:image" content="${escapeHtml(ogImage)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:type" content="image/png">
  <meta property="og:image:alt" content="Treble Quest — Draft. Simulate. Conquer.">
  <meta property="og:site_name" content="Treble Quest">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(ogImage)}">
  <meta name="twitter:image:alt" content="Treble Quest — Draft. Simulate. Conquer.">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#0f1923;color:#e2e8f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:2rem 1rem}
    .card{max-width:440px;width:100%;background:#1a2634;border-radius:8px;padding:2rem;border:1px solid #2d3f50}
    .header{text-align:center;margin-bottom:1.5rem}
    .badge{display:inline-block;background:#10b981;color:#fff;font-size:.7rem;font-weight:700;padding:.25rem .6rem;border-radius:4px;margin-bottom:.75rem}
    .label{font-size:1.4rem;font-weight:800;color:#f8fafc;margin-bottom:.25rem}
    .mode-tag{font-size:.75rem;color:#94a3b8;margin-bottom:1rem}
    .stats{display:grid;grid-template-columns:repeat(3,1fr);gap:.5rem;margin-bottom:1.5rem;text-align:center}
    .stat{background:#0f1923;border-radius:8px;padding:.75rem .5rem}
    .stat-value{font-size:1.3rem;font-weight:800;color:#f8fafc}
    .stat-label{font-size:.65rem;color:#94a3b8;text-transform:uppercase;margin-top:.2rem}
    .squad{margin-bottom:1.5rem}
    .squad-row{display:flex;align-items:center;padding:.4rem 0;border-bottom:1px solid #2d3f50}
    .squad-row:last-child{border-bottom:none}
    .pos{font-size:.65rem;font-weight:700;color:#fff;padding:.15rem .4rem;border-radius:3px;width:2.2rem;text-align:center;flex-shrink:0}
    .name{flex:1;font-size:.85rem;margin-left:.6rem;color:#e2e8f0}
    .ovr{font-size:.85rem;font-weight:700;color:#f59e0b}
    .awards{display:grid;grid-template-columns:1fr 1fr;gap:.5rem;margin-bottom:1.5rem}
    .award{background:#0f1923;border-radius:8px;padding:.6rem;text-align:center}
    .award-label{font-size:.6rem;color:#f59e0b;text-transform:uppercase;letter-spacing:.03em}
    .award-name{font-size:.8rem;font-weight:700;color:#f8fafc;margin-top:.2rem}
    .award-stat{font-size:.7rem;color:#10b981}
    .verified{text-align:center;margin-bottom:1.5rem}
    .verified-badge{font-size:.75rem;color:#10b981}
    .cta{display:block;text-align:center;background:#10b981;color:#fff;text-decoration:none;font-weight:700;font-size:1rem;padding:1rem;border-radius:8px}
    .cta:hover{background:#059669}
    .manager{text-align:center;font-size:.8rem;color:#94a3b8;margin-bottom:1rem}
    .cups{text-align:center;font-size:.75rem;color:#94a3b8;margin-bottom:1rem}
    .cup-sep{margin:0 .4rem;color:#475569}
    .footer{text-align:center;margin-top:1.5rem;font-size:.7rem;color:#64748b}
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="badge">Verified result</div>
      <div class="label">${escapeHtml(label)}</div>
      <div class="mode-tag">${escapeHtml(modeLabel(share))}</div>
    </div>

    <div class="stats">
      <div class="stat">
        <div class="stat-value">${worldCup ? record : share.league_points}</div>
        <div class="stat-label">${worldCup ? 'Record' : 'Points'}</div>
      </div>
      <div class="stat">
        <div class="stat-value">${worldCup ? '8-0' : record}</div>
        <div class="stat-label">${worldCup ? 'Target' : 'W-D-L'}</div>
      </div>
      <div class="stat">
        <div class="stat-value">${ordinal(share.league_position)}</div>
        <div class="stat-label">Finished</div>
      </div>
    </div>

    ${manager ? `<div class="manager">Manager: <strong>${escapeHtml(manager.name)}</strong></div>` : ''}

    ${!worldCup ? `<div class="cups"><span class="cup-item">CL: ${escapeHtml(share.cl === 'Winners' ? 'Winners' : `Out in ${share.cl}`)}</span><span class="cup-sep">·</span><span class="cup-item">FA Cup: ${escapeHtml(share.fa_cup === 'Winners' ? 'Winners' : `Out in ${share.fa_cup}`)}</span></div>` : ''}

    <div class="squad">
      ${squadRows}
    </div>

    <div class="awards">
      ${awards.goldenBoot ? `<div class="award"><div class="award-label">Golden Boot</div><div class="award-name">${escapeHtml(awards.goldenBoot.name)}</div><div class="award-stat">${awards.goldenBoot.goals} goals</div></div>` : ''}
      ${awards.playerOfSeason ? `<div class="award"><div class="award-label">Player of Season</div><div class="award-name">${escapeHtml(awards.playerOfSeason.name)}</div></div>` : ''}
    </div>

    <div class="verified">
      <div class="verified-badge">This result was re-simulated and signed on the server.</div>
    </div>

    <a href="${escapeHtml(siteUrl)}" class="cta">${worldCup ? 'Can you go 8-0?' : 'Can you win the Treble?'} Play now</a>
  </div>
  <div class="footer">Treble Quest / The football draft game</div>
</body>
</html>`;
}

export function render404Page(siteUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Result not found | Treble Quest</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#0f1923;color:#e2e8f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2rem 1rem;text-align:center}
    h1{font-size:1.5rem;margin-bottom:1rem}
    p{color:#94a3b8;margin-bottom:2rem}
    a{display:inline-block;background:#10b981;color:#fff;text-decoration:none;font-weight:700;padding:.75rem 1.5rem;border-radius:8px}
    a:hover{background:#059669}
  </style>
</head>
<body>
  <h1>Result not found</h1>
  <p>This link may be invalid or expired.</p>
  <a href="${escapeHtml(siteUrl)}">Play Treble Quest</a>
</body>
</html>`;
}
