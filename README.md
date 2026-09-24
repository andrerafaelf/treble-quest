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
PUBLIC_API_BASE=https://api.treble.quest
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
The same service hosts **multiplayer "Versus" lobbies** (`/vs/*` + a `/vs/ws` WebSocket): a
streamer creates a lobby, shares the link/code with chat, everyone races their own randomly
seeded draft of the chosen mode, and a live board ranks them — highest treble score wins. Scores
are verified through the same replay path, so the lobby can't be cheated. The multiplayer UI is
the [`/vs`](src/routes/vs/+page.svelte) route. See [`server/README.md`](server/README.md) for the
endpoint list.

## Deploy via GitHub Actions

Every push to `main` runs [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)
(it can also be started by hand from the Actions tab).
The workflow typechecks and builds both the static site and the API, then SSHes
into the VPS to swap in the new build and restart the systemd unit.

### Hosting layout (shared VPS)

Treble Quest shares one VPS with Vexara and the portfolio. Vexara's Dockerized
nginx (`vx-nginx`) is the only thing on ports `80`/`443` and serves every site:

| Hostname                      | Served by                                                      |
| ----------------------------- | -------------------------------------------------------------- |
| `treble.quest`                | static files in `/var/www/treble-quest`                        |
| `treble.quest/r/*`            | proxied to the API (share-result pages)                        |
| `api.treble.quest`            | proxied to the API, incl. the `/vs/ws` lobby WebSocket         |
| `www.treble.quest`            | 301 to `treble.quest`                                          |

The API is the `treble-quest-api` systemd unit on the host, bound to the docker0
gateway `172.17.0.1:8787`. The nginx container reaches it as
`host.docker.internal`, and UFW only lets Docker subnets reach that port.

The nginx server blocks for all three hostnames live in the **vexara** repo:
`deploy/nginx/treble.conf.template`. Change them there, then run Vexara's deploy.

### One-time VPS setup

Host provisioning (Docker, Node 22, the `deploy` and `trebleq` users, UFW,
Let's Encrypt cert for `treble.quest` + `www` + `api`) is done by the vexara
repo's `deploy/bootstrap-vps.sh`. See its `deploy/RUNBOOK.md`.

DNS (Cloudflare):

```
A    treble.quest       → <VPS IP>   proxied
A    www.treble.quest   → <VPS IP>   proxied
A    api.treble.quest   → <VPS IP>   DNS only
```

### Required GitHub repo configuration

Secrets (Settings → Secrets and variables → Actions → Secrets):

| Name           | Purpose                                                    |
| -------------- | ---------------------------------------------------------- |
| `VPS_HOST`     | VPS IP or hostname                                         |
| `VPS_USER`     | SSH user with passwordless sudo (`deploy`)                 |
| `VPS_SSH_KEY`  | Private SSH key authorized for `VPS_USER`                  |
| `IP_SALT`      | Random string used to hash IPs in the scores table         |

Variables (Settings → Secrets and variables → Actions → Variables):

| Name                              | Example value             |
| --------------------------------- | ------------------------- |
| `PUBLIC_SITE_URL`                 | `https://treble.quest`     |
| `PUBLIC_API_BASE`                 | `https://api.treble.quest` |
| `ALLOWED_ORIGINS`                 | `https://treble.quest`     |
| `PUBLIC_GA_MEASUREMENT_ID`        | (GA4 id, optional)         |
| `PUBLIC_GOOGLE_SITE_VERIFICATION` | (your Search Console token, optional) |

### API troubleshooting

```bash
sudo systemctl status treble-quest-api
sudo journalctl -u treble-quest-api -n 100 --no-pager
curl -v http://172.17.0.1:8787/health                     # API itself
curl -v --resolve api.treble.quest:443:127.0.0.1 https://api.treble.quest/health   # through vx-nginx
docker logs --tail 50 vx-nginx
```

If the API is healthy but the edge returns `502`, check that UFW still has the
`8787` rule for `172.16.0.0/12` (`sudo ufw status`) and that
`/opt/vexara/runtime/nginx/treble.conf` is not empty (it is left empty when the
`treble.quest` cert is missing).

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
