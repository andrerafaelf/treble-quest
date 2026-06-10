import { randomBytes, randomUUID } from 'node:crypto';

export function generateShareId(): string {
  return randomBytes(6).toString('base64url');
}

// Unambiguous alphabet for human-typed room codes: no 0/O, 1/I/L, etc.
const ROOM_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateRoomCode(length = 5): string {
  const bytes = randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i++) {
    code += ROOM_CODE_ALPHABET[bytes[i] % ROOM_CODE_ALPHABET.length];
  }
  return code;
}

// Opaque per-room member token (also serves as the member id).
export function generateToken(): string {
  return randomUUID();
}
