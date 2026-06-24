import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  if (!storedHash.includes(':')) {
    return storedHash === password;
  }

  const [salt, originalHash] = storedHash.split(':');
  const derivedHash = scryptSync(password, salt, 64).toString('hex');
  return timingSafeEqual(Buffer.from(originalHash, 'hex'), Buffer.from(derivedHash, 'hex'));
}
