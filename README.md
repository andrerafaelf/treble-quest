# Treble Quest

Treble Quest is a fast football draft simulator built with SvelteKit, TypeScript, Vite, and the static adapter. Draft a squad in Quick or Classic Mode, simulate the Premier League, FA Cup, and Champions League, then share the result.

## Install

```bash
npm install
```

## Dev

```bash
npm run dev
```

## Build

```bash
npm run check
npm run build
```

The static site is generated in `build/`.

## Preview

```bash
npm run preview
```

## Analytics and Search Console

Copy `.env.example` to `.env` for local testing, or set the same public environment variables in your deployment environment:

```bash
PUBLIC_SITE_URL=https://treblequest.com/
PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
PUBLIC_GOOGLE_SITE_VERIFICATION=your-search-console-token
```

Google Analytics is loaded with a basic consent flow: the GA script is not added to the page until the visitor accepts analytics in the cookie banner. Search Console verification uses the HTML meta tag token from `PUBLIC_GOOGLE_SITE_VERIFICATION`.

Setup checklist:

- Create a GA4 web data stream and copy its Measurement ID into `PUBLIC_GA_MEASUREMENT_ID`.
- Add the site in Google Search Console.
- Choose the HTML tag verification method and copy only the `content` token into `PUBLIC_GOOGLE_SITE_VERIFICATION`.
- Set `PUBLIC_SITE_URL` to the real production origin with a trailing slash.
- Deploy, then verify the property in Search Console.

## Leaderboards

The leaderboard API lives in [`server/`](server/) — a small Fastify + SQLite service that
replays every submitted run server-side to verify the score before storing it.
See [`server/README.md`](server/README.md) for details.

## Deploy via GitHub Actions

Every push to `main` runs [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).
The workflow typechecks and builds both the static site and the API, then SSHes
into the VPS to swap in the new build and restart the systemd unit.

### One-time VPS setup

Point DNS at the VPS:

```
A    treble.quest       → <VPS IP>
A    www.treble.quest   → <VPS IP>
A    api.treble.quest   → <VPS IP>
```

On the VPS, run:

```bash
curl -fsSL https://raw.githubusercontent.com/andrerafaelf/treble-quest/main/deploy/bootstrap-vps.sh | sudo bash
sudo certbot --nginx -d treble.quest -d www.treble.quest
sudo certbot --nginx -d api.treble.quest
```

The deploy user (the one CI SSHes in as) needs passwordless sudo. Add their
public key to `~/.ssh/authorized_keys`.

### Required GitHub repo configuration

Secrets (Settings → Secrets and variables → Actions → Secrets):

| Name           | Purpose                                                    |
| -------------- | ---------------------------------------------------------- |
| `VPS_HOST`     | VPS IP or hostname                                         |
| `VPS_USER`     | SSH user with passwordless sudo                            |
| `VPS_SSH_KEY`  | Private SSH key (PEM) authorized for `VPS_USER`            |
| `IP_SALT`      | Random string used to hash IPs in the scores table         |

Variables (Settings → Secrets and variables → Actions → Variables):

| Name                              | Example value             |
| --------------------------------- | ------------------------- |
| `PUBLIC_SITE_URL`                 | `https://treble.quest`     |
| `PUBLIC_API_BASE`                 | `https://api.treble.quest` |
| `ALLOWED_ORIGINS`                 | `https://treble.quest`     |
| `PUBLIC_GOOGLE_SITE_VERIFICATION` | (your Search Console token, optional) |

The API runs as a separate origin on `api.treble.quest`, proxied by nginx to
the Node service bound to `127.0.0.1:8787`. CORS is gated by `ALLOWED_ORIGINS`.

### Production environment gate

The deploy job runs in the `production` GitHub Actions environment. Create it
under Settings → Environments → `production` (optionally add required reviewers
if you want a manual approval before each deploy).

## Expanding Player Data

Player seasons live in `src/lib/game/data/players.ts`. Add entries with the `PlayerSeason` shape from `src/lib/game/types.ts`.

Guidelines:

- Ratings are internal Treble Quest numbers, not copied from EA, Football Manager, or any ratings provider.
- Use descriptive historical club-season references only.
- Keep each player season distinct with a stable `id`.
- Preserve enough variety across positions so Quick and Classic runs both have meaningful choices.

Managers live in `src/lib/game/data/managers.ts`.

## How Simulation Works

Draft state is stored in a Svelte store and persisted to LocalStorage. A run has a seed, mode, current pick index, selected picks, the current prompt, and the final result.

The simulation is deterministic for a selected squad and seed:

- `draft.ts` generates seeded prompts and prevents duplicate player picks.
- `scoring.ts` calculates attack, control, defence, clutch, consistency, chemistry, manager boost, and slot fit.
- `simulation.ts` resolves the league, FA Cup, and Champions League with mode-specific variance.
- `share.ts` creates the shareable result text.
- `storage.ts` persists, resumes, clears, and replays runs.

Treble Score weighting:

- Premier League: 45%
- Champions League: 35%
- FA Cup: 20%
- Actual treble bonus, capped at 100

## Legal

Treble Quest is an independent, fan-made football draft game. It is not affiliated with, endorsed by, or sponsored by any football club, league, competition, governing body, game publisher, or ratings provider. Player, club and season references are used descriptively.
