import type { ClassicFormation, GameMode } from '$lib/game/types';
import { sanitizeName } from './name.ts';
import { generateRoomCode, generateToken } from './share-id.ts';
import type { SquadEntry, VerifyOk } from './verify.ts';

export type Phase = 'lobby' | 'playing' | 'finished';

export type Member = {
  id: string; // secret per-room bearer token; identifies the member to the server. NEVER broadcast.
  pid: string; // public, non-secret id for client-side rendering/self-identification
  name: string;
  isHost: boolean;
  joinedAt: number;
  connected: boolean;
  done: boolean;
  score: number | null;
  trophies: number | null;
  squad: SquadEntry[] | null;
  formation: ClassicFormation; // each player picks their own; only matters for classic mode
};

export type Room = {
  code: string;
  hostId: string;
  phase: Phase;
  mode: GameMode;
  formation?: ClassicFormation;
  hideRatings: boolean;
  round: number;
  members: Map<string, Member>;
  createdAt: number;
  startedAt?: number;
  lastActivity: number;
};

// Serializable snapshots sent to clients. Member tokens are NEVER included.
export type PublicMember = {
  pid: string; // non-secret display id; clients match this against the pid returned to them on join
  name: string;
  isHost: boolean;
  connected: boolean;
  done: boolean;
  score: number | null;
  trophies: number | null;
  squad: SquadEntry[] | null;
  formation: ClassicFormation;
};

export type PublicRoom = {
  code: string;
  phase: Phase;
  mode: GameMode;
  formation?: ClassicFormation;
  hideRatings: boolean;
  round: number;
  startedAt?: number;
  members: PublicMember[];
};

const ROOM_TTL_MS = 6 * 60 * 60 * 1000; // 6h
const EMPTY_ROOM_GRACE_MS = 2 * 60 * 1000; // keep an empty room briefly so a sole host can reconnect
const MAX_MEMBERS = 200;

const rooms = new Map<string, Room>();

export type LobbyError = { error: string };

function isLobbyError(value: unknown): value is LobbyError {
  return typeof value === 'object' && value !== null && 'error' in value;
}

export { isLobbyError };

function touch(room: Room) {
  room.lastActivity = Date.now();
}

function uniqueName(room: Room, desired: string): string {
  const taken = new Set(Array.from(room.members.values()).map((m) => m.name.toLowerCase()));
  if (!taken.has(desired.toLowerCase())) return desired;
  for (let n = 2; n < 1000; n++) {
    const candidate = `${desired} ${n}`;
    // Keep within the 16-char sanitize limit; if too long, trim the base.
    const trimmed = candidate.length > 16 ? `${desired.slice(0, 16 - String(n).length - 1)} ${n}` : candidate;
    if (!taken.has(trimmed.toLowerCase())) return trimmed;
  }
  return `${desired} ${room.members.size + 1}`;
}

function newMember(name: string, isHost: boolean): Member {
  return {
    id: generateToken(),
    pid: generateToken(),
    name,
    isHost,
    joinedAt: Date.now(),
    connected: false,
    done: false,
    score: null,
    trophies: null,
    squad: null,
    formation: '4-3-3',
  };
}

export function createRoom(rawName: unknown): { room: Room; member: Member } | LobbyError {
  const name = sanitizeName(rawName);
  if (!name) return { error: 'invalid_name' };

  let code = generateRoomCode();
  // Vanishingly unlikely, but guarantee uniqueness.
  while (rooms.has(code)) code = generateRoomCode();

  const host = newMember(name, true);
  const room: Room = {
    code,
    hostId: host.id,
    phase: 'lobby',
    mode: 'classic',
    formation: '4-3-3',
    hideRatings: false,
    round: 0,
    members: new Map([[host.id, host]]),
    createdAt: Date.now(),
    lastActivity: Date.now(),
  };
  rooms.set(code, room);
  return { room, member: host };
}

export function joinRoom(code: string, rawName: unknown): { room: Room; member: Member } | LobbyError {
  const room = rooms.get(normalizeCode(code));
  if (!room) return { error: 'room_not_found' };
  if (room.phase !== 'lobby') return { error: 'already_started' };
  if (room.members.size >= MAX_MEMBERS) return { error: 'room_full' };

  const name = sanitizeName(rawName);
  if (!name) return { error: 'invalid_name' };

  const member = newMember(uniqueName(room, name), false);
  room.members.set(member.id, member);
  touch(room);
  return { room, member };
}

export type StartConfig = {
  mode: GameMode;
  formation?: ClassicFormation;
  hideRatings?: boolean;
};

const VALID_MODES: GameMode[] = ['classic', 'world-cup', 'global', 'legacy'];
const VALID_FORMATIONS: ClassicFormation[] = ['4-3-3', '4-4-2', '4-2-3-1', '3-4-3'];

export function startRoom(code: string, token: string, config: StartConfig): Room | LobbyError {
  const room = rooms.get(normalizeCode(code));
  if (!room) return { error: 'room_not_found' };
  if (room.hostId !== token) return { error: 'not_host' };
  if (!VALID_MODES.includes(config.mode)) return { error: 'invalid_mode' };

  const formation = config.formation && VALID_FORMATIONS.includes(config.formation) ? config.formation : '4-3-3';

  room.phase = 'playing';
  room.mode = config.mode;
  room.formation = formation;
  room.hideRatings = config.hideRatings === true;
  room.round += 1;
  room.startedAt = Date.now();
  // Reset everyone's result for the new round.
  for (const member of room.members.values()) {
    member.done = false;
    member.score = null;
    member.trophies = null;
    member.squad = null;
  }
  touch(room);
  return room;
}

export function recordResult(code: string, token: string, verified: VerifyOk): Room | LobbyError {
  const room = rooms.get(normalizeCode(code));
  if (!room) return { error: 'room_not_found' };
  if (room.phase !== 'playing') return { error: 'not_playing' };

  const member = room.members.get(token);
  if (!member) return { error: 'not_a_member' };
  if (member.done) return { error: 'already_submitted' };

  // The submitted run must match the round's mode (and formation when relevant).
  if (verified.mode !== room.mode) return { error: 'mode_mismatch' };

  member.done = true;
  member.score = verified.result.score;
  member.trophies = verified.result.trophies;
  member.squad = verified.squad;
  touch(room);

  // Flip to finished once everyone connected has submitted (host can also start a new round anytime).
  const active = Array.from(room.members.values()).filter((m) => m.connected || m.done);
  if (active.length > 0 && active.every((m) => m.done)) {
    room.phase = 'finished';
  }
  return room;
}

export function setMemberFormation(code: string, token: string, formation: ClassicFormation): Room | LobbyError {
  const room = rooms.get(normalizeCode(code));
  if (!room) return { error: 'room_not_found' };
  if (room.phase !== 'lobby') return { error: 'already_started' };
  if (!VALID_FORMATIONS.includes(formation)) return { error: 'invalid_formation' };
  const member = room.members.get(token);
  if (!member) return { error: 'not_a_member' };
  member.formation = formation;
  touch(room);
  return room;
}

export function setConnected(code: string, token: string, connected: boolean): Room | undefined {
  const room = rooms.get(normalizeCode(code));
  if (!room) return undefined;
  const member = room.members.get(token);
  if (!member) return undefined;
  member.connected = connected;
  touch(room);
  if (!connected) maybeReassignHost(room);
  return room;
}

// Permanently remove a member (explicit leave). Disconnects just flip `connected`.
export function leaveRoom(code: string, token: string): Room | undefined {
  const room = rooms.get(normalizeCode(code));
  if (!room) return undefined;
  if (!room.members.delete(token)) return room;
  maybeReassignHost(room);
  touch(room);
  if (room.members.size === 0) {
    // Empty rooms are swept by the janitor after a grace period.
    room.lastActivity = Date.now() - (ROOM_TTL_MS - EMPTY_ROOM_GRACE_MS);
  }
  return room;
}

function maybeReassignHost(room: Room) {
  const host = room.members.get(room.hostId);
  if (host && host.connected) return;
  // Promote the oldest connected member; fall back to the oldest member overall.
  const ordered = Array.from(room.members.values()).sort((a, b) => a.joinedAt - b.joinedAt);
  const next = ordered.find((m) => m.connected) ?? ordered[0];
  if (next) {
    for (const m of room.members.values()) m.isHost = false;
    next.isHost = true;
    room.hostId = next.id;
  }
}

export function getRoom(code: string): Room | undefined {
  return rooms.get(normalizeCode(code));
}

export function getPublicRoom(room: Room): PublicRoom {
  return {
    code: room.code,
    phase: room.phase,
    mode: room.mode,
    formation: room.formation,
    hideRatings: room.hideRatings,
    round: room.round,
    startedAt: room.startedAt,
    members: Array.from(room.members.values())
      .sort((a, b) => {
        // Done players first by score desc, then the rest by join order.
        if (a.done !== b.done) return a.done ? -1 : 1;
        if (a.done && b.done) return (b.score ?? 0) - (a.score ?? 0);
        return a.joinedAt - b.joinedAt;
      })
      .map((m) => ({
        pid: m.pid,
        name: m.name,
        isHost: m.isHost,
        connected: m.connected,
        done: m.done,
        score: m.score,
        trophies: m.trophies,
        squad: m.squad,
        formation: m.formation,
      })),
  };
}

export function sweepExpired(now = Date.now()): number {
  let removed = 0;
  for (const [code, room] of rooms) {
    const expired = now - room.lastActivity > ROOM_TTL_MS;
    const emptyAndStale = room.members.size === 0 && now - room.lastActivity > EMPTY_ROOM_GRACE_MS;
    if (expired || emptyAndStale) {
      rooms.delete(code);
      removed++;
    }
  }
  return removed;
}

function normalizeCode(code: string): string {
  return String(code ?? '')
    .trim()
    .toUpperCase();
}

export function roomCount(): number {
  return rooms.size;
}
