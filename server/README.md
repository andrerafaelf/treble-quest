# Treble Quest leaderboard API

Fastify + SQLite. Replays each submitted run server-side to verify the score
before storing it, so a tampered client payload can't reach the board.

## Endpoints

- `GET /health` — liveness probe.
- `GET /leaderboard?mode=quick|classic&limit=50` — top entries for a mode.
- `POST /scores` — body `{ name, run }`. Server replays and writes if valid.

## Local dev

```bash
cd server
npm install
npm run dev
```

Defaults: listens on `127.0.0.1:8787`, writes to `./data/leaderboard.db`.

## Configuration

The systemd unit reads `/etc/treble-quest.env` (written by CI on each deploy).
For local dev, set the same vars in your shell:

| Variable          | Default                                          | Purpose                                  |
| ----------------- | ------------------------------------------------ | ---------------------------------------- |
| `PORT`            | `8787`                                           | TCP port to bind                         |
| `HOST`            | `127.0.0.1`                                      | Interface to bind                        |
| `DB_PATH`         | `./data/leaderboard.db`                          | SQLite file path                         |
| `ALLOWED_ORIGINS` | `https://treble.quest,http://localhost:5173`     | Comma-separated CORS allowlist           |
| `IP_SALT`         | `treble`                                         | Salt for hashed IPs stored with scores   |
| `LOG_LEVEL`       | `info`                                           | Fastify/pino log level                   |

## Deployment

Deployment is driven by GitHub Actions — see [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml).
Every push to `main` builds the static site + the API, scps the bundles to the
VPS, swaps the static site in place atomically, runs `npm install --omit=dev`
in the server directory, and restarts the systemd unit.

The one-time VPS setup is handled by [`deploy/bootstrap-vps.sh`](../deploy/bootstrap-vps.sh).

## Backups

SQLite is one file. A nightly cron is enough:

```cron
15 3 * * * /usr/bin/sqlite3 /opt/treble-quest/server/data/leaderboard.db ".backup '/opt/treble-quest/server/data/backup-$(date +\%F).db'"
```
