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
  const cardClass = share.trophies === 3 || (worldCup && share.trophies > 0) ? 'result-card treble' : 'result-card';

  const players = squad.filter((s) => !s.isManager);
  const manager = squad.find((s) => s.isManager);

  const squadRows = players
    .map(
      (p) => `
      <div class="squad-player">
        <span class="pos-badge" style="background:${positionColor(p.slot)}">${escapeHtml(p.slot)}</span>
        <span class="player-name">${escapeHtml(p.name)}</span>
        <span class="player-rarity">${escapeHtml(p.rarity)}</span>
        <span class="player-ovr">${p.overall}</span>
      </div>`,
    )
    .join('');

  const awardsMarkup = `
      <article>
        <span>Golden Boot</span>
        <h2>${escapeHtml(awards.goldenBoot.name)}</h2>
        <p>${awards.goldenBoot.goals} goals${awards.goldenBoot.fromUser ? ' for your squad' : ''}</p>
      </article>
      <article>
        <span>Player of Season</span>
        <h2>${escapeHtml(awards.playerOfSeason.name)}</h2>
        <p>${awards.playerOfSeason.rating.toFixed(1)} average rating${awards.playerOfSeason.fromUser ? ' for your squad' : ''}</p>
      </article>`;

  const trophyStrip = worldCup
    ? `<div class="trophy-strip" aria-label="World Cup result">
        <span class="${share.trophies > 0 ? 'won' : ''}">World Cup</span>
        <span class="${share.league_wins === 8 && share.league_draws === 0 && share.league_losses === 0 ? 'won' : ''}">8-0</span>
      </div>`
    : `<div class="trophy-strip" aria-label="${share.trophies} trophies">
        <span class="${share.league_position === 1 ? 'won' : ''}">Premier League</span>
        <span class="${share.fa_cup === 'Winners' ? 'won' : ''}">FA Cup</span>
        <span class="${share.cl === 'Winners' ? 'won' : ''}">Champions League</span>
      </div>`;

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
  <meta property="og:image:alt" content="Treble Quest - Draft. Simulate. Conquer.">
  <meta property="og:site_name" content="Treble Quest">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(ogImage)}">
  <meta name="twitter:image:alt" content="Treble Quest - Draft. Simulate. Conquer.">
  <style>
    :root{--bg:#0f0d0d;--surface:#1a1616;--surface-2:#241f1f;--line:rgba(255,255,255,.12);--text:#f1f0ee;--muted:#9e9e9e;--accent:#e63946;--accent-2:#457b9d;--gold:#f4a261;color-scheme:dark;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:var(--bg);color:var(--text)}
    *{box-sizing:border-box}
    body{margin:0;min-width:320px;min-height:100vh;background:linear-gradient(rgba(230,57,70,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(230,57,70,.04) 1px,transparent 1px),linear-gradient(155deg,rgba(69,123,157,.22),transparent 34rem),linear-gradient(25deg,rgba(244,162,97,.18),transparent 38rem),var(--bg);background-size:100% 4.5rem,4.5rem 100%,auto,auto,auto}
    a{color:inherit;text-decoration:none}
    .site-header,.site-footer,main{width:min(1120px,calc(100% - 32px));margin:0 auto}
    .site-header{min-height:72px;display:flex;align-items:center;justify-content:space-between;gap:20px}
    .brand{display:inline-flex;align-items:center;gap:10px;font-weight:850;letter-spacing:0}
    .brand img{width:30px;height:30px;border-radius:6px;box-shadow:0 0 0 1px rgba(230,57,70,.28),0 10px 26px rgba(0,0,0,.35)}
    nav{display:flex;gap:6px;align-items:center}
    nav a{color:var(--muted);padding:9px 10px;border-radius:6px;font-size:.92rem;white-space:nowrap}
    nav a:hover{color:var(--text);background:rgba(255,255,255,.06)}
    .result-page{padding:24px 0 54px}
    .result-card{border:1px solid rgba(244,162,97,.38);border-radius:12px;background:linear-gradient(150deg,rgba(244,162,97,.1),transparent 40%),rgba(22,16,16,.95);padding:22px}
    .result-card.treble{border-color:rgba(244,162,97,.7);background:linear-gradient(150deg,rgba(244,162,97,.2),transparent 50%),rgba(22,16,16,.98);box-shadow:0 0 60px rgba(244,162,97,.18),0 0 0 1px rgba(255,190,130,.15)}
    .result-hero{display:grid;grid-template-columns:1fr minmax(220px,330px);gap:18px;align-items:end}
    .eyebrow{color:var(--accent);font-size:.74rem;text-transform:uppercase;font-weight:850;letter-spacing:.06em}
    h1{font-size:clamp(4rem,14vw,9rem);line-height:.85;margin:10px 0;background:linear-gradient(135deg,#ffc49b,var(--gold) 50%,#e87722);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
    .result-title{color:var(--gold);font-weight:800;font-size:1.12rem;margin:0}
    .result-subtitle{color:var(--muted);margin:8px 0 0;line-height:1.5}
    .trophy-strip{display:grid;gap:8px}
    .trophy-strip span{border:1px solid var(--line);border-radius:8px;padding:14px 16px;color:var(--muted);font-size:.92rem}
    .trophy-strip span.won{color:#1a0a00;background:linear-gradient(135deg,#ffc49b,var(--gold) 60%,#e87722);border-color:var(--gold);font-weight:900;font-size:1rem;box-shadow:0 4px 24px rgba(244,162,97,.45),0 0 0 1px rgba(255,190,130,.3)}
    .breakdown-grid,.share-grid,.awards-grid{display:grid;gap:12px;margin-top:14px}
    .breakdown-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
    .share-grid{grid-template-columns:minmax(0,1.25fr) minmax(280px,.75fr);align-items:start}
    .awards-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
    article,.squad-panel,.proof-panel{border:1px solid var(--line);border-radius:8px;padding:14px;background:rgba(255,255,255,.035)}
    article.won{border-color:rgba(244,162,97,.55);background:linear-gradient(150deg,rgba(244,162,97,.18),rgba(244,162,97,.06));box-shadow:0 2px 20px rgba(244,162,97,.15)}
    article span,.panel-kicker{color:var(--accent);font-size:.74rem;text-transform:uppercase;font-weight:850;letter-spacing:.06em}
    article h2{margin:8px 0;font-size:1.25rem}
    article p,.panel-note{color:var(--muted);margin:0;line-height:1.45}
    .squad-head{display:flex;justify-content:space-between;gap:16px;align-items:end;margin-bottom:12px}
    .squad-head h2{margin:4px 0 0;font-size:1.3rem}
    .manager{color:var(--muted);font-size:.86rem;text-align:right}
    .manager strong{color:var(--text)}
    .squad-list{display:grid;gap:6px}
    .squad-player{display:grid;grid-template-columns:42px minmax(0,1fr) auto 38px;align-items:center;gap:10px;border:1px solid rgba(255,255,255,.07);border-radius:6px;padding:8px;background:rgba(12,10,10,.42)}
    .pos-badge{font-size:.66rem;font-weight:900;color:#fff;padding:4px 6px;border-radius:4px;text-align:center}
    .player-name{font-weight:780;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .player-rarity{color:var(--muted);font-size:.74rem;text-transform:uppercase}
    .player-ovr{color:var(--gold);font-weight:900;text-align:right;font-variant-numeric:tabular-nums}
    .proof-panel{display:grid;gap:12px}
    .proof-panel .awards-grid{grid-template-columns:1fr}
    .verified{border:1px solid rgba(244,162,97,.42);border-radius:8px;padding:12px;background:linear-gradient(140deg,rgba(244,162,97,.12),rgba(244,162,97,.03));color:var(--gold);font-weight:800}
    .button{display:inline-flex;justify-content:center;align-items:center;width:100%;border-radius:8px;padding:14px 16px;background:var(--accent);color:#fff;font-weight:900;text-align:center;box-shadow:0 12px 30px rgba(230,57,70,.18)}
    .button:hover{filter:brightness(1.06)}
    .site-footer{display:flex;justify-content:space-between;gap:20px;padding:36px 0 28px;border-top:1px solid var(--line);color:var(--muted);font-size:.84rem;line-height:1.5}
    .site-footer p{margin:0}
    @media (max-width:760px){.site-header{align-items:flex-start;flex-direction:column;padding:16px 0}.result-hero,.share-grid,.breakdown-grid,.awards-grid{grid-template-columns:1fr}h1{font-size:4.4rem}.squad-player{grid-template-columns:38px minmax(0,1fr) 34px}.player-rarity{display:none}.site-footer{flex-direction:column}}
  </style>
</head>
<body>
  <header class="site-header">
    <a class="brand" href="${escapeHtml(siteUrl)}" aria-label="Treble Quest home">
      <img src="${escapeHtml(siteUrl)}/favicon.svg" alt="" aria-hidden="true">
      <span>Treble Quest</span>
    </a>
    <nav aria-label="Primary navigation">
      <a href="${escapeHtml(siteUrl)}">Home</a>
      <a href="${escapeHtml(siteUrl)}/play">Play</a>
      <a href="${escapeHtml(siteUrl)}/leaderboard">Leaderboard</a>
    </nav>
  </header>
  <main class="result-page">
    <section class="${cardClass}">
      <section class="result-hero">
        <div>
          <span class="eyebrow">Verified result</span>
          <h1>${share.score.toLocaleString()}</h1>
          <p class="result-title">${escapeHtml(label)}</p>
          <p class="result-subtitle">${escapeHtml(modeLabel(share))}${share.headline ? ` / ${escapeHtml(share.headline)}` : ''}</p>
        </div>
        ${trophyStrip}
      </section>

      <div class="breakdown-grid">
        <article class="${share.trophies > 0 ? 'won' : ''}">
          <span>${worldCup ? 'Record' : 'Points'}</span>
          <h2>${worldCup ? record : share.league_points}</h2>
          <p>${worldCup ? 'World Cup run' : `${record} league record`}</p>
        </article>
        <article class="${share.league_position === 1 || (worldCup && share.trophies > 0) ? 'won' : ''}">
          <span>${worldCup ? 'Target' : 'League'}</span>
          <h2>${worldCup ? '8-0' : ordinal(share.league_position)}</h2>
          <p>${worldCup ? 'Perfect world run' : 'Final position'}</p>
        </article>
        <article class="${!worldCup && (share.fa_cup === 'Winners' || share.cl === 'Winners') ? 'won' : ''}">
          <span>${worldCup ? 'Finished' : 'Cups'}</span>
          <h2>${worldCup ? ordinal(share.league_position) : `${share.trophies}/3`}</h2>
          <p>${worldCup ? 'Tournament finish' : `FA Cup: ${escapeHtml(share.fa_cup)} / CL: ${escapeHtml(share.cl)}`}</p>
        </article>
      </div>

      <div class="share-grid">
        <section class="squad-panel">
          <div class="squad-head">
            <div>
              <span class="panel-kicker">Drafted squad</span>
              <h2>Starting XI</h2>
            </div>
            ${manager ? `<div class="manager">Manager<br><strong>${escapeHtml(manager.name)}</strong></div>` : ''}
          </div>
          <div class="squad-list">
            ${squadRows}
          </div>
        </section>

        <aside class="proof-panel">
          <div class="verified">This result was re-simulated and signed on the server.</div>
          <div class="awards-grid">
            ${awardsMarkup}
          </div>
          <a href="${escapeHtml(siteUrl)}" class="button">${worldCup ? 'Can you go 8-0?' : 'Can you win the Treble?'} Play now</a>
        </aside>
      </div>
    </section>
  </main>
  <footer class="site-footer">
    <p>Treble Quest is an independent, fan-made football draft game.</p>
    <p>Verified share / ${escapeHtml(share.id)}</p>
  </footer>
  <template>
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
  </template>
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
