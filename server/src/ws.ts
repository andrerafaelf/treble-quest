import fastifyWebsocket from '@fastify/websocket';
import type { FastifyInstance } from 'fastify';
import type { WebSocket } from 'ws';
import { getPublicRoom, getRoom, setConnected } from './lobby.ts';

// Sockets grouped by room code so we can fan out snapshots.
const roomSockets = new Map<string, Set<WebSocket>>();
// Reverse lookup so a closing socket can clean itself up and flip the member offline.
const socketMeta = new WeakMap<WebSocket, { code: string; token: string }>();

function addSocket(code: string, socket: WebSocket) {
  let set = roomSockets.get(code);
  if (!set) {
    set = new Set();
    roomSockets.set(code, set);
  }
  set.add(socket);
}

function removeSocket(code: string, socket: WebSocket) {
  const set = roomSockets.get(code);
  if (!set) return;
  set.delete(socket);
  if (set.size === 0) roomSockets.delete(code);
}

/** Broadcast the current room snapshot to every connected socket in that room. */
export function broadcastRoom(code: string) {
  const room = getRoom(code);
  const set = roomSockets.get(code.trim().toUpperCase());
  if (!room || !set) return;
  const payload = JSON.stringify({ type: 'room', room: getPublicRoom(room) });
  for (const socket of set) {
    if (socket.readyState === socket.OPEN) {
      try {
        socket.send(payload);
      } catch {
        /* ignore individual send failures */
      }
    }
  }
}

// Register the @fastify/websocket plugin. MUST run before app.listen() AND before
// the routes that use { websocket: true } — the plugin installs the HTTP server's
// `upgrade` listener at registration time, so registering it late makes upgrade
// requests hang (the route matches but the connection is never upgraded).
export async function registerWebsocketPlugin(app: FastifyInstance) {
  await app.register(fastifyWebsocket);
}

// Define the /vs/ws route. Call AFTER registerWebsocketPlugin has run.
export function registerVsWebsocketRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { code?: string; token?: string } }>(
    '/vs/ws',
    { websocket: true },
    (socket, req) => {
      const code = String(req.query.code ?? '').trim().toUpperCase();
      const token = String(req.query.token ?? '');

      const room = getRoom(code);
      const member = room?.members.get(token);
      if (!room || !member) {
        try {
          socket.send(JSON.stringify({ type: 'error', error: 'invalid_room_or_token' }));
        } catch {
          /* ignore */
        }
        socket.close();
        return;
      }

      socketMeta.set(socket, { code, token });
      addSocket(code, socket);
      setConnected(code, token, true);
      broadcastRoom(code);

      socket.on('message', (raw: Buffer) => {
        // Only a heartbeat ping is accepted; all mutations go over HTTP.
        try {
          const msg = JSON.parse(raw.toString());
          if (msg?.type === 'ping') {
            socket.send(JSON.stringify({ type: 'pong' }));
          }
        } catch {
          /* ignore malformed frames */
        }
      });

      socket.on('close', () => {
        const meta = socketMeta.get(socket);
        if (!meta) return;
        socketMeta.delete(socket);
        removeSocket(meta.code, socket);
        // Only flip offline if this member has no other open sockets (e.g. duplicate tabs).
        const stillOpen = Array.from(roomSockets.get(meta.code) ?? []).some(
          (s) => socketMeta.get(s)?.token === meta.token,
        );
        if (!stillOpen) {
          setConnected(meta.code, meta.token, false);
          broadcastRoom(meta.code);
        }
      });
    },
  );
}
