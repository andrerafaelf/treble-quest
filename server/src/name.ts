const BLOCKED = [
  'admin', 'mod', 'moderator', 'staff', 'official', 'support',
  'nazi', 'hitler', 'kill', 'rape', 'nigger', 'faggot', 'retard'
];

export function sanitizeName(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim().replace(/\s+/g, ' ');
  if (trimmed.length < 2 || trimmed.length > 16) return null;
  if (!/^[A-Za-z0-9 _\-.]+$/.test(trimmed)) return null;
  const lower = trimmed.toLowerCase().replace(/[\s_\-.]/g, '');
  for (const word of BLOCKED) {
    if (lower.includes(word)) return null;
  }
  return trimmed;
}
