import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const DEFAULT_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY || DEFAULT_KEY;
  return Buffer.from(hex.slice(0, 64), 'hex');
}

export function encryptCredentials(data: Record<string, any>): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const text = JSON.stringify(data);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decryptCredentials(encryptedString: string): Record<string, any> {
  if (!encryptedString) return {};
  try {
    const parts = encryptedString.split(':');
    if (parts.length !== 3) return {};
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  } catch {
    return {};
  }
}

export function maskSecret(secret?: string): string {
  if (!secret) return '';
  if (secret.length <= 4) return '****';
  return `****${secret.slice(-4)}`;
}

export function maskCredentialsMap(creds: Record<string, any>): Record<string, any> {
  const masked: Record<string, any> = {};
  for (const [provider, keys] of Object.entries(creds)) {
    masked[provider] = {};
    if (typeof keys === 'object' && keys !== null) {
      for (const [k, v] of Object.entries(keys)) {
        masked[provider][k] = maskSecret(String(v));
      }
    }
  }
  return masked;
}
