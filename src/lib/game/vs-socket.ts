import { browser } from '$app/environment';
import { writable, type Readable } from 'svelte/store';
import { fetchRoom, wsUrl, type PublicRoom } from '$lib/game/vs-api';

export type ConnectionStatus = 'connecting' | 'open' | 'closed';

export type VsSocket = {
  room: Readable<PublicRoom | null>;
  status: Readable<ConnectionStatus>;
  close: () => void;
};

/**
 * Opens a live connection to a room and exposes a store that always holds the
 * latest server snapshot. Auto-reconnects with capped backoff and sends a
 * heartbeat ping. The whole protocol is "server pushes a room snapshot, client
 * re-renders" — so reconnection is self-healing with no replay needed.
 */
export function connectRoom(code: string, token: string): VsSocket {
  const room = writable<PublicRoom | null>(null);
  const status = writable<ConnectionStatus>('connecting');

  let socket: WebSocket | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let attempts = 0;
  let closedByCaller = false;

  if (!browser) {
    return { room, status, close: () => {} };
  }

  // Seed from a one-shot REST fetch so the UI shows something even before the socket opens.
  fetchRoom(code).then((r) => {
    if (r) room.update((current) => current ?? r);
  });

  const clearTimers = () => {
    if (heartbeat) clearInterval(heartbeat);
    if (reconnectTimer) clearTimeout(reconnectTimer);
    heartbeat = null;
    reconnectTimer = null;
  };

  const connect = () => {
    if (closedByCaller) return;
    status.set('connecting');
    socket = new WebSocket(wsUrl(code, token));

    socket.onopen = () => {
      attempts = 0;
      status.set('open');
      heartbeat = setInterval(() => {
        if (socket?.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'ping' }));
        }
      }, 25000);
    };

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg?.type === 'room' && msg.room) {
          room.set(msg.room as PublicRoom);
        }
      } catch {
        /* ignore malformed frames */
      }
    };

    socket.onclose = () => {
      clearTimers();
      socket = null;
      if (closedByCaller) {
        status.set('closed');
        return;
      }
      status.set('connecting');
      attempts += 1;
      const delay = Math.min(1000 * 2 ** Math.min(attempts, 4), 15000); // 1s..15s
      reconnectTimer = setTimeout(connect, delay);
    };

    socket.onerror = () => {
      // onclose handles reconnection; just make sure the socket is torn down.
      socket?.close();
    };
  };

  connect();

  return {
    room,
    status,
    close: () => {
      closedByCaller = true;
      clearTimers();
      socket?.close();
      status.set('closed');
    },
  };
}
