# Treble Quest leaderboard API

Fastify + SQLite. Replays each submitted run server-side to verify the score
before storing it, so a tampered client payload can't reach the board.

## Endpoints

- `GET /health` — liveness probe.
- `GET /leaderboard?mode=quick|classic&limit=50` — top entries for a mode.
- `POST /scores` — body `{ name, run }`. Server replays and writes if valid.

### Multiplayer "Versus" lobbies

Ephemeral, in-memory rooms for streamer-vs-chat play. Rooms are not persisted to
SQLite — they live in process memory and are swept when empty/expired.

- `POST /vs/rooms` — body `{ name }`. Creates a room. Returns `{ code, token, pid, room }`.
  `token` is the caller's secret per-room bearer token; `pid` is a public display id.
- `POST /vs/rooms/:code/join` — body `{ name }`. Returns `{ code, token, pid, room }`.
- `POST /vs/rooms/:code/start` — body `{ token, mode, formation, hideRatings }`. Host only.
  Flips the room to `playing`, bumps the round, resets results.
- `POST /vs/rooms/:code/submit` — body `{ token, run }`. **Reuses `verifyRun`** to replay the
  run server-side before recording the score, so a tampered payload can't post a fake score.
- `GET /vs/rooms/:code` — current public room snapshot (no tokens).
- `GET /vs/ws?code=…&token=…` — WebSocket. Server pushes `{ type: 'room', room }` snapshots on
  every state change (join/leave/start/finish). Client→server: only `{ type: 'ping' }`.

Each player drafts their **own** randomly-seeded run of the host's chosen mode (luck-based race;
highest score wins) — there is no shared seed to broadcast.

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
