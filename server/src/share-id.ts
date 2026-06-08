import { randomBytes } from 'node:crypto';

export function generateShareId(): string {
  return randomBytes(6).toString('base64url');
}
