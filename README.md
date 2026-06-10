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

The API runs as a separate origin on `api.treble.quest`, proxied to the Node
service on port `8787`. The multiplayer lobby uses a WebSocket at
`api.treble.quest/vs/ws`. **The `api.treble.quest` vhost must be edited once** to
forward the upgrade headers — without this the WS handshake fails at the edge and
lobbies silently fall back to a stale snapshot (members/round-start don't update
live). The deploy ships the server code but does **not** auto-patch upgrade headers
into the shared edge, because injecting directives into a shared Docker nginx is
risky. Add a dedicated `location /vs/ws` block to the API vhost (see the canonical
[`deploy/nginx.example.conf`](deploy/nginx.example.conf)):

```nginx
# once, at http {} scope (top of the config):
map $http_upgrade $connection_upgrade { default upgrade; '' close; }

# inside the api.treble.quest server {} block, BEFORE `location / {`:
location /vs/ws {
    proxy_pass http://127.0.0.1:8787;   # or the Docker gateway on the shared edge
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
    proxy_set_header Host $host;
    proxy_read_timeout 3600s;
}
```

Verify after reloading nginx: a WS upgrade request to `/vs/ws` should return
`101`/`426`/`400` (route exists), **not** `404` (route missing → server not deployed)
and not hang (headers not forwarded). On a single-purpose VPS, host nginx can proxy to
`127.0.0.1:8787`. On the current shared VPS, Docker owns public ports `80` and
`443`, so the Dockerized shared nginx edge must proxy to the host via its Docker
gateway instead. The deploy workflow detects that mode and runs
[`deploy/repair-nginx-vps.sh`](deploy/repair-nginx-vps.sh).

### API troubleshooting

If the leaderboard service is healthy on the VPS but `https://api.treble.quest`
times out publicly, first check which process owns the public edge:

```bash
curl -v http://127.0.0.1:8787/health
sudo ss -tlnp | grep -E ':80|:443|:8787'
sudo nginx -t
sudo grep -R "client:3000\|api.treble.quest\|treble.quest" -n /etc/nginx
```

If `docker-proxy` owns `80`/`443`, do not start or restart host nginx to take
those ports. Keep the VPS shared and repair only Treble Quest's route in the
Dockerized edge:

```bash
sudo bash /tmp/treble-quest-deploy/repair-nginx-vps.sh
```

The script finds the nginx container publishing `443`, binds the API to that
container's Docker gateway, patches Treble Quest `proxy_pass` targets that still
point at an unreachable loopback/public address, validates nginx, reloads the
container, and then checks `https://api.treble.quest/health`. It also ensures
the main `treble.quest` vhost proxies `/r/*` share-result links to the API; if
share links show the unstyled Treble Quest shell instead of a verified result,
the edge is falling through to the static site and this repair needs to run
again. The `/r/*` verification probes the local HTTPS edge with `--resolve` so
Cloudflare managed challenges do not fail deploys. If a host firewall blocks
container-to-host traffic, it also allows only the shared edge Docker subnet to
reach only the API port on the Docker gateway.

If host nginx owns the public edge, `nginx -t` must pass. An error like
`host not found in upstream "client:3000"` means a stale nginx config from
another app is still loaded from `/etc/nginx`. Production deploys repair that
one known-bad host-level upstream by replacing `server client:3000;` with
`server 127.0.0.1:3000;` after backing up `/etc/nginx/nginx.conf`. This is
intentionally narrow for a shared VPS: the deploy does not replace nginx config
or remove other apps' server blocks.

For any other nginx error, fix only the stale config that owns the bad upstream,
then reload nginx and re-check the public health endpoint:

```bash
sudo systemctl reload nginx
curl -v https://api.treble.quest/health
```

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
