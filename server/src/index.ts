import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { createHash } from 'node:crypto';
import Fastify from 'fastify';
import { findByRunId, insertScore, topScores, type ScoreRow } from './db.ts';
import { sanitizeName } from './name.ts';
import { verifyRun, type SubmittedRun } from './verify.ts';

const PORT = Number(process.env.PORT ?? 8787);
const HOST = process.env.HOST ?? '127.0.0.1';
const ORIGINS = (process.env.ALLOWED_ORIGINS ?? 'https://treble.quest,http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

const app = Fastify({ logger: { level: process.env.LOG_LEVEL ?? 'info' } });

await app.register(cors, {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    cb(null, ORIGINS.includes(origin));
  },
  methods: ['GET', 'POST']
});

await app.register(rateLimit, {
  max: 30,
  timeWindow: '1 minute'
});

app.get('/health', async () => ({ ok: true }));

app.get<{ Querystring: { mode?: string; limit?: string } }>('/leaderboard', async (req, reply) => {
  const mode = req.query.mode === 'classic' ? 'classic' : 'quick';
  const limit = Math.min(Math.max(Number(req.query.limit ?? 50), 1), 100);
  const rows = topScores.all({ mode, limit }) as ScoreRow[];
  reply.header('Cache-Control', 'public, max-age=15');
  return {
    mode,
    entries: rows.map((r) => ({
      name: r.name,
      score: r.score,
      trophies: r.trophies,
      formation: r.formation,
      createdAt: r.created_at
    }))
  };
});

type SubmitBody = {
  name?: unknown;
  run?: SubmittedRun;
};

app.post<{ Body: SubmitBody }>('/scores', {
  config: { rateLimit: { max: 6, timeWindow: '1 minute' } }
}, async (req, reply) => {
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
  const ipHash = createHash('sha256').update(ip + (process.env.IP_SALT ?? 'treble')).digest('hex').slice(0, 16);

  insertScore.run({
    run_id: verified.runId,
    name,
    score: verified.result.score,
    trophies: verified.result.trophies,
    mode: verified.mode,
    formation: verified.formation ?? null,
    seed: verified.seed,
    created_at: Date.now(),
    ip_hash: ipHash
  });

  return {
    ok: true,
    name,
    score: verified.result.score,
    trophies: verified.result.trophies,
    mode: verified.mode
  };
});

try {
  await app.listen({ port: PORT, host: HOST });
  app.log.info(`leaderboard api listening on ${HOST}:${PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
