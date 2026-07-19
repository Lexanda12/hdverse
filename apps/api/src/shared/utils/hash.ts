import crypto from 'crypto';

export function sha256Hash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export function sha256HashStream(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export function verifyHash(buffer: Buffer, expectedHash: string): boolean {
  const actualHash = sha256Hash(buffer);
  return actualHash === expectedHash;
}
