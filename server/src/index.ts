import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import Fastify from 'fastify';
import { createHash } from 'node:crypto';
import {
  findByRunId,
  findShareById,
  findShareByRunId,
  insertScore,
  insertShare,
  scoreCount,
  scoreSpot,
  submittedScoreCount,
  submittedScoreRank,
  topScores,
  type ScoreRow,
  type ShareRow,
} from './db.ts';
import { sanitizeName } from './name.ts';
import { render404Page, renderResultPage } from './result-page.ts';
import { generateShareId } from './share-id.ts';
import { verifyRun, type SubmittedRun } from './verify.ts';

const PORT = Number(process.env.PORT ?? 8787);
const HOST = process.env.HOST ?? '127.0.0.1';
const ORIGINS = (process.env.ALLOWED_ORIGINS ?? 'https://treble.quest,http://localhost:5173')
  .split(',')
  .map((o) => o.trim());
const SITE_URL = (process.env.SITE_URL ?? 'https://treble.quest').replace(/\/$/, '');

const app = Fastify({ logger: { level: process.env.LOG_LEVEL ?? 'info' } });

await app.register(cors, {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    cb(null, ORIGINS.includes(origin));
  },
  methods: ['GET', 'POST'],
});

await app.register(rateLimit, {
  max: 30,
  timeWindow: '1 minute',
});

app.get('/health', async () => ({ ok: true }));

app.get<{ Querystring: { mode?: string; limit?: string; hideRatings?: string } }>(
  '/leaderboard',
  async (req, reply) => {
    const mode = req.query.mode === 'classic' || req.query.mode === 'world-cup' ? req.query.mode : 'quick';
    const hideRatings = mode === 'classic' && req.query.hideRatings === '1';
    const limit = Math.min(Math.max(Number(req.query.limit ?? 50), 1), 100);
    const rows = topScores.all({ mode, hide_ratings: hideRatings ? 1 : 0, limit }) as ScoreRow[];
    reply.header('Cache-Control', 'public, max-age=15');
    return {
      mode,
      hideRatings,
      entries: rows.map((r) => ({
        name: r.name,
        score: r.score,
        trophies: r.trophies,
        formation: r.formation,
        squad: r.squad ? JSON.parse(r.squad) : null,
        createdAt: r.created_at,
      })),
    };
  },
);

app.get<{ Querystring: { mode?: string; hideRatings?: string; score?: string } }>(
  '/leaderboard/spot',
  async (req, reply) => {
    const mode = req.query.mode === 'classic' || req.query.mode === 'world-cup' ? req.query.mode : 'quick';
    const hideRatings = mode === 'classic' && req.query.hideRatings === '1';
    const score = Number(req.query.score ?? NaN);
    if (!Number.isFinite(score)) {
      return reply.code(400).send({ error: 'invalid_score' });
    }

    const rankRow = scoreSpot.get({ mode, hide_ratings: hideRatings ? 1 : 0, score }) as { rank: number };
    const countRow = scoreCount.get({ mode, hide_ratings: hideRatings ? 1 : 0 }) as { count: number };

    return {
      mode,
      hideRatings,
      score,
      rank: rankRow.rank,
      totalEntries: countRow.count,
    };
  },
);

type SubmitBody = {
  name?: unknown;
  run?: SubmittedRun;
};

app.post<{ Body: SubmitBody }>(
  '/scores',
  {
    config: { rateLimit: { max: 6, timeWindow: '1 minute' } },
  },
  async (req, reply) => {
    const body = req.body ?? {};
    const name = sanitizeName(body.name);
    if (!name) {
      return reply.code(400).send({ error: 'invalid_name' });
    }
    if (!body.run || typeof body.run !== 'object') {
      return reply.code(400).send({ error: 'invalid_run' });
    }

    const verified = verifyRun(body.run);
    if (!verified.ok) {
      req.log.warn({ reason: verified.reason }, 'rejected submission');
      return reply.code(400).send({ error: 'invalid_run', reason: verified.reason });
    }

    const existing = findByRunId.get(verified.runId);
    if (existing) {
      return reply.code(409).send({ error: 'already_submitted' });
    }

    const ip = req.ip ?? 'unknown';
    const ipHash = createHash('sha256')
      .update(ip + (process.env.IP_SALT ?? 'treble'))
      .digest('hex')
      .slice(0, 16);

    insertScore.run({
      run_id: verified.runId,
      name,
      score: verified.result.score,
      trophies: verified.result.trophies,
      mode: verified.mode,
      hide_ratings: verified.hideRatings ? 1 : 0,
      formation: verified.formation ?? null,
      seed: verified.seed,
      squad: JSON.stringify(verified.squad),
      created_at: Date.now(),
      ip_hash: ipHash,
    });

    const rankRow = submittedScoreRank.get({ run_id: verified.runId }) as { rank: number };
    const countRow = submittedScoreCount.get({ run_id: verified.runId }) as { count: number };

    return {
      ok: true,
      name,
      score: verified.result.score,
      trophies: verified.result.trophies,
      mode: verified.mode,
      rank: rankRow.rank,
      totalEntries: countRow.count,
    };
  },
);

type ShareBody = {
  run?: SubmittedRun;
};

app.post<{ Body: ShareBody }>(
  '/share',
  {
    config: { rateLimit: { max: 6, timeWindow: '1 minute' } },
  },
  async (req, reply) => {
    const body = req.body ?? {};
    if (!body.run || typeof body.run !== 'object') {
      return reply.code(400).send({ error: 'invalid_run' });
    }

    const verified = verifyRun(body.run);
    if (!verified.ok) {
      req.log.warn({ reason: verified.reason }, 'share rejected');
      return reply.code(400).send({ error: 'invalid_run', reason: verified.reason });
    }

    const existing = findShareByRunId.get(verified.runId) as { id: string } | undefined;
    if (existing) {
      return { ok: true, shareId: existing.id, url: `${SITE_URL}/r/${existing.id}` };
    }

    const shareId = generateShareId();
    const ip = req.ip ?? 'unknown';
    const ipHash = createHash('sha256')
      .update(ip + (process.env.IP_SALT ?? 'treble'))
      .digest('hex')
      .slice(0, 16);
    const { result } = verified;

    insertShare.run({
      id: shareId,
      run_id: verified.runId,
      mode: verified.mode,
      formation: verified.formation ?? null,
      score: result.score,
      trophies: result.trophies,
      league_points: result.league.points,
      league_position: result.league.position,
      league_wins: result.league.wins,
      league_draws: result.league.draws,
      league_losses: result.league.losses,
      fa_cup: result.faCup.won ? 'Winners' : result.faCup.exitRound,
      cl: result.championsLeague.won ? 'Winners' : result.championsLeague.exitRound,
      squad_json: JSON.stringify(verified.squad),
      awards_json: JSON.stringify(result.awards),
      headline: result.highlights.narrativeHeadline,
      created_at: Date.now(),
      ip_hash: ipHash,
    });

    return { ok: true, shareId, url: `${SITE_URL}/r/${shareId}` };
  },
);

app.get<{ Params: { id: string } }>('/r/:id', async (req, reply) => {
  const share = findShareById.get(req.params.id) as ShareRow | undefined;
  if (!share) {
    reply.code(404).header('Content-Type', 'text/html; charset=utf-8');
    return render404Page(SITE_URL);
  }
  reply.header('Content-Type', 'text/html; charset=utf-8');
  reply.header('Cache-Control', 'public, max-age=3600');
  return renderResultPage(share, SITE_URL);
});

app.get<{ Params: { id: string } }>('/share/:id', async (req, reply) => {
  const share = findShareById.get(req.params.id) as ShareRow | undefined;
  if (!share) {
    return reply.code(404).send({ error: 'not_found' });
  }
  reply.header('Cache-Control', 'public, max-age=3600');
  return {
    ok: true,
    share: {
      id: share.id,
      mode: share.mode,
      formation: share.formation,
      score: share.score,
      trophies: share.trophies,
      league: {
        points: share.league_points,
        position: share.league_position,
        wins: share.league_wins,
        draws: share.league_draws,
        losses: share.league_losses,
      },
      faCup: share.fa_cup,
      championsLeague: share.cl,
      squad: JSON.parse(share.squad_json),
      awards: JSON.parse(share.awards_json),
      headline: share.headline,
      createdAt: share.created_at,
    },
  };
});

try {
  await app.listen({ port: PORT, host: HOST });
  app.log.info(`leaderboard api listening on ${HOST}:${PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
